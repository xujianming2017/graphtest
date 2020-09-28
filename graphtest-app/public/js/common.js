var host = "http://192.168.200.88:3333";

function initTree(type) {
    var reqApi = host;
    if ("path" == type) {
        reqApi += "/api/folder/tree/path";
    } else if ("scenario" == type) {
        reqApi += "/api/folder/tree/scenario";
    }
    var reqParam = {
        userId: userId
    };
    var reqData = JSON.stringify(reqParam);
    console.log('获取tree req type is {'+type+ '} and param is: ' + reqData+' and req api is {'+reqApi+'}');

    $.ajax({
        type: 'POST',
        url: reqApi,
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            console.log('获取tree成功');
            console.log(JSON.stringify(data));
            //alert(data);
            //treeNodes = data; //把后台封装好的简单Json格式赋给treeNodes  
            zNodes = data;
            zTree = $.fn.zTree.init($("#tree"), zSetting, zNodes);
            zTree.expandAll(true);
        },
        error: function (xhr, error, exception) {
            //alert('请求失败');
            console.log('获取path tree失败')
        }
    });
}

function loadTree(type, successCallback) {
    var reqApi = host;
    if ("path" == type) {
        reqApi += "/api/folder/tree/path";
    } else if ("scenario" == type) {
        reqApi += "/api/folder/tree/scenario";
    }
    var reqParam = {
        userId: userId
    };
    var reqData = JSON.stringify(reqParam);
    console.log('获取tree req param is: ' + reqData);

    $.ajax({
        type: 'POST',
        url: reqApi,
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            if (data && data.length > 0) {
                console.log('获取tree成功');
                console.log(JSON.stringify(data));
                successCallback(data);
            }
        },
        error: function (xhr, error, exception) {
            //alert('请求失败');
            console.log('获取path tree失败')
        }
    });
}

//非异步获取tree数据
function getTreeData(type) {
    var reqApi = host;
    if ("path" == type) {
        reqApi += "/api/folder/tree/path";
    } else if ("scenario" == type) {
        reqApi += "/api/folder/tree/scenario";
    }
    var reqParam = {
        userId: userId
    };
    var reqData = JSON.stringify(reqParam);
    console.log('获取tree req param is: ' + reqData);

    $.ajax({
        type: 'POST',
        url: reqApi,
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            console.log('获取tree成功');
            console.log(JSON.stringify(data));
            //alert(data);
            //treeNodes = data; //把后台封装好的简单Json格式赋给treeNodes  
            zNodesSelector = data;
        },
        error: function (xhr, error, exception) {
            //alert('请求失败');
            console.log('获取path tree失败')
        }
    });
}

function initModel(uid, loadModelSuccessed) {
    var reqParam = {
        userId: uid
    };
    var reqData = JSON.stringify(reqParam);
    console.log('获取model list param: ' + reqData);
    $.ajax({
        type: 'POST',
        url: host + "/api/user/getModelList",
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            console.log('获取ModelList成功');
            console.log(JSON.stringify(data));
            //alert(data);
            if (data && data.returnCode == 0 && data.modelList.length > 0) {
                loadModelSuccessed(data.modelList[0]);
                //                $("textarea#model-content").html(model.graph_file);
            }
        },
        error: function (xhr, error, exception) {
            console.log('获取ModelList失败');
            alert('模型获取失败');
        }
    });
}

function changeModelName(modelname){
    $('a#model-name').html(modelname);
}

function loadModelGraph(paths) {
    if (paths && paths.length > 0) {
        var nodesList = new Array();

        $("div#canvas").empty();
        var left = 200;
        for (var i = 0; i < paths.length; i++) {
            var temp = paths[i].split(",");
            var nodes = new Array();
            var top = 20;

            for (var j = 0; j < temp.length; j += 2) {
                nodes.push(temp[j] + i);
                $("div#canvas").append("<div class='window jtk-node' id='fcw-" + temp[j] + i + "'style='left:" + left + "px;top:" + top + "px;'>" + temp[j] + "</div>");
                top += 100;
            }
            nodesList.push(nodes);
            left += 300;
        }
        draw(nodesList);
    }
}

function queryFullPaths(modelid, loadPathsSuccessed) {
    var reqParam = {
        modelId: modelid,
        start: 'START',
        end: 'END'
    };
    var reqData = JSON.stringify(reqParam);
    console.log('获取模型全路径 param: ' + reqData);

    $.ajax({
        type: 'POST',
        //        async: false,
        url: host + "/api/path/generate",
        contentType: "application/json; charset=utf-8",
        data: reqData,
        dataType: "json",
        success: function (data) {
            if (data && data.returnCode == 0) {
                console.log('获取模型全路径成功 result: ' + JSON.stringify(data));
                console.log(data.pathList);
                if (data.pathList && data.pathList.length > 0) {
                    loadPathsSuccessed(data.pathList);
                }
            }
        },
        error: function (xhr, error, exception) {
            //alert('请求失败');
            console.log('获取模型全路径失败');
        }
    });
}

function jsPlumbReady() {
    plumbInstance = window.jsp = jsPlumb.getInstance({
        // default drag options
        DragOptions: {
            cursor: 'pointer',
            zIndex: 2000
        },
        // the overlays to decorate each connection with.  note that the label overlay uses a function to generate the label text; in this
        // case it returns the 'labelText' member that we set on each connection in the 'init' method below.
        ConnectionOverlays: [
            ["Arrow", {
                location: 1,
                visible: true,
                width: 11,
                length: 11,
                id: "ARROW",
                events: {
                    click: function () {
                        alert("you clicked on the arrow overlay")
                    }
                }
            }],
            ["Label", {
                location: 0.1,
                id: "label",
                cssClass: "aLabel",
                events: {
                    tap: function () {
                        alert("hey");
                    }
                }
            }]
        ],
        Container: "canvas"
    });
    var basicType = {
        connector: "Bezier", //StateMachine,Flowchart
        paintStyle: {
            stroke: "red",
            strokeWidth: 4
        },
        hoverPaintStyle: {
            stroke: "blue"
        },
        overlays: [
            "Arrow"
        ]
    };
    plumbInstance.registerConnectionType("basic", basicType);
}

