var userId;
var model;
var pathList;
var path;

var zTree;
var zSetting = {
    view: {
        addHoverDom: addHoverDom,
        removeHoverDom: removeHoverDom,
        dblClickExpand: true,
        showLine: true,
        showIcon: true,
        showTitle: true,
        selectedMulti: false
    },
    edit: {
        enable: true,
        removeTitle: "删除路径或目录",
        renameTitle: "编辑路径或目录名称",
        showRemoveBtn: true,
        showRenameBtn: true
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
        onClick: zTreeOnClick,
        onRename: zTreeOnRename,
        beforeEditName: zTreeBeforeEditName,
        onRemove:zTreeOnRemove,
        beforeRemove:zTreeBeforeRemove
    }
};
var zNodes;

$(document).ready(function () {
    initTree("path");
    initModel(userId, loadModelSuccessed);

    $('button#btn-get-path-all').click(function () {
        //console.log(model);
        //$('div#modal-folder-name').modal('show');
        pathList = null;
        if (model) {
            //pathGenerate(model.id,'START','END');
            generatePath(model.id, 'START', 'END');
        } else {
            alert("当前用户无模型数据，请先导入模型!");
        }
    });

    $('button#btn-get-path-custom').click(function () {
        $('div#modal-select-nodes').modal('show');
    });

    $('button#modal-btn-save-paths').click(function () {
        //todo save paths
        var folderName = $('input#folder-name').val();
        savePaths(folderName, pathList, model.id, userId);
    });

    $('button#modal-btn-get-path').click(function () {
        //        var start = $('select#sel-node-start').val();
        //        var end = $('select#sel-node-end').val();
        var start = $('input#node-start').val();
        var end = $('input#node-end').val();
        generatePath(model.id, start, end);

        //        if (pathList && pathList.length) {
        //            $('div#modal-select-nodes').modal('hide');
        //            $('div#modal-folder-name').modal('show');
        //        }
    });
});

function loadModelSuccessed(m) {
    model = m;
    changeModelName(model.model_name);
    queryFullPaths(model.id, loadPathsSuccessed);

    console.log("loadModelSuccessed : " + JSON.stringify(model));
}

function loadPathsSuccessed(pathList) {
    console.log("loadPathsSuccessed : " + JSON.stringify(pathList));
    loadModelGraph(pathList);
}

//vetexEdgeId 
//get all: start: 'START'; end: 'END'
function generatePath(modelid, start, end) {
    var reqParam = {
        modelId: modelid,
        start: start,
        end: end
    };
    var reqData = JSON.stringify(reqParam);
    console.log('路径生成 param: ' + reqData);

    $.ajax({
        type: 'POST',
        url: host + "/api/path/generate",
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            console.log('路径生成成功');
            console.log(JSON.stringify(data));
            if (data && data.returnCode == 0) {
                console.log(data.pathList);
                pathList = data.pathList;
                if (pathList && pathList.length) {
                    $('div#modal-select-nodes').modal('hide');
                    $('div#modal-folder-name').modal('show');
                }
            }
        },
        error: function (xhr, error, exception) {
            //alert('请求失败');
            console.log('路径生成失败');
        }
    });
}

function savePaths(foldername, pathlist, modelid, userid) {
    var result = false;
    var reqParam = {
        folderName: foldername,
        pathList: pathlist,
        modelId: modelid,
        userId: userid
    };
    var reqData = JSON.stringify(reqParam);
    console.log('路径保存 param: ' + reqData);

    $.ajax({
        type: 'POST',
        url: host + "/api/folder/appendPaths",
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            console.log('路径保存成功');
            console.log(JSON.stringify(data));
            if (data && data.returnCode == 0) {
                //model = data.returnMsg;
                //$("textarea#model-content").html(model.graph_file);
                //$("div#projectModal").modal('hide');
                //console.log(data.pathList);
                //return data.pathList;
                $('div#modal-folder-name').modal('hide');
                initTree("path");
            }
        },
        error: function (xhr, error, exception) {
            //alert('请求失败');
            console.log('路径保存失败');
        }
    });
}

function queryPath(pathid, successCallback) {
    var reqParam = {
        pathId: pathid
    };
    var reqData = JSON.stringify(reqParam);
    console.log('获取Path信息 param: ' + reqData);

    $.ajax({
        type: 'POST',
        url: host + "/api/path/get",
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            if (data && data.returnCode == 0) {

                console.log(JSON.stringify(data));
                console.log('获取Path信息成功');
                successCallback(data.returnMsg);
            }
        },
        error: function (xhr, error, exception) {
            //alert('请求失败');
            console.log('获取Path信息失败');
        }
    });
}

