var userId;
var model;

var zTree;
var zSetting = {
    view: {
        dblClickExpand: true,
        showLine: true,
        showIcon: true,
        showTitle: true
    },
    data: {
        key: {
            name: "folder_name"
        },
        simpleData: {
            enable: true,
            idKey: "id",
            pIdKey: "parent_id",
            rootPId: null
        }
    },
    edit: {
        enable: true,
        removeTitle: "删除场景",
        showRemoveBtn: true,
        showRenameBtn: false
    },
    callback: {
        onClick: zTreeOnClick,
        onRemove:zTreeOnRemove,
        beforeRemove:zTreeBeforeRemove
    }
};
var zNodes;

var allPaths;
var scenario;
var caseList;




$(document).ready(function () {
    initScenarioTree();
    initModel(userId, loadModelSuccessed);



    $('#modalScenarioEditor').on('show.bs.modal', function (event) {
        var button = $(event.relatedTarget); // Button that triggered the modal
        var operation = button.data('operation'); // Extract info from data-* attributes
        // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
        // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
        //var modal = $(this);
        $(this).find('#btnSaveScenario').attr('data-operation', operation);
        if (operation == "new") {
            clearScenarioInfoEditor();
        } else if (operation == "edit") {
            var name = $("input#scenario-name").val();
            var desc = $("textarea#scenario-desc").val();
            displayScenarioInfoEditor(name, desc, "");
        }
    });

    $('button#btnSaveScenario').click(function () {
        var folderid = zNodes[0].id;
        var name = $("input#modal-scenario-name").val();
        var desc = $("textarea#modal-scenario-desc").val();
        var setting = $('input:radio[name="optradio"]:checked').val();

        console.log("folderid: " + folderid + " name: " + name + " desc: " + desc + " setting: " + setting);

        //var operation = $(this).data('operation');
        var operation = $(this).attr('data-operation');
        if (operation == "new") {
            console.log("operation: 新增");
            createScenario(folderid, name, desc, "");
        } else if (operation == "edit") {
            console.log("operation: 编辑");
            updateScenario(folderid, scenario.id, name, desc, "");
        }
    });

    $('button#btnExecuteScenario').click(function () {
        //        var folderid = zNodes[0].id;
        //        var name = $("input#modal-scenario-name").val();
        //        var desc = $("textarea#modal-scenario-desc").val();
        //        console.log("name " + name);
        //        console.log("desc " + desc);
        //        var setting = $('input:radio[name="optradio"]:checked').val();
        //createScenario(folderid, name, desc);
    });


    $('button#btnExecScenario').click(function () {


        var scenarioId =     $("input#scenario-id").val();
        var scenarioName =     $("input#scenario-name").val();
        var scenario = {
                scenarioId:scenarioId,
                scenarioName:scenarioName
                };

        $.ajax({
            type: 'POST',
            url: "http://localhost:9526/api/runScenario",
            data: scenario,
            dataType: "json",
            success:function(data){

                alert(data.returnMsg);
            }
        });



    });


    $('#modalCaseListEditor').on('show.bs.modal', function (event) {
        //获取path tree to fill modal-all-paths.
        queryAllPaths(userId, function (paths) {
            if ($('select#modal-all-paths option').length > 0) {
                $('select#modal-all-paths').empty();
            }

            var options = '';
            for (i = 0; i < paths.length; i++) {
                options += '<option value="' + paths[i].id + '">' + paths[i].folder_name + '</option>';
            }
            $('select#modal-all-paths').append(options);
        });

        //获取table data to fill modal-sel-paths.
        if ($('select#modal-sel-paths option').length > 0) {
            $('select#modal-sel-paths').empty();
        }
        if (caseList) {
            var options = '';
            for (i = 0; i < caseList.length; i++) {
                options += '<option value="' + caseList[i].path_id + '">' + caseList[i].case_name + '</option>';
            }
            $('select#modal-sel-paths').append(options);
        }
        //        if (operation == "new") {
        //            clearScenarioInfoEditor();
        //        } else if (operation == "edit") {
        //            var name = $("input#scenario-name").val();
        //            var desc = $("textarea#scenario-desc").val();
        //            displayScenarioInfoEditor(name, desc, "");
        //        }
    });

    $('button#btn-add-path').click(function () {
        var selectedOptions = $('select#modal-all-paths option:selected');
        if (selectedOptions) {
            $('select#modal-sel-paths').append(selectedOptions);
        }
    });

    $('button#btn-remove-path').click(function () {
        var selectedOptions = $('select#modal-sel-paths option:selected');
        if (selectedOptions) {
            $('select#modal-all-paths').append(selectedOptions);
        }
    });

    $('button#btnSaveCaseList').click(function () {
        //获取modal-sel-paths数据
        var options = $('select#modal-sel-paths option');
        if (options) {
            var pathIds = new Array();
            $('select#modal-sel-paths option').each(function (index) {
                pathIds.push($(this).attr('value'));
            });
            //            for (i = 0; i < selectedOptions.length; i++) {
            //                pathIds.push(selectedOptions[i].attr('value'));
            //            }
            //call api to save
            updateCaseList(scenario.id, pathIds, function () {
                $("div#modalCaseListEditor").modal('hide'); //hide editor modal
                queryCaseList(scenario.id); //refresh ui[table] data
            });
        }
    });

    //首个单元格
    $('body').on('click','table#tbl-case-list tr td:first-child',function(){



        var index = $(this).parent().attr('id');
        $('input#modal-case-name').val(caseList[index].case_name);
        $('textarea#modal-case-script').val(caseList[index].graphpath_script_content);
        $('div#modalCaseInfo').modal('show');
    });


    //数据按钮
    $('body').on('click','table#tbl-case-list tr td button',function(){


        var index = $(this).closest("tr").attr('id');
        $('div#modalCaseDataEditor span.modal-case-name').text(caseList[index].case_name);
        var scenarioPathId = caseList[index].id;
        graphtest_testdata.initTestDataTable($('div.graphtest-testdata'),scenarioPathId);
        //展示遮罩层
        $('div#modalCaseDataEditor').modal('show').css({
            width: 'auto'
        });
        //设置div数据宽度
        $('div#modalCaseDataEditor .modal-dialog').attr("style","width:"+eval(window.screen.width-200)+"px;");




    });

});


