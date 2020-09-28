var data = require('../models/auth')();
var Promise = require('bluebird');
var Bookshelf = require('bookshelf').mysqlAuth;
var f = require('../models/folder');
var async = require('async');
//事务删除用例
//forge:辅助函数，不需要new就可以实例化一个模型


//删除用例路径，已经场景中路径
function updateFolderName(folder,folderName,cb){

    Bookshelf.transaction(function(t) {

        folder.set("folder_name",folderName);
        return new data.ApiFolder().save(folder.attributes,{method: 'update'},{ transacting: t }).then(function(renameCaseFolder) {
                console.log(renameCaseFolder);


                return renameCaseFolder;


               /* return new data.ApiPath({"id":folderCaseId}).destroy({transacting: t}).then(function(delPath){
                    return  data.ApiScenarioPath.query(function(qb){
                        qb.where("path_id","=",folderCaseId);
                    }).fetchAll({transacting: t}).then(function(result){

                        if(result){
                            var apiScenarioPathModels = result.models;
                            if(apiScenarioPathModels.length>0) {
                                return delScenarioPath(apiScenarioPathModels,t).then(function(value){
                                    console.log("删除场景路径成功....")
                                    return value;
                                });
                            }
                        }

                    });
                });*/
            });
    }).then(function(renameCaseFolder) {
        console.log(renameCaseFolder);
        cb({returnCode:0,returnMsg:"更新名称成功"});
    }).catch(function(err) {
        cb({returnCode:-1,returnMsg:"删除路径失败"+err});
    })
}


//删除用例路径，已经场景中路径
function delCaseFolder(folder,folderName,cb){

    Bookshelf.transaction(function(t) {
        return new data.ApiFolder({"id":folderId}).fetch().then(function(folderCaseParent){
            return  data.ApiFolder.query(function(qb){
                qb.where("parentid_list", 'like',folderCaseParent.get("parentid_list")+folderCaseParent.get("id")+"/"+'%');
                qb.where("type",'like','case%')
            }).fetchAll().then(function(models){

                //删除用例目录
                return new data.ApiFolder({"id":folderId}).destroy({transacting: t}).then(function(caseFolder){
                    //删除用例路径及关联场景路径
                    return new Promise(function(resolve, reject){
                        async.eachSeries(models.models, function(caseFolder, callback) {
                            new data.ApiFolder({"id":caseFolder.get("id")})
                                .destroy({transacting: t})
                                .then(function(delCaseFolder) {
                                    new data.ApiPath({"id":caseFolder.get("id")}).destroy({transacting: t}).then(function(delPath){
                                         data.ApiScenarioPath.query(function(qb){
                                            qb.where("path_id","=",caseFolder.get("id"));
                                        }).fetchAll({transacting: t}).then(function(result){
                                             if(result){
                                                 var apiScenarioPathModels = result.models;
                                                 if(apiScenarioPathModels.length>0) {
                                                     return delScenarioPath(apiScenarioPathModels,t).then(function(value){
                                                         console.log("删除场景路径成功....")
                                                         return value;
                                                     });
                                                 }
                                             }
                                        });
                                    });
                                });
                        },function(error){
                            if(!error){
                                resolve({returnCode:0,returnMsg:"删除路径目录成功"}) ;
                            }else {
                                reject(error);
                            }
                        });
                    })
                })
            })
        });
    }).then(function(caseFolders) {
        cb({returnCode:0,returnMsg:"删除路径目录成功"});
    }).catch(function(err) {
        cb({returnCode:-1,returnMsg:"删除路径目录失败"+err});
    })
}

//删除用例路径，已经场景中路径
function delScenario(folder,folderName,cb){
    Bookshelf.transaction(function(t) {
        return new data.ApiFolder({"id":folderScenarioId})
            .destroy({transacting: t})
            .then(function(delScenarioFolder) {
                return  new data.ApiScenario({"id":folderScenarioId}).destroy({transacting: t}).then(function(delScenario){
                    return  data.ApiScenarioPath.query(function(qb){
                        qb.where("scenario_id","=",folderScenarioId);
                    }).fetchAll({transacting: t}).then(function(result){
                        if(result){
                            var apiScenarioPathModels = result.models;
                            if(apiScenarioPathModels.length>0) {
                                return delScenarioPath(apiScenarioPathModels,t).then(function(value){
                                    console.log("删除场景路径成功....")
                                    return value;
                                });
                            }
                        }
                    });
                });
            });
    }).then(function(result) {
        cb({returnCode:0,returnMsg:"删除场景成功"});
    }).catch(function(err) {
        cb({returnCode:-1,returnMsg:"删除场景失败"+err});
    })
}

//删除场景路径及测试数据信息
function delScenarioPath(scenarioPaths,t){

    return new Promise(function (resolve, reject) {
        async.eachSeries(scenarioPaths, function (model, callback) {
            var scenarioPathId = model.get("id");
            console.log("删除场景中路径,%s",JSON.stringify(model));
            model.destroy().then(function () {
                console.log("删除场景中路径数据");
                data.ApiScenarioPathData.query(function(qb){
                    qb.where("scenario_path_id","=",scenarioPathId);
                }).destroy({transacting: t}).then(function(){
                    console.log("删除场景中路径数据完毕");
                    callback(null);

                });
            });
        }, function (error) {
            if (!error) {
                resolve({returnCode: 0, returnMsg: "删除场景成功"});
            } else {
                reject({returnCode: -1, returnMsg: "删除场景异常"+error});
            }
        });
    });



}


function updateFolder(folderId,folderName, cb) {
    new data.ApiFolder({"id":folderId}).fetch().then(function(folder){
//删除不同类型
        if(folder){
            var type  = folder.get("type");
            switch(type){
                case "case":
                    console.log("路径更名");
                    updateFolderName(folder,folderName,cb);
                    break;
                case "case_folder":
                    console.log("目录更名");
                    updateFolderName(folder,folderName,cb);
                    break;
/*                case "scenario":
                    console.log("场景更名");
                    updateScenarioName(folder,cb);
                    break;*/
                default:
                    break;
            }
        }else {
            cb({returnCode:-1,returnMsg:"删除对象不存在"});
        }

    }).catch(function(error){
        cb({returnCode:-1,returnMsg:"查询删除对象异常"+error});
    });


};

module.exports = updateFolder;