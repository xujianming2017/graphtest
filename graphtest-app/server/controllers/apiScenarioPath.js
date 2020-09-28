var data = require('../models/auth')();
var async = require('async');
exports.scenarioPath = function(req, res) {
    var url = req.url;
    switch(url){
        case "/api/scenario/path/params":
            var scenarioPathId = req.body.scenarioPathId;
            if(!scenarioPathId){
                res.json({returnCode:-1,returnMsg:'没有scenarioPathId属性！',format:'{"scenarioPathId":"场景路径Id"}'});
            }
            new data.ApiScenarioPath({id:scenarioPathId}).fetch().then(function(scenarioPath){
                if(scenarioPath){
                    var pathId = scenarioPath.get("path_id");
                    new data.ApiPath({id:pathId}).fetch().then(function(path){
                        if(path){
                            var graphPathScript = path.get("graphpath_script_content");
                            if(graphPathScript!=null||graphPathScript==""){
                                var paramArr = getParameters(graphPathScript);
                                return res.json({returnCode:0,returnMsg:'有参数！',data:paramArr});
                            }else {
                                return res.json({returnCode:-1,returnMsg:'没有参数！'});
                            }
                        }else {
                            return res.json({returnCode:-1,returnMsg:'没有路径！'});
                        }
                    });
                }else {
                    return res.json({returnCode:-1,returnMsg:'没有此场景路径信息！'});
                }
            });
            break;
        case "/api/scenario/path/data":

            var scenarioPathId = req.body.scenarioPathId;
            var dataContent = req.body.data;
            if(!scenarioPathId){
                return res.json({returnCode:-1,returnMsg:'没有scenarioPathId属性！',format:'{"scenarioPathId":"场景路径Id"}'});
            }

            new data.ApiScenarioPathData().where("scenario_path_id","=",scenarioPathId).fetch().then(function(scenarioPathData){
             if(scenarioPathData){

                 if(dataContent){
                     scenarioPathData.set("data",JSON.stringify(dataContent));
                     new data.ApiScenarioPathData().save(scenarioPathData.attributes, {
                         method: 'update'
                     }).then(function(result){
                         return res.json({returnCode:0,returnMsg:'更新场景路径数据成功！',data:result});
                     });
                 }else {
                     return res.json({returnCode:0,returnMsg:'查询场景路径数据成功！',data:scenarioPathData});
                 }

             }else {
                 new data.ApiScenarioPathData({scenario_path_id:scenarioPathId,data:JSON.stringify(dataContent)}).save().then(function(result){
                     return res.json({returnCode:0,returnMsg:'插入场景路径数据成功！',data:result});
                 });
             }
             });

            break;
        case "/api/scenario/path/data/json":

            var scenarioPathId = req.body.scenarioPathId;
            if(!scenarioPathId){
                return res.json({returnCode:-1,returnMsg:'没有scenarioPathId属性！',format:'{"scenarioPathId":"场景路径Id"}'});
            }

            new data.ApiScenarioPathData().where("scenario_path_id","=",scenarioPathId).fetch().then(function(scenarioPathData){
                if(scenarioPathData){


                    var jsonData = JSON.parse(scenarioPathData.get("data"));

                    return res.json(jsonData);
                }else {
                    return res.json({returnCode:-1,returnMsg:'没有scenarioPathId 数据！',format:'{"scenarioPathId":"场景路径Id"}'});
                }
            });

            break;

        default:
            res.json({userList:'',returnCode:-1,returnMsg:'没有对应的处理方法！'});
            break;
    }

}


function getParameters(scriptContent){
    var regExp = /'\$\$.*'/g;
    var res = scriptContent.match(regExp);
    var tempArr = [];
    var json = {};

    if(res){
        var newArr =res.map(function(item,index){
            item = item.replace(/'/g,"").replace(/\$\$/g,"");

            if(!json[item]){
                tempArr.push(item);
                json[item]=1;
            }
            return item;
        });
    }


    return tempArr;
}
