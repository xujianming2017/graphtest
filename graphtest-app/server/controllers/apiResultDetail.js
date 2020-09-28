var data = require('../models/auth')();
var async = require('async');
exports.result = function(req, res) {	
	var url = req.url;	
	switch(url){
		case "/api/invoke/result/path/detail":
			var invoke_result_id = req.body.resultId;
			if(!invoke_result_id){
				res.json({returnCode:-1,returnMsg:'没有resultId参数！'});
			} else {
				data.ApiResultDetail.query(function(qb){
					qb.where(function () {
						this.where('invoke_result_id', invoke_result_id);
					});
					qb.orderBy('id', 'ASC');
				}).fetchAll().then(function(results){
					res.json({returnCode:0,returnMsg:'查询路径的执行日志成功',resultList:results});
				},function(){
					res.json({returnCode:-1,returnMsg:'查询路径的执行日志失败！'});
				});
			}
			break;

		case "/api/invoke/result/detail/create":
			var details = req.body.details;
			if(!details){
				res.json({returnCode:-1,returnMsg:'没有details参数！'});
			} else {
				var saveNum = 0;
				async.each(details, function( detail, callback) {
					saveNum ++;
					new data.ApiResultDetail(detail).save().then(function(result){
						if(!result){
							callback('新增路径执行日志失败！总共' + details.length + '条，保存' + saveNum + '条！');
						} else {
							callback();
						}
					});
				}, function(err){
					if(err) {
						res.json({returnCode:-1,returnMsg: err});
					}else{
						res.json({returnCode:0,returnMsg:'新增路径执行日志成功！插入' + details.length + '条日志！'});
					}
				});
			}
			break;


		default:
			res.json({resultList:'',returnCode:-1,returnMsg:'没有对应的处理方法！'});
			break;
	}
	
}