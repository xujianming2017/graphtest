var http = require('http');
http.createServer(function(req,res){
    res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});
    res.write('<h1>hello world, h1</h1>');
    res.write('<div id="mainId" class="mainClass">this is a div element.</div>');
    res.write('<div>');
    res.write('用户名：<input id="userName" class="userNameClass" />');
    res.write('</div>');
    res.write('<div>');
    res.write('密 码：<input id="password" class="passwordClass" />');
    res.write('</div>');
    res.write('<div>');
    res.write('<input id="submit" name="submit" type="button" value="提交" onclick="document.getElementById(\'content\').innerHTML=\'success\';" />');
    res.write('</div>');
    res.end('<p id="content"></p>')
}).listen(80);     //事件监听3000端口
console.log('starting server ... ');


var webdriver = require('selenium-webdriver');   // 驱动包
global.driver = new webdriver.Builder().forBrowser('chrome').build();
global.By = webdriver.By;
var until = webdriver.until;
var params = new Array();
var exe_step_order = 0;

var selectUtil = require('./allocation/select.js');

console.log('before setTimeout ' + new Date());
setTimeout(function(){
    console.log('after setTimeout ' + new Date());
    driver.get('http://127.0.0.1/');
    console.log("。。。。。。");

    // 1、登录流程：输入用户名、密码，点击登录按钮
    driver.then(
        findUserNameElement
    ).then(
        findPasswordElement
    ).then(
        findSubmitElement
    ).catch(function(error){
        console.log("======= promise Error =====\nerror:" + error);
    });

    // 2、下单流程：输入sku、数量，加入购物车
},3000);

function initParams(nextFunction){
    exe_step_order = exe_step_order + 1;
    params.length = 0;
    params.push(exe_step_order);
    params.push(nextFunction);
}

function findUserNameElement(result){
    console.log("1==== findUserNameElement ===");
    initParams(inputUserName);
    selectUtil.selectElement(params);
}

function inputUserName(result){
    console.log("2==== inputUserName ===" + result);
    result.sendKeys('jingdong');
}

function findPasswordElement(result){
    console.log("3==== findPasswordElement ===");
    initParams(inputPassword);
    selectUtil.selectElement(params);
}

function inputPassword(result){
    console.log("4==== inputPassword ===" + result);
    result.sendKeys('123456');
}

function findSubmitElement(){
    console.log("51==== findSubmitElement ===" + new Date());
    setTimeout(function(){
        console.log("52==== findSubmitElement ===" + new Date());
        initParams(clickSubmit);
        selectUtil.selectElement(params);
    },1000);
}

function clickSubmit(result){
    console.log("6==== clickSubmit ===" + result);
    result.click();
}

console.log(111111111);