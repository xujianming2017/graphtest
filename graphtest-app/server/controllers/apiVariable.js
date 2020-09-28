var data = require('../models/auth')();
var f = require('../models/folder');
var async = require('async');
var bookshelf = require('bookshelf').mysqlAuth;

exports.variable = function(req, res) {
	
	var url = req.url;	
	switch(url){
		case "/api/variable/create":
			var userId = req.body.userId;
			var varName = req.body.varName;
			var varValue = req.body.varValue;
			if(!userId){
                res.json({returnCode:-1,returnMsg:'没有userId属性，更新失败！'});
            }
			
			data.ApiVariable.query(function(qb){
                qb.where("user_id","=",userId);
                qb.where("var_name","=",varName);
                qb.where("var_value","=",varValue);
            }).fetch().then(function(result){
                if(!result){
                	new data.ApiVariable({user_id:userId,var_name:varName,var_value:varValue}).save().then(function(result){
        				if(result){
        					res.json({returnCode:0,returnMsg:result});
        				}else {
        					res.json({returnCode:-1,returnMsg:'新增变量失败！'});
        				}
        			},function(){
        				res.json({returnCode:-1,returnMsg:'新增变量失败！'});
        			});
                } else{
                	res.json({returnCode:-1,returnMsg:'变量已存在！'});
                }
            });			
			break;			
		case "/api/variable/delete":
			var userId = req.body.userId;
			var varName = req.body.varName;
			bookshelf.Model.extend({
				tableName:"user_variable"
			}).where({"user_id":userId,"var_name":varName}).destroy({require:true}).then(function(result){
				res.json({returnCode:0,returnMsg:'删除变量名成功'});
			},function(error){
				res.json({returnCode:-1,returnMsg:'删除变量名失败！' + error});
			});
        
            break;
		case "/api/variable/deletebyid":
			var id = req.body.id;			
			bookshelf.Model.extend({
				tableName:"user_variable"
			}).where({"id":id}).destroy({require:true}).then(function(result){
				res.json({returnCode:0,returnMsg:'删除变量成功'});
			},function(error){
				res.json({returnCode:-1,returnMsg:'删除变量失败！' + error});
			});
        
            break;
	
		case "/api/variable/getUserVarNameList":
			var userId = req.body.userId;
			data.ApiVariable.query().where("user_id","=",userId).then(function(results){
            	if(results.length>0){
                    var varNames = [];
                    for (x in results)
                    {
                    	varNames.push(results[x].var_name);
                    }
            	}   
                res.json({returnCode:0,returnMsg:'查询用户变量列表成功',varNameList:varNames});
            },function(){
                res.json({returnCode:-1,returnMsg:'查询用户变量列表失败！'});
            });			
			break;
		case "/api/variable/getUserVarNameValueList":
			var userId = req.body.userId;
            if(!userId){
                if(req.session.user){
                    userId = req.session.user.id;
                }else {
                    res.json({returnCode:-1,returnMsg:'没有userId参数！请查看报文的format',format:'{"userId":"用户Id"}'});
                }
            }
			console.log('user : ' + req.session.user);
			if(!userId){
			    userId = req.session.user.id;
			}			
			data.ApiVariable.query().where("user_id","=",userId).then(function(results){
            	   
                res.json({returnCode:0,returnMsg:'查询用户变量列表成功',data:results});
            },function(){
                res.json({returnCode:-1,returnMsg:'查询用户变量列表失败！'});
            });			
			break;
		case "/api/variable/getVarValueList":
			var userId = req.body.userId;
			var varName = req.body.varName;
			data.ApiVariable.query().where("var_name","=",varName).then(function(results){            	
            	if(results.length>0){
                    var varValues = [];
                    for (x in results)
                    {
                    	varValues.push(results[x].var_value);
                    }
            	}             	 
                res.json({returnCode:0,returnMsg:'查询变量值列表成功',varValueList:varValues});
            },function(){
                res.json({returnCode:-1,returnMsg:'查询变量值列表失败！'});
            });			
			break;
			
		case "/api/variable/update":
			var id = req.body.id;
			var var_value = req.body.var_value;
			console.log('var_value : ' + var_value);
			var var_name = req.body.var_name;
			if(var_value == "" || var_value == undefined || var_value == null){
				data.ApiVariable.query().where("var_name","=",var_name).then(function(results){
					if(results.length>0){
						res.json({returnCode:-1,returnMsg:'变量名已存在!'});
						
	            	}else{
	            		new data.ApiVariable({id: id}).save({var_name:var_name,var_value: var_value},{patch: true}).then(function(variable){
	                        if(variable){
	                            res.json({returnCode:0,returnMsg:'更新成功！'});
	                        }else {
	                            res.json({returnCode:-1,returnMsg:'根据id:'+id+'找不到变量，无法更新！'});
	                        }
	                    },function(){
	                        res.json({returnCode:-1,returnMsg:'更新异常！'});
	                    });
	            	}
				});
			} else {
				new data.ApiVariable({id: id}).save({var_name:var_name,var_value: var_value},{patch: true}).then(function(variable){
                    if(variable){
                        res.json({returnCode:0,returnMsg:'更新成功！'});
                    }else {
                        res.json({returnCode:-1,returnMsg:'根据id:'+id+'找不到变量，无法更新！'});
                    }
                },function(){
                    res.json({returnCode:-1,returnMsg:'更新异常！'});
                });
			}            
			break;
			
		case "/api/variable/getVarValue":
			var userId = req.body.userId;
			var varName = req.body.varName;
			data.ApiVariable.query().where("var_name","=",varName).then(function(results){            	
            	if(results.length>0){
                    var varnameValue = results[0].var_value;
            	}             	 
                res.json({returnCode:0,returnMsg:'查询变量值成功',varValue:varnameValue});
            },function(){
                res.json({returnCode:-1,returnMsg:'查询变量值失败！'});
            });			
			break;
		default:
			res.json({resultList:'',returnCode:-1,returnMsg:'没有对应的处理方法！'});
			break;
	}
	
}