function initScenarioTree(){
    loadTree("scenario", function (znodes) {
        zNodes = znodes; //把后台封装好的简单Json格式赋给zNodes
        zTree = $.fn.zTree.init($("#tree"), zSetting, zNodes);
        zTree.expandAll(true);
        //默认选中一个节点,以显示数据
        scenario = zTree.getNodeByParam("type", "scenario");
        if (scenario) { //存在type为scenario的节点
            console.log('默认选中一个节点: ' + JSON.stringify(scenario));
            zTree.selectNode(scenario);
            displayScenarioInfo(scenario.folder_name, scenario.folder_desc, "");
            displayScenarioId(scenario);
            queryCaseList(scenario.id);
        }
    });
}


//加载模型
function loadModelSuccessed(mlist) {
//    modelList = mlist;
//    model = modelList[0];
    model = mlist;
    changeModelName(model.model_name);
    changeModelId(model.id);

    console.log("loadModelSuccessed : " + JSON.stringify(model));


    //启动录制浏览器
    $("#btn-recorder").click(function(){
        $.ajax({
            url:"http://localhost:9526/api/startServer",
            type:"post",
            dataType:"json",
            data:{modelId:$('input#modelId').val(),modelName:$('a#model-name').text()},
            success:function(data){
                console.log(data.returnCode);
                if(data.returnCode==0){
                    alert("启动录制服务器成功");
                }else {
                    alert("启动录制服务器失败");
                }
            }
        });
    });


}



function displayScenarioInfo(name, desc, execsetting) {
    $("input#scenario-name").val(name);
    $("textarea#scenario-desc").val(desc);
    //$('input#scenario-name').html(name);
}

function displayScenarioId(sceanrio) {



    $("input#scenario-id").val(sceanrio.id);

}




function displayScenarioInfoEditor(name, desc, execsetting) {
    $("input#modal-scenario-name").val(name);
    $("textarea#modal-scenario-desc").val(desc);
    //$('input#scenario-name').html(name);
}

