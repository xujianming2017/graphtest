/**
 * Created by gaodeliang on 2017/4/21.
 */
var data = require('../models/auth')();
exports.model = function(req, res) {
    var url = req.url;
    switch (url) {
        //获取属于该用户的模型信息列表 入参：userId
        case "/api/user/getModelList":
            var userId = req.body.userId;

            if(!userId){
                res.json({returnCode:-1,returnMsg:'没有userId参数！',format:'{"userId":"用户Id"}'});
            }

            data.ApiModel.query(function(qb){
                qb.where("user_id",userId);

            }).fetchAll().then(function(models){
                res.json({returnCode:0,returnMsg:'查询模型列表成功',modelList:models});
            },function(){
                res.json({returnCode:-1,returnMsg:'查询模型列表失败！'});
            });


            /*new data.ApiModel({USER_ID: userId}).fetchAll().then(function(models){
                res.json({returnCode:0,returnMsg:'查询模型列表成功',modelList:models});
            },function(){
                res.json({returnCode:-1,returnMsg:'查询模型列表失败！'});
            });*/
            break;
        //模型信息创建 入参：modelName，modelFile，userId
        case "/api/model/create":
            console.log(req.body);
            var modelName = req.body.modelName;
            var modelFile = req.body.modelFile;
            var userId = req.body.userId;
            if(!modelFile){
                res.json({returnCode:-1,returnMsg:'模型文件为空，创建失败！',format:'{"modelName":"模型文件名称","modelFile":"模型文件内容","userId":"用户Id"}'});
            }
            var graphxml=formatGraphNode(modelFile);
            var nodeList=getNodeList(graphxml);
            var startNodeCount=0,endNodeCount=0;
            for(var i=0;i<nodeList.length;i++){
                if(nodeList[i].toUpperCase()=="START"){startNodeCount++;}
                if(nodeList[i].toUpperCase()=="END"){endNodeCount++;}
            }
            if(startNodeCount==0){
                res.json({returnCode:-1,returnMsg:'模型图中必须有一个start节点'});
            }
            if(startNodeCount>1){
                res.json({returnCode:-1,returnMsg:'模型图中有且只能有一个start节点'});
            }
            if(endNodeCount==0){
                res.json({returnCode:-1,returnMsg:'模型图中必须有一个end节点'});
            }
            if(endNodeCount>1){
                res.json({returnCode:-1,returnMsg:'模型图中有且只能有一个end节点'});
            }
            //保存模型信息
            new data.ApiModel({model_name: modelName,graph_file:graphxml,user_id:userId}).save().then(function(model){
                if(model){
                    res.json({returnCode:0,returnMsg:model});
                }else {
                    res.json({returnCode:-1,returnMsg:'创建模型失败！'});
                }
            },function(){
                res.json({returnCode:-1,returnMsg:'创建模型失败！'});
            });
            break;
        //更新模型信息 入参：modelId，modelName，modelFile，userId
        case "/api/model/update":
            console.log(req.body);
            var modelId = req.body.modelId;
            var modelName = req.body.modelName;
            var modelFile = req.body.modelFile;
            var userId = req.body.userId;
            if(!modelId){
                res.json({returnCode:-1,returnMsg:'没有modelId属性，更新失败！',format:'{"modelId":"模型文件Id","modelName":"模型文件名称","modelFile":"模型文件内容","userId":"用户Id"}'});
            }
            if(!modelFile){
                res.json({returnCode:-1,returnMsg:'模型文件为空，更新失败！',format:'{"modelId":"模型文件Id","modelName":"模型文件名称","modelFile":"模型文件内容","userId":"用户Id"}'});
            }
            var graphxml=formatGraphNode(modelFile);
            var nodeList=getNodeList(graphxml);
            var startNodeCount=0,endNodeCount=0;
            for(var i=0;i<nodeList.length;i++){
                if(nodeList[i].toUpperCase()=="START"){startNodeCount++;}
                if(nodeList[i].toUpperCase()=="END"){endNodeCount++;}
            }
            if(startNodeCount==0){
                res.json({returnCode:-1,returnMsg:'模型图中必须有一个start节点'});
            }
            if(startNodeCount>1){
                res.json({returnCode:-1,returnMsg:'模型图中有且只能有一个start节点'});
            }
            if(endNodeCount==0){
                res.json({returnCode:-1,returnMsg:'模型图中必须有一个end节点'});
            }
            if(endNodeCount>1){
                res.json({returnCode:-1,returnMsg:'模型图中有且只能有一个end节点'});
            }
            new data.ApiModel({id: modelId}).save({model_name: modelName,graph_file:graphxml,user_id:userId},{patch: true}).then(function(model){
                if(model){
                    res.json({returnCode:0,returnMsg:'更新成功！'});
                }else {
                    res.json({returnCode:-1,returnMsg:'根据id:'+modelId+'找不到模型，无法更新！'});
                }
            },function(){
                res.json({returnCode:-1,returnMsg:'更新模型异常！'});
            });
            break;
        //获取模型信息 入参：modelId
        case "/api/model/get":
            console.log(req.body);
            var modelId = req.body.modelId;
            if(!modelId){
                res.json({returnCode:-1,returnMsg:'没有modelId属性！请检查参数是否正确',format:'{"modelId":"模型文件Id"}'});
            }
            new data.ApiModel({id: modelId}).fetch().then(function(model){
                if(model){
                    var modelName=model.get('model_name');
                    var modelFile=model.get('graph_file');
                    var userId=model.get('user_id');
                    res.json({modelId:modelId,modelName:modelName,modelFile:modelFile,userId:userId,returnCode:0,returnMsg:'获取模型信息成功'});
                }else {
                    res.json({returnCode:-1,returnMsg:'根据id:'+modelId+'找不到模型，查询失败！'});
                }
            },function(){
                res.json({returnCode:-1,returnMsg:'查询模型失败！'});
            });
            break;
        //获取模型的顶点与边 入参：modelId
        case "/api/model/getVetexEdge":
            console.log(req.body);
            var modelId = req.body.modelId;

            if(!modelId){
                res.json({returnCode:-1,returnMsg:'没有modelId属性！请检查参数是否正确',format:'{"modelId":"模型文件Id"}'});
            }

            new data.ApiModel({id: modelId}).fetch().then(function(model){
                if(model){
                    //根据xml取到所有的边和节点
                    var graphXml=model.get('graph_file');
                    var nodeList=getNodeList(graphXml);
                    var edgeList=getEdgeList(graphXml);
                    res.json({returnCode:0,returnMsg:'查询成功！',modelId:modelId,vetexes:nodeList,edges:edgeList});
                }else {
                    res.json({returnCode:-1,returnMsg:'根据id:'+modelId+'找不到模型，查询失败！'});
                }
            },function(){
                res.json({returnCode:-1,returnMsg:'查询模型失败！'});
            });
            break;
        //删除模型信息 入参：modelId
        case "/api/model/delete":
            console.log(req.body);
            var modelId = req.body.modelId;
            if(!modelId){
                res.json({returnCode:-1,returnMsg:'没有modelId属性！请检查参数是否正确',format:'{"modelId":"模型文件Id"}'});
            }

            //删除模型信息
            new data.ApiModel({id: modelId}).destroy({require:true}).then(function(model){
                res.json({returnCode:0,returnMsg:'删除模型成功！'});
            },function(){
                res.json({returnCode:-1,returnMsg:'根据id:'+modelId+'删除模型失败！'});
            });
            break;

        //模型添加节点和边
        case "/api/model/addVetexEdge":
            var dom = require('xmldom').DOMParser,oSerializer=require('xmldom').XMLSerializer;
            var modelId = req.body.modelId;
            var fromNodeId = req.body.fromNodeId;
            var fromEdgeId= req.body.fromEdgeId;
            var nodeId= req.body.nodeId;
            var toNodeId = req.body.toNodeId;
            var toEdgeId=req.body.toEdgeId;
            if(!modelId){
                res.json({returnCode:-1,returnMsg:'没有modelId属性！请检查参数是否正确',model:'',format:'{"modelId":"模型文件Id","nodeId":"节点Id","fromNode":"入边来源节点ID","fromEdge":"入边ID","toNode":"出边目标节点ID","toEdge":"出边ID"}'});
            }
            if(!nodeId){
                res.json({returnCode:-1,returnMsg:'没有nodeId属性！请检查参数是否正确',model:'',format:'{"modelId":"模型文件Id","nodeId":"节点Id","fromNode":"入边来源节点ID","fromEdge":"入边ID","toNode":"出边目标节点ID","toEdge":"出边ID"}'});
            }
            if(!fromEdgeId){
                res.json({returnCode:-1,returnMsg:'没有fromEdgeId属性！请检查参数是否正确',model:'',format:'{"modelId":"模型文件Id","nodeId":"节点Id","fromNode":"入边来源节点ID","fromEdge":"入边ID","toNode":"出边目标节点ID","toEdge":"出边ID"}'});
            }
            if(!toEdgeId){
                res.json({returnCode:-1,returnMsg:'没有toEdgeId属性！请检查参数是否正确',model:'',format:'{"modelId":"模型文件Id","nodeId":"节点Id","fromNode":"入边来源节点ID","fromEdge":"入边ID","toNode":"出边目标节点ID","toEdge":"出边ID"}'});
            }
            if(!fromNodeId){
                fromNodeId="START";
            }
            if(!toNodeId){
                toNodeId="END";
            }
            new data.ApiModel({id: modelId}).fetch().then(function(model){
                if(model){
                    //根据xml取到所有的边和节点
                    var graphXml=model.get('graph_file');
                    var modelName=model.get('model_name');
                    var xmlDoc = new dom().parseFromString(graphXml);

                    //验证添加的节点ID和边ID在模型图中是否存在，存在的话，则返回失败
                    var nodeList=getNodeList(graphXml);
                    var edgeList=getEdgeList(graphXml);
                    for(var i=0;i<nodeList.length;i++){
                        if(nodeList[i]==nodeId){
                            res.json({returnCode:-1,returnMsg:'模型中已存在ID为'+nodeId+'的节点，请重新输入',model:''});
                        }
                    }
                    for(var i=0;i<edgeList.length;i++){
                        if(edgeList[i]==fromEdgeId){
                            res.json({returnCode:-1,returnMsg:'模型中已存在ID为'+fromEdgeId+'的边，请重新输入',model:''});
                        }
                        if(edgeList[i]==toEdgeId){
                            res.json({returnCode:-1,returnMsg:'模型中已存在ID为'+toEdgeId+'的边，请重新输入',model:''});
                        }
                    }

                    var newGraphXml=graphXml;
                    var graphElement=xmlDoc.getElementsByTagName("graph")[0];

                    //添加节点
                    var newNodeElement=xmlDoc.createElement("node");
                    var endNode=getElementByNodeId(xmlDoc,"END");
                    newNodeElement.setAttribute("id",nodeId);
                    graphElement.insertBefore(newNodeElement,endNode);

                    //添加节点的入边
                    var newFromEdgeElement=xmlDoc.createElement("edge");
                    newFromEdgeElement.setAttribute("id",fromEdgeId);
                    newFromEdgeElement.setAttribute("source",fromNodeId);
                    newFromEdgeElement.setAttribute("target",nodeId);
                    graphElement.appendChild(newFromEdgeElement);


                    //添加节点的出边
                    var newToEdgeElement=xmlDoc.createElement("edge");
                    newToEdgeElement.setAttribute("id",toEdgeId);
                    newToEdgeElement.setAttribute("source",nodeId);
                    newToEdgeElement.setAttribute("target",toNodeId);
                    graphElement.appendChild(newToEdgeElement);
                    console.log('模型修改成功！修改后的模型xml:'+newGraphXml);
                    if (xmlDoc.xml) {
                        newGraphXml=xmlDoc.xml;
                    }
                    else {
                        newGraphXml= new oSerializer().serializeToString(xmlDoc);
                    }
                    //保存修改后的模型信息
                    new data.ApiModel({id: modelId}).save({model_name: modelName,graph_file:newGraphXml,user_id:userId},{patch: true}).then(function(model){
                        if(model){
                            res.json({returnCode:0,returnMsg:'模型修改成功！',model:newGraphXml});
                        }else {
                            res.json({returnCode:-1,returnMsg:'根据id:'+modelId+'找不到模型，无法修改！',model:''});
                        }
                    },function(){
                        res.json({returnCode:-1,returnMsg:'更新模型异常！',model:''});
                    });

                }else {
                    res.json({returnCode:-1,returnMsg:'根据id:'+modelId+'找不到模型，查询失败！',model:''});
                }
            },function(){
                res.json({returnCode:-1,returnMsg:'查询模型失败！',model:''});
            });
            break;



        //路径信息生成 入参：modelId，start，end，algorithm
        case "/api/path/generate":
            var modelId = req.body.modelId;
            var startNode = req.body.start;
            var endNode = req.body.end;


            if(!modelId){
                res.json({returnCode:-1,returnMsg:'没有modelId属性！请检查参数是否正确',format:'{"modelId":"模型文件Id","start":"起始节点","end":"结束节点"}'});
            }
            if(!startNode){
                res.json({returnCode:-1,returnMsg:'无起始节点！请检查参数是否正确',format:'{"modelId":"模型文件Id","start":"起始节点","end":"结束节点"}'});
            }
            if(!endNode){
                res.json({returnCode:-1,returnMsg:'无结束节点！请检查参数是否正确',format:'{"modelId":"模型文件Id","start":"起始节点","end":"结束节点"}'});
            }
            if(startNode.toUpperCase()=='START'){
                startNode='START';
            }
            if(endNode.toUpperCase()=='END'){
                endNode='END';
            }


            //根据modelId获取模型xml文件
            new data.ApiModel({id: modelId}).fetch().then(function(model){
                if(model){
                    var graphXml=model.get('graph_file');
                    //var select = require('xpath.js'), dom = require('xmldom').DOMParser;
                    var dom = require('xmldom').DOMParser;
                    var xmlDoc = new dom().parseFromString(graphXml);
                    //var nodes = select(xmlDoc, "//node");
                    var nodes = xmlDoc.getElementsByTagName("node");
                    var nodeList=[];
                    var graph = new Graph();
                    for(var  i=0;i<nodes.length;i++){
                        var nodeId=nodes[i].getAttribute('id');
                        nodeList[i]=nodeId;
                    }
                    initGraph(nodeList,graph);//初始化有向图
                    //var edges = select(xmlDoc, "//edge");
                    var edges =  xmlDoc.getElementsByTagName("edge");
                    for(var  i=0;i<edges.length;i++){//对邻接矩阵的边进行赋值
                        var sourceNodeId=edges[i].getAttribute('source');
                        var targetNodeId=edges[i].getAttribute('target');
                        var soureIndex=nodeList.indexOf(sourceNodeId);
                        var targetIndex=nodeList.indexOf(targetNodeId);
                        var edgeId=edges[i].getAttribute('id');
                        initEdge(edgeId,sourceNodeId,targetNodeId,graph);
                        graph.matrix[soureIndex][targetIndex]=edgeId;
                    }
                    var startIndex=nodeList.indexOf(startNode);
                    var endIndex=nodeList.indexOf(endNode);
                    var initIndex=nodeList.indexOf("START");
                    if(startIndex==-1||endIndex==-1){
                        res.json({returnCode:-1,returnMsg:'参数不正确，请检查',pathList:[]});
                    }
                    //计算从start节点到要遍历的开始节点的最短路径
                    var initPath="";
                    if(startNode=="START"){
                        initPath="START"
                    }else{
                        var tmpPath = "START";
                        var initPathList=visit(initIndex,startIndex,graph,tmpPath);
                        if(initPathList.length==0){
                            res.json({returnCode:-1,returnMsg:'从节点start到节点'+startNode+'路径不可达',pathList:[]});
                        }else{
                            initPath=initPathList[0];
                            for(var i=0;i<initPathList.length;i++){
                                if(initPathList[i].length<initPath.length){
                                    initPath=initPathList[i];
                                }
                            }
                        }
                    }
                    //路径列表和路径数量重新初始化为0
                    graph.pathList=[];
                    graph.resultNum=0;

                    //遍历开始节点到结束节点的所有路径，路径前加上initPath
                    var pathList=visit(startIndex,endIndex,graph,initPath);


                    if(pathList.length==0){
                        res.json({returnCode:-1,returnMsg:'从节点'+startNode+'到节点'+endNode+'路径不可达',pathList:[]});
                    }else{
                        res.json({returnCode:0,returnMsg:'路径遍历成功',pathList:pathList});
                    }

                }else {
                    res.json({returnCode:-1,returnMsg:'根据id:'+modelId+'找不到模型图，查询失败！',pathList:[]});
                }
            },function(){
                res.json({returnCode:-1,returnMsg:'查询模型图失败！',pathList:[]});
            });
            break;
    }
}


    function getNodeList(graphXml) {
        var dom = require('xmldom').DOMParser;
        var xmlDoc = new dom().parseFromString(graphXml);
        var nodes = xmlDoc.getElementsByTagName("node");
        var nodeList=[];
        for(var  i=0;i<nodes.length;i++){
            var nodeId=nodes[i].getAttribute('id');
            nodeList[i]=nodeId;
        }
        return nodeList;
    };

    function getEdgeList(graphXml) {
        var dom = require('xmldom').DOMParser;
        var xmlDoc = new dom().parseFromString(graphXml);
        var edges =  xmlDoc.getElementsByTagName("edge");
        var edgeList=[];
        for(var  i=0;i<edges.length;i++){
            var edgeId=edges[i].getAttribute('id');
            edgeList[i]=edgeId;
        }
        return edgeList;
    };

    function formatGraphNode(modelFile){
        var dom = require('xmldom').DOMParser,oSerializer=require('xmldom').XMLSerializer;
        var xmlDoc = new dom().parseFromString(modelFile);
        var nodes = xmlDoc.getElementsByTagName("node");
        var nodeList=[];
        for(var  i=0;i<nodes.length;i++){
            var nodeId=nodes[i].getAttribute('id');
            if(nodeId.toUpperCase()=="START"){
                nodes[i].setAttribute("id","START");
            }
            if(nodeId.toUpperCase()=="END"){
                nodes[i].setAttribute("id","END");
            }
        }
        var edges =  xmlDoc.getElementsByTagName("edge");
        var edgeList=[];
        for(var  i=0;i<edges.length;i++){
            var source=edges[i].getAttribute('source');
            if(source.toUpperCase()=="START"){
                edges[i].setAttribute("source","START");
            }
            if(source.toUpperCase()=="END"){
                edges[i].setAttribute("source","END");
            }
            var target=edges[i].getAttribute('target');
            if(target.toUpperCase()=="START"){
                edges[i].setAttribute("target","START");
            }
            if(target.toUpperCase()=="END"){
                edges[i].setAttribute("target","END");
            }
        }
        if (xmlDoc.xml) {
            //IE
            return xmlDoc.xml;
        }
        else {
            //火狐
            return new oSerializer().serializeToString(xmlDoc);
        }
    }
    function getElementByEdgeId(xmlDoc,edgeId) {
        var edges =  xmlDoc.getElementsByTagName("edge");
        for(var  i=0;i<edges.length;i++){
            if(edgeId==edges[i].getAttribute('id')){
                return edges[i];
            }
        }
        return null;
    };

    function getElementByNodeId(xmlDoc,nodeId) {
        var nodes =  xmlDoc.getElementsByTagName("node");
        for(var  i=0;i<nodes.length;i++){
            if(nodeId==nodes[i].getAttribute('id')){
                return nodes[i];
            }
        }
        return null;
    };



    function Graph() {
        this.vertexList = [];//存放顶点的集合
        this.edgeList=[];//存放边的集合
        this.matrix=new Array();//存放邻接矩阵，映射edge与vertex的关系
        this.isVisited = [];//存放顶点是否访问过的数组
        this.vertexNum = 0;//顶点的数目
        this.edgeNum = 0;//边的数目
        this.pathList=[];//生成的路径list
        this.resultNum=0;//生成的路径个数
    }

    function Vertex() {
        this.id = null; //顶点的id属性
    };

    function Edge() {
        this.id = null; //边的id属性
        this.sourceId=null;//边的起点
        this.targetId=null;//边的终点
    };




    function initGraph(datas, graph) {
        initVertex(datas,graph);//初始化顶点
        initMatrix(datas,graph);//初始化邻接矩阵
    }

    function initVertex(datas, graph) {
        graph.vertexNum = datas.length;
        for (var i = 0; i < datas.length; i++) {
            var vertex = new Vertex();
            vertex.id = datas[i];
            graph.vertexList[i] = vertex;
            graph.isVisited[i] = false;
        }
    };

    function initEdge(id,sourceId,targetId, graph) {
        var edge = new Edge();
        edge.id=id;
        edge.sourceId=sourceId;
        edge.targetId=targetId;
        graph.edgeNum = graph.edgeNum+1;
        graph.edgeList[graph.edgeNum+1]=edge;
    };

    function initMatrix(datas,graph){
        var length=datas.length;
        for(var i=0;i<length;i++){
            graph.matrix[i]=new Array();
            //此处注释掉，会将邻接矩阵中的初始值为undefined。如需要将邻接矩阵初始为0或者对应权重值，将此处注释放开即可。
            for(var j=0;j<length;j++){
             graph.matrix[i][j]=0;
             }
        }
    }

    function visit(startIndex, endIndex, graph, tmpPath) {
        //tmpPath用来存放遍历未完成的节点路径
        graph.isVisited[startIndex] = true;
        for(var i=0;i<graph.vertexNum;i++){
            if (graph.matrix[startIndex][i]==0|| graph.isVisited[i]==true){continue;}//无路可通，或者已访问过                  ;
            if(i==endIndex)//找到一条路径，放到List中
            {
                var path=tmpPath+','+graph.matrix[startIndex][i]+','+graph.vertexList[i].id;
                graph.pathList[graph.resultNum]=path;
                graph.resultNum++;
                continue;
            }
            visit(i, endIndex,graph, tmpPath+','+graph.matrix[startIndex][i]+','+graph.vertexList[i].id);//递归遍历
            graph.isVisited[i]=false;
        }
        return graph.pathList;
    }

