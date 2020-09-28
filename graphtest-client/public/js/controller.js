var GraphServerUrl = "http://localhost:3333";

var USERFOLDER = "D:/temp"

var async = require('async');
var path = require('path');
var fs = require('fs');
var cp = require('child_process');
var net = require('net');

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

(function(){
    initIndexlink();
	loadUser();

	if(chrome.storage.local){
	    console.log('你的浏览器支持localStorage!');
	    chrome.storage.local.get(function(result){console.log("本地存储:"+JSON.stringify(result))});
		/*chrome.storage.local.clear(function() {
	     var error = chrome.runtime.lastError;
	     if (error) {
	     console.error(error);
	     }
	     });
	     */
	}else{
	    console.log('浏览器不支持localStorage!');
	}

})();

//加载用户信息
function loadUser(){
	 // 获取缓存
	 		  chrome.storage.local.get(function(result){
	 		  	console.log("已存在本地认证用户:"+JSON.stringify(result));

	 		  	if(result.username){
		            getModelPage();
                initUserInfo(result);
	 		  	}else{

	 		  		// 登录页面
	 		  		 callPage("login.html",function(response){
				    	  var p = response;
				    	  $(".message div").remove();
				    	  $(".content div").remove();
               $(".content").append(p);
               initSignin();
		    		});
	 		  	}
	 		  });

}
//主页
function initIndexlink(){

		$('.container .index-link').on('click', function(e){
		    e.preventDefault();
		    loadUser();

		});

		$('.container .logout').on('click', function(e){
		    e.preventDefault();
		    chrome.storage.local.clear(function() {
			    var error = chrome.runtime.lastError;
			    if (error) {
			        console.error(error);
				}else{
					var message = '<div class="alert alert-success alert-dismissible" role="alert">'+
  								'<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>'+
  								'缓存已清空</div>';
					$(".message div").remove();
					$(".message").append(message);
				}
		});
		});
};

function initSignin(){
	// 登录请求
	 $(".container .form-signin button").on('click', function(e){
	    e.preventDefault();
	    var pageRef = $(this).attr('href');

	    var action = $(this).closest("form").attr("action");
	    var username = $(this).closest("form").find(".username").val();
	    var password = $(this).closest("form").find(".password").val();

	    console.log("username:"+username+",password:"+password);

	     var params = {un:username,pw:password};
	    console.log(action);
	    postForm(action,params,	function(response){

	    		if(response.success === true){
	    			console.log("登录成功！");
	    			chrome.storage.local.set({apiToken:response.token});
		 			  chrome.storage.local.set({username:username});
            chrome.storage.local.set({user:response.user});
		 			// 进入工作区页面
            getModelPage();
            //初始化信息
            chrome.storage.local.get(function(result){
              initUserInfo(result);
            });

	    		}else{
	    			var message = '<div class="alert alert-success alert-dismissible" role="alert">'+
  								'<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>'+
  								'用户认证失败，请检查用户名及密码</div>';
					$(".message div").remove();
					$(".message").append(message);
	    		}


		    },function(error){
				$(".content").html("<div class='col-md-2' style='width:100px;'>"+error+"</div>");
		    }
	    );

	});
}
//进入模型页面
function getModelPage(){
  callPage("toolbox.html",function(response){
    $(".message div").remove();
    $(".content div").remove();
    $(".content").append(response);
  });
}

function initUserInfo(cache){
  apiAjaxMethod("/api/user/getModelList",{userId:cache.user.id},initModelRecorder);
  apiAjaxMethod("/api/scenario",{userId:cache.user.id},initScenarioRunner);
}



// 设置模型录制按钮事件
function initModelRecorder(data) {
  var modelListItemTemplate =
    '<li class="list-group-item">' +
    '<div class="checkbox"><input type="hidden" id="checkbox" value="{modelId}"/>No.{modelId}<label for="checkbox">{modelName}</label></div>' +
    '<div class="pull-right action-buttons">  ' +
    '<a href="#" class="record"><span class="glyphicon glyphicon glyphicon-play"></span></a>' +
    /*      '<a href="#" class="trash"><span class="glyphicon glyphicon-trash"></span></a>' +
     '<a href="#" class="flag"><span class="glyphicon glyphicon-flag"></span></a>' +*/
    '</div> </li>';

  if (data.modelList&&data.modelList.length>0) {

    $.each(data.modelList, function (index, model) {
      var modelInfo = modelListItemTemplate;
      console.log(model);
      modelInfo = modelInfo.replace(/{modelName}/g, model.model_name);
      modelInfo = modelInfo.replace(/{modelId}/g, model.id);
      $(".list-group-model").append(modelInfo);

    });
    $(".list-group-model .record").click(function () {
      var modelId = $(this).closest("li").find("#checkbox").val();
      chrome.storage.local.set({modelId: modelId});
      Recorder.startRecorder("");
      Recorder.setModelId({modelId: modelId,userId:0});


    });
  } else {
    $(".list-group-model").append('<li class="list-group-item"><div class="checkbox"><label for="checkbox">此用户没有模型内容</label></div></li>');
  }

}