function displayCaseList(caselist) {
    if ($('table#tbl-case-list tbody').length > 0) {
        $('table#tbl-case-list tbody').remove();
    }
    
    if (caselist) {


        var showDataTable = function(scenarioPathId){
            var showDataButton =    '<button  class="btn  btn-success addTestData" >'+
                                        '<i class="glyphicon glyphicon-plus"></i> 测试数据'+
                                    ' </button>';
            return showDataButton;

        }
        //跳过执行复选框
        var buildChkbox = function (executable) {
            var temp;
            if (executable) {
                temp = '<input type="checkbox" name="executable">';
            } else {
                temp = '<input type="checkbox" name="executable">';
                //temp = '<input type="checkbox" name="executable" checked="true">';
            }
            return temp;
        };

        var table = '<tbody>';
        for (i = 0; i < caselist.length; i++) {
            table += '<tr id="' +i+'">'+
                '<td style="cursor:pointer">' + i + '</td>' +
                '<td>' + caselist[i].case_name + '</td>' +
                '<td>' + '用例' + '</td>' +
                '<td>' + showDataTable(caselist[i].id)+ '</td>' +
               /*跳过执行暂时不显示 '<td>' + buildChkbox(true) + '</td>' +*/
                '</tr>';
        }
        //        for (var i = 0, i <= caseList.length - 1; i++) {
        //            
        //        }
        table += '</tbody>'
        $('table#tbl-case-list').append(table);
    }
    //$("input#modal-scenario-name").empty();
    //$("textarea#modal-scenario-desc").empty();
    //$('input#scenario-name').html(name);
}

function displayCaseListEditor() {
    $("input#modal-scenario-name").empty();
    $("textarea#modal-scenario-desc").empty();
    //$('input#scenario-name').html(name);
}

function clearScenarioInfoEditor() {
    $("input#modal-scenario-name").val("");
    $("textarea#modal-scenario-desc").val("");
    //$('input#scenario-name').html(name);
}

function createScenario(folderid, name, desc, execsetting) {
    var result = false;
    var reqParam = {
        scenarioName: name,
        scenarioDesc: desc,
        //        setting: execsetting,
        folderId: folderid
    };
    var reqData = JSON.stringify(reqParam);
    console.log('场景信息新增 param: ' + reqData);

    $.ajax({
        type: 'POST',
        url: host + "/api/scenario/create",
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            console.log(JSON.stringify(data));
            if (data && data.returnCode == 0) {
                console.log('场景信息新增保存成功');
                //model = data.returnMsg;
                //$("textarea#model-content").html(model.graph_file);
                //$("div#projectModal").modal('hide');
                //console.log(data.pathList);
                //return data.pathList;
                $('div#modalScenarioEditor').modal('hide');
                initTree("scenario", loadScenarioTreeSuccessed);
            }
        },
        error: function (xhr, error, exception) {
            //alert('请求失败');
            console.log('场景信息新增保存失败');
        }
    });
}

function updateScenario(folderid, scenarioid, name, desc, execsetting) {
    var result = false;
    var reqParam = {
        scenarioId: scenarioid,
        scenarioName: name,
        scenarioDesc: desc,
        //        setting: execsetting,
        folderId: folderid
    };
    var reqData = JSON.stringify(reqParam);
    console.log('场景信息编辑 param: ' + reqData);

    $.ajax({
        type: 'POST',
        url: host + "/api/scenario/update",
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            console.log(JSON.stringify(data));
            if (data && data.returnCode == 0) {
                console.log('场景信息编辑保存成功');
                //model = data.returnMsg;
                //$("textarea#model-content").html(model.graph_file);
                //$("div#projectModal").modal('hide');
                //console.log(data.pathList);
                //return data.pathList;
                $('div#modalScenarioEditor').modal('hide');
                initTree("scenario", loadScenarioTreeSuccessed);
            }
        },
        error: function (xhr, error, exception) {
            //alert('请求失败');
            console.log('场景信息编辑保存失败');
        }
    });
}

function updateCaseList(scenarioid, pathids, successCallback) {
    var result = false;
    var reqParam = {
        scenarioId: scenarioid,
        pathIds: pathids
    };
    var reqData = JSON.stringify(reqParam);
    console.log('更新用例列表 param: ' + reqData);

    $.ajax({
        type: 'POST',
        url: host + "/api/scenario/path/update",
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            if (data && data.returnCode == 0) {
                console.log('更新用例列表成功');
                console.log(JSON.stringify(data));
                successCallback();
            }
        },
        error: function (xhr, error, exception) {
            //alert('请求失败');
            console.log('更新用例列表失败');
        }
    });
}

