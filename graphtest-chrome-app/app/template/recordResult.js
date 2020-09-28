const rooturl = 'http://localhost:3333';
var globalParams = {
  scenarioId: {$scenarioId},
  pathIds: [{$pathIds}],
  resultFiles: []
};


var expect = require('chai').expect;
var fetch = require('node-fetch');
var fs = require('fs');
var moment = require('moment');
var path = require('path');
var async = require('async');
const header = { 'Content-type': 'application/json' };

const invokeTypeScenario = "scenario";
const invokeTypePath = "path";

var result = "";
var date = "";
var start_exe_time = "";
var running_number = "";
var invoke_result_scenario = {};
var invoke_result_paths = [];
var flag = true;
const currentDir = getRootPath();


describe('收集执行结果', function() {

  it('检查pathIds与文件数量是否相等', function(done) {
    var files = fs.readdirSync(currentDir);
    var i = 0;
    files.forEach(function (filename) {
      var fullname = path.join(currentDir, filename);
      var fullname_ext = path.extname(fullname);
      if('.txt' == fullname_ext){
        i++;
      }
    });
    if(i != globalParams.pathIds.length){
      flag = false;
    }
    expect(i).to.be.equal(globalParams.pathIds.length);
    done();
  });


  it('解析路径执行结果', function(done) {
    if(flag) {
      var files = fs.readdirSync(currentDir);
      var i = 0, k = 0;
      files.forEach(function (filename) {
        var fullname = path.join(currentDir, filename);
        var fullname_ext = path.extname(fullname);
        if('.txt' == fullname_ext){
          k++;
          fs.readFile(fullname, "utf8", function(err, data){
            if (err) {
              throw err;
            } else {
              // 解析 stats
              result = JSON.parse(data);
              var stats = result.stats;
              date = new Date(stats.start);
              var startTime = moment(date).format("YYYY-MM-DD HH:mm:ss");
              date = new Date(stats.end);
              var endTime = moment(date).format("YYYY-MM-DD HH:mm:ss");

              var invoke_result_path = {
                invokeType: invokeTypePath,
                pathId: globalParams.pathIds[i],
                startTime: startTime,
                endTime: endTime,
                duration: Math.floor(stats.duration/1000)
              };
              var tests_num = stats.tests;
              var passes_num = stats.passes;
              var failures_num = stats.failures;
              if(tests_num == passes_num && failures_num == 0){
                invoke_result_path.result = 'pass';
              } else {
                invoke_result_path.result = 'failure';
              }
              // 解析 tests
              var tests = result.tests;
              var state = 1;
              var result_details = [];
              var order = 1;
              tests.forEach(function (test) {
                var detail = {
                  title: test.title,
                  duration: test.duration,
                  fullTitle: test.fullTitle.split(' ')[0],
                  order: order
                };
                if(isEmpty(test.err)){
                  if(typeof test.duration !== 'undefined'){
                    detail.state = 1;
                  } else {
                    detail.state = 3;
                  }
                } else {
                  detail.state = 2;
                  detail.err = test.err.stack;
                }
                order ++;
                result_details.push(detail);
              });
              invoke_result_path.details = result_details;
              // push 到数组
              invoke_result_paths.push(invoke_result_path);

              // console.log("path " + (i+1) + ":" + JSON.stringify(invoke_result_path));
              i++;
            }
            if(i==globalParams.pathIds.length){
              done();
            }
          });
        }
      });
      if(k==0){
        console.log("Error: 找不到执行结果文件！");
        expect(k).to.not.be.equal(0);
        done();
      }
    } else {
      expect(flag).to.be.true;
      done();
    }
  });


  it('解析场景执行结果', function(done){
    if(flag) {
      // 解析场景
      if(invoke_result_paths.length > 0){
        invoke_result_scenario.invokeType = invokeTypeScenario;
        invoke_result_scenario.scenarioId = globalParams.scenarioId;
        invoke_result_scenario.startTime = invoke_result_paths[0].startTime;
        start_exe_time = invoke_result_scenario.startTime.replace(new RegExp(':',"gm"),'-').replace(new RegExp(' ',"gm"),'-');
        invoke_result_scenario.endTime = invoke_result_paths[invoke_result_paths.length-1].endTime
        invoke_result_scenario.duration = showInterval(invoke_result_scenario.startTime, invoke_result_scenario.endTime);
        var passes_num = 0;
        var invoke_result_path = {};
        for(var j=0; j<invoke_result_paths.length; j++){
          invoke_result_path = invoke_result_paths[j];
          if(invoke_result_path.result == 'pass'){
            passes_num++;
          }
        }
        if(passes_num == invoke_result_paths.length){
          invoke_result_scenario.result = 'pass';
        } else {
          invoke_result_scenario.result = 'failure';
        }
        //console.log("scenario:" + JSON.stringify(invoke_result_scenario));
      } else {
        console.log("未找到路径执行结果！");
      }
      expect(invoke_result_paths.length).to.be.above(0);
      done();
    } else {
      expect(flag).to.be.true;
      done();
    }
  });


  it('保存场景执行记录', function() {
    if(flag) {
      if(invoke_result_paths.length > 0){
        return fetch(rooturl.concat('/api/invoke/create'), fetchRequest(JSON.stringify(invoke_result_scenario)) ).then(function(res) {
          return res.json();
        }).then(function(json) {
          var returnCode = json.returnCode;
          running_number = json.returnMsg.id;
//          console.log("保存场景执行记录返回：" + returnCode + " 返回的id：" + running_number);
          expect(json).to.be.deep.property("returnCode", 0);
        });
      } else {
        expect(invoke_result_paths.length).to.be.above(0);
      }
    } else {
      expect(flag).to.be.true;
    }
  });


  it('更新场景执行记录-running_number', function(){
    if(flag) {
      if(running_number != "" && running_number != 0 && running_number != 'undefined' && typeof(running_number) != "undefined"){
        var scenario = {
          id: running_number,
          running_number: running_number
        }
        return fetch(rooturl.concat('/api/invoke/update'), fetchRequest(JSON.stringify(scenario)) ).then((res) => {
          return res.json();
        }).then((json) => {
          var returnCode = json.returnCode;
          console.log("更新场景执行记录-running_number返回：" + returnCode + " 返回的id：" + json.returnMsg.id);
          expect(json).to.be.deep.property("returnCode", 0);
        });
      } else {
        expect(running_number).to.not.be.empty.to.not.be.undefined;
      }
    } else {
      expect(flag).to.be.true;
    }
  });



  it('保存路径执行记录', function(done){
    console.log("路径执行记录 num: " + invoke_result_paths.length);
    if(flag) {
      if(running_number != "" && running_number != 0 && running_number != 'undefined' && typeof(running_number) != "undefined"){
        var saveNum = 0;
        // 循环保存路径执行记录
        async.each(invoke_result_paths, function(item, callback) {
          item.running_number = running_number;
          return fetch(rooturl.concat('/api/invoke/create'), fetchRequest(JSON.stringify(item)) ).then(function(res) {
            saveNum++;
            console.log("\n保存pathId:" + item.pathId + "第" + saveNum  + "条路径执行记录。");
            return res.json();
          }).then(function(json){
            console.log("保存pathId:" + item.pathId + "路径执行记录返回：returnCode:" + json.returnCode + " returnMsg.id:" + json.returnMsg.id);
            item.id = json.returnMsg.id;
            if(saveNum == invoke_result_paths.length){
              done();
            }
          }, function(err){
            console.log("保存路径执行记录发生异常: " + err);
          }).catch(function(e) {
            console.log("保存路径执行记录发生异常catch: " + e);
          });
        },function(error){
          console.log("error:" + error);
          console.log("path:" + JSON.stringify(invoke_result_paths[0]));
        });
      } else {
        expect(running_number).to.not.be.empty.to.not.be.undefined;
      }
    } else {
      expect(flag).to.be.true;
    }
  });


  it('保存路径执行日志', function(done){
    if(flag) {
      var saveNum = 0;
      async.each(invoke_result_paths, function(item, callback) {
        console.log("\nitem:" + JSON.stringify(item));
        var details = item.details;
        details.forEach(function (detail) {
          detail.invoke_result_id = item.id;
          if(detail.state == 1 || detail.state == 2){
            detail.screenshots = currentDir + '/screenshots-' + start_exe_time + '-' +  running_number + '/' + detail.fullTitle + '_chrome_' + detail.order + '.png';
          }
          delete detail["fullTitle"];
        });
        var request = {details: details};
        // 批量保存路径执行日志
        return fetch(rooturl.concat('/api/invoke/result/detail/create'), fetchRequest(JSON.stringify(request)) ).then(function(res) {
          saveNum++;
          console.log("\n保存pathId:" + item.pathId  + "共" + details.length + "条路径执行日志。");
          return res.json();
        }).then(function(json){
          console.log("保存pathId:" + item.pathId  + "路径执行日志返回：returnCode:" + json.returnCode + " returnMsg:" + json.returnMsg);
          item.id = json.returnMsg.id;
          if(saveNum == invoke_result_paths.length){
            done();
          }
        }, function(err){
          console.log("保存路径执行日志发生异常: " + err);
        }).catch(function(e) {
          console.log("保存路径执行日志发生异常catch: " + e);
        });
      });
    } else {
      expect(flag).to.be.true;
    }
  });


  it('截图文件转历史', function(done){
    if(flag) {
      var screenshotPath = currentDir + '/screenshots';
      var doScreenshot = fs.existsSync(screenshotPath);
      if(doScreenshot){
        var newHistoryName = currentDir + '/screenshots-' + start_exe_time + '-' +  running_number;
        console.log("rename:" + newHistoryName);
        fs.rename(screenshotPath, newHistoryName, function(err){
          if(err){
            console.log("截图文件转历史失败！" + err);
          }else{
            fs.mkdirSync(screenshotPath);
            console.log("截图文件转历史成功！");
          }
          done();
        });
      } else {
        console.log("screenshots文件夹不存在!");
        expect(doScreenshot).to.be.true;
      }
    } else {
      expect(flag).to.be.true;
    }
  });



});


function fetchRequest(data){
  return {
    method: 'post',
    headers: header,
    body: data
  };
}


function getRootPath(){
  var rootPath = path.resolve(__dirname);
  return rootPath;
}


function showInterval(start, end){
  var startTime = new Date(start);
  var endTime = new Date(end);
  var interval = Math.floor(((endTime.getTime()-startTime.getTime())/1000));
  return interval;
}

function isEmpty(obj) {
  for (var name in obj) {
    return false;
  }
  return true;
};


