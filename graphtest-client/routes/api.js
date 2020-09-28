var rendering = require('../util/rendering');
var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../util/config');
var recorder = require("../util/startRecorder")
var scenarioExec = require("../util/scenarioExec")
var net = require('net');
var path = require('path');
var fs = require('fs');
var async = require('async');
var cp = require('child_process');
router.post("/startServer",function(req,res){

    var modelId = req.body.modelId;
    var modelName = req.body.modelName;

    var userId =  req.session.user.id;
    //启动录制浏览器
    portIsOccupied(9766,function(result){
        if(result){
            return res.json({returnCode:-1,returenMsg:"启动录制浏览器失败，已存在录制服务"})
        }else {
            recorder.startRecorder();
            recorder.setFrontData({modelId: modelId,userId:userId,modelName:modelName});
            return res.json({returnCode:0,returenMsg:"启动录制浏览器成功"});
        }
    });
});

router.post("/runScenario",function(req,res){

    var scenarioId = req.body.scenarioId;
    var scenarioName = req.body.scenarioName;

    //调用场景执行方法
    scenarioExec(scenarioId,scenarioName,function(message){
        return  res.json(message);
    });


});




// 检测端口是否被占用
function portIsOccupied (port,callback) {
    // 创建服务并监听该端口
    var server = net.createServer().listen(port)

    server.on('listening', function () { // 执行这块代码说明端口未被占用
        server.close() // 关闭服务
        console.log('The port【' + port + '】 is available.') // 控制台输出信息
        callback(false);
    })

    server.on('error', function (err) {
        if (err.code === 'EADDRINUSE') { // 端口已经被使用
            console.log('The port【' + port + '】 is occupied, please change other port.')
            callback(true);
        }
    })
}




