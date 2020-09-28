// 录制器
//
var os = require("os");
var fs = require("fs");
var async = require('async');

var cp = require('child_process');
var chromedriver = require('chromedriver');
var JWebDriver = require('jwebdriver');
var path = require('path');

var GRAPHTEST_SERVER_URL = "http://localhost:3333";
var GRAPHTEST_SERVER_URL_SCRIPT_CREATE = GRAPHTEST_SERVER_URL + "/api/vertexedge/script/create";


/*
 var express = require('express');
 var bodyParser = require('body-parser');
 var app = express();
 app.get('/storage', function (req, res) {
 chrome.storage.local.get(function(result){
 console.log("本地存储:"+JSON.stringify(result))
 if(result){
 res.json(result);
 }else{
 res.json({message:'没有存储'});
 }
 });
 })
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
 console.log("type："+type);
 console.log("data:"+JSON.stringify(data));

 Recorder.onCommand(req.body.data);

 res.json({});

 });
 */

/*child.send({ hello: 'world' });*/

//子进程对象
var child;
var recorderModel;

var dic = new Array();

dic["url"] = "地址跳转";
dic["closeWindow"] = "关闭窗口";
dic["sleep"] = "延时";
dic["waitBody"] = "等待加载";
dic["mouseMove"] = "鼠标移动";
dic["mouseDown"] = "鼠标下击";
dic["mouseUp"] = "鼠标松开";
dic["click"] = "点击";
dic["touchClick"] = "点击";
dic["dblClick"] = "双击";
dic["sendKeys"] = "文本输入";
dic["keyDown"] = "键盘按下";
dic["keyUp"] = "键盘松开";
dic["scrollElementTo"] = "元素滚动";
dic["select"] = "下拉选择";
dic["acceptAlert"] = "警示框确认";
dic["dismissAlert"] = "警示框取消";
dic["setAlert"] = "警示框设值";



