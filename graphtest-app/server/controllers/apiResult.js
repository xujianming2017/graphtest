var data = require('../models/auth')();
var f = require('../models/folder');
var async = require('async');
exports.result = function(req, res) {	
	var url = req.url;	
	switch(url){
		case "/api/invoke/result/scenario/path":
			var invokeType = req.body.invokeType;
			var runningNumber = req.body.runningNumber;
			data.ApiResult.query(function(qb){
            	qb.where(function () {
                    this.where('invoke_type', invokeType);
                    this.where('running_number', runningNumber);
                });
            }).fetchAll().then(function(results){


				if(results&&results.models.length>0){
					results.map(function(item,index){


						var startTime = new Date(item.get("start_time")).toLocaleString();
						console.log("%s-%s startTime:%s",invokeType,runningNumber,startTime);

						item.set("start_time",startTime);
						item.set("end_time",new Date(item.get("end_time")).toLocaleString());
						return item;

					});
				}




                res.json({returnCode:0,returnMsg:'查询场景内路径执行结果列表成功',pathResultList:results});
            },function(){
                res.json({returnCode:-1,returnMsg:'查询场景内路径执行结果列表失败！'});
            });			
			break;	
		case "/api/invoke/result":
			console.log(req.body);
			var scenarioId = req.body.scenarioId;			
			data.ApiResult.query(function(qb){
            	qb.where("scenario_id",scenarioId);
            }).fetchAll().then(function(results){

            	if(results&&results.models.length>0){
					results.map(function(item,index){


						var startTime = new Date(item.get("start_time")).toLocaleString();
						console.log("scenarioId:%s startTime:%s",scenarioId,startTime);
						item.set("start_time",startTime);
						item.set("end_time",new Date(item.get("end_time")).toLocaleString());
						return item;

					});
				}


                res.json({returnCode:0,returnMsg:'查询场景执行结果列表成功',scenarioResultList:results});



            },function(){
                res.json({returnCode:-1,returnMsg:'查询场景执行结果列表失败！'});
            });			
			break;

		case "/api/invoke/create":
			var invoke_type = req.body.invokeType;
			if(!invoke_type){
				res.json({returnCode:-1,returnMsg:'没有invokeType参数！'});
			} else {
				switch(invoke_type){
					case "scenario":
						var scenario_id = req.body.scenarioId;
						if(!scenario_id){
							res.json({returnCode:-1,returnMsg:'当入参invoke_type=scenario时，请传入scenarioId的值！'});
						} else {
							var invoke_result = {
								invoke_type:"scenario",
								scenario_id:scenario_id,
								start_time:req.body.startTime,
								end_time:req.body.endTime,
								duration:req.body.duration,
								result:req.body.result
							};
							new data.ApiResult(invoke_result).save().then(function(result){
								if(result){
									res.json({returnCode:0,returnMsg:result});
								}else {
									res.json({returnCode:-1,returnMsg:'新增执行结果失败！'});
								}
							},function(){
								res.json({returnCode:-1,returnMsg:'新增执行结果失败！'});
							});
						}
						break;

					case "path":
						var paths = req.body.paths;
						if(!paths || typeof paths === 'undefined'){
							var path_id = req.body.pathId;
							if(!path_id){
								res.json({returnCode:-1,returnMsg:'当入参invoke_type=path时，请传入pathId的值！'});
							} else {
								var invoke_result = {
									invoke_type:"path",
									path_id:path_id,
									test_data:req.body.test_data,
									start_time:req.body.startTime,
									end_time:req.body.endTime,
									duration:req.body.duration,
									result:req.body.result,
									running_number:req.body.running_number
								};
								new data.ApiResult(invoke_result).save().then(function(result){
									if(result){
										res.json({returnCode:0,returnMsg:result});
									}else {
										res.json({returnCode:-1,returnMsg:'新增执行结果失败！'});
									}
								},function(){
									res.json({returnCode:-1,returnMsg:'新增执行结果失败！'});
								});
							}
						} else {
							var invoke_results = [];
							for(var i=0;i<paths.length;i++){
								var invoke_result = {
									invoke_type:"path",
									path_id:paths[i].pathId,
									start_time:paths[i].startTime,
									end_time:paths[i].endTime,
									duration:paths[i].duration,
									result:paths[i].result,
									running_number:paths[i].running_number
								};
								invoke_results.push(invoke_result);
							}
							var saveNum = 0;
							async.eachSeries(invoke_results, function( invoke_result, callback) {
								saveNum ++;
								new data.ApiResult(invoke_result).save().then(function(result){
									if(!result){
										callback('新增执行结果失败！总共' + paths.length + '条，保存' + saveNum + '条！');
									} else {
										callback();
									}
								});
							}, function(err){
								if(err) {
									res.json({returnCode:-1,returnMsg: err});
								}else{
									res.json({returnCode:0,returnMsg:'新增执行结果成功！插入' + invoke_results.length + '条路径！'});
								}
							});
						}
						break;

					default :
						res.json({resultList:'',returnCode:-1,returnMsg:'invoke_type传参出错，无法识别invoke_type[:' + invoke_type + ']！'});
						break;
				}
			}
			break;

		case "/api/invoke/update":
			var id = req.body.id;
			if(!id){
				res.json({returnCode:-1,returnMsg:'没有id参数！'});
			} else {
				var invoke_result = {
					running_number: req.body.running_number
				};
				new data.ApiResult({id:id}).save(invoke_result).then(function(result){
					if(result){
						res.json({returnCode:0,returnMsg:result});
					}else {
						res.json({returnCode:-1,returnMsg:'更新执行结果失败！'});
					}
				},function(error){
					res.json({returnCode:-1,returnMsg:'更新执行结果失败！' + error});
				});
			}
			break;

		default:
			res.json({resultList:'',returnCode:-1,returnMsg:'没有对应的处理方法！'});
			break;
	}
	
}