function draw(nodesList) {
    if (plumbInstance) {
        plumbInstance.reset();
        plumbInstance.setContainer($("#canvas"));
        // this is the paint style for the connecting lines..
        var connectorPaintStyle = {
                strokeWidth: 2,
                stroke: "#61B7CF",
                joinstyle: "round",
                outlineStroke: "white",
                outlineWidth: 2
            },
            // .. and this is the hover style.
            connectorHoverStyle = {
                strokeWidth: 3,
                stroke: "#216477",
                outlineWidth: 5,
                outlineStroke: "white"
            },
            endpointHoverStyle = {
                fill: "#216477",
                stroke: "#216477"
            },
            // the definition of source endpoints (the small blue ones)
            sourceEndpoint = {
                endpoint: "Dot",
                paintStyle: {
                    stroke: "#7AB02C",
                    fill: "transparent",
                    radius: 7,
                    strokeWidth: 1
                },
                isSource: true,
                connector: ["Flowchart", {
                    stub: [40, 60],
                    gap: 10,
                    cornerRadius: 5,
                    alwaysRespectStubs: true
            }],
                connectorStyle: connectorPaintStyle,
                hoverPaintStyle: endpointHoverStyle,
                connectorHoverStyle: connectorHoverStyle,
                dragOptions: {},
                overlays: [
                ["Label", {
                        location: [0.5, 1.5],
                        label: "Drag",
                        cssClass: "endpointSourceLabel",
                        visible: false
                }]
            ]
            },
            // the definition of target endpoints (will appear when the user drags a connection)
            targetEndpoint = {
                endpoint: "Dot",
                paintStyle: {
                    fill: "#7AB02C",
                    radius: 7
                },
                hoverPaintStyle: endpointHoverStyle,
                maxConnections: -1,
                dropOptions: {
                    hoverClass: "hover",
                    activeClass: "active"
                },
                isTarget: true,
                overlays: [
                ["Label", {
                        location: [0.5, -0.5],
                        label: "Drop",
                        cssClass: "endpointTargetLabel",
                        visible: false
                }]
            ]
            },
            init = function (connection) {
                connection.getOverlay("label").setLabel(connection.sourceId.substring(15) + "-" + connection.targetId.substring(15));
            };

        var _addEndpoints = function (toId, sourceAnchors, targetAnchors) {
            for (var i = 0; i < sourceAnchors.length; i++) {
                var sourceUUID = toId + sourceAnchors[i];
                plumbInstance.addEndpoint("fcw-" + toId, sourceEndpoint, {
                    anchor: sourceAnchors[i],
                    uuid: sourceUUID
                });
            }
            for (var j = 0; j < targetAnchors.length; j++) {
                var targetUUID = toId + targetAnchors[j];
                plumbInstance.addEndpoint("fcw-" + toId, targetEndpoint, {
                    anchor: targetAnchors[j],
                    uuid: targetUUID
                });
            }
        };

        //suspend drawing and initialise.
        plumbInstance.batch(function () {
            var locatorEnum = {
                top: "TopCenter",
                right: "RightMiddle",
                bottom: "BottomCenter",
                left: "LeftMiddle"
            }
            for (var i = 0; i < nodesList.length; i++) {
                var nodes = nodesList[i];
                //Add Endpoints
                for (var m = 0; m < nodes.length; m++) {
                    _addEndpoints(nodes[m], [locatorEnum.right, locatorEnum.bottom], [locatorEnum.left, locatorEnum.top]);
                }
                //Add Connections
                for (var n = 0; n < nodes.length - 1; n++) {
                    var sourceUUID = nodes[n] + locatorEnum.bottom;
                    var targetUUID = nodes[n + 1] + locatorEnum.top;
                    console.log("sourceUUID:" + sourceUUID + " targetUUID:" + targetUUID);
                    plumbInstance.connect({
                        uuids: [sourceUUID, targetUUID],
                        editable: true
                    });
                }
            }

            // listen for new connections; initialise them the same way we initialise the connections at startup.
            plumbInstance.bind("connection", function (connInfo, originalEvent) {
                init(connInfo.connection);
            });

            // make all the window divs draggable
            plumbInstance.draggable(jsPlumb.getSelector(".flowchart-demo .window"), {
                grid: [20, 20]
            });
            // THIS DEMO ONLY USES getSelector FOR CONVENIENCE. Use your library's appropriate selector
            // method, or document.querySelectorAll:
            //jsPlumb.draggable(document.querySelectorAll(".window"), { grid: [20, 20] });

            //
            // listen for clicks on connections, and offer to delete connections on click.
            //
            plumbInstance.bind("click", function (conn, originalEvent) {
                // if (confirm("Delete connection from " + conn.sourceId + " to " + conn.targetId + "?"))
                //   plumbInstance.detach(conn);
                conn.toggleType("basic");
            });

            plumbInstance.bind("connectionDrag", function (connection) {
                console.log("connection " + connection.id + " is being dragged. suspendedElement is ", connection.suspendedElement, " of type ", connection.suspendedElementType);
            });

            plumbInstance.bind("connectionDragStop", function (connection) {
                console.log("connection " + connection.id + " was dragged");
            });

            plumbInstance.bind("connectionMoved", function (params) {
                console.log("connection " + params.connection.id + " was moved");
            });
        });

    }
    //jsPlumb.fire("jsPlumbDemoLoaded", plumbInstance);
}
