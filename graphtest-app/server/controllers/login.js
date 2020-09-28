var crypto = require('crypto'),
    passport = require('passport'),
    jwt = require('jsonwebtoken'),
    data = require('../models/auth')();
var f = require('../models/folder');


exports.registerPage = function(req, res) {
    res.render('login/register', {username: req.flash('username')});
}


exports.registerPost = function(req, res) {

    //获取参数

    var vpw = req.body.vpw;//验证密码
    var pwu = req.body.pw;//密码
    var un = req.body.un;//用户名称
    // flash 实际就是一个用一次就删除(就是说只引用一次,第二次引用该值就没有了)的变量而已…跟普通的变量一样.
    req.flash('username', un);
    if(vpw !== pwu) {
        req.flash('error', '两次输入的密码不一致，请重新输入！');
        res.redirect('/register');
        return;
    }

    // req.checkBody('un', 'Please enter a valid email.').notEmpty().isEmail();
    req.checkBody('un', '请输入正确的用户名称.').notEmpty();
    //验证错误
    var errors = req.validationErrors();
    if (errors) {
        var msg = errors[0].msg;
        req.flash('error', msg);
        res.redirect('/register');
        return;
    }

    data.ApiUser.query().where("name",un).then(function(users){
        if(users&&users.length>0){
            req.flash('error', '已存在此用户名称');
            res.redirect('/register');
        }else {


            var new_salt = Math.round((new Date().valueOf() * Math.random())) + '';
            var pw = crypto.createHmac('sha1', new_salt).update(pwu).digest('hex');
            var created = new Date().toISOString().slice(0, 19).replace('T', ' ');

            new data.ApiUser({name: un, password: pw, salt: new_salt, created: created}).save().then(function(model) {

                //初始化用户目录
                new f().initUserFolder(model);
                passport.authenticate('local')(req, res, function () {
                    // 注册后先退出当前用户
                    req.logout();
                    var user = req.session.user;
                    if(user){
                        user = null;
                    }
                    var token = req.session.token;
                    if(token){
                        token=null;
                        req.session.token=null;
                    }
                    req.session.user = model;
                    res.redirect('/home');
                })



            }, function(err) {
                req.flash('error', '无法获取账户信息');
                res.redirect('/register');
            });



        }
    }).catch(function(error){
        return res.json({returnCode:-1,returnMsg:'查询用户异常！'+error});
    })














    

}


exports.loginPage = function(req, res) {
    res.render('login/index',{username: req.flash('username')});
}

//登录检查
exports.checkLogin = function(req, res, next) {
    //passportjs是一个提供authentication服务的node中间件
    //每一个strategy是对一种验证方式的封装。比如local

    passport.authenticate('local', function(err, user, info) {
        if (err || !user) {
            req.flash('username', req.body.un);
            req.flash('error', info.message);
            return res.redirect('/login');
        }
        req.logIn(user, function(err) {
            if (err) {
                req.flash('error', info.message);
                return res.redirect('/login');
            }

            req.session.user = user;
            req.flash('success', user.attributes.name+',欢迎回来! ');
            return res.redirect('/home');
        });
    })(req, res, next);
}

//获取一个认证的用户，再执行next()方法
exports.getAuthUser = function(req, res, next) {

    passport.authenticate('local', function(err, user, info) {
        if (err || !user) {
            return res.json({ success: false, message: '获取API认证Token失败，没有此用户.' });
        }
        req.logIn(user, function(err) {
            if (err) {
                return res.json({ success: false, message: '获取API认证Token失败！' });
            }
            req.session.user = user;
            next();
        });
    })(req, res,next);
}

exports.logout = function(req, res) {
    req.logout();
    var user = req.session.user;
    if(user){
        user = null;
    }
    var token = req.session.token;
    if(token){
        token=null;
        req.session.token=null;
    }

    req.flash('info', '您已经退出了.');
    res.redirect('/login');
}

