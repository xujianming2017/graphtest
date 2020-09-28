var os = require("os");
var fs = require("fs");
var async = require('async');
var cp = require('child_process');

var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var modelId = 0;

//查询客户端数据
app.post('/storage', function (req, res) {

      res.json({modelId:modelId});

});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var server = app.listen(9527, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("应用实例，访问地址为 http://%s:%s", host, port)
});
//本地服务处理script录制请求
app.post('/api/model/scriptservice', function (req, res) {

  console.log("/api/model/scriptservice 服务请求处理");
   var scriptBody = req.body;
   //命令类型
   var type = req.body.type;
   //命令内容
   var data = req.body.data;

  //向父进程对象发送数据
  process.send(data);

  res.json({});

});

process.on('message', function(m) {

  modelId = m.modelId;
});


