var data = require('../models/auth')();
var URL = require('url');
var f = require('../models/folder');
exports.api = function(req, res) {
    res.render('api/index');
}
exports.user = function(req, res) {
    var url = req.url;
    switch(url){
        //查询所有用户信息
        case "/api/user":
            data.ApiUser.fetchAll().then(function(users){
                res.json(users);
            });
            break;
        //查询用户信息
        case "/api/user/query":
            console.log(req.body);
            var userId = req.body.userId;
            if(!userId){
                res.json({userList:'',returnCode:-1,returnMsg:'没有userId属性！',format:'{"userId":"用户Id"}'});
            }
            //orm 查询数据库中用户的信息 根据LOGIN_NAME id条件查询
            new data.ApiUser({id:userId}).fetch().then(function(user){
                if(user){
                    res.json({returnCode:0,returnMsg:'用户查询成功！',data:user});
                }else {
                    res.json({returnCode:-1,returnMsg:'没有查询到用户数据！',data:user});
                }
            }).catch(function(error){
                res.json({userList:'',returnCode:-1,returnMsg:'查询到用户数据异常！'+error});
            });

            break;
        //查询用户信息
        case "/api/user/get":
            var username = req.body.username;
            var userid = req.body.userid;
            if(!username&&!userid){
               return  res.json({returnCode:-1,returnMsg:'没有username属性！',format:'{"username":"用户姓名"}'});
            }
            var promise = data.ApiUser.query();
            var queryData = {};
            if(username){
                queryData.name = username;
            }
            if(userid){
                queryData.id = userid;
            }
            data.ApiUser.query().where(queryData).then(function(users){
                if(users&&users.length>0){
                    return res.json({returnCode:0,returnMsg:'查询用户成功！',data:users});
                }else {
                    return  res.json({returnCode:0,returnMsg:'查询用户为空！'});
                }
            }).catch(function(error){
                return res.json({returnCode:-1,returnMsg:'查询用户异常！'+error});
            })
            break;

        //查询用户信息
        case "/api/user/save":

            var user = req.body;
            if(user){
                new data.ApiUser(user).save().then(function(model) {
                    if(model){
                        new f().initUserFolder(model,function(result){
                            return res.json({returnCode:0,returnMsg:'创建用户成功！',data:model});
                        });

                    }else {
                        return res.json({returnCode:-1,returnMsg:'创建用户失败！'});
                    }
                }).catch(function(error){
                    return res.json({returnCode:-1,returnMsg:'创建用户异常！'+error});
                });
            }else {
                return res.json({returnCode:-1,returnMsg:'用户信息为空，创建失败！'});
            }



            break;

        default:
            res.json({userList:'',returnCode:-1,returnMsg:'没有对应的处理方法！'});
            break;
    }





}

