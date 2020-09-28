var crypto = require('crypto'),
    LocalStrategy = require('passport-local').Strategy,
    data = require('../server/models/auth')();

module.exports = function(passport) {

    ////保存user对象
    passport.serializeUser(function(user, done) {

        done(null, user.id);
    });

    //删除user对象
    passport.deserializeUser(function(user_id, done) {
        new data.ApiUser({id: user_id}).fetch().then(function(user) {
            return done(null, user);
        }, function(error) {
            return done(error);
        });
    });

    // LocalStrategy策略，用于匹配本地环境的用户名和密码，可以扩展这个策略，通过数据库的方式进行匹配。
    passport.use(new LocalStrategy({
        usernameField: 'un',
        passwordField: 'pw'
    },function(username, password, done) {
        new data.ApiUser({name: username}).fetch({require: true}).then(function(user) {
            var sa = user.get('salt');
            var pw = user.get('password');
            var upw = crypto.createHmac('sha1', sa).update(password).digest('hex');
            if(upw == pw) {
                return done(null, user);
            }
            return done(null, false, { 'message': 'Invalid password'});
        }, function(error) {
            return done(null, false, { 'message': 'Unknown user'});
        });
    }));
};