function queryCaseList(scenarioid) {
    var result = false;
    var reqParam = {
        scenarioId: scenarioid
    };
    var reqData = JSON.stringify(reqParam);
    console.log('获取用例列表 param: ' + reqData);

    $.ajax({
        type: 'POST',
        url: host + "/api/scenario/getCaseList",
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            console.log(JSON.stringify(data));
            if (data) {
                if (data.result) { //有结果
                    console.log('获取用例列表成功');
                    console.log(data);
                    caseList = data.result;
                    displayCaseList(caseList);
                } else { //没结果,清空table
                    caseList = null;
                    displayCaseList(caseList);
                }
            }
        },
        error: function (xhr, error, exception) {
            //alert('请求失败');
            console.log('获取用例列表失败');
        }
    });
}

function queryCase(caseid) {
    var reqParam = {
        pathId: 154
    };
    var reqData = JSON.stringify(reqParam);
    console.log('获取用例信息 param: ' + reqData);

    $.ajax({
        type: 'POST',
        url: host + "/api/path/get",
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            if (data && data.returnCode == 0) {
                
                console.log(JSON.stringify(data));
                console.log('获取用例信息成功');
                //model = data.returnMsg;
                //$("textarea#model-content").html(model.graph_file);
                //$("div#projectModal").modal('hide');
                //console.log(data.pathList);
                //return data.pathList;
                //$('div#scenarioEditorModal').modal('hide');
                //setDisplayInfo(name, desc, execsetting);
                //initTree("scenario");
            }
        },
        error: function (xhr, error, exception) {
            //alert('请求失败');
            console.log('获取用例信息失败');
        }
    });
}

function queryAllPaths(userid, successCallback) {
    var reqParam = {
        userId: userid
    };
    var reqData = JSON.stringify(reqParam);
    console.log('获取all paths req param is: ' + reqData);

    $.ajax({
        type: 'POST',
        url: host + "/api/folder/paths",
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            console.log('获取all paths成功');
            console.log(JSON.stringify(data));
            if (data && data.result && data.result.length > 0) {
                successCallback(data.result);
            }
        },
        error: function (xhr, error, exception) {
            //alert('请求失败');
            console.log('获取all paths失败')
        }
    });
}

function zTreeOnClick(event, treeId, treeNode) {
    //treeNode.id treeNode.type(scenario,scenario_root)
    //{id":136,"folder_name":"测试场景1","folder_desc":"测试场景1测试场景1","type":"scenario"}
    console.log('zTreeOnClick the node is : ' + JSON.stringify(treeNode));
    //console.log(JSON.stringify(treeNode));
    if (treeNode.type == "scenario" && treeNode.id != scenario.id) {
        scenario = treeNode;
        displayScenarioInfo(scenario.folder_name, scenario.folder_desc, "");
        displayScenarioId(scenario);
        //display case list. To fetch case list first, when successed, call displayCaseList().
        queryCaseList(scenario.id);
    }
};


function zTreeBeforeRemove(treeId, treeNode) {


    if(treeNode.type =="scenario"||treeNode.type =="scenario_folder"){
        return confirm("确认删除节点 " + treeNode.folder_name + " 吗？");
    }else {
        alert("不允许删除场景根目录");
        return false;
    }



}

function zTreeOnRemove(event, treeId, treeNode) {

    console.log('zTreeOnClick the node is : ' + JSON.stringify(treeNode));
    var folderId = treeNode.id;
    var reqParam = {
        folderId: folderId
    };
    var reqData = JSON.stringify(reqParam);

    if (treeNode.type == "scenario") {
        $.ajax({
            type: 'POST',
            url: host + "/api/folder/delete",
            contentType: "application/json; charset=utf-8",
            data: reqData,
            dataType: "JSON",
            success: function (data) {
                if (data && data.returnCode == 0) {
                    initScenarioTree();
                }
            },
            error: function (xhr, error, exception) {
                //alert('请求失败');
                console.log(error);
                console.log(exception);
                console.log('场景删除失败');
            }
        });
    }

}