function linkjs(pathid) {
    var reqParam = {
        pathId: pathid
    };
    var reqData = JSON.stringify(reqParam);
    console.log('给path关联脚本 param: ' + reqData);

    $.ajax({
        type: 'POST',
        url: host + "/api/path/updateJsScript",
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            if (data && data.returnCode == 0) {
                console.log(JSON.stringify(data));
                console.log('给path关联脚本成功');
            }
        },
        error: function (xhr, error, exception) {
            //alert('请求失败');
            console.log('给path关联脚本失败');
        }
    });
}

function delNode(pathid) {
    var reqParam = {
        folderId: pathid
    };
    var reqData = JSON.stringify(reqParam);
    console.log('删除节点 param: ' + reqData);

    $.ajax({
        type: 'POST',
        url: host + "/api/folder/delete",
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            if (data && data.returnCode == 0) {
                console.log(JSON.stringify(data));
                console.log('删除节点成功');

                initTree("path");
            }
        },
        error: function (xhr, error, exception) {
            //alert('请求失败');
            console.log('删除节点成功失败');
        }
    });
}


jsPlumb.ready(function () {
    console.log("jsPlumb ready");
    jsPlumbReady();
});


function zTreeBeforeRemove(treeId, treeNode) {


    if(treeNode.type =="case"||treeNode.type =="case_folder"){
        return confirm("确认删除节点 " + treeNode.folder_name + " 吗？");
    }else {
        alert("不允许删除路径根目录");
        return false;
    }





}

function zTreeOnRemove(event, treeId, treeNode) {

    console.log('zTreeOnClick the node is : ' + JSON.stringify(treeNode));
    var folderId = treeNode.id;
    delNode(folderId);


}




function zTreeBeforeEditName(treeId, treeNode) {
    console.log(treeNode.type=="case");
   if(treeNode.type =="case"||treeNode.type =="case_folder"){
       return true;
   }else {
       alert("根目录不允许重命名");
       return false;
   }

}

function zTreeOnRename(event, treeId, treeNode, isCancel) {

    console.log('zTreeOnClick the node is : ' + JSON.stringify(treeNode));
    var folderId = treeNode.id;
    var folderName = treeNode.folder_name;

    var renameData = {folderId:folderId,folderName:folderName};
    if (treeNode.type == "case"||treeNode.type =="case_folder") {
        $.ajax({
            type: 'POST',
            url: host + "/api/folder/rename",
            // contentType: "application/json; charset=utf-8",
            data: renameData,
            dataType: "JSON",
            success: function (data) {
                if (data && data.returnCode == 0) {
                    initTree("path");
                }
            },
            error: function (xhr, error, exception) {
                //alert('请求失败');
                console.log(error);
                console.log(exception);
                console.log('节点重命名失败');
            }
        });
    }




}



function zTreeOnClick(event, treeId, treeNode) {
    console.log('zTreeOnClick the node is : ' + JSON.stringify(treeNode));
    //console.log(JSON.stringify(treeNode));
    if (treeNode.type == "case") {
        if (path && treeNode.id != path.id) {
            path = treeNode;
            queryPath(path.id, function (path) {
                var pathlist = new Array();
                pathlist.push(path.graph_path);
                loadModelGraph(pathlist);
            });
        } else {
            path = treeNode;
            queryPath(path.id, function (path) {
                var pathlist = new Array();
                pathlist.push(path.graph_path);
                loadModelGraph(pathlist);
            });
        }
    }
};

function addHoverDom(treeId, treeNode) {
    var sObj = $("#" + treeNode.tId + "_span");
    if (treeNode.isParent || $("#linkBtn_" + treeNode.tId).length > 0) return;
    var linkStr = "<span class='button linkjs' id='linkBtn_" + treeNode.tId +
        "' title='关联脚本' onfocus='this.blur();'></span>";
    sObj.after(linkStr);
    var linkBtn = $("#linkBtn_" + treeNode.tId);

    if (linkBtn) linkBtn.bind("click", function () {
        //var zTree = $.fn.zTree.getZTreeObj("tree");
        //        zTree.addNodes(treeNode, {
        //            id: (100 + newCount),
        //            pId: treeNode.id,
        //            name: "new node" + (newCount++)
        //        });
        //alert(JSON.stringify(treeNode));
        linkjs(treeNode.id);
        return false;
    });

  /*  if (delBtn) delBtn.bind("click", function () {
        //var zTree = $.fn.zTree.getZTreeObj("tree");
        //        zTree.addNodes(treeNode, {
        //            id: (100 + newCount),
        //            pId: treeNode.id,
        //            name: "new node" + (newCount++)
        //        });
        //alert(JSON.stringify(treeNode));
        delNode(treeNode.id);
        return false;
    });*/




};

function removeHoverDom(treeId, treeNode) {
    $("#linkBtn_" + treeNode.tId).unbind().remove();
/*    $("#delBtn_" + treeNode.tId).unbind().remove();*/
};
