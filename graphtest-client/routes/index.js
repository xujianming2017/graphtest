var rendering = require('../util/rendering');
var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../util/config');
var ensureAuthenticated = require('../util/routeMiddleware');
var crypto = require('crypto'),
    passport = require('passport');


router.get("/",function(req,res,next){
    var user = req.session.user;
    res.render('index/index', {
        user: user
    });
});

router.get("/login",function(req,res,next){
    res.render('login/index',{username: req.flash('username')});
});

router.post("/login",function(req,res,next){

    passport.authenticate('local', function(err, user, info) {
        if (err || !user) {
            req.flash('username', req.body.un);
            req.flash('error', info.message);
            return res.redirect('/login');
        }

        //passport扩展的http方法，logIn(user, options,callback)：用login()也可以。作用是为登录用户初始化session。options可设置session为false，即不初始化session，默认为true。
        req.logIn(user, function(err) {
            if (err) {
                req.flash('error', info.message);
                return res.redirect('/login');
            }
            req.session.user = user;
            req.flash('success', user.name+',欢迎回来! ');
            return res.redirect('/home');
        });
    })(req, res, next);

});

router.get("/home",ensureAuthenticated,function(req,res,next){
    var user = req.session.user;
    req.flash("info","欢迎来到图测");
    res.render('project', {
        user: user
    });

});


router.get("/project",ensureAuthenticated,function(req,res,next){
    var user = req.session.user;
    res.render('project', {
        user: user
    });

});

router.get("/design",ensureAuthenticated,function(req,res,next){
    var user = req.session.user;
    res.render('design', {
        user: user
    });

});


router.get("/execution",ensureAuthenticated,function(req,res,next){
    var user = req.session.user;
    res.render('execution', {
        user: user
    });

});

router.get("/report",ensureAuthenticated,function(req,res,next){
    var user = req.session.user;
    res.render('report', {
        user: user
    });
});


router.get("/param",ensureAuthenticated,function(req,res,next){
    var user = req.session.user;
    res.render('param', {
        user: user
    });
});

router.get("/register",function(req,res,next){
    res.render('login/register', {username: req.flash('username')});
});



router.post("/register",function(req,res){
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

    //查询是否存在用户
    request({
        url:config.url+"api/user/get",
        json:true,
        method: "POST",
        body: {username:un}},function (error, response, body){
        //    判断不存在同名用户
        if(!error&&body.returnCode===0&&!body.data){


            var new_salt = Math.round((new Date().valueOf() * Math.random())) + '';
            var pw = crypto.createHmac('sha1', new_salt).update(pwu).digest('hex');
            var created = new Date().toISOString().slice(0, 19).replace('T', ' ');
            var saveForm = {name: un, password: pw, salt: new_salt, created: created};
            //保存新用户
            request({
                url:config.url+"api/user/save",
                json:true,
                method: "POST",
                body: saveForm},function (error, response, body){
                    var model = body.data;
                    //认证

                    if(model){
                        passport.authenticate('local')(req, res, function () {
                            // 注册后先退出当前用户
                            req.logout();
                            var user = req.session.user;
                            if(user){
                                user = null;
                            }
                            req.session.user = model;
                            res.redirect('/home');
                        });
                    }else {
                        req.flash('error', '用户名已存在或异常，请重新输入！'+body);
                        res.redirect('/register');
                    }



            });
        }else {
            req.flash('error', '用户名已存在或异常，请重新输入！');
            res.redirect('/register');
        }
    });


});



router.get("/logout",function(req,res,next){
    req.logout();
    var user = req.session.user;
    if(user){
        user = null;
    }

    req.flash('info', '您已经退出了.');
    res.redirect('/login');

});


module.exports = router;