var Recorder = {
  startRecorder: function (options) {
    self = this;

    startChromeDriver();
    startRecorderServer(self.onReady, self.onCommand, self.onEnd);

  },

  onReady: function () {
    console.log("开始动作");

    // recorder browser
    newChromeBrowser({isRecorder: true}, function*(browser) {
      console.log('recorder_browser_opened maximize');
      yield browser.maximize();

      console.log('recorder_browser_opened');
      recorderBrowser = browser;
      // checkAllReady();
      for (var i = 0; i < 900; i++) {
        if (recorderBrowser) {
          yield recorderBrowser.windowSize();
          yield recorderBrowser.sleep(2000);
        }
        else {
          break;
        }
      }
    });


  },

  setModelId: function (modelId) {

    if (child) {
      child.send(modelId);
    }
    recorderModel = modelId.modelId;
  },
  onCommand: function () {

    var modelId = 0;
    var seq = 0;
    var edge = "";
    //启动一个子进程来获取浏览器插件的录制命令
    var dirname = path.resolve("");
    var startChildServerJs = path.resolve(dirname, './app/scripts/startServer.js');

    if(!child){

      child = cp.fork(startChildServerJs);
      child.on('message', function (m) {
        if(m.data){
          if(m.data.modelId){
            modelId = m.data.modelId;
          }
          if(m.data.edge){
            edge = m.data.edge;
          }
        }

        onCommand(m);
      });
    }




    //测试代码
    var arrTestCodes = [];
    //最新的windowId
    var lastWindowId = 0;
    //最新的frameId
    var lastFrameId = null;
    var lastTestTitle = '';
    var arrLastTestCodes = [];
    var arrRawCmds = [];
    var allCaseCount = 0;
    var failedCaseCount = 0;


    function escapeStr(str) {
      return str.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\'/g, "\\'");
    }

    // 打印生成测试代码 cmd：命令  text：输入    codes：执行代码
    function pushTestCode(cmd, text, ext, codes) {

      var dicStr = dic[cmd];
      var title = cmd +': ';
      if(dicStr){
        title = dicStr +" : ";
      }

      if(cmd==="url"){
        modelId = recorderModel;
        edge = "START";

      }

      title += text ? text + ' ( '+ext+' )' : ext;



      lastTestTitle = title;
      arrLastTestCodes = [];
      if(Array.isArray(codes)){
        codes.forEach(function(line){
          arrLastTestCodes.push('    '+line);
        });
      }
      else{
        arrLastTestCodes.push('    '+codes);
      }
      // 控制台输出内容设置颜色，匹配冒号前的内容，命令title

      title = title.replace(/^\w+:/, function(all){
        return all.cyan;
      });
      console.log('  '+title);
      // 控制台输出内容设置颜色，匹配冒号前的内容，命令title


      console.log(arrLastTestCodes);

      //保存模型



    }

    //保存测试代码
    function saveTestCode(success, error,callback) {


      allCaseCount++;
      if (!success) {
        failedCaseCount++;
      }
      if (arrLastTestCodes.length > 0) {
        /*        (checkerBrowser || recorderMobileApp) && sendWsMessage('checkResult', {
         title: lastTestTitle,
         success: success
         });*/
        if (!success) {
          lastTestTitle = '\u00D7 ' + lastTestTitle;
        }

        arrTestCodes = [];
        arrTestCodes.push('it(\'' + escapeStr(lastTestTitle) + '\', function(){');
        arrTestCodes = arrTestCodes.concat(arrLastTestCodes);
        arrTestCodes.push("});");
        arrTestCodes.push("");

        console.log("code:" + arrTestCodes);

        lastTestTitle = '';
        arrLastTestCodes = [];
        console.log("model:" + modelId);
        console.log("edge:" + edge);
        var vertextEdgeScript = {
          modelId: modelId,
          vertexedge: edge,
          type:"edge",
          scriptContent: arrTestCodes

        }

        console.log();

        if(edge=="START"||edge=="END"){
          vertextEdgeScript = {
            modelId: modelId,
            vertexedge: edge,
            type:"vertex",
            scriptContent: arrTestCodes

          }
        }
        console.log("开始调用服务ajax存储脚本")
        console.log(JSON.stringify(vertextEdgeScript));


        if(modelId!=0){
          $.ajax({
            url:GRAPHTEST_SERVER_URL_SCRIPT_CREATE,
            type:"post",
            dataType:"json",
            data:vertextEdgeScript,
            success:function(data){
              console.log("结束调用服务ajax存储脚本")
              console.log(data);
              callback();
            }

          });
        }else {
          callback();
        }

        message("录制命令："+JSON.stringify(vertextEdgeScript));

      }

    }

    var cmdQueue = async.priorityQueue(function (cmdInfo, next) {
      var window = cmdInfo.window;
      var frame = cmdInfo.frame;
      var cmd = cmdInfo.cmd;
      var data = cmdInfo.data;
      if (cmd === 'end') {
        console.log("cmd end start");



        return next();
      }
      console.log(window + ":" + frame + ":" + cmd + ":" + data + "cmdQueue start");
      //任务列表
      var arrTasks = [];

      //跳转windows
      arrTasks.push(function (callback) {

        function doNext() {
          //保存测试代码方法
          saveTestCode(true,null,callback);
          // callback();
        }

        //错误处理
        function catchError(error) {
          saveTestCode(false, error);
          callback();
        }

        //判断是否出现新的windowId，如果出现，那么开始处理switchWindow
        if (window !== lastWindowId) {
          //更新当前的windowid
          lastWindowId = window;
          //重置frameid
          lastFrameId = null;
          // pushRawCmd('switchWindow', window);
          pushTestCode('switchWindow', '', window, 'return driver.sleep(500).switchWindow(' + window + ');');
          doNext();
          //验证浏览器动作
          // checkerBrowser && checkerBrowser.sleep(500).switchWindow(window).then(doNext).catch(catchError) || doNext();
        }
        else {
          callback();
        }
      });

      //处理跳转frame
      arrTasks.push(function (callback) {
        function doNext() {
          saveTestCode(true,null,callback);
          // callback();
        }
        function catchError(error) {
          saveTestCode(false, error);
          callback();
        }
        //判断frame是否更新
        if (frame !== lastFrameId) {
          lastFrameId = frame;
          var arrCodes = [];
          //如果包含有frame，那么开始生成代码;
          if (frame !== null) {
            arrCodes.push('return driver.switchFrame(null)');
            arrCodes.push('       .wait(\'' + frame + '\', 30000).then(function(element){');
            arrCodes.push('           return this.switchFrame(element).wait(\'body\');');
            arrCodes.push('       });');
          }
          else {
            //无需跳转frame
            arrCodes.push('return driver.switchFrame(null);');
          }
          //记录行命令
          // pushRawCmd('switchFrame', frame);
          //输出命名
          pushTestCode('switchFrame', '', frame, arrCodes);
          doNext();
        }
        else {
          callback();
        }

      });


      arrTasks.push(function (callback) {
        function doNext() {
          saveTestCode(true,null,callback);
          // callback();
        }
        function catchError(error) {
          saveTestCode(false, error);
          callback();
        }

        var arrCodes = [];
        console.log("arrTash cmd:"+cmd);
        switch (cmd) {

          //url 命令处理
          case 'url':
            pushTestCode('url', '', data.url, 'return driver.url(_(\'' + escapeStr(data.url) + '\'));');
            doNext();
            break;
          case 'closeWindow':
            pushTestCode('closeWindow', '', '', 'return driver.closeWindow();');
            doNext();
            break;
          case 'sleep':
            pushTestCode('sleep', '', data, 'return driver.sleep(' + data + ');');
            doNext();
            break;
          case 'waitBody':
            arrCodes = [];
            arrCodes.push('return driver.sleep(500).wait(\'body\', 30000).html().then(function(code){');
            arrCodes.push('    isPageError(code).should.be.false;');
            arrCodes.push('});');
            pushTestCode('waitBody', '', '', arrCodes);
            doNext();
            break;
          case 'mouseMove':
            arrCodes = [];
            arrCodes.push('return driver.sleep(300).wait(\'' + escapeStr(data.path) + '\', 30000)');
            arrCodes.push('       .sleep(300).mouseMove(' + (data.x ? data.x + ', ' + data.y : '') + ');');
            pushTestCode('mouseMove', data.text, data.path + (data.x !== undefined ? ', ' + data.x + ', ' + data.y : ''), arrCodes);
            doNext();
            break;

          case 'mouseDown':
            arrCodes = [];
            arrCodes.push('return driver.sleep(300).wait(\'' + escapeStr(data.path) + '\', 30000)');
            arrCodes.push('       .sleep(300).mouseMove(' + data.x + ', ' + data.y + ').mouseDown(' + data.button + ');');
            pushTestCode('mouseDown', data.text, data.path + ', ' + data.x + ', ' + data.y + ', ' + data.button, arrCodes);
            doNext();
            break;
          case 'mouseUp':
            arrCodes = [];
            arrCodes.push('return driver.sleep(300).wait(\'' + escapeStr(data.path) + '\', 30000)');
            arrCodes.push('       .sleep(300).mouseMove(' + data.x + ', ' + data.y + ').mouseMove(' + data.x + ', ' + data.y + ').mouseUp(' + data.button + ');');
            pushTestCode('mouseUp', data.text, data.path + ', ' + data.x + ', ' + data.y + ', ' + data.button, arrCodes);
            doNext();
            break;

          case 'click':
            arrCodes = [];
            var option = data.option;
            arrCodes.push('return driver.sleep(300).wait(\'' + escapeStr(data.path) + '\', ' + (option ? '5000' : '30000') + ')');
            arrCodes.push('       .sleep(300).mouseMove(' + data.x + ', ' + data.y + ').click(' + data.button + ')' + (option ? '.catch(catchError)' : '') + ';');
            pushTestCode(option ? 'optionClick' : 'click', data.text, data.path + ', ' + data.x + ', ' + data.y + ', ' + data.button, arrCodes);
            doNext();
            break;

          case 'touchClick':
            arrCodes = [];
            arrCodes.push('return driver.sleep(300).wait(\'' + escapeStr(data.path) + '\', 30000)');
            arrCodes.push('       .sleep(300).touchClick();');
            pushTestCode('touchClick', data.text, data.path, arrCodes);
            doNext();
            break;
          case 'dblClick':
            arrCodes = [];
            arrCodes.push('return driver.sleep(300).wait(\'' + escapeStr(data.path) + '\', 30000)');
            arrCodes.push('       .sleep(300).mouseMove(' + data.x + ', ' + data.y + ').click(0).click(0);');
            pushTestCode('dblClick', data.text, data.path + ', ' + data.x + ', ' + data.y + ', ' + data.button, arrCodes);
            doNext();
            break;

          case 'sendKeys':
            pushTestCode('sendKeys', '', data.keys, 'return driver.sendKeys(\'' + escapeStr(data.keys) + '\');');
            doNext();
            break;
          case 'keyDown':
            pushTestCode('keyDown', '', data.character, 'return driver.keyDown(\'' + escapeStr(data.character) + '\');');
            doNext();
            break;

          case 'keyUp':
            pushTestCode('keyUp', '', data.character, 'return driver.keyUp(\'' + escapeStr(data.character) + '\');');
            doNext();
            break;
          case 'scrollTo':
            pushTestCode('scrollTo', '', data.x + ', ' + data.y, 'return driver.scrollTo(' + data.x + ', ' + data.y + ');');
            doNext();
            break;

          case 'scrollElementTo':
            arrCodes = [];
            arrCodes.push('return driver.sleep(300).wait(\'' + escapeStr(data.path) + '\', 30000)');
            arrCodes.push('       .sleep(300).scrollElementTo(' + data.x + ', ' + data.y + ');');
            pushTestCode('scrollElementTo', data.text, data.path + (data.x !== undefined ? ', ' + data.x + ', ' + data.y : ''), arrCodes);
            doNext();
            break;
          case 'select':
            arrCodes = [];
            arrCodes.push('return driver.sleep(300).wait(\'' + escapeStr(data.path) + '\', 30000)');
            arrCodes.push('       .sleep(300).select({');
            arrCodes.push('           type: \'' + data.type + '\',');
            arrCodes.push('           value: \'' + data.value + '\'');
            arrCodes.push('       });');
            pushTestCode('select', data.text, data.path + ', ' + data.type + ', ' + data.value, arrCodes);
            doNext();
            break;
          case 'acceptAlert':
            pushTestCode('acceptAlert', '', '', 'return driver.acceptAlert();');
            doNext();
            break;
          case 'dismissAlert':
            pushTestCode('dismissAlert', '', '', 'return driver.dismissAlert();');
            doNext();
            break;
          case 'setAlert':
            pushTestCode('setAlert', '', data.text, 'return driver.setAlert("' + data.text + '");');
            doNext();
            break;
          default:
            doNext();
            break;
        }

      });

      //多个函数依次执行，之间没有数据交换，依次执行window跳转、frame跳转、操作
      async.series(arrTasks, function () {
        next();
      });


    }, 1);

    //输入操作keys
    var arrSendKeys = [];
    var lastCmdInfo0 = null;
    var lastCmdInfo1 = null;
    var lastCmdInfo2 = null;
    var dblClickFilterTimer = null;

    function onCommand(cmdInfo) {

      //处理输入命令
      function sendKeysFilter(cmdInfo) {


        // 合并连续的sendKeys
        var cmd = cmdInfo.cmd;
        var data = cmdInfo.data;


        if (cmd === 'sendKeys') {
          arrSendKeys.push(data.keys);
        } else {
          if (arrSendKeys.length > 0) {
            // 满足条件，进行合并
            clickFilter({
              window: lastCmdInfo0.window,
              frame: lastCmdInfo0.frame,
              cmd: 'sendKeys',
              data: {
                keys: arrSendKeys.join('')
              }
            });
            arrSendKeys = [];
          }
          clickFilter(cmdInfo);
        }
        lastCmdInfo0 = cmdInfo;


      }

      //合并联系的click
      function clickFilter(cmdInfo) {


        var cmd = cmdInfo.cmd;
        var data = cmdInfo.data;
        //lastCmdInfo1存在，判断是否上个动作的cmd是'mouseDown'，点击动作的开始

        if (lastCmdInfo1 && lastCmdInfo1.cmd === 'mouseDown') {
          //取出上个动作数据
          var lastCmdData = lastCmdInfo1.data;
          //如果当前动作是点击动作结束，那么判断两个动作的window、frame、path、操作区域数据，那么合并成click
          if (cmd === 'mouseUp' &&
            cmdInfo.window === lastCmdInfo1.window &&
            cmdInfo.frame === lastCmdInfo1.frame &&
            lastCmdData.path === data.path &&
            Math.abs(lastCmdData.x - data.x) < 20 &&
            Math.abs(lastCmdData.y - data.y) < 20
          ) {
            // 条件满足，合并为click
            cmdInfo = {
              window: cmdInfo.window,
              frame: cmdInfo.frame,
              cmd: 'click',
              data: data,
              text: cmdInfo.text
            };
          }
          else {
            // 不需要合并，恢复之前旧的mouseDown
            dblClickFilter(lastCmdInfo1);
          }
        }

        if (cmdInfo.cmd !== 'mouseDown') {
          // mouseDown 缓存到下一次，确认是否需要合并click，非mouseDown立即执行
          dblClickFilter(cmdInfo);
        }
        lastCmdInfo1 = cmdInfo;

      }


      function dblClickFilter(cmdInfo) {


        // 合并为dblClick，增加兼容性, 某些浏览器不支持连续的两次click
        var cmd = cmdInfo.cmd;
        var data = cmdInfo.data;
        if (lastCmdInfo2 && lastCmdInfo2.cmd === 'click') {
          var lastCmdData = lastCmdInfo2.data;

          //取消设置的timeout
          clearTimeout(dblClickFilterTimer);
          if (cmd === 'click' &&
            cmdInfo.window === lastCmdInfo2.window &&
            cmdInfo.frame === lastCmdInfo2.frame &&
            lastCmdData.path === data.path &&
            Math.abs(lastCmdData.x - data.x) < 20 &&
            Math.abs(lastCmdData.y - data.y) < 20
          ) {
            // 条件满足，合并为dbclick
            cmdInfo = {
              window: cmdInfo.window,
              frame: cmdInfo.frame,
              cmd: 'dblClick',
              data: data,
              text: cmdInfo.text
            };
          }
          else {
            // 不需要合并，恢复之前旧的click
            cmdQueue.push(lastCmdInfo2, 2);
          }
        }
        if (cmdInfo.cmd !== 'click') {
          // click 缓存到下一次，确认是否需要合并dblClick，非click立即执行
          cmdQueue.push(cmdInfo, 2);
        }
        else {
          // 500毫秒以内才进行dblClick合并
          dblClickFilterTimer = setTimeout(function () {
            cmdQueue.push(lastCmdInfo2, 2);
            lastCmdInfo2 = null;
          }, 500);
        }
        lastCmdInfo2 = cmdInfo;
      }

      if (/^!/.test(cmdInfo.cmd)) {
        cmdQueue.push(cmdInfo, 2);
      }
      else {
        sendKeysFilter(cmdInfo);
      }

    }


  },

  onEnd: function () {
    console.log("结束动作");
  }

}


