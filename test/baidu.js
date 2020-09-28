var http = require('http');
http.createServer(function(req,res){
    res.writeHead(200,{'Content-Type':'textml;charset=utf-8'});
    res.write('<h1>hello world, h1</h1>');
    res.write('<div id="mainId" class="mainClass">this is a div element.</div>');
    res.write('<div>');
    res.write('用户名：<input id="userName" class="userNameClass" />');
    res.write('</div>');
    res.write('<div>');
    res.write('密 码：<input id="password" class="passwordClass" />');
    res.write('</div>');
    res.write('<div>');
    res.write('<input id="submit" name="submit" type="button" value="提交" onclick="alert(123);" />');
    res.write('</div>');
    res.end('<p id="content"></p>')
}).listen(8001);     //事件监听3000端口
console.log('starting server ... ');

var webdriver = require('selenium-webdriver');   // 驱动包
global.By = webdriver.By; // 选择包
var until = webdriver.until;

global.driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build();

console.log('start to call select... ');

var selectUtil = require('./select2.js');

global.driver.get('http://127.0.0.1:8001');

console.log('http://127.0.0.1:8001... ');
var params = new Array();

/*var fiber1 = selectUtil.selectElement;
fiber1(driver,params);*/

var p = new Promise(function(resolve, reject) {

    if(true){
        resolve("success");
    }else {
        reject("failue");
    }


});


function sleep(numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime)
            return;
    }
}
var p2 = new Promise(function(resolve, reject) {

    if(true){


        resolve("success");


    }else {
        reject("failue");
    }


});
 function aaa(driver){


    var element = global.driver.findElement(global.By.id("userName"));
    element.sendKeys('jingdong');
}


var driverFinder = {
    driver:"",
    str:"123",
    find:function(driver){
        driverxxx = driver;
        // new aaa(driverxxx);
        p.then(function(result){
            p2.then(function(result){
                console.log("======="+result);
                sleep(2000);


                str = result;

            })

        });

        var element = global.driver.findElement(global.By.id("userName"));
        element.sendKeys('jingdong222');







        // aaa(driver);
        // return  global.driver.findElement(global.By.id('userName'));
    }

}

driverFinder.find(global.driver);