// 设置场景执行事件
function initScenarioRunner(data){
  var scenarioListItemTemplate =
    '<li class="list-group-item">' +
    '<div class="checkbox"><input type="hidden" id="scenarioId" value="{scenarioId}"/>No.{scenarioId}<label for="checkbox">{scenarioName}</label></div>' +
    '<div class="pull-right action-buttons">  ' +
    '<a href="#" class="runScenario"><span class="glyphicon glyphicon glyphicon-play"></span></a>' +
    /*      '<a href="#" class="trash"><span class="glyphicon glyphicon-trash"></span></a>' +
     '<a href="#" class="flag"><span class="glyphicon glyphicon-flag"></span></a>' +*/
    '</div> </li>';


    $(".allScenarioFolder").click(function(){
      var cmdStr = 'start "" "'+USERFOLDER+'"';
      cp.exec(cmdStr,function(error, stdout, stderr) {
        if (!error ) {
          message("打开所有场景文件夹："+USERFOLDER+"");

        } else {
          message("打开所有场景文件夹失败："+error);
        }
      });


    });


  if(data.result){
    $.each(data.result,function(index,scenario){
      var scenarioInfo = scenarioListItemTemplate;

      if(scenario){

        scenarioInfo = scenarioInfo.replace(/{scenarioName}/g,scenario.scenario_name);
        scenarioInfo = scenarioInfo.replace(/{scenarioId}/g,scenario.id);
        $(".list-group-scenario").append(scenarioInfo);
      }
    });
    $(".list-group-scenario .runScenario").click(function(){
      var scenarioId = $(this).closest("li").find("#scenarioId").val();
      var scenarioName = $(this).closest("li").find("label").text();
      console.log("开始执行场景："+scenarioId+","+scenarioName);

      runScenarioRunner({"scenarioId":scenarioId,"scenarioName":scenarioName});

    });
  }else {
    $(".list-group-scenario").append('<li class="list-group-item"><div class="checkbox"><label for="checkbox">此用户没有场景内容</label></div></li>');
  }

}

