var data = require('../models/auth')();
var f = require('../models/folder');
var ps = require('../models/pathScript');
var Bookshelf = require('bookshelf').mysqlAuth;
exports.path = function(req, res) {
    var url = req.url;

    switch(url){
        //增加子节点
        case "/api/path/create":
            var modelId = req.body.modelId;
            if(!modelId){

                res.json({returnCode:-1,returnMsg:'没有modelId参数！请查看报文的format',format:'{"modelId":"模型id","pathName":"路径名称","graphPath":"路径内容","folderId":"父目录节点","scriptContent":"脚本内容（可选）"}'});

            }
            var pathName = req.body.pathName;
            if(!pathName){

                res.json({returnCode:-1,returnMsg:'没有pathName参数！请查看报文的format',format:'{"modelId":"模型id","pathName":"路径名称","graphPath":"路径内容","folderId":"父目录节点","scriptContent":"脚本内容（可选）"}'});
            }
            var graphPath = req.body.graphPath;
            if(!graphPath){

                res.json({returnCode:-1,returnMsg:'没有graphPath参数！请查看报文的format',format:'{"modelId":"模型id","pathName":"路径名称","graphPath":"路径内容","folderId":"父目录节点","scriptContent":"脚本内容（可选）"}'});
            }

            var folderId = req.body.folderId;
            if(!folderId){

                res.json({returnCode:-1,returnMsg:'没有folderId参数！请查看报文的format',format:'{"modelId":"模型id","pathName":"路径名称","graphPath":"路径内容","folderId":"父目录节点","scriptContent":"脚本内容（可选）"}'});
            }
            var scriptContent = req.body.scriptContent;

            new data.ApiFolder({id:folderId}).fetch().then(function(folder){
                if(folder){
                    if(folder.attributes.type === "case_root"||folder.attributes.type === "case_folder"){
                        var child = {};
                        child.folder_name = pathName;
                        child.type = "case";
                        new f().appendChild(folder,child,function(result){
                            var casePath = result.returnMsg;
                            //保存一个场景信息
                            new data.ApiPath().save({id:casePath.attributes.id,model_id: modelId,graph_path:graphPath,graphpath_script_content:scriptContent},{method:"insert"}).then(function(path){
                                if(path){
                                    res.json({returnCode:0,returnMsg:path});
                                }else {
                                    res.json({returnCode:-1,returnMsg:'创建路径失败！'});
                                }
                            }).catch(function(error){
                                res.json({returnCode:-1,returnMsg:'添加子节点失败！:'+error});
                            });
                        });
                    }else {
                        res.json({returnCode:-1,returnMsg:'指定的folderId不是路径目录！'});
                    }
                }else {
                    res.json({returnCode:-1,returnMsg:'指定的folderId不存在！'});
                }

            });

            // 插入目录

            break;
        //更新路径信息
        case "/api/path/update":

            var pathId = req.body.pathId;
            if(!pathId){

                res.json({returnCode:-1,returnMsg:'没有pathId参数！请查看报文的format',format:'{"pathId","路径Id","modelId":"模型id（可选）","graphPath":"路径内容（可选）","scriptContent":"脚本内容（可选）"}'});

            }

            var modelId = req.body.modelId;
            var graphPath = req.body.graphPath;
            var scriptContent = req.body.scriptContent;

            var pathModel = {};
            if(modelId){
                pathModel.model_id = modelId;
            }
            if(graphPath){
                pathModel.graph_path = graphPath;
            }
            if(scriptContent){
                pathModel.graphpath_script_content = scriptContent;
            }

            new data.ApiPath({id:pathId}).save(pathModel).then(function(path){

                if(path){
                    res.json({returnCode:0,returnMsg:path});
                }else {
                    res.json({returnCode:-1,returnMsg:'更新路径失败！'});
                }

            }).catch(function(error){
                res.json({returnCode:-1,returnMsg:'更新路径失败！:'+error});
            });


            break;

        //查询路径信息
        case "/api/path/get":

            var pathId = req.body.pathId;
            if(!pathId){
                res.json({returnCode:-1,returnMsg:'没有pathId参数！请指定路径的ID',format:'{"pathId":"路径Id"}'});
            }

            new data.ApiPath({id:pathId}).fetch().then(function(path){

                if(path){
                    res.json({returnCode:0,returnMsg:path});
                }else {
                    res.json({returnCode:-1,returnMsg:'查询路径失败！'});
                }

            }).catch(function(error){
                res.json({returnCode:-1,returnMsg:'查询路径失败！:'+error});
            });

            break;

        //查询路径信息
        case "/api/path/delete":

            var pathId = req.body.pathId;
            if(!pathId){
                res.json({returnCode:-1,returnMsg:'没有pathId参数！请指定路径的ID',format:'{"pathId":"路径Id"}'});
            }

            //删除一个场景信息
            new data.ApiPath({id: pathId}).destroy({require:true}).then(function(path){

                res.json({returnCode:0,returnMsg:'删除场景成功！'});

            },function(){
                res.json({returnCode:-1,returnMsg:'根据id:'+pathId+'删除测试场景失败！'});
            });
            break;

        ///api/path/getJsScript

        //查询路径脚本信息
        case "/api/path/getJsScript":

            var pathId = req.body.pathId;
            if(!pathId){
                res.json({returnCode:-1,returnMsg:'没有pathId参数！请指定路径的ID',format:'{"pathId":"路径Id"}'});
            }

            //一个场景信息
            new data.ApiPath({id: pathId}).fetch().then(function(path){

                if(path){
                    res.json({returnCode:0,returnMsg:path.attributes.graphpath_script_content});
                }else {
                    res.json({returnCode:-1,returnMsg:'查询路径脚本失败！'});
                }


            },function(){
                res.json({returnCode:-1,returnMsg:'根据id:'+pathId+'查询测试路径脚本失败！'});
            });
            break;
        //更新当前的path脚本
        //当节点的脚本更新后，可以调用此接口来完成path的脚本更新
        case "/api/path/updateJsScript":

            var pathId = req.body.pathId;
            if(!pathId){
                res.json({returnCode:-1,returnMsg:'没有pathId参数！请指定路径的ID',format:'{"pathId":"路径Id"}'});
            }

            //一个场景信息
            new data.ApiPath({id: pathId}).fetch().then(function(path){

                if(path){

                    new ps().saveTestScript(path,function(result){
                        if(result.scripts.length>0){

                            // var script = result.scripts.join("\n");
                            path.set("graphpath_script_content",result.scripts);

                            new data.ApiPath(path.attributes).save().then(function(pathNew){
                                res.json({returnCode:0,returnMsg:'组装脚本成功！',graphPath:path});
                            }).catch(function(error){
                                res.json({returnCode:-1,returnMsg:'更新路径的脚本信息失败！'+error});
                            });


                        }else {
                            res.json({returnCode:-1,returnMsg:'组装脚本为空！'});
                        }
                    });

                    // res.json({returnCode:0,returnMsg:path});
                }else {
                    res.json({returnCode:-1,returnMsg:'查询路径脚本失败！'});
                }


            },function(){
                res.json({returnCode:-1,returnMsg:'根据id:'+pathId+'查询测试路径脚本失败！'});
            });
            break;


        default:
            res.json({userList:'',returnCode:-1,returnMsg:'没有对应的处理方法！'});
            break;
    }



//回调返回结果
    function  returnRes(result){
        res.json(result);
    }


}





