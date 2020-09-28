var data = require('../models/auth')();
var f = require('../models/folder');
var async = require('async');
exports.scenario = function(req, res) {
    var url = req.url;
    switch(url){

        case "/api/scenario":

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
                    var folder_root_id = userFolder.attributes.folder_root_id;
                    new data.ApiFolder({id: folder_root_id}).fetch().then(function(parent){
                        //查找子节点

                        new f().findChildren(parent,'scenario',function(models){

                         var results = models.filter(function(model){

                         return model.get("type")==="scenario";

                         });

                         var scenarios = [];

                         async.eachSeries(results, function(item, callback) {
                         var scenarioId = item.get("id");
                         new data.ApiScenario({id: scenarioId}).fetch().then(function(scenario){
                         scenarios.push(scenario);

                         callback(null, scenario );

                         });
                         },function(error){

                         if(!error){
                         res.json({returnCode:0,returnMsg:'查找用户的场景成功！',result:scenarios});
                         }else {
                         res.json({returnCode:-1,returnMsg:'查找用户的场景失败！'+error});
                         }


                         });
                         });

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


        //查询所有用户信息
        case "/api/scenario/create":
            console.log(req.body);
            var scenarioName = req.body.scenarioName;
            var scenarioDesc = req.body.scenarioDesc;
            var folderId = req.body.folderId;

            if(!folderId){
                res.json({returnCode:-1,returnMsg:'没有folderId参数！',format:'{"folderId":"父节点Id","scenarioName":"场景名称","scenarioDesc":"场景描述"}'});
            }

            //检查folderId是否为用户的场景根目录

            new data.ApiFolder({id:folderId}).fetch().then(function(folder){

                if(folder){
                    if(folder.attributes.type === "scenario_root"){

                        var child = {};
                        child.folder_name = scenarioName;
                        child.folder_desc = scenarioDesc;
                        child.type = "scenario";
                        new f().appendChild(folder,child,function(result){
                            var scenarioFolder = result.returnMsg;
                            //保存一个场景信息
                            new data.ApiScenario().save({id:scenarioFolder.attributes.id,scenario_name: scenarioName,scenario_desc:scenarioDesc,folder_id:scenarioFolder.attributes.id}).then(function(scenario){
                                if(scenario){
                                    res.json({returnCode:0,returnMsg:scenario});
                                }else {
                                    res.json({returnCode:-1,returnMsg:'创建场景失败！'});
                                }
                            }).catch(function(error){
                                res.json({returnCode:-1,returnMsg:'创建场景失败！'+error});
                            });

                        });

                    }else {
                        res.json({returnCode:-1,returnMsg:'指定的folderId不是场景的根目录！'});
                    }
                }

            });



            break;
        case "/api/scenario/get":
            console.log(req.body);
            var scenarioId = req.body.scenarioId;

            if(!scenarioId){
                res.json({returnCode:-1,returnMsg:'没有scenarioId参数！',format:'{"scenarioId":"场景Id"}'});
            }

            //保存一个场景信息
            new data.ApiScenario({id: scenarioId}).fetch().then(function(scenario){
                if(scenario){
                    res.json({returnCode:0,returnMsg:scenario});
                }else {
                    res.json({returnCode:-1,returnMsg:'根据id:'+scenarioId+'找不到测试场景，查询失败！'});
                }
            },function(){
                res.json({returnCode:-1,returnMsg:'查询场景失败！'});
            });

            break;
        //查询用户信息
        case "/api/scenario/update":
            console.log(req.body);
            var scenarioId = req.body.scenarioId;
            var scenarioName = req.body.scenarioName;
            var scenarioDesc = req.body.scenarioDesc;

            if(!scenarioId){
                res.json({userList:'',returnCode:-1,returnMsg:'没有scenario Id属性，更新失败！',format:'{"scenarioId":"场景Id","scenarioName":"场景名称","scenarioDesc":"场景描述"}'});
            }

            //保存一个场景信息
            new data.ApiScenario({id: scenarioId}).save({scenario_name: scenarioName,scenario_desc:scenarioDesc},{patch: true}).then(function(scenario){
                if(scenario){

                    //同步修改场景目录中的内容
                    new data.ApiFolder({id:scenarioId}).save({folder_name: scenarioName},{patch: true}).then(function(folder){
                        res.json({returnCode:0,returnMsg:{scenario:scenario,folder:folder}});
                    });


                }else {
                    res.json({returnCode:-1,returnMsg:'根据id:'+scenarioId+'找不到测试场景，无法更新！'});
                }
            },function(){
                res.json({returnCode:-1,returnMsg:'更新场景异常！'});
            });

            break;
        case "/api/scenario/delete":

            var scenarioId = req.body.scenarioId;
            if(!scenarioId){
                res.json({returnCode:-1,returnMsg:'没有scenario Id属性！',format:'{"scenarioId":"场景Id"}'});
            }
            //删除一个场景信息
            new data.ApiScenario({id: scenarioId}).destroy({require:true}).then(function(scenario){

                    res.json({returnCode:0,returnMsg:'删除场景成功！'});

            },function(){
                res.json({returnCode:-1,returnMsg:'根据id:'+scenarioId+'删除测试场景失败！'});
            });
            break;

        case "/api/scenario/path/create":
            var scenarioId = req.body.scenarioId;
            var pathIds = req.body.pathIds;
            if(!scenarioId){
                res.json({returnCode:-1,returnMsg:'没有scenarioId属性！',format:'{"scenarioId":"场景Id","pathIds":"路径的Id数组"}'});
            }
            if(!pathIds||pathIds.length===0){
                res.json({returnCode:-1,returnMsg:'没有pathIds属性！或者没有pathIds数据',format:'{"scenarioId":"场景Id","pathIds":"路径的Id数组"}'});
            }
            async.eachSeries(pathIds, function(pathId, callback) {
                data.ApiScenarioPath.query(function(qb){
                    qb.where("scenario_id","=",scenarioId);
                    qb.where("path_id","=",pathId);
                }).fetch().then(function(result){
                    if(!result){
                        new data.ApiScenarioPath({scenario_id: scenarioId,path_id:pathId}).save().then(function(scenarioPath){
                            callback(null, scenarioPath );
                        });
                    }
                });
            },function(error){
                if(!error){
                    res.json({returnCode:0,returnMsg:'场景与路径关系插入成功！'});
                }else {
                    res.json({returnCode:-1,returnMsg:'场景与路径关系插入失败！'+error});
                }
            });
            break;
        case "/api/scenario/path/update":
            var scenarioId = req.body.scenarioId;
            var pathIds = req.body.pathIds;
            if(!scenarioId){
                res.json({returnCode:-1,returnMsg:'没有scenarioId属性！',format:'{"scenarioId":"场景Id","pathIds":"路径的Id数组"}'});
            }
            if(!pathIds||pathIds.length===0||pathIds==undefined){
                res.json({returnCode:-1,returnMsg:'没有pathIds属性！或者没有pathIds数据',format:'{"scenarioId":"场景Id","pathIds":"路径的Id数组"}'});
            }

            new data.ApiScenarioPath().where("scenario_id","=",scenarioId).destroy().then(function (result) {

                async.eachSeries(pathIds, function(pathId, callback) {
                    data.ApiScenarioPath.query(function(qb){
                        qb.where("scenario_id","=",scenarioId);
                        qb.where("path_id","=",pathId);
                    }).fetch().then(function(result){
                        if(!result){
                            new data.ApiScenarioPath({scenario_id: scenarioId,path_id:pathId}).save().then(function(scenarioPath){
                                callback(null, scenarioPath );
                            });
                        }
                    });
                },function(error){
                    if(!error){
                        res.json({returnCode:0,returnMsg:'场景与路径关系更新成功！'});
                    }else {
                        res.json({returnCode:-1,returnMsg:'场景与路径关系更新失败！'+error});
                    }
                });

            }).catch(function(error){
                res.json({returnCode:-1,returnMsg:'场景与路径关系删除失败！'+error});
            });


            break;

        case "/api/scenario/path/delete":
            var scenarioId = req.body.scenarioId;
            var pathIds = req.body.pathIds;
            if(!scenarioId){
                res.json({returnCode:-1,returnMsg:'没有scenarioId属性！',format:'{"scenarioId":"场景Id","pathIds":"路径的Id数组"}'});
            }
            if(!pathIds||pathIds.length===0){
                res.json({returnCode:-1,returnMsg:'没有pathIds属性！或者没有pathIds数据',format:'{"scenarioId":"场景Id","pathIds":"路径的Id数组"}'});
            }

            data.ApiScenarioPath.query().where("scenario_id","=",scenarioId).whereIn("path_id",pathIds).del().then(function(result){
                res.json({returnCode:0,returnMsg:'场景与路径关系删除成功！删除数据：'+result+"条"});
            }).catch(function(error){
                res.json({returnCode:-1,returnMsg:'场景与路径关系删除失败！'+error});
            });

            break;
        case "/api/scenario/getCaseList":
            var scenarioId = req.body.scenarioId;
            if(!scenarioId){
                res.json({returnCode:-1,returnMsg:'没有scenarioId属性！',format:'{"scenarioId":"场景Id"}'});
            }
            data.ApiScenarioPath.query().where("scenario_id","=",scenarioId).then(function(scenarioPaths){

                if(scenarioPaths.length>0){

                    //查询场景信息
                    async.eachSeries(scenarioPaths, function(scenarioPath, callback) {
                        new data.ApiPath({id:scenarioPath.path_id}).fetch().then(function(path){
                            // console.log(path);

                            if(path){
                                scenarioPath.model_id = path.get("model_id");
                                scenarioPath.graph_path = path.get("graph_path");
                                scenarioPath.graphpath_script_content = path.get("graphpath_script_content");
                                //查询路径目录信息，获取路径名称
                                data.ApiFolder.query().where("id","=",scenarioPath.path_id).then(function(folder){
                                    if(folder&&folder.length>0){
                                        scenarioPath.case_name = folder[0].folder_name;

                                        //查询场景路径的数据信息
                                        data.ApiScenarioPathData.query().where("scenario_path_id",scenarioPath.id).then(function(scenarioPathData){
                                            if(scenarioPathData.length>0){
                                                scenarioPath.data = scenarioPathData[0].data;
                                            }else {
                                                scenarioPath.data = [];
                                            }
                                            callback(null,scenarioPath);

                                        });

                                    }
                                });
                            }else {
                                callback(null);
                            }



                        });

                    },function(error){
                        if(error){
                            res.json({returnCode:-1,returnMsg:'场景路径关联结果查询失败！'+error});
                        }else {
                            res.json({returnCode:0,returnMsg:'场景路径关联结果查询成功！',result:scenarioPaths});
                        }
                    });

                }else {
                    res.json({returnCode:0,returnMsg:'场景没有路径关联！'});
                }
            });
            break;

        default:
            res.json({userList:'',returnCode:-1,returnMsg:'没有对应的处理方法！'});
            break;
    }

}

