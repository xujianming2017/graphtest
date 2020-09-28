var flash = require('connect-flash');
// flash 是 session 中一个用于存储信息的特殊区域。消息写入到 flash 中，在跳转目标页中显示该消息。flash 是配置 redirect 一同使用的，以确保消息在目标页面中可用。
// flash 可用于一次性的消息提示，比如注册，登录页面，当你再次刷新时，flash就没有提示消息了。
module.exports = function() {
    return function(req, res, next) {
        var error_messages = req.flash('error');
        var info_messages = req.flash('info');
        var success_messages = req.flash('success');
        res.locals.messages = [];
        for(var i in error_messages) {
            res.locals.messages.push({type: 'error', message: error_messages[i]});
        }
        for(var i in info_messages) {
            res.locals.messages.push({type: 'info', message: info_messages[i]});
        }
        for(var i in success_messages) {
            res.locals.messages.push({type: 'success', message: success_messages[i]});
        }   
        res.locals.isAuthenticated = req.isAuthenticated();
        next();
    }
}
