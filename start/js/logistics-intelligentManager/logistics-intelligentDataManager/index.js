var onlyRowSelected;
layui.use(["laydate", "form", "table", "layer"], function () {
  var laydate = layui.laydate,
      form = layui.form,
      $ = layui.jquery,
      table = layui.table,
      layer = layui.layer,
      tableWhere;                   //表格查询数据

  form.render();
  laydate.render({
    elem: '#input-date',
    type: 'date',
    range: "~",
    trigger: 'click',
    format: "yyyy-MM-dd"
  });

  renderTable({});
  /*
  * -----三个按钮的事件---------------------------------------------------------------------------------------------------
  * */
  form.on("submit(button-search)", function (data) {
    let field = data.field,
        dateArr = ["", ""],
        {username, accountType} = field;
    if (field.dateRange) {
      let arr = field.dateRange.split(" ~ ");
      dateArr[0] = arr[0] + " 00:00:00";
      dateArr[1] = arr[1] + " 23:59:59"
    }
    renderTable({beginDate: dateArr[0], endDate: dateArr[1], username, accountType})
  });
  form.on("submit(button-reset)", function () {
    $('input[name="dateRange"]').val("");
    $(".only-form")[0].reset();
    renderTable({});
  });
  form.on("submit(button-edit)", function () {
    let checkedData = table.checkStatus("only-table").data;
    if (checkedData.length !== 1) {
      layer.msg(`${checkedData.length ? "只能选择一个用户" : "请先选择一个用户"}`);
      return
    }
    openModel(checkedData[0]);
  });
  /*
  * -----公共方法--------------------------------------------------------------------------------------------------------
  * */

//  渲染表格的方法
  function renderTable({beginDate, endDate, username, accountType, orderColumn, order}) {
    tableWhere = {beginDate, endDate, username, accountType, orderColumn, order};
    table.render({
      elem: '#only-table',
      id: "only-table",
      url: "/api/admin/dataAuth/user/pageList",
      headers: {Authorization: layui.data(setter.tableName)[setter.request.tokenName]},
      where: tableWhere,
      page: true,
      limits: [20, 40],
      limit: 20,
      autoSort: false,
      parseData: function (res) {
        let list = res.data.rows;
        let jobNoMatch = ["运维", "内部", "外部", "单项疾病外部"];
        list = list.map(item => ({
          ...item,
          accountType: jobNoMatch[Number(item.accountType)]
        }));
        return {
          code: "0",
          msg: res.message,
          count: res.data.total,
          data: list
        };
      },
      cols: [[
        {type: "checkbox", width: 50, fixed: "left"},
        {field: 'username', title: '用户名', width: 320, sort: true, event: 'editDataAuth'},
        {field: 'accountType', title: '账户类型', width: 100, sort: true, event: 'editDataAuth'},
        {field: 'jobNo', title: '工号', width: 150, sort: true, event: 'editDataAuth'},
        {field: 'updTime', title: '更新时间', width: 240, sort: true, event: 'editDataAuth'}
      ]]
    });
    table.on('sort(only-table)', function (data) {
      renderTable({...tableWhere, orderColumn: data.field});
      table.reload('only-table', {
        initSort: data,
        where: {...tableWhere, orderColumn: data.field}
      });
    });
    table.on('rowDouble(only-table)', function (data) {
      openModel(data.data)
    });
    $(document).on("click", "th", function () {
      // alert($(this).find("span").text());
    })
  }

//  格式化查询字符串的方法
  function openModel(data) {
    onlyRowSelected = data;
    layer.open({
      type: 2,
      title: '修改权限',
      content: layui.setter.base + "views/iframe/logistics-intelligentManager/logistics-intelligentDataManager/index.html",
      area: ['520px', '600px'],
      maxmin: true
    });
  }

});
