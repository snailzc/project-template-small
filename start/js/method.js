var $ = layui.$,
    layer = layui.layer,
    form = layui.form,
    setter = layui.setter,
    laydate = layui.laydate,
    table = layui.table,
    rate = layui.rate,
    response = setter.response;
// console.log(response);

var provinceInfos = {}
var cityInfos = {}
var countyInfos = {}

// 获取url参数
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return (false);
}

function ajax({
                  data,
                  url,
                  callback,
                  type = 'GET',
                  async = true
              }) {
    $.ajax({
        type: type,
        dataType: 'json',
        url: url,
        contentType: 'application/json',
        async: async,
        data: type === 'POST' || type === 'PUT' ? JSON.stringify(data) : data,
        headers: {
            Authorization: layui.data(setter.tableName)[setter.request.tokenName]
        },
        success: function (res) {
            if (res.status === 200) {
                callback(res);
            }
            else{
                layer.msg(res.message);
            }
        },
        error: function (e, code) {
            var statusCode = response.statusCode;
            if (e.responseJSON[response.statusName] == statusCode.logout) {
                // layui.data(setter.tableName, {
                //     key: setter.request.tokenName
                //     , remove: true
                // });
                // callback(res);
                // parent.location.hash = '/user/login';
                layer.msg('登录状态已失效', {
                    offset: '15px'
                    ,icon: 2
                    ,time: 1500
                  }, function(){
                    parent.layer.closeAll();
                    layer.closeAll();
                    localStorage.clear();
                    parent.location.hash = '/user/login';
                });
            } else {
                if (e.responseJSON.message && e.responseJSON.message !== '') {
                    layer.msg('请求失败:' + e.responseJSON.message + '！');
                    return;
                }
                layer.msg('请求失败！');
            }
        }
    })
}

// 上传图片
var clickFlag = null;
var ca,ctype
function imgClikc(a,type) {
    console.log(a,type);
    ca = a;
    ctype = type;
    if(clickFlag) {//取消上次延时未执行的方法
        clickFlag = clearTimeout(clickFlag);
    }
    clickFlag = setTimeout(function() {
        console.log('当前类型'+ctype)
        if(type == '1'){
            $("#" + $(ca).attr("for")).click();
        }else {
            reviewIg(ca)
        }
    }, 300);
   
}
function reviewIg(img){
    var srcc = img.src;
    if (!srcc) {
        return false;
    }
    top.layer.open({
        type: 1
        ,title: '预览图片'
        ,area: ['530px', '480px']
        ,shade: 0
        ,maxmin: true
       // ,content:  '/start/module/image.html'
        ,content: '    <link rel="stylesheet" href="/start/module/viewer/viewer.min.css">\n' +
        '    <script src="/start/module/viewer/viewer.min.js"></script><div style="width:98%;height:99%;magin-left:1%;" id ="vehicleLicenseFrontImgTest3">' +
        '<img  style="display:block;width:100%;height:98%" src="'+srcc+'"></div><script>new Viewer(document.getElementById("vehicleLicenseFrontImgTest3"));</script>'
      });
}

function getImg(img) {
    var srcc = img.src;
    if (!srcc) {
        return false;
    }
    var width = $(img).width();
    if (width == 120) {
        $(img).parent().width('100%');
        $(img).addClass('bigImg');
    } else {
        $(img).parent().width('120');
        $(img).removeClass('bigImg');
    }
}

function ajaxFileUploadPic(a) {
    var imgId = $(a).attr("id");
    var formData = new FormData();
    var file = $(a)[0].files[0];
    formData.append("upload_file", file); //传给后台的file的key值是可以自己定义的
    // formData.append("appCode",JSON.stringify(typeData))
    $.ajax({
        url: '/file/upload/v4',
        type: 'POST',
        headers: {
            appCode: 'logistics-intelligent'
        },
        cache: false,
        processData: false,
        contentType: false,
        data: formData,
        success: function (res) {

            var imgurl = res.data.rows[0].url;
            $("input[type=text][name='" + imgId.replace('File', '') + "']").val(imgurl);
            $("img[for='" + imgId + "']").attr("src", imgurl).css({
                "width": 120,
                "height": 100,
                "margin-left": 0,
                "margin-top": 0
            });
        },
        error: function (err) {
            alert("图片上传失败，请重试一下！");
        }
    });
    return false;
}

// 省份
function setProvince(id, coalType,form_) {
    ajax({
        url: "/api/logistics_intelligent/myProvince/getAllProvice",
        type: 'post',
        callback: function (res) {
            var datalist = res.data;
            $("#" + id).empty();
            $("#" + id).append('<option value="">请选择省</option>');
            $.each(datalist, function (i, n) {
                //为Select追加一个Option(下拉项)
                var opt = '<option value="' + n.provinceCode + '">' + n
                    .provinceName + '</option>';
                $("#" + id).append(opt);
                provinceInfos[n.provinceCode] = n.provinceName
            });
            $("#" + id).find("option[value='" + coalType + "']").attr("selected", true);

            if(form_){
                form_.render("select");
            }else{
                form.render("select");
            }
        }
    })
}

// 市区
function setCity(code, id, coalType,form_) {
    ajax({
        url: "/api/logistics_intelligent/myCity/getCityByProvince?provinceCode=" + code,
        type: 'post',
        callback: function (res) {
            var datalist = res.data;
            $("#" + id).empty();
            $("#" + id).append('<option value="">请选择市</option>');
            $.each(datalist, function (i, n) {
                //为Select追加一个Option(下拉项)
                var opt = '<option value="' + n.cityCode + '">' + n.cityName +
                    '</option>';
                $("#" + id).append(opt);
                cityInfos[n.cityCode] = n.cityName
            });
            $("#" + id).find("option[value='" + coalType + "']").attr("selected", true);
            if(form_){
                form_.render("select");
            }else{
                form.render("select");
            }
        }
    })
}

// 县
function setCounty(code, id, coalType,form_) {
    ajax({
        url: "/api/logistics_intelligent/myCounty/getCountyByCity?cityCode=" + code,
        type: 'post',
        callback: function (res) {
            var datalist = res.data;
            $("#" + id).empty();
            $("#" + id).append('<option value="">请选择地区</option>');
            $.each(datalist, function (i, n) {
                //为Select追加一个Option(下拉项)
                var opt = '<option value="' + n.countyCode + '">' + n
                    .countyName + '</option>';
                $("#" + id).append(opt);
                countyInfos[n.countyCode] = n.countyName
            });
            $("#" + id).find("option[value='" + coalType + "']").attr("selected", true);
            if(form_){
                form_.render("select");
            }else{
                form.render("select");
            }
        }
    })
}

function getDateTime(date, preDay = 0){
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate() - preDay;
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    //修改月份格式
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    //修改日期格式
    if (day >= 0 && day <= 9) {
        day = "0" + day;
    }
    //修改小时格式
    if (hours >= 0 && hours <= 9) {
        hours = "0" + hours;
    }
    //修改分钟格式
    if (minutes >= 0 && minutes <= 9) {
        minutes = "0" + minutes;
    }
    //修改秒格式
    if (seconds >= 0 && seconds <= 9) {
        seconds = "0" + seconds;
    }
    //格式(yyyy-mm-dd hh:mm:ss)
    var currentFormatDate = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
    return currentFormatDate;
}
