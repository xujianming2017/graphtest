var rendering = require('../../util/rendering');


exports.home = function (req, res) {
    var user = req.session.user;
    res.render('index/index', {
        user: user
    });
}


exports.userHome = function (req, res) {
    var user = req.session.user;
//    res.render('index/user-home', {
//        user: user
//    });
    res.render('project', {
        user: user
    });
}

exports.projectPage = function (req, res) {
    var user = req.session.user;
//    res.render('index/user-home', {
//        user: user
//    });
    res.render('project', {
        user: user
    });
}

exports.designPage = function (req, res) {
    var user = req.session.user;
//    res.render('index/user-home', {
//        user: user
//    });
    res.render('design', {
        user: user
    });
}
exports.reportPage = function (req, res) {
    var user = req.session.user;
//    res.render('index/user-home', {
//        user: user
//    });
    res.render('report', {
        user: user
    });
}

exports.executionPage = function (req, res) {
    var user = req.session.user;
//    res.render('index/user-home', {
//        user: user
//    });
    res.render('execution', {
        user: user
    });
}
