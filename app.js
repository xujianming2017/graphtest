
var dbConfig;
var config;
try {
  //  开发配置文件
    dbConfig = require('./graphtest-app/config/db.dev.conf.js');
    config = require('./graphtest-app/config/app.dev.conf.js');
} catch(e) {
  try {
    // 生产环境配置文件
      dbConfig = require('./graphtest-app/config/db.conf.js');
      config = require('./graphtest-app/config/app.conf.js');
  } catch(e) {
    console.log('启动失败，没有配置文件可以读取！');
    return false;
  }
}

var knex = require('knex')({
      client: 'mysql',
      connection: dbConfig,
        pool: {
            min: 0,
            max: 10
        }
    }),
    express = require('express'),
    //用body parser 来解析post和url信息中的参数
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    cookieSession = require('cookie-session'),
    serveStatic = require('serve-static'),
    expressValidator = require('express-validator'),
    flash = require('connect-flash'),
    swig = require('swig'),
    passport = require('passport'),
    crypto = require('crypto'),
    Bookshelf = require('bookshelf'),
    messages = require('./graphtest-app/util/messages');


//// 创建项目实例
var app = express();

Bookshelf.mysqlAuth = Bookshelf(knex);


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

//设置静态文件目录
app.use(serveStatic('./graphtest-app/public'));
//app.use(express.favicon(__dirname + '/public/images/shortcut-icon.png'));
app.use(messages());


//制定模板引擎
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/graphtest-app/server/views');

//密码配置参数
app.set('superSecret', config.secret);

app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    if (req.method == 'OPTIONS') {
        res.send(200);
    } else {
        next();
    }
});
require('./graphtest-app/util/auth')(passport);
require('./graphtest-app/server/routes')(app, passport);



app.listen(process.env.PORT || 3333);

console.log('Listening on port 3333');
