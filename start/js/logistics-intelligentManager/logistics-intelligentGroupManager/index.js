/*
* -----初始化全局变量数据-------------------------------------------------------------------------------------------------
* */
var $ = layui.jquery,
    form,
    tree,
    table,
    layer,
    appCode = "logistics-intelligent",
    currentRoleTypeInfo;                    //当前选中的角色类型的信息
layui.use(['tree', 'table', 'form'], function () {
  tree = layui.tree;
  table = layui.table;
  form = layui.form;
  layer = layui.layer;

  getRoleType();
  form.render();
  setRoleFormInputStatus(true);
  //添加
  form.on("submit(button-form-add)", function (data) {
    let params = data.field;
    let parentId = currentRoleTypeInfo ? currentRoleTypeInfo.id : -1;
    params = {
      ...params,
      appCode,
      groupType,
      parentId
    };
    ajax({
      url: "/api/admin/group",
      type: "POST",
      data: params,
      callback: function (res) {
        //请求父级详情  刷新表单  禁用表单 按钮隐藏  刷新树
        if (checkAjaxStatus(res, "新增成功")) {
          initTreeAndForm();
          if (parentId === -1) {
            $(".form-role-type")[0].reset();
          } else {
            getRoleTypeDetail(parentId, function (res) {
              currentRoleTypeInfo = {...res.data, mullu: res.data.name};
              assignFormData(currentRoleTypeInfo);
            })
          }
        }
      }
    });
    return false;
  });

  //更新
  form.on("submit(button-form-update)", function (data) {
    let params = {...currentRoleTypeInfo, ...data.field};
    let {id} = currentRoleTypeInfo;
    ajax({
      url: "/api/admin/group/" + id,
      data: params,
      type: "PUT",
      callback: function (res) {
        //请求父级详情  刷新表单  禁用表单 按钮隐藏  刷新树
        if (checkAjaxStatus(res, "更新成功")) {
          initTreeAndForm();
          getRoleTypeDetail(id, function (res) {
            currentRoleTypeInfo = {...res.data, mullu: res.data.name};
            assignFormData(currentRoleTypeInfo);
          })
        }
      }
    });
    return false;
  });

  //取消
  form.on("submit(button-form-cancel)", function () {

    return false;
  });
});
/*
* -----角色类型查询和重置------------------------------------------------------------------------------------------------
* */

$(".role-query").click(function () {
  let name = $('input[name="name"]').val();
  getRoleType(name);
});

$(".role-reset").click(function () {
  $('input[name="name"]').val("");
  $(".form-role-type")[0].reset();
  currentRoleTypeInfo = null;
  getRoleType();
});

/*
* -----角色类型的新增、编辑、删除、角色权限和人员分配------------------------------------------------------------------------
* */
$(".role-add").click(function () {
  setRoleFormInputStatus(["mullu"]);
  showAddOrUpdateButton("add");
  if (currentRoleTypeInfo) {
    let {mullu} = currentRoleTypeInfo;
    assignFormData({mullu});
  }
});

$(".role-edit").click(function () {
  setRoleFormInputStatus(["type", "mullu"]);
  showAddOrUpdateButton("update")
});

$(".role-del").click(function () {
  let id = currentRoleTypeInfo.id;
  $.ajax({
    url: "/api/admin/group/" + id,
    type: "DELETE",
    dataType: 'json',
    contentType: 'application/json',
    async: true,
    headers: {
      Authorization: layui.data(setter.tableName)[setter.request.tokenName]
    },
    success: function (res) {
      if (checkAjaxStatus(res, "删除成功")) {
        initTreeAndForm();
        $(".form-role-type")[0].reset();
      }
    },
    error: function () {
      layer.msg("删除失败")
    }
  });
});

$(".role-auth-assign").click(function () {
  openModel({title: "关联资源", filename: "assignPermissions"})
});

$(".user-assign").click(function () {
  openModel({title: "关联用户", filename: "assignUsers"})
});
//
/*
* -----公共方法----------------------------------------------------------------------------------------------------------
* */

//渲染树
function renderTree({element, data, showCheckbox, clickFn}) {
  tree.render({
    elem: `#${element}`,
    data: data,
    id: element,
    showCheckbox: !!showCheckbox,
    onlyIconControl: true,
    showLine: false,
    click: clickFn
  })
}

//获取角色类型列表并刷新树
function getRoleType(name, reload) {
  currentRoleTypeInfo = null;
  $.ajax({
    url: `/api/admin/group/tree?groupType=${groupType}&appCode=${appCode}&name=${name || ""}`,
    type: "GET",
    async: true,
    headers: {
      Authorization: layui.data(setter.tableName)[setter.request.tokenName]
    },
    success: function (data) {
      if (reload) {
        tree.reload('role-tree', {
          data
        });
      } else {
        renderTree({
          element: "role-tree",
          data,
          clickFn(data) {
            getRoleTypeDetail(data.data.id, function (res) {
              currentRoleTypeInfo = {...res.data, mullu: res.data.name};
              assignFormData(currentRoleTypeInfo);
              $(".role-type-manage .layui-btn").show();
              setRoleFormInputStatus(true);
              $(".role-form-button").hide();
            })
          }
        })
      }
    }
  });
}

//获取某一角色类型的详细信息
function getRoleTypeDetail(id, callback) {
  ajax({
    url: "/api/admin/group/" + id,
    type: "GET",
    callback: function (res) {
      if (callback && checkAjaxStatus(res)) {
        callback(res)
      }
    }
  })
}

//给表单赋值
function assignFormData(params) {
  let {name, code, type, mullu, description, orderNum} = params;
  //parentId存放在currentRoleTypeInfo里面，最外层的话parentId为-1
  form.val("form-role-type", {name, code, type, mullu, description, orderNum})
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

//切换form表单内下拉框的状态
function switchSelectStatus(bool) {
  $(".form-select select").attr("disabled", bool);
  form.render("select");
}

//控制form表单里面哪些项目可用，哪些不可用(true为不可用)
function setRoleFormInputStatus(param) {
  if (typeof param === "boolean") {
    $(".form-role-type input").attr("readonly", param);
    switchSelectStatus(param);
  } else if (Array.isArray(param)) {
    let formArr = ["name", "code", "type", "orderNum", "mullu", "description"];
    formArr.forEach(item => {
      $(`.form-role-type input[name='${item}']`).attr("readonly", param.includes(item));
    });
    switchSelectStatus(param.includes("type"))
  }
}

//表单里面显示增加按钮还是更新按钮
function showAddOrUpdateButton(type) {
  $(".role-form-button").show();
  if (type === "add") {
    $(".button-form-add").show();
    $(".button-form-update").hide();
  } else {
    $(".button-form-update").show();
    $(".button-form-add").hide();
  }
}

//初始化角色树和form表单
function initTreeAndForm() {
  setRoleFormInputStatus(true);
  $(".role-form-button").hide();
  getRoleType("", true);
}

//打开指定的弹窗 assignPermissions  assignUsers
function openModel({title, filename}) {
  layer.open({
    type: 2,
    title: currentRoleTypeInfo.name + title,
    content: layui.setter.base + `views/iframe/logistics-intelligentManager/logistics-intelligentGroupManager/${filename}.html`,
    area: ['1100px', '600px'],
    maxmin: true
  });
}
