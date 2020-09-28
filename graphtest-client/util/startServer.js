var os = require("os");
var fs = require("fs");
var async = require('async');
var cp = require('child_process');
var net = require('net');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var modelId = 0;
var userId = 0;
var modelName = "";


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var server = app.listen(9527, function () {

    var host = server.address().address;
    var port = server.address().port;
    console.log("启动图测本地子服务：http://%s:%s", host, port)
});
process.on('uncaughtException', function (err) {
    console.log('Caught exception: ', err);
    process.send({type:"err",message:"启动9527服务错误"});
});
//查询客户端数据
app.post('/storage', function (req, res) {
    console.log("查询客户端数据");
      res.json({modelId:modelId,userId:userId,modelName:modelName});
});


//本地服务处理script录制请求
app.post('/api/model/scriptservice', function (req, res) {
  console.log("/api/model/scriptservice 服务请求处理");
   var scriptBody = req.body;
   //命令类型
   var type = req.body.type;
   //命令内容

    console.log(JSON.stringify(req.body.data));

   var data = req.body.data;
  //向父进程对象发送数据
  process.send({type:"data",message:data});
  res.json({});

});

process.on('message', function(m) {
    modelId = m.modelId;
    userId = m.userId;
    modelName = m.modelName;
});


