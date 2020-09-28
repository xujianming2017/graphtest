var Fiber = require('fibers');
var async = require('async');
var http = require("http");
var mysql = require('mysql');

var connection = mysql.createConnection({
    host     : '192.168.200.88',
    user     : 'root',
    password : 'root',
    database : 'test'
});
connection.connect();

var queryObjectLibSelectString = "select * from user";


var aaa = function(driver){
    console.log("==========="+driver);
    var element = driver.findElement(global.By.id("userName"));
    element.sendKeys('jingdong');
    // return "";
}



var driverFinder = {

    find:function(driver){
   /*     var element = driver.findElement(global.By.id("userName"));
        element.sendKeys('jingdong');*/
        // aaa(driver);

        p.then(function(result){

            console.log("---------------"+result);

            aaa(driver);
        });
        // return  global.driver.findElement(global.By.id('userName'));
    }

}




var obj= {
    results:"",
    query:function()
    {
        var mysql = require('mysql');
        //创建连接
        var client = mysql.createConnection({
            "host": "192.168.200.88",
            "user": "root",
            "password": "root",
            "database": "test"
        });
        client.connect();
        var byStr;
        client.query(
                queryObjectLibSelectString,
            function (err, results, fields) {
                if (err) {
                    throw err;
                }
                if (results) {

                    /*                console.log('return results:'+results)
                     console.log(results);
                     byStr = results[0].name;
                     console.log("byStr:" + byStr);
                     */

                    this.results = results;


                    try {
                        // console.log(global.driver);
                        //element = global.driver.findElement(eval(byStr));
                        // element = global.driver.findElement(By.id('userName'));

                        // element = aaa();
                        // element.sendKeys('jingdong');

                        console.log("findby sucess!");
                    } catch (error) {
                        console.log("11111NoSuchElementException..." + error);
                    }
                }
                client.end();
            });
        return this;
    },
    select:function()
    {
        var element = global.driver.findElement(By.id('userName'));
        return this;
    }
}
exports.selectElement = function(driver) {
    // driver.get('http://127.0.0.1:8001');
    console.log("findelement!");
    console.log("driver = "+driver);
    driverFinder.find(driver);
    // element.sendKeys('jingdong');

    var obj2 = obj.query();
    console.log("obj = "+obj);
    console.log("obj2 = "+obj2.results);

    // var byStr =obj2.results[0].name;

    // console.log("byStr:" + byStr);
    obj.select();
    //obj.select();
    //console.log("out byStr:"+byStr);

    // var element = global.driver.findElement(By.id('userName'));
    // element.sendKeys('jingdong');
};