//场景执行方法
function runScenarioRunner(scenario){


    var time = new Date().format("yyyy年MM月dd日hh时mm分ss秒");
    var scenarioFolder = path.resolve(USERFOLDER,"场景-"+scenario.scenarioId+"-"+scenario.scenarioName+"-"+time);
    // var scenarioFolder = path.resolve(USERFOLDER,"test");

    message("执行场景："+scenario.scenarioName+"，开始生成执行文件");

  //查询场景下用例的内容
  apiAjaxMethod("/api/scenario/getCaseList",{scenarioId:scenario.scenarioId},function(result){

    if(result&&result.returnCode===0){

      var pathArr = result.result;

      if(pathArr){
        //创建场景文件夹
        mkdirs(scenarioFolder);
        //创建截图文件夹
        var screenshots = path.resolve(scenarioFolder,"screenshots");
        mkdirs(screenshots);

        //创建config.json\hosts\run.bat
        var configTemplate = path.resolve(path.dirname(''), './app/template/config.json');
        var configFile = path.resolve(scenarioFolder,"config.json");

        var hostsTemplate = path.resolve(path.dirname(''), './app/template/hosts');
        var hostsFile = path.resolve(scenarioFolder,"hosts");

        var packageTemplate = path.resolve(path.dirname(''), './app/template/package.json');
        var packageFile = path.resolve(scenarioFolder,"../package.json");


        //创建config.json\hosts\run.bat
        var initTemplate = path.resolve(path.dirname(''), './app/template/init.bat');
        var initFile = path.resolve(scenarioFolder,"../init.bat");


        fs.exists(packageFile, function (exists) {
          if(!exists){
            fs.createReadStream(packageTemplate).pipe(fs.createWriteStream(packageFile));
          }
        });

        fs.exists(configFile, function (exists) {
          if(!exists){
            fs.createReadStream(configTemplate).pipe(fs.createWriteStream(configFile));
          }
        });
        fs.exists(hostsFile, function (exists) {
          if(!exists){
            fs.createReadStream(hostsTemplate).pipe(fs.createWriteStream(hostsFile));
          }
        });

        fs.exists(initFile,function (exists) {
          if(!exists){
            fs.createReadStream(initTemplate).pipe(fs.createWriteStream(initFile));
          }
        });


        var tempalteFile = path.resolve(path.dirname(''), './app/template/template_web.js');
        var templateContent = fs.readFileSync(tempalteFile).toString();

        var pathIdArr =[];
        var runPathCmds = [];

        async.eachSeries(pathArr, function(pathItem, callback) {

          var templateContentTemp = templateContent;
          var pathFileName = "path_"+pathItem.id+"_"+pathItem.case_name+".js";
          var pathResultName = "path_"+pathItem.id+"_"+pathItem.case_name+".result.txt";
          var testFile = path.resolve(scenarioFolder,pathFileName);

          var runPathCmd = "mocha "+pathFileName+" --reporter json > "+pathResultName;
          runPathCmds.push(runPathCmd);

          fs.writeFileSync(testFile, pathItem.graphpath_script_content);

          pathIdArr.push(pathItem.id);
          callback(null,templateContentTemp);



        },function(error){
          if(error){

            message("脚本生成有错误："+error);
            console.log(error);

          }else{

            var recordResultJsFile = path.resolve(path.dirname(''), './app/template/recordResult.js');
            var pathIds = pathIdArr.join(",");
            var recordResultJsFileContent = fs.readFileSync(recordResultJsFile).toString();
            //替换参数
            recordResultJsFileContent = recordResultJsFileContent.replace(/\{\$(\w+)\}/g, function(all, name){
              switch(name){
                case 'scenarioId':
                  return scenario.scenarioId;
                case 'pathIds':
                  return pathIds;

              }
              return all;
            });
            var recorderResult = path.resolve(scenarioFolder,"recordResult.js");
            fs.writeFileSync(recorderResult, recordResultJsFileContent);

            var runGraphTestFile = path.resolve(path.dirname(''), './app/template/run-graph-test.bat');
            var runGraphTestStr = runPathCmds.join(" & ");
            var runGraphTestFileContent = fs.readFileSync(runGraphTestFile).toString();
            //替换参数
            runGraphTestFileContent = runGraphTestFileContent.replace(/\{\$(\w+)\}/g, function(all, name){
              switch(name){
                case 'pathCmds':
                  return runGraphTestStr;
              }
              return all;
            });
            var runGraphTest = path.resolve(scenarioFolder,"run-graph-test.bat");
            fs.writeFileSync(runGraphTest, runGraphTestFileContent);

            var runBatTemplate = path.resolve(path.dirname(''), './app/template/run.bat');
            var runBatFile = path.resolve(scenarioFolder,"run.bat");


            /////////////////////////////生成run.bat
            var stream =  fs.createReadStream(runBatTemplate).pipe(fs.createWriteStream(runBatFile));
            stream.on('finish', function () {
              var cmdStr = 'start "" "'+scenarioFolder+'"';
              cp.exec(cmdStr, {cwd:scenarioFolder},function(error, stdout, stderr) {
                if (!error ) {
                  message("打开场景文件夹："+scenarioFolder+",请点击执行run.bat");

                } else {
                  message("打开场景文件夹："+error);
                }
              });
            });
            ////////////////////////////////

          }
        });
      }else {

        message("场景下没有可执行用例，请检查！")


      }




    }else {

      console.log("result:"+result.returnMsg);

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

//get页面请求
function callPage(pageRef,next){
	$.ajax({
		url:pageRef,
		type:"get",
		dataType:"text",
		success:function(response){
			next(response);
		}

	});
}

//post页面请求
function postForm(action,params,next,error){
	$.ajax({
		url:action,
		type:"get",
		data:params,
		dataType:"json",
		success:function(response){
			next(response);
		}
	});
}

//api调用方法
function apiAjaxMethod(url,data,callback){

  $.ajax({
    type: "post",
    url:GraphServerUrl+url,
    data:data,
    dataType: "json",
    success: function (data) {
      callback(data);
    },
  });

}


function message(data){


  var template = '<div class="alert alert-warning"><a href="#" class="close" data-dismiss="alert">&times;</a>'+data+ '</div>';
  $(".message").html("");
  $(".message").append(template);


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

