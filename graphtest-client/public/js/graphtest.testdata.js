
var graphtest_testdata = (function($){

    var configMap,dataUrl,getPathColumnUrl,$table,columnData,scenarioPathIdNow;
    getPathColumnUrl    = host+"/api/scenario/path/params";
    getScenarioPathDataUrl    = host+"/api/scenario/path/data/json";
    getScenarioPathDataSaveUrl    = host+"/api/scenario/path/data";

    var getParams = function(callback){

        $.ajax({
            type:"post",
            url:getPathColumnUrl,
            data:{scenarioPathId:scenarioPathIdNow},
            dataType:"json",
            success:function(data){
                console.log(data);
                callback(data);
            }

        });

    };

    var saveTableAndRefresh = function(){

        var dataContent = $table.bootstrapTable('getData');
        $.ajax({
            type:"post",
            url:getScenarioPathDataSaveUrl,
            data:{scenarioPathId:scenarioPathIdNow,data:dataContent},
            dataType:"json",
            success:function(data){
                if(data.returnCode==-1){

                    alert("提交异常！："+data.returnMsg)
                }else {
                    alert("成功提交！")
                }


            }

        });


    };

    var setColumn = function(dataTable,paramArr){

        var colomnArr = new Array();
        columnData = new Array();
        colomnArr[0] = {
            field: 'ID',
            title: '序号'
        };
        for(var i in paramArr){
            var indexArr = parseInt(i)+parseInt(1);
            colomnArr[indexArr] = {field:paramArr[i],title:paramArr[i],editable: true, align: 'center'}
            columnData[i] = paramArr[i];
        }

        colomnArr[colomnArr.length] = {
            field: 'operation',
            title: '操作',
            width: 100,
            formatter: function (value, row, index) {
                var d = '<a class = "remove" href="javascript:void(0)">删除</a>';
                return  d;
            },
            events: 'operateEvents'
        };

        window.operateEvents = {
            'click .remove': function (e, value, row, index) {
                console.log("删除表格内容..."+row.ID);
                $("#graphtest-testdata").bootstrapTable('remove', {
                    field: 'ID',
                    values: [row.ID]
                });
                updateIdAfterRemove();

            }
        };
        return colomnArr;

    };

    //更新ID
    var updateIdAfterRemove = function(){
        var columns = $table.bootstrapTable('getData');
        for(var i in columns){
            console.log(columns[i]);
            columns[i].ID = parseInt(i)+1;
            $table.bootstrapTable('updateRow', {index: i, row: columns[i]});
        }
    }

    //添加默认数据
    var appendData = function(){
        var rows ={};
        var columns = $table.bootstrapTable('getData');
        console.log("当前行数"+eval(columns.length+1));
        rows.ID = eval(columns.length+1);
        for(i in columnData){
            rows[columnData[i]] = '';
        }
        return rows;
    }

    //初始化测试数据表格
    var initTestDataTable = function($container,scenarioPathId){


        console.log(window.graphServerHost);
        console.log("host:"+window.graphServerHost);
        console.log("host2:"+host);


        scenarioPathIdNow = scenarioPathId;
        getParams(function(data){
            console.log(data.returnCode);
            console.log(data.returnMsg);
            console.log(data.data);
            console.log(data);
            if(data.returnCode==-1){
                $container.html('<div class="alert alert-success" role="alert">当前路径中没有参数化内容</div>');

            }else {


                if(data.data.length==0){
                    $container.html('<div class="alert alert-success" role="alert">当前路径中没有参数化内容</div>');
                }else {

                    $container.html(
                        ' <div id="toolbar">' +
                        '    <div class="form-inline" role="form">' +
                        '    <div class="form-group">' +
                        '           <button id="addTestDataRow" class="btn btn-success">' +
                        '               <i class="glyphicon glyphicon-plus"></i> 新增' +
                        '               </button>' +
                        '       </div>' +
                        '     </div>' +
                        ' </div>' +
                        '<table id="graphtest-testdata"></table>') ;
                    $table = $container.find("table");
                    $table.bootstrapTable( {
                        url: getScenarioPathDataUrl, //请求后台的URL（*）
                        method: 'post', //请求方式（*）
                        toolbar: '#toolbar', //工具按钮用哪个容器
                        striped: true, //是否显示行间隔色
                        cache: false, //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
                        pagination: true, //是否显示分页（*）
                        sortable: false, //是否启用排序
                        sortOrder: "asc", //排序方式
                        queryParams: {scenarioPathId:scenarioPathIdNow},//传递参数（*）
                        sidePagination: "client", //分页方式：client客户端分页，server服务端分页（*）
                        pageNumber:1, //初始化加载第一页，默认第一页
                        pageSize: 50, //每页的记录行数（*）
                        pageList: [10, 25, 50, 100], //可供选择的每页的行数（*）
                        search: true, //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
                        strictSearch: true,
                        showColumns: true, //是否显示所有的列
                        showRefresh: true, //是否显示刷新按钮
                        minimumCountColumns: 2, //最少允许的列数
                        clickToSelect: true, //是否启用点击选中行
                        height: 600, //行高，如果没有设置height属性，表格自动根据记录条数觉得表格高度
                        uniqueId: "ID", //每一行的唯一标识，一般为主键列
                        showToggle:true, //是否显示详细视图和列表视图的切换按钮
                        cardView: false, //是否显示详细视图
                        detailView: false, //是否显示父子表
                        columns: setColumn($table,data.data)
                    } );

                    //加载数据

                    $container.find("#addTestDataRow").on("click",function(){

                        $table.bootstrapTable('append',  appendData());
                        // $table.bootstrapTable('append',  [{id:1,  $$parameter1:2,  $$varName1:3}]);
                    });

                    $("#btnSaveScenarioCaseData").unbind("click").click(function(){
                        saveTableAndRefresh();
                    });

                }




            }
        });

        return true;
    };

    return {initTestDataTable:initTestDataTable}

})(jQuery);