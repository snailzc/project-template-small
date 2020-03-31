/*
* -----初始化全局变量数据-------------------------------------------------------------------------------------------------
* */
var $ = layui.jquery,
    form,
    tree,
    table,
    layer,
    admin,
    globalMenuList,                     //菜单树的数据
    currentSelectedMenu,                //当前被选中菜单
    tableWhere,                         //资源表格的查询数据（此处保存的是最新值）
    resourceInfoToEdit = {};            //表格里面当前元素
layui.use(['tree', 'table', 'form'], function () {
  tree = layui.tree;
  table = layui.table;
  form = layui.form;
  layer = layui.layer;
  admin = layui.admin;
  /*
   * -----初始化数据或者元素----------------------------------------------------------------------------------------------
   * */
  initPageData();
  form.render();
  /*
  * -----事件-----------------------------------------------------------------------------------------------------------
  * */
  //资源表单的提交事件
  form.on("submit(save-menu-resource)", function (data) {
    let params = {
      ...data.field,
      appCode: config.appCode,
    };
    ajax({
      url: "/api/admin/menu/v1",
      type: "POST",
      data: params,
      callback(res) {
        if (checkAjaxStatus(res, "操作成功")) {
          showTableOrForm("table");
          initPageData();
          $(".right-resource-add")[0].reset()
        }
      }
    });
    return false
  });
  form.on("submit(update-menu-resource)", function (data) {
    console.log(data);
    let params = {
      ...currentSelectedMenu,
      ...data.field,
      appCode: config.appCode,
    };
    ajax({
      url: "/api/admin/menu/" + currentSelectedMenu.id,
      type: "PUT",
      data: params,
      callback: function (res) {
        console.log({res});
        if (checkAjaxStatus(res, "更新成功")) {
          initPageData();
        }
        $(".right-resource-add")[0].reset()
      }
    })
  });
  $('a[lay-filter="cancel-menu-resource"]').click(function () {
    $(".right-resource-add")[0].reset();
    showTableOrForm(false);
    return false
  });
});

/*
* -----菜单的新增、编辑、删除------------------------------------------------------------------------------------------
* */
$(".add-menu").click(function () {
  showTableOrForm("form");
  showConfirmOrUpdateButton("add");
  $(".right-resource-add")[0].reset();
  if (currentSelectedMenu) {
    assignFormValue({
      parentId: currentSelectedMenu.id,
      parentNodeTitle: currentSelectedMenu.title
    });
  }
});

$(".edit-menu").on('click', function () {
  let {
    appCode,
    code,
    title,
    parentId,
    icon,
    type,
    orderNum,
    description,
  } = currentSelectedMenu;
  let parent = findTreeNodeById(globalMenuList, parentId);
  assignFormValue({
    appCode,
    code,
    title,
    parentId,
    icon,
    type,
    orderNum,
    description,
    parentNodeTitle: parent.title
  });
  showTableOrForm("form");
  showConfirmOrUpdateButton("edit");
});

$(".del-menu").click(function () {
  layer.confirm('此操作将永久删除此菜单？',
      function () {
        admin.req({
          url: "/api/admin/menu/remove",
          type: "DELETE",
          data: JSON.stringify({id: currentSelectedMenu.id}),
          dataType: 'json',
          contentType: 'application/json; charset=utf-8',
          done: function (res) {
            if (checkAjaxStatus(res, "删除成功")) {
              initPageData()
            }
          }
        })
      }
  );

});

$("#select-menu-button").click(function () {
  $("#select-menu-tree").toggle()
});

/*
* -----资源表格的查询、重置、新增元素--------------------------------------------------------------------------------------
* */
$(".tr-query").click(function () {
  querytableDataByName();
});

function querytableDataByName() {
  let name = $('input[name="resource-name"]').val();
  renderResourceTable({...tableWhere, name});
}

$(".tr-reset").click(function () {
  $('input[name="resource-name"]').val("");
  renderResourceTable({...tableWhere, name: ""});
});

$(".tr-add").click(function () {
  resourceInfoToEdit = {isEdit: false};
  layer.open({
    type: 2,
    title: '新建资源',
    content: layui.setter.base + 'views/iframe/logistics-intelligentManager/logistics-intelligentMenuManager/addResource.html',
    area: ['520px', '420px'],
    maxmin: true
  });
});
/*
* -----公共方法----------------------------------------------------------------------------------------------------------
* */

//初始化页面数据（菜单数据和form数据）
function initPageData() {
  //初始化菜单树形数据
  getOrderList();
  //初始化资源表格数据
  renderResourceTable({});

  showTableOrForm("table");
  initMenuManageButton()
}