// 启动录制命令服务
function startRecorderServer(onReady, onCommand, onEnd) {

  //

  onReady();
  onCommand();
  onEnd();

}


function newChromeBrowser(options, callback) {
  var driver = new JWebDriver({
    'host': '127.0.0.1',
    'port': 9766
  });

  var capabilities = {};
  var dirname = path.resolve("");
  var crxPath = path.resolve(dirname, './app/template/graphtest-extension.crx');
  var extContent = fs.readFileSync(crxPath).toString('base64');
  capabilities.chromeOptions = {
    args: ['--disable-bundled-ppapi-flash'],
    prefs: {
      'plugins.plugins_disabled': ['Adobe Flash Player']
    },
    extensions: [extContent],
  };

  driver.session(capabilities, function*(error, browser) {
    if (error) {
      console.log('chrome_init_failed');
      console.log(error);
      process.exit(1);
    }
    else {

      console.log('chrome_init_success');
      yield browser.config({
        asyncScriptTimeout: 10000
      });
      console.log('chrome_init_config');
      yield callback(this);
    }
  }).catch(function (e) {
  });

}

// 启动chromeDriver hub
function startChromeDriver() {
  chromedriver.start(['--url-base=wd/hub', '--port=9766']);
}


function* generateNaturalNumber() {
  console.log('function start');
  var i = 0;
  // 为了便于观察log，将循环减小到5
  while (i <= 5) {
    console.log('yield start');
    yield i;
    console.log('yield end');
    i++;
  }
  console.log('function end');
}
Recorder.onCommand();
