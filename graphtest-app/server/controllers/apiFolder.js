var data = require('../models/auth')();
var f = require('../models/folder');
var async = require('async');
var Bookshelf = require('bookshelf').mysqlAuth;
var delFolder = require('../models/delTransaction');
var updateFolder = require('../models/updateFolderTransaction');
exports.folder = function(req, res) {
    var url = req.url;

//      save:保存
//      appendChild:增加子节点
//      findChildren:查询所有子节点
//      findRootAndChild：查找根节点及一级节点
//      deleteSelfAndChild：删除自己及子节点（单个节点）
//      nextWeight:排序（select case when max(weight) is null then 1 else (max(weight) + 1) end from %s where parentId = ?1）
//      /api/{id}/rename?newName={newName}
//      /api/{id}/delete
//      /api/{id}/appendChild
//      /api/{sourceId}/{targetId}/{moveType}/move
//      /api/load

/*    config.renameUrl = config.renameUrl || (config.urlPrefix + "/ajax/{id}/rename?newName={newName}");
    config.removeUrl = config.removeUrl || (config.urlPrefix + "/ajax/{id}/delete");
    config.addUrl = config.addUrl || (config.urlPrefix + "/ajax/{id}/appendChild");
    config.moveUrl = config.moveUrl || (config.urlPrefix + "/ajax/{sourceId}/{targetId}/{moveType}/move");
    config.asyncLoadAll = config.asyncLoadAll || false;
    config.loadUrl = config.loadUrl || (config.urlPrefix + "/ajax/load" +
        "?async=" + config.async +
        "&asyncLoadAll=" + config.asyncLoadAll +
        (config.excludeId ? "&excludeId=" + config.excludeId : "") +
        (config.onlyDisplayShow ? "&search.show_eq=true" : ""));
    */

    switch(url){

        //增加子节点
        case "/api/folder/appendChild":
            var folderId = req.body.folderId;
            if(!folderId){
                res.json({returnCode:-1,returnMsg:'没有folderId参数！',format:'{"folderId":"父节点Id","folderType":"节点类型：两种[case,scenario]","folderName":"节点名称","folderDesc":"描述"}'});
            }
            var folderType = req.body.folderType;
            if(!folderType){
                res.json({returnCode:-1,returnMsg:'没有folderType参数！',format:'{"folderId":"父节点Id","folderType":"节点类型：两种[case,scenario]","folderName":"节点名称","folderDesc":"描述"}'});
            }
            var folderName = req.body.folderName;
            if(!folderName){
                res.json({returnCode:-1,returnMsg:'没有folderName参数！',format:'{"folderId":"父节点Id","folderType":"节点类型：两种[case,scenario]","folderName":"节点名称","folderDesc":"描述"}'});
            }
            var folderDesc = req.body.folderDesc;
            //在指定父节点下，插入子节点
            new data.ApiFolder({id: folderId}).fetch().then(function(parent){
                var child = {};
                child.folder_name = folderName;
                child.folder_desc = folderDesc;
                child.type = folderType;

                new f().appendChild(parent,child,returnRes);
                // new f.FolderModel().appendChild(parent,child,returnRes);
                // appendChild(parent,child,returnRes)

            }).catch(function(error){
                res.json({returnCode:-1,returnMsg:'添加子节点失败！:'+error});
            });
            break;
        //查询所有子节点信息
        case "/api/folder/findChildren":
            var folderId = req.body.folderId;
            if(!folderId){
                res.json({returnCode:-1,returnMsg:'没有folderId参数！'});
            }
            var folderType = req.body.folderType;

            // save(url,returnRes);
            break;
        case "/api/folder/tree/path":
            var userId = req.body.userId;
            if(!userId){
                userId = req.session.user.id;
            }
            new data.ApiUserFolder({user_id:userId}).fetch().then(function (userFolder) {
                if(userFolder){
                    //查找目录根节点
                    var folder_root_id = userFolder.attributes.folder_root_id;
                    new data.ApiFolder({id: folder_root_id}).fetch().then(function(parent){
                        //查找子节点
                        new f().findChildren(parent,'case',returnTreeRes);

                    }).catch(function(error){
                        res.json({returnCode:-1,returnMsg:'添加子节点失败！:'+error});
                    });
                }else {
                    res.json({returnCode:-1,returnMsg:'查询用户目录不存在！'});
                }



            }).catch(function(error){
                res.json({returnCode:-1,returnMsg:'查找用户目录异常！:'+error});
            });
            break;
        case "/api/folder/tree/scenario":
            var userId = req.body.userId;
            if(!userId){
                if(req.session.user){
                    userId = req.session.user.id;
                }else {
                    res.json({returnCode:-1,returnMsg:'没有userId参数！请查看报文的format',format:'{"userId":"用户Id"}'});
                }
            }
            new data.ApiUserFolder({user_id:userId}).fetch().then(function (userFolder) {
                if(userFolder){
                    //查找目录根节点
                    var folder_root_id = userFolder.get("folder_root_id");
                    new data.ApiFolder({id: folder_root_id}).fetch().then(function(parent){
                        //查找子节点

                        new f().findChildren(parent,'scenario',returnTreeRes);


                    }).catch(function(error){
                        res.json({returnCode:-1,returnMsg:'查找目录子节点失败！:'+error});
                    });
                }else {
                    res.json({returnCode:0,returnMsg:'没有找到此用户的目录，请联系管理员！:'});
                }
            }).catch(function(error){
                res.json({returnCode:-1,returnMsg:'查找用户的目录节点失败！:'+error});
            });

            break;

        //增加子节点
        case "/api/folder/appendPaths":
            var folderName = req.body.folderName;
            var pathList = req.body.pathList;
            var modelId = req.body.modelId;
            var userId = req.body.userId;

            if(!folderName){
                res.json({returnCode:-1,returnMsg:'没有folderName参数！',format:'{"folderName":"父目录命名","pathList":"路径集合[]","modelId":"模型id","userId":"用户id，可选"}'});

            }
            if(!pathList){
                res.json({returnCode:-1,returnMsg:'没有pathList参数！',format:'{"folderName":"父目录命名","pathList":"路径集合[]","modelId":"模型id","userId":"用户id，可选"}'});

            }
            if(!modelId){
                res.json({returnCode:-1,returnMsg:'没有modelId参数！',format:'{"folderName":"父目录命名","pathList":"路径集合[]","modelId":"模型id","userId":"用户id，可选"}'});

            }



            Bookshelf.transaction(function(t){

                new data.ApiUser({id:userId}).fetch({withRelated:['modelFolder']}).then(function(user){
                    if(user){
                    var modelFolders = user.related('modelFolder');
                    if(modelFolders&&modelFolders.models.length>0){

                        var modelFolder = modelFolders.models[0];
                        var parentid_list = '0/'+modelFolder.get("folder_root_id")+"/%";
                        data.ApiFolder.query().where("folder_name","=",folderName).where('parentid_list','like',parentid_list).then(function(parents){

                            var parent = parents[0];
                            if(parent){
                                savePathsAndFolder(pathList,parent,t);
                            }else{
                                //    新建一个case folder
                                        new f().findUserFolder(user,function(rootFolder){
                                            //    查询路径根目录
                                            new f().findChildren(rootFolder,"case_root",function(folders){

                                                if(folders.models.length>0){
                                                    var caseRootFolder = folders.models[0];
                                                    var caseFolder = {};
                                                    caseFolder.folder_name = folderName;
                                                    caseFolder.folder_desc = "路径目录";
                                                    caseFolder.type = "case_folder";

                                                    //创建一个新的路径目录
                                                    new f().appendChild(caseRootFolder,caseFolder,function(result){
                                                        console.log(result.returnMsg);

                                                        savePathsAndFolder(pathList,result.returnMsg,t);
                                                    });
                                                }
                                            })
                                        });


                            }

                        });

                    }else {
                        res.json({returnCode:-1,returnMsg:'session没有用户信息！或者没有userId参数查不到用户数据'});
                    }
                        //查询folder_name的目录 ,如果没有目录，那就新在根目录下创建一个目录
                  /*      new data.ApiFolder({folder_name: folderName}).fetch().then(function(parent){

                        });*/

                    }



                });


            });
            break;

        //查询子节点
        case "/api/folder/paths":
            var userId = req.body.userId;

            if(!userId){
                res.json({returnCode:-1,returnMsg:'没有userId参数！',format:'{"userId":"父目录命名"}'});
            }

            new data.ApiUserFolder({user_id:userId}).fetch().then(function (userFolder) {
                if (userFolder) {
                    //查找目录根节点
                    var folder_root_id = userFolder.get("folder_root_id");
                    new data.ApiFolder({id: folder_root_id}).fetch().then(function(parent) {
                        //查找子节点
                        new f().findChildren(parent,'case',function(models){


                            var results = models.filter(function(model){

                                return model.get("type")==="case";

                            });

                            res.json({returnCode:0,returnMsg:'查找的用户的path信息列表成功！',result:results});


                        });

                    });
                }
            }).catch(function(error){

                res.json({returnCode:-1,returnMsg:'查找的用户的path信息列表失败！'+error});
            });


            break;


        case "/api/folder/delete":

            var folderId = req.body.folderId;
            if(!folderId){
                res.json({returnCode:-1,returnMsg:'没有folderId参数！',format:'{"folderId":"删除节点Id"}'});
            }
            delFolder(folderId,function(result){

                return res.json(result);
            });

            break;

        //更新目录名称
        case "/api/folder/rename":

            var folderId = req.body.folderId;
            var folderName = req.body.folderName;
            if(!folderId){
                res.json({returnCode:-1,returnMsg:'没有folderId参数！',format:'{"folderId":"目录Id"，"folderName":""}'});
            }
            if(!folderName){
                res.json({returnCode:-1,returnMsg:'没有folderName参数！',format:'{"folderId":"目录Id"，"folderName":""}'});
            }
            updateFolder(folderId,folderName,function(result){

                return res.json(result);
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

    function  returnTreeRes(result){
        res.json(result);
    }

    function  savePathsAndFolder(pathList,parent,t){
        var i = 0;
        async.eachSeries(pathList, function(item, callback) {
            //延时执行
            setTimeout(function() {
                //插入folder case节点
                i++;
                var child = {};
                child.folder_name="model_"+modelId+"_path_"+i;
                child.type = "case";
                new f().appendChild(parent,child,function(result){
                    //插入path表
                    new data.ApiPath().save({id:result.returnMsg.id ,model_id:modelId,graph_path:item},{method:"insert"},{ transacting: t }).then(function(path){
                        if(path){
                            console.log("插入路径成功："+path);
                            callback(null, path );
                        }
                    }).catch(function(error){
                        callback(error);
                    });
                },t);

            }, 0);
        }, function(err) {
            if(err){
                res.json({err:err});
            }else {
                res.json({returnCode:0,returnMsg:'添加路径成功！'});
            }

        });
    }


}