//渲染菜单树形数据
function getOrderList() {
  //菜单数据
  $.ajax({
    url: "/api/admin/menu/tree?appCode=" + config.appCode,
    type: "GET",
    dataType: 'json',
    contentType: 'application/json',
    async: true,
    headers: {
      Authorization: layui.data(setter.tableName)[setter.request.tokenName]
    },
    success: function (res) {
      let data = res[0].children;
      globalMenuList = res;
      //渲染左侧菜单树的数据
      renderTree({
        element: "LAY-auth-tree",
        data,
        clickFn: function (data) {
          //渲染菜单所对应的资源表格
          renderResourceTable({menuId: data.data.id, appCode: data.data.appCode});
          //获取菜单对应的信息及之后的操作
          getMenuInfo(data.data.id, (data => {
            console.log({"菜单的信息": data});
            currentSelectedMenu = JSON.parse(JSON.stringify(data));
            $(".button-edit-menu").fadeIn();
            showTableOrForm("table");
            if (data.require) {
              $(".button-del-menu").fadeOut()
            } else {
              $(".button-del-menu").fadeIn()
            }
          }));
        }
      });
      //渲染择右侧添加编辑表单里面的数据
      renderTree({
        element: "select-menu-tree", data, clickFn: function (data) {
          data = data.data;
          console.log({data});
          assignFormValue({
            parentId: data.id,
            parentNodeTitle: data.title
          });
          $("#select-menu-tree").hide();
        }
      })
    },
  })
}

//渲染树
function renderTree({element, data, showCheckbox, clickFn}) {
  tree.render({
    elem: `#${element}`,
    data: data,
    showCheckbox: !!showCheckbox,
    onlyIconControl: true,
    showLine: false,
    click: clickFn
  })
}

//渲染资源表格
function renderResourceTable({menuId, appCode, name}) {
  tableWhere = {menuId, appCode, name};//意义是保存最新的查询参数（当你只改变一个查询参数时，可以只对最新改变的那一个进行赋值即可）
  table.render({
    elem: '#resource-table',
    url: "/api/admin/element/list",
    headers: {Authorization: layui.data(setter.tableName)[setter.request.tokenName]},
    page: true,
    limits: [20, 40],
    limit: 20,
    parseData: function (res) {
      return {
        code: "0",
        msg: res.message,
        count: res.data.total,
        data: res.data.rows
      };
    },
    width: 730,
    where: {menuId: menuId || "", appCode: appCode || "", name: name || ""},
    cols: [[
      {field: 'code', title: '资源编码', width: 320},
      {field: 'type', title: '资源类型', width: 100},
      {field: 'name', title: '资源名称', width: 150},
      {field: 'uri', title: '资源地址', width: 350},
      {field: 'method', title: '资源请求类型', width: 100},
      {field: 'description', title: '描述', width: 180},
      {
        field: 'sign',
        title: '操作',
        width: 180,
        fixed: "right",
        templet: `<div>
                    <a class="layui-btn layui-btn-normal layui-btn-xs" lay-event="editResource">编辑元素</a>
                    <a class="layui-btn layui-btn-danger layui-btn-xs" lay-event="delResource">删除元素</a>
                 </div>`
      }
    ]]
  });
  table.on('tool(resource-table)', function (data) {
    if (data.event === "editResource") {
      resourceInfoToEdit = {...data.data, isEdit: true};
      layer.open({
        type: 2,
        title: '新建资源',
        content: layui.setter.base + 'views/iframe/logistics-intelligentManager/logistics-intelligentMenuManager/addResource.html',
        area: ['520px', '420px'],
        maxmin: true
      });
    } else if (data.event === "delResource") {
      layer.confirm('确认删除此资源吗？', function () {
        ajax({
          url: "/api/admin/element/" + data.data.id,
          type: "DELETE",
          callback: function () {
            layer.msg("删除成功");
            querytableDataByName()
          }
        })
      })
    }
  })
}

//获取一个菜单的信息
function getMenuInfo(id, fn) {
  ajax({
    url: "/api/admin/menu/" + id,
    callback: function (res) {
      if (res.rel && fn) {
        fn(res.data)
      }
    }
  })
}

//右侧表格和form的区域是否显示form
function showTableOrForm(type) {
  if (type === "form") {
    $(".right-resource-add").show();
  } else {
    $(".right-resource-add").hide();
  }
}

//资源的表单显示确定按钮还是更新按钮
function showConfirmOrUpdateButton(type) {
  if (type === "add") {
    $(".save-menu").show();
    $(".update-menu").hide();
  } else {
    $(".save-menu").hide();
    $(".update-menu").show();
  }
}

//左上角的菜单的增删改按钮的初始化
function initMenuManageButton() {
  $(".edit-menu,.del-menu").hide()
}

//接口信息反馈
function checkAjaxStatus(res, message) {
  let bool = res.status === 200 && res.rel;
  if (!bool) {
    layer.msg(res.message || "操作失败")
  } else if (message) {
    layer.msg(message)
  }
  return bool
}

//给表单赋值
function assignFormValue(data) {
  console.log({"到达表单的数据": data});
  /*var data = {
    appCode,
    code,
    title,
    parentId,
    icon,
    type,
    orderNum,
    description,
    parentNodeTitle
  };*/
  form.val('form-resource-add', data);
}

//根据id查找树节点
function findTreeNodeById(list, id) {
  for (let i = 0; i < list.length; i++) {
    let node = list[i];
    if (node.id === id) {
      return node
    } else if (node.children) {
      let _node = findTreeNodeById(node.children, id);
      if (_node) {
        return _node
      }
    }
  }
}

