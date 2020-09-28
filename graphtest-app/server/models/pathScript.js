// var data = require('../models/auth')();
var async = require('async');
var path = require('path');
var fs = require('fs');
module.exports = FolderModel;
function FolderModel(){


 this.createTestCode = function(arrTestCodes){

     //__dirname当前模块所在的完整目录

     if(arrTestCodes){
         var tempalteFile = path.resolve(__dirname, '../models/template/'+'template_web.js');
         var templateContent = fs.readFileSync(tempalteFile).toString();
         var sizeCode = '.maximize()';
         //替换参数
         templateContent = templateContent.replace(/\{\$(\w+)\}/g, function(all, name){
             switch(name){
                 case 'testCodes':
                     return arrTestCodes.join('\r\n');
                     return "代码啊";
                 case 'sizeCode':
                     return sizeCode;

             }
             return all;
         });

         return templateContent;
     }else {
         return "";
     }


 }


 this.saveTestScript = function(graphPath,callback){

     var self = this;

     var modelId =  graphPath.get("model_id");
     var graphPath  = graphPath.get("graph_path").split(",");
     data.ApiVertexEdgeScript.query(function(qb){
         qb.where("model_id","=",modelId).whereIn("vertexedge",graphPath);
     }).fetchAll().then(function(vertextedge_scripts){
         var script = [];
         async.eachSeries(vertextedge_scripts.models, function(item, callback){
             script.push(item.get("script_content"));


             callback(null, item );

         },function(error){
             if(error){
                 callback({scripts:[]})
             }else {

                 var testFile = self.createTestCode(script);

                 callback({scripts:testFile});
             }
         });

     }).catch(function(error){
         callback({scripts:[]})
     });


 }


}





