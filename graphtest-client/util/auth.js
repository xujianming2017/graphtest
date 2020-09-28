var crypto = require('crypto');
var LocalStrategy = require('passport-local').Strategy;
var request = require("request");
var config = require('../util/config');
module.exports = function(passport) {

    ////user.id序列化到session中，即sessionID，同时它将作为凭证存储在用户cookie中。
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    //session反序列化，参数为用户提交的sessionID，若存在则从数据库中查询user并存储与req.user中。
    passport.deserializeUser(function(user_id, done) {
        var form = {};
        form.userid = user_id;
        request({
            url:config.url+"api/user/get",
            json:true,
            method: "POST",
            body: form},function (error, response, body){
            if(!error&&body.data.length>0){
                var user = body.data[0];
                return done(null, user);
            }else {
                return done(error);
            }
        });
    });

    // LocalStrategy策略，用于匹配本地环境的用户名和密码，可以扩展这个策略，通过数据库的方式进行匹配。
    passport.use(new LocalStrategy({
        usernameField: 'un',
        passwordField: 'pw'
    },function(username, password, done) {

        var form = {};
        form.username = username;
        form.password = password;
        request({
            url:config.url+"api/user/get",
            json:true,
            method: "POST",
            body: form},function (error, response, body){

                if(!error&&body.returnCode===0&&body.data){
                    var user = body.data[0];
                    var sa = user.salt;
                    var pw = user.password;
                    var upw = crypto.createHmac('sha1', sa).update(password).digest('hex');
                    if(upw == pw) {
                        return done(null, user);
                    }
                    return done(null, false, { 'message': '密码错误'});

                }else {
                    return done(null, false, { 'message': '未知用户'+error});
                }
        });


    }));
};
