var data = require('../models/auth')();

exports.vertexedgeScript = function(req, res) {
	var url = req.url;	
	switch(url){
		case "/api/vertexedge/script/create":


			console.log(req.body);


			var modelId = req.body.modelId;
			var vertexedge = req.body.vertexedge;
			var type = req.body.type;
			var scriptContentArray = req.body.scriptContent;
			var cmd = req.body.cmd;
			var scriptContent = "";
			//解析拼装脚本
			if(Array.isArray(scriptContentArray)){
				for(i in scriptContentArray){
					scriptContent = scriptContent.concat(scriptContentArray[i],"\n");
				}
			}else {
				scriptContent = scriptContentArray;
			}
			if(!modelId||modelId == "" || modelId == undefined || modelId == null){
				return res.json({returnCode:-1,returnMsg:'没有modelId参数！或者没有内容',format:'{"modelId":"模型Id","vertexedge":"节点名称","type":"节点类型","scriptContent":"脚本内容，可选"}'});
			}
			if(!vertexedge||vertexedge == "" || vertexedge == undefined || vertexedge == null){
				return res.json({returnCode:-1,returnMsg:'没有vertexedge节点名称参数！或者没有内容',format:'{"modelId":"模型Id","vertexedge":"节点名称","type":"节点类型","scriptContent":"脚本内容，可选"}'});
			}

            if(!type||type == "" || type == undefined || type == null){
                return res.json({returnCode:-1,returnMsg:'没有type节点名称参数！或者没有内容',format:'{"modelId":"模型Id","vertexedge":"节点名称","type":"节点类型","scriptContent":"脚本内容，可选"}'});
            }


            //按照模型id，节点名称查询记录
            //如果有记录，那么则更新记录的脚本内容，累加的方式更新
            //如果没有记录，那么则新保存一条记录，包括脚本
			data.ApiVertexEdgeScript.query(function(qb){
				qb.where("model_id","=",modelId);
				qb.where("vertexedge","=",vertexedge);
				qb.where("type","=",type);
			}).fetch().then(function(vertextedge_script){

				if(vertextedge_script){
					var oldScript = vertextedge_script.get("script_content");
					//START节点内容，直接更新，不累加
					if(oldScript){
						if(cmd){
							if(cmd!="url"){
								scriptContent = oldScript.concat("\n", scriptContent);
							}
						}else {
							scriptContent = oldScript.concat("\n", scriptContent);
						}
					}
					vertextedge_script.set("script_content",scriptContent);
					new data.ApiVertexEdgeScript(vertextedge_script.toJSON()).save().then(function(new_vertextedge_script){
						console.log(new_vertextedge_script);
						res.json({returnCode:0,returnMsg:'成功更新模型节点的脚本内容！',vertextedge_script:new_vertextedge_script});

					}).catch(function(error){
						res.json({returnCode:-1,returnMsg:'更新新的模型节点的脚本内容异常！'+error});
					});
				}else{

					var vertextedge_script_insert = {
						model_id:modelId,
						vertexedge:vertexedge,
						type:type,
						script_content:scriptContent
					}
					new data.ApiVertexEdgeScript(vertextedge_script_insert).save().then(function(new_vertextedge_script){
						console.log(new_vertextedge_script);
						res.json({returnCode:0,returnMsg:'成功保存新的模型节点的脚本内容！',vertextedge_script:new_vertextedge_script});
					}).catch(function(error){
						res.json({returnCode:-1,returnMsg:'保存新的模型节点的脚本内容异常！'+error});
				});
				}
			}).catch(function(error){
				res.json({returnCode:-1,returnMsg:'更新新的模型节点的脚本内容异常！'+error});
			});


			break;
		case "/api/vertexedge/script":
			var modelId = req.body.modelId;
			var vertexedge = req.body.vertexedge;
			var type=req.body.type;
			if(!modelId){
				return res.json({returnCode:-1,returnMsg:'没有modelId参数！',format:'{"modelId":"模型Id","vertexedge":"节点名称"}'});
			}
			if(!vertexedge&&(vertexedge==="")){
				return res.json({returnCode:-1,returnMsg:'没有vertexedge节点名称参数！',format:'{"modelId":"模型Id","vertexedge":"节点名称"}'});
			}
			data.ApiVertexEdgeScript.query(function(qb){
				qb.where("model_id","=",modelId);
				qb.where("vertexedge","=",vertexedge);
				qb.where("type","=",type);
			}).fetch().then(function(vertexedge_script){
				if(vertexedge_script){
					res.json({returnCode:0,returnMsg:'查询节点的脚本内容成功！',result:vertexedge_script});
				}else {
					res.json({returnCode:0,returnMsg:'查询节点的脚本内容成功！',result:{}});
				}

			}).catch(function(error){
				res.json({returnCode:-1,returnMsg:'查询节点的脚本内容失败！'+error});
			});

			break;
		case "/api/vertexedge/script/update":
			var modelId = req.body.modelId;
			var vertexedge = req.body.vertexedge;
			var type = req.body.type;
			var scriptContent = req.body.scriptContent;

			if(!modelId){
				return res.json({returnCode:-1,returnMsg:'没有modelId参数！',format:'{"modelId":"模型Id","vertexedge":"节点名称","type":"节点类型","scriptContent":"脚本内容，可选"}'});
			}
			if(!vertexedge&&(vertexedge==="")){
				return res.json({returnCode:-1,returnMsg:'没有vertexedge节点名称参数！',format:'{"modelId":"模型Id","vertexedge":"节点名称","type":"节点类型","scriptContent":"脚本内容，可选"}'});
			}

			data.ApiVertexEdgeScript.query(function(qb){
				qb.where("model_id","=",modelId);
				qb.where("type","=",type);
				qb.where("vertexedge","=",vertexedge);

			}).fetch().then(function(vertextedge_script){
				if(vertextedge_script){

					vertextedge_script.set("script_content",scriptContent);

					new data.ApiVertexEdgeScript(vertextedge_script.attributes).save().then(function(vertextedge_scriptNew){
						res.json({returnCode:0,returnMsg:'更新节点的脚本成功！',result:vertextedge_scriptNew});
					}).catch(function(error){
						res.json({returnCode:-1,returnMsg:'更新节点的脚本成功失败！'+error});
					});

				}else {
					res.json({returnCode:0,returnMsg:'没有找到可以更新的模型节点！',result:{}});
				}

			}).catch(function(error){
				res.json({returnCode:-1,returnMsg:'查询节点的脚本内容失败！'+error});
			});


			break;



	}
	
}