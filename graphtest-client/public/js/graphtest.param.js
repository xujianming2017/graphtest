var graphtest_param = (function($){
    var configMap, initTable,dataUrl;
    dataUrl = "http://192.168.200.88:3333/api/variable/getUserVarNameValueList";
    var appendData = function(data){
        var rows ={id:data.returnMsg.id,var_name:'',var_value:''};        
        return rows;
    }    
    
    initTable = function($container,userId){
        $container.bootstrapTable( {
        	locale:'zh-CN',
        	url:dataUrl,
        	method: "post",
        	toolbar:"#toolbar",
        	dataType:"json",
        	escape: true,
        	striped: true,
        	pagination: true,
        	pageNumber: 1,
        	pageSize: 10,
        	pageList: [10, 25, 50, 100],
        	
        	showColumns: true,
        	showRefresh: true,
        	clickToSelect: true,
        	paginationPreText: "上一页",
            paginationNextText: "下一页",
            idField : 'oid',
        	showToggle: true,
        	showExport: true,
        	exportDataType: "basic",
        	queryParams:{"userId":userId},
        	columns: [{
                checkbox: true
            }, {
                field: 'id',
                title: 'ID',
                align: 'center'
            }, {
                field: 'var_name',
                title: '参数名称',
                align: 'center',
                editable: {
                    type: 'text',
                    title: '默认值'
                }
            }, {
                field: 'var_value',
                title: '默认值',
                align: 'center',
                editable: {
                    type: 'text',
                    title: '默认值'
                }
            },{
                field: 'operate',
                title: '操作',
                align: 'center',
                events: 'operateEvents',
                formatter: function (value, row, index) {
                    var d = '<a class = "remove" href="javascript:void(0)">删除</a>';
                    return  d;
                }
            }],
            onEditableSave: function (field, row, oldValue, $el) {
                $.ajax({
                    type: "post",
                    url: "http://192.168.200.88:3333/api/variable/update",
                    data: { id:row.id,var_name:row.var_name,var_value:row.var_value },
                    success: function (data, status) {
                        if (status == "success" && data.returnCode != 0) {
                            alert(data.returnMsg);
                            $("#graphtest-param").bootstrapTable('refresh');
                        } else {
                        	console.log('更新成功！');
                        }
                    },
                    error: function () {
                    	alert("更新失败!");
                    },
                    complete: function () {

                    }

                });
            }
        } );
        $("#add").on("click",function(){       	
        	$.ajax({
                type: "post",
                url: "http://192.168.200.88:3333/api/variable/create",
                data: {"userId":userId},
                success: function (data, status) {
                    if (status == "success") {
                    	console.log("变量创建成功!");                    	
                    	$("#graphtest-param").bootstrapTable('append',  appendData(data));
                    	//$("#graphtest-param").bootstrapTable('refresh'); 
                    }
                },
                error: function () {
                    alert("变量创建失败!");
                },
                complete: function () {

                }

            });
        	
            // $table.bootstrapTable('append',  [{id:1,  $$parameter1:2,  $$varName1:3}]);
        });
        window.operateEvents = {
                'click .remove': function (e, value, row, index) {
                    console.log("row.id : "+row.id);
                    console.log("row.var_name : "+row.var_name);
                    $("#graphtest-param").bootstrapTable('remove', {
                        field: 'id',
                        values: [row.id]
                    });
                    $.ajax({
                        type: "post",
                        url: "http://192.168.200.88:3333/api/variable/deletebyid",
                        data: {id: row.id},
                        success: function (data, status) {
                            if (status == "success") {
                            	console.log("变量删除成功!");
                            }
                        },
                        error: function () {
                            alert("变量删除失败!");
                        },
                        complete: function () {

                        }

                    });

                }
        };
        
        console.log("userId : " + userId);
        //return true;
    };
    
    //console.log('initTable : ' + initTable);
    //console.log('{initTable:initTable} : ' + JSON.stringify({initTable:initTable}));
    return {initTable:initTable}
})(jQuery);