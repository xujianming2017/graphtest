var userId;
var modelList;
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
    callback: {
        onClick: zTreeOnClick
    }
};
var zNodes;

var plumbInstance;

$(document).ready(function () {
    initTree("path");
    initModel(userId, loadModelSuccessed);

    $('input[id=file-model]').change(function () {
        $(this).closest(".form-group").find("input[type=text]").val($(this).val());
    });

    $('button#create-model').click(function () {
        //First, read xml file content.
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            // Check for the various File API support.
            var node = $("input#file-model").get(0);
            if (node.files && node.files[0]) {
                var file = node.files[0];
                var location = file.name.lastIndexOf(".");
                var modelName = file.name.substr(0, location);
                var modelContent = null;

                var reader = new FileReader();
                reader.onloadend = function (e) {
                    if (e.target.readyState == FileReader.DONE) {
                        modelContent = reader.result;
                        console.log(modelContent);
                        if (modelContent) {
                            //Second, post the file content to server.
                            createModel(modelName, modelContent, userId, createModelSuccessed);
                        }
                    }
                    //$("textarea#model-content").html(modelContent);
                };
                reader.readAsText(file, 'utf-8');
            } else {
                alert("请先选择文件，再保存!")
            }
        } else {
            alert('The File APIs are not fully supported in this browser.');
        }
    });

    $('button#update-model').click(function () {
        var modelId = model.id;
        var nodeId = $("input#nodeId").val();
        var fromNodeId = $("input#fromNodeId").val();
        var fromEdgeId = $("input#fromEdgeId").val();
        var toNodeId = $("input#toNodeId").val();
        var toEdgeId = $("input#toEdgeId").val();

        if (modelId && nodeId && fromNodeId && fromEdgeId && toNodeId && toEdgeId) {
            updateModelAddVetexEdge(modelId, nodeId, fromNodeId, fromEdgeId, toNodeId, toEdgeId, updateModelSuccessed);
        } else {
            alert("输入项不能为空");
        }
    });

    $('button#btn-show-model-editor').click(function () {
        //$("textarea#modal-model-content").html(model.graph_file);
        if (model) {
            $('div#modal-model-editor').modal('show');
        } else {
            alert("无模型信息，请先导入模型");
        }
    });
});

function loadModelSuccessed(mlist) {
//    modelList = mlist;
//    model = modelList[0];
    model = mlist;
    changeModelName(model.model_name);
    queryFullPaths(model.id, loadPathsSuccessed);
    
    console.log("loadModelSuccessed : " + JSON.stringify(model));
}

function createModelSuccessed(m) {
    $("div#projectModal").modal('hide');
    model = m;
    console.log("createModelSuccessed : " + JSON.stringify(model));
    queryFullPaths(model.id, loadPathsSuccessed);
}

function updateModelSuccessed(m) {
    $("div#modal-model-editor").modal('hide');
    //model = m;
    console.log("updateModelSuccessed : " + JSON.stringify(m));
    queryFullPaths(model.id, loadPathsSuccessed);
}

function loadPathsSuccessed(pathList) {
    console.log("loadPathsSuccessed : " + JSON.stringify(pathList));
    loadModelGraph(pathList);
}

function createModel(name, content, userid, createModelSuccessed) {
    var reqParam = {
        modelName: name,
        modelFile: content,
        userId: userid
    };
    var reqData = JSON.stringify(reqParam);
    console.log('创建model param: ' + reqData);

    $.ajax({
        type: 'POST',
        url: host + "/api/model/create",
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            console.log('创建model成功');
            console.log(JSON.stringify(data));
            if (data && data.returnCode == 0) {
                createModelSuccessed(data.returnMsg);
            }
        },
        error: function (xhr, error, exception) {
            //alert('请求失败');
            console.log('创建model失败');
        }
    });
}

function updateModel(modelid, name, content, userid, updateModelSuccessed) {
    var reqParam = {
        modelId: modelid,
        modelName: name,
        modelFile: content,
        userId: userid
    };
    var reqData = JSON.stringify(reqParam);
    console.log('更新model param: ' + reqData);

    $.ajax({
        type: 'POST',
        url: host + "/api/model/update",
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            if (data && data.returnCode == 0) {
                console.log('更新model成功');
                console.log(JSON.stringify(data));
                model.graph_file = content;
                //$("textarea#model-content").html(model.graph_file);
                //$("div#caseModal").modal('hide');
            }
        },
        error: function (xhr, error, exception) {
            //alert('请求失败');
            console.log('更新model失败');
        }
    });
}

function updateModelAddVetexEdge(modelid, nodeid, fromNodeid, fromEdgeid, toNodeid, toEdgeid, updateModelSuccessed) {
    var reqParam = {
        modelId: modelid,
        nodeId: nodeid,
        fromNodeId: fromNodeid,
        fromEdgeId: fromEdgeid,
        toNodeId: toNodeid,
        toEdgeId: toEdgeid
    };
    var reqData = JSON.stringify(reqParam);
    console.log('更新model AddVetexEdge param: ' + reqData);

    $.ajax({
        type: 'POST',
        url: host + "/api/model/addVetexEdge",
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            if (data && data.returnCode == 0) {
                console.log('更新model AddVetexEdge成功');
                console.log(JSON.stringify(data));
                updateModelSuccessed(data);
                //$("textarea#model-content").html(model.graph_file);
                //$("div#caseModal").modal('hide');
            }
        },
        error: function (xhr, error, exception) {
            //alert('请求失败');
            console.log('更新model AddVetexEdge失败');
        }
    });
}

jsPlumb.ready(function () {
    console.log("jsPlumb ready");
    jsPlumbReady();
});

function zTreeOnClick(event, treeId, treeNode) {
    //treeNode.id treeNode.type(scenario,scenario_root)
    console.log(JSON.stringify(treeNode));
};
