// 录制器
//

var config;
try {
  config = require('../config/app.dev.conf.js');
} catch(e) {
  try {
    // 生产环境配置文件
    config = require('../config/app.conf.js');
  } catch(e) {
    console.log('启动失败，没有配置文件可以读取！');
  }
}

var os = require("os");
var fs = require("fs");
var async = require('async');
var cp = require('child_process');
var exec = require('child_process').exec;
var chromedriver = require('chromedriver');
var JWebDriver = require('jwebdriver');
var co = require('co');
var path = require('path');
var request = require('request');
var GRAPHTEST_SERVER_URL_SCRIPT_CREATE = config.server + "/api/vertexedge/script/create";

//子进程对象
var child;
var recorderModel;
var userId;
var modelId;
var edge;
var vertex;
var modelName;
var startFlag = 0;
var firstUrlFlag=0;
var vertextEdgeScript;
var type;
var urlScript = [];


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

    edge = "";
    startChromeDriver();
    startRecorderServer(self.onReady, self.onCommand, self.onEnd);

  },

  onReady: function () {
    console.log("开始动作");
    //开始标志位
    startFlag = 1;
    //第一次访问URL标志位
    firstUrlFlag=1;
    //当前的模型id，如果是0的话，那么还没有进入录制的网页
    modelId=0;
    // recorder browser
    newChromeBrowser({isRecorder: true}, function*(browser) {
      console.log('最大化浏览器');
      yield browser.maximize();

      console.log('录制浏览器启动');
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

  setFrontData: function (data) {

    if (child) {
      child.send(data);
    }
    recorderModel = data.modelId;
  },
  onCommand: function () {


    var seq = 0;


    //启动一个子进程来获取浏览器插件的录制命令
    var dirname = path.resolve("");
    var startChildServerJs = path.resolve(dirname, './util/startServer.js');

    if(!child){
      child = cp.fork(startChildServerJs);
      child.on('message', function (m) {

        console.log("子线程传输过来的数据：%s",JSON.stringify(m));
        if(m.type){
          if(m.type=="err"){
            console.log("子线程发生错误：%s",JSON.stringify(m));
            var cmd=process.platform=='win32'?'netstat -ano':'ps aux';
            var qqname='node';
            var port='9527';
            exec(cmd, function(err, stdout, stderr) {
              if(err){ return console.log(err); }

              stdout.split('\n').filter(function(line){
                var p=line.trim().split(/\s+/);
                var address=p[1];
                if(address!=undefined){
                  if(address.split(':')[1]==port)
                  {
                    exec('taskkill /F /pid '+p[4],function(err, stdout, stderr){
                      if(err){
                        return console.log('释放指定端口失败！！');
                      }
                      child = cp.fork(startChildServerJs);
                      console.log('占用指定端口的程序被成功杀掉！');
                    });
                  }
                }
              });
            });

          }





          //接受录制传输数据
          if(m.type=="data"){
            console.log("子线程传输过来的数据：%s",JSON.stringify(m.message));
            if(m.message.model){
              modelId = m.message.model;
            }else {
              modelId = recorderModel;
            }


            //包含了edge信息
            if(m.message.edge){
              edge = m.message.edge;
              type= "edge";
            }
            //包含了vertext信息
            if(m.message.data){
              if(m.message.data.vertex){
                vertex = m.message.data.vertex;
                type = "vertex";
              }
            }
            //处理数据



            onCommand(m.message);
          }

        }
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

      //需要保存的模型脚本片段
      vertextEdgeScript = {};

      //当url命令的时候，需要判断是否是首次URl操作，如果是首次操作，那么



      if(edge==""){
  /*      if(edge==""){
          console.log("这是首次URL操作....------))))))");*/





          // vertex = "START";
        vertextEdgeScript.modelId  = recorderModel;
        modelId = recorderModel;
        vertextEdgeScript.type = "vertex";
        vertextEdgeScript.vertexedge = "START";

        if(cmd=="url"){
          vertextEdgeScript.cmd="url";
        }else {
          vertextEdgeScript.cmd="";
        }


          //waitbody
/*          edge = "START";
          type = "vertex";*/
          
       /* }else {
          console.log("这是其他的URL操作....------))))))");
          vertextEdgeScript.modelId = modelId;
          vertextEdgeScript.type = type;
          vertextEdgeScript.vertexedge = edge;

        }*/
        /*//刚开始进入页面
        if(modelId){
            modelId = recorderModel;
            startFlag=0;
            edge = "START";
        }*/

      }
      else {
        startFlag=0;
        vertextEdgeScript.modelId = modelId;
        vertextEdgeScript.type = type;
        vertextEdgeScript.vertexedge = edge;
      }

      console.log(' ================= '+JSON.stringify(vertextEdgeScript));

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






    //保存测试检查点代码
    function saveExpectCode(success, error,callback) {

      allCaseCount++;
      if (!success) {
        failedCaseCount++;
      }
      if (arrLastTestCodes.length > 0) {
        /*(checkerBrowser || recorderMobileApp) && sendWsMessage('checkResult', {
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
        lastTestTitle = '';
        arrLastTestCodes = [];

        console.log("model:" + modelId);
        console.log("edge:" + edge);
        console.log("vertex:" + vertex);

        //生成模型的脚本对象
        vertextEdgeScript = {
          modelId: modelId,
          vertexedge: vertex,
          type:"vertex",
          scriptContent: arrTestCodes

        }

        console.log("开始调用服务ajax存储检查点脚本：")
        console.log(JSON.stringify(vertextEdgeScript));

        if(modelId!=0){
          request({
            url:GRAPHTEST_SERVER_URL_SCRIPT_CREATE,
            json:true,
            method: "POST",
            body: vertextEdgeScript},function (error, response, body){
            console.log("结束调用服务ajax存储脚本")
            console.log(body);
            callback();
          });
        }else {
          callback();
        }
      }
    }



    //保存测试操作代码
    function saveTestCode(success, error,callback) {

      allCaseCount++;
      if (!success) {
        failedCaseCount++;
      }
      if (arrLastTestCodes.length > 0) {
        /*(checkerBrowser || recorderMobileApp) && sendWsMessage('checkResult', {
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

        console.log("当前测试脚本内容:" + arrTestCodes);
        lastTestTitle = '';
        arrLastTestCodes = [];
        console.log("model:" + modelId);
        console.log("edge:" + edge);
        vertextEdgeScript.scriptContent = arrTestCodes;

        console.log("开始调用服务ajax存储脚本")
        console.log(JSON.stringify(vertextEdgeScript));

        if(modelId!=0){

          //还有开始边的操作记录的情况

            request({
              url:GRAPHTEST_SERVER_URL_SCRIPT_CREATE,
              json:true,
              method: "POST",
              body: vertextEdgeScript},function (error, response, body){
              console.log("结束调用服务ajax存储脚本")
              console.log(body);
              callback();
            });







          //START的默认两次操作
       /*   if(vertextEdgeScript.vertexedge == "START"){
           /!* if(startFlag==1){
              urlScript = urlScript.concat(vertextEdgeScript.scriptContent);
              callback();
            }else {
              urlScript = urlScript.concat(vertextEdgeScript.scriptContent);
              vertextEdgeScript.scriptContent = urlScript;
              request({
                url:GRAPHTEST_SERVER_URL_SCRIPT_CREATE,
                json:true,
                method: "POST",
                body: vertextEdgeScript},function (error, response, body){
                  console.log("结束调用服务ajax存储脚本")
                  console.log(body);
                  urlScript = [];
                  callback();
              });
            }*!/



          }else {*/






          // }







        }else {
          callback();
        }

        /*message("录制命令："+JSON.stringify(vertextEdgeScript));*/

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
      console.log(window + ":" + frame + ":" + cmd + ":" + data + "开始处理命令  cmdQueue start");
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

        function doNextForExpect() {
          saveExpectCode(true,null,callback);
          // callback();
        }

        function catchError(error) {
          saveTestCode(false, error);
          callback();
        }

        var arrCodes = [];
        console.log("arrTash cmd:"+cmd);
        var reDomRequire = /^(val|text|displayed|enabled|selected|attr|css)$/;
        var reParamRequire = /^(attr|css|cookie|localStorage|sessionStorage|alert)$/;
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

          //添加检查点
          case 'expect':
            co(function*(){
              var sleepTime = data.sleep;
              var expectType = data.type;
              var expectParams = data.params;
              var expectCompare = data.compare;
              var expectTo = data.to;
              arrCodes = [];
              if(reDomRequire.test(expectType)){
                arrCodes.push('return driver.sleep('+sleepTime+').wait(\''+escapeStr(expectParams[0])+'\', 30000)');
              }
              else{
                arrCodes.push('return driver');
              }
              switch(expectType){
                case 'val':
                  arrCodes.push('       .val()');
                  break;
                case 'text':
                  arrCodes.push('       .text()');
                  break;
                case 'displayed':
                  arrCodes.push('       .displayed()');
                  break;
                case 'enabled':
                  arrCodes.push('       .enabled()');
                  break;
                case 'selected':
                  arrCodes.push('       .selected()');
                  break;
                case 'attr':
                  arrCodes.push('       .attr(\''+escapeStr(expectParams[1])+'\')');
                  break;
                case 'css':
                  arrCodes.push('       .css(\''+escapeStr(expectParams[1])+'\')');
                  break;
                case 'url':
                  arrCodes.push('       .url()');
                  break;
                case 'title':
                  arrCodes.push('       .title()');
                  break;
                case 'cookie':
                  arrCodes.push('       .cookie(\''+escapeStr(expectParams[0])+'\')');
                  break;
                case 'localStorage':
                  arrCodes.push('       .localStorage(\''+escapeStr(expectParams[0])+'\')');
                  break;
                case 'sessionStorage':
                  arrCodes.push('       .sessionStorage(\''+escapeStr(expectParams[0])+'\')');
                  break;
                case 'alert':
                  arrCodes.push('       .getAlert()');
                  break;
              }
              var codeExpectTo = expectTo.replace(/"/g, '\\"').replace(/\n/g, '\\n');
              arrCodes.push('       .should.not.be.a(\'error\')');
              switch(expectCompare){
                case 'equal':
                  arrCodes.push('       .should.equal(_('+(/^(true|false)$/.test(codeExpectTo)?codeExpectTo:'\''+escapeStr(codeExpectTo)+'\'')+'));');
                  break;
                case 'notEqual':
                  arrCodes.push('       .should.not.equal(_('+(/^(true|false)$/.test(codeExpectTo)?codeExpectTo:'\''+escapeStr(codeExpectTo)+'\'')+'));');
                  break;
                case 'contain':
                  arrCodes.push('       .should.contain(_(\''+escapeStr(codeExpectTo)+'\'));');
                  break;
                case 'above':
                  arrCodes.push('       .should.above(_(\''+escapeStr(codeExpectTo)+'\'));');
                  break;
                case 'below':
                  arrCodes.push('       .should.below(_(\''+escapeStr(codeExpectTo)+'\'));');
                  break;
                case 'match':
                  arrCodes.push('       .should.match('+escapeStr(codeExpectTo)+');');
                  break;
                case 'notMatch':
                  arrCodes.push('       .should.not.match('+escapeStr(codeExpectTo)+');');
                  break;
              }
              pushTestCode('expect', '', expectType + ', ' + String(expectParams) + ', ' + expectCompare + ', ' + expectTo, arrCodes);
            }).then(doNextForExpect).catch(catchError);
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
  var crxPath = path.resolve(dirname, './config/graphtest-extension.crx');
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

module.exports = Recorder;