//场景执行方法
function runScenarioRunner(scenarioId,scenarioName,callback) {


    var time = new Date().format("yyyy年MM月dd日hh时mm分ss秒");
    var scenarioFolder = path.resolve(config.scenarioDir, "场景-" + scenarioId + "-" + scenarioName + "-" + time);
    // var scenarioFolder = path.resolve(USERFOLDER,"test");

    //查询场景下用例的内容
    request({
        url:config.url+"api/scenario/getCaseList",
        json:true,
        method: "POST",
        body:  {scenarioId: scenarioId}},function (error, response, result){


        if (result && result.returnCode === 0) {

            var pathArr = result.result;
            if (pathArr) {
                //创建场景文件夹
                mkdirs(scenarioFolder);
                //创建截图文件夹
                var screenshots = path.resolve(scenarioFolder, "screenshots");
                mkdirs(screenshots);

                //创建config.json\hosts\run.bat
                var configTemplate = path.resolve(path.dirname(''), './config/config.json');
                var configFile = path.resolve(scenarioFolder, "config.json");

                var hostsTemplate = path.resolve(path.dirname(''), './config/hosts');
                var hostsFile = path.resolve(scenarioFolder, "hosts");

                var packageTemplate = path.resolve(path.dirname(''), './config/package.json');
                var packageFile = path.resolve(scenarioFolder, "../package.json");


                //创建config.json\hosts\run.bat
                var initTemplate = path.resolve(path.dirname(''), './config/init.bat');
                var initFile = path.resolve(scenarioFolder, "../init.bat");


                fs.exists(packageFile, function (exists) {
                    if (!exists) {
                        fs.createReadStream(packageTemplate).pipe(fs.createWriteStream(packageFile));
                    }
                });

                fs.exists(configFile, function (exists) {
                    if (!exists) {
                        fs.createReadStream(configTemplate).pipe(fs.createWriteStream(configFile));
                    }
                });
                fs.exists(hostsFile, function (exists) {
                    if (!exists) {
                        fs.createReadStream(hostsTemplate).pipe(fs.createWriteStream(hostsFile));
                    }
                });

                fs.exists(initFile, function (exists) {
                    if (!exists) {
                        fs.createReadStream(initTemplate).pipe(fs.createWriteStream(initFile));
                    }
                });


                var tempalteFile = path.resolve(path.dirname(''), './config/template_web.js');
                var templateContent = fs.readFileSync(tempalteFile).toString();

                var pathIdArr = [];
                var runPathCmds = [];

                async.eachSeries(pathArr, function (pathItem, callback) {

                    var templateContentTemp = templateContent;
                    var pathFileName = "path_" + pathItem.id + "_" + pathItem.case_name + ".js";
                    var pathResultName = "path_" + pathItem.id + "_" + pathItem.case_name + ".result.txt";
                    var testFile = path.resolve(scenarioFolder, pathFileName);

                    var runPathCmd = "mocha " + pathFileName + " --reporter json > " + pathResultName;
                    runPathCmds.push(runPathCmd);

                    fs.writeFileSync(testFile, pathItem.graphpath_script_content);

                    pathIdArr.push(pathItem.id);
                    callback(null, templateContentTemp);


                }, function (error) {
                    if (error) {
                        callback({returnCode:-1,returnMsg:"脚本生成有错误：" + error});

                    } else {

                        var recordResultJsFile = path.resolve(path.dirname(''), './config/recordResult.js');
                        var pathIds = pathIdArr.join(",");
                        var recordResultJsFileContent = fs.readFileSync(recordResultJsFile).toString();
                        //替换参数
                        recordResultJsFileContent = recordResultJsFileContent.replace(/\{\$(\w+)\}/g, function (all, name) {
                            switch (name) {
                                case 'scenarioId':
                                    return scenarioId;
                                case 'pathIds':
                                    return pathIds;

                            }
                            return all;
                        });
                        var recorderResult = path.resolve(scenarioFolder, "recordResult.js");
                        fs.writeFileSync(recorderResult, recordResultJsFileContent);

                        var runGraphTestFile = path.resolve(path.dirname(''), './config/run-graph-test.bat');
                        var runGraphTestStr = runPathCmds.join(" & ");
                        var runGraphTestFileContent = fs.readFileSync(runGraphTestFile).toString();
                        //替换参数
                        runGraphTestFileContent = runGraphTestFileContent.replace(/\{\$(\w+)\}/g, function (all, name) {
                            switch (name) {
                                case 'pathCmds':
                                    return runGraphTestStr;
                            }
                            return all;
                        });
                        var runGraphTest = path.resolve(scenarioFolder, "run-graph-test.bat");
                        fs.writeFileSync(runGraphTest, runGraphTestFileContent);

                        var runBatTemplate = path.resolve(path.dirname(''), './config/run.bat');
                        var runBatFile = path.resolve(scenarioFolder, "run.bat");


                        /////////////////////////////生成run.bat
                        var stream = fs.createReadStream(runBatTemplate).pipe(fs.createWriteStream(runBatFile));
                        stream.on('finish', function () {
                            var cmdStr = 'start "" "' + scenarioFolder + '"';
                            cp.exec(cmdStr, {cwd: scenarioFolder}, function (error, stdout, stderr) {
                                if (!error) {
                                    callback({returnCode:0,returnMsg:"打开场景文件夹：" + scenarioFolder + ",请点击执行run.bat"});
                                } else {
                                    callback({returnCode:-1,returnMsg:"打开场景文件夹失敗：" + error });

                                }
                            });
                        });
                        ////////////////////////////////

                    }
                });
            } else {

                // message("场景下没有可执行用例，请检查！")
                console.log("result:" + result.returnMsg);
                callback({returnCode:-1,returnMsg:"场景下没有可执行用例，请检查！"  });
            }

        } else {

            callback(result);


        }

    });


}



//创建目录
function mkdirs(dirname){
    if(fs.existsSync(dirname)){
        return true;
    }else{
        if(mkdirs(path.dirname(dirname))){
            fs.mkdirSync(dirname);
            return true;
        }
    }
}


// 时间格式化函数
Date.prototype.format = function (format) {
    var args = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),  //quarter
        "S": this.getMilliseconds()
    };
    if (/(y+)/.test(format))
        format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var i in args) {
        var n = args[i];
        if (new RegExp("(" + i + ")").test(format))
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? n : ("00" + n).substr(("" + n).length));
    }
    return format;
};



    module.exports = router;


