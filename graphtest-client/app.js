
var config;
try {
    config = require('./config/app.dev.conf.js');
} catch(e) {
    try {
        // 生产环境配置文件
        config = require('./config/app.conf.js');
    } catch(e) {
        console.log('启动失败，没有配置文件可以读取！');
    }
}

var express = require('express');
//用body parser 来解析post和url信息中的参数
var  bodyParser = require('body-parser');
var  cookieParser = require('cookie-parser');
var  cookieSession = require('cookie-session');
var  serveStatic = require('serve-static');
var  expressValidator = require('express-validator');
var  flash = require('connect-flash');
var  swig = require('swig');
var  passport = require('passport');
var  crypto = require('crypto');
var  favicon = require('serve-favicon');
var  messages = require('./util/messages');
var  index = require('./routes/index');
var  api = require('./routes/api');
var session = require("express-session");


//// 创建项目实例
var app = express();

//app.user注册各种中间件，express框架处理请求时会调用各种中间件，来完成不同的处理
//若需要使用签名，需要指定一个secret,字符串halsisiHHh445JjO0,否者会报错
app.use(cookieParser('halsisiHHh445JjO0'));
app.use(cookieSession({
  keys: ['key1', 'key2']
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(expressValidator());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// 设置执行路径为静态文件目录
app.use(serveStatic(config.exeReportDir));

//设置静态文件目录
app.use(serveStatic('./public'));
app.use(favicon("./public/img/favicon.ico"));
app.use(messages());

app.use("/",index);
app.use("/api",api)
//制定模板引擎
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', './views');

require('./util/auth')(passport);
var recorder = require('./util/startRecorder');
recorder.onCommand();

app.listen(process.env.PORT || 9526,function(error){

    console.log('启动图测本地主服务http://localhost:9526');
    if(typeof(window)!="undefined"){
        if (window.location.href.indexOf('localhost') < 0) {
            console.log('加载服务地址');
            window.location = "http://localhost:9526";

        }
    }

});

