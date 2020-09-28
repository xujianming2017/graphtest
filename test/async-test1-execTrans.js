var mysql = require('mysql');
var async = require("async");

module.exports = {
    execTrans: execTrans,
    getNewSqlParamEntity: getNewSqlParamEntity,
    execQuerySingle: execQuerySingle,
    execQuerySeries: execQuerySeries
}

var pool = mysql.createPool({
    host     : 'localhost',
    user     : 'mysql',
    password : 'mysql',
    database : 'jd_auto_test',
    connectionLimit: 10,
    port: "3306",
    waitForConnections: false
});

function execTrans(sqlParamsEntities, callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            return callback(err, null);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                return callback(err, null);
            }
            console.log("   开始执行transaction，共执行" + sqlParamsEntities.length + "条数据");
            var funcAry = [];
            sqlParamsEntities.forEach(function (sql_param) {
                var temp = function (cb) {
                    var sql = sql_param.sql;
                    var param = sql_param.params;
                    var sql1 = mysql.format(sql, param);
                    console.log("   sql0:" + sql);
                    console.log("   sql1:" + sql1);
                    connection.query(sql, param, function (tErr, rows, fields) {
                        if (tErr) {
                            connection.rollback(function () {
                                console.log("事务失败，" + sql_param + "，ERROR：" + tErr);
                                throw tErr;
                            });
                        } else {
                            return cb(null, 'ok');
                        }
                    })
                };
                funcAry.push(temp);
            });

            async.series(funcAry, function (err, result) {
                if (err) {
                    connection.rollback(function (err) {
                        console.log("   transaction error: " + err);
                        connection.release();
                        return callback(err, null);
                    });
                } else {
                    connection.commit(function (err, info) {
                        console.log("transaction info: " + JSON.stringify(info));
                        if (err) {
                            console.log("执行事务失败，" + err);
                            connection.rollback(function (err) {
                                console.log("   transaction error: " + err);
                                connection.release();
                                return callback(err, null);
                            });
                        } else {
                            connection.release();
                            return callback(null, info);
                        }
                    })
                }
            })
        });
    });
}

function execQuerySingle(sqlParamsEntity, callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            return callback(err, null);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                return callback(err, null);
            }
            console.log("   开始执行单个查询sql");
            var func = function (cb) {
                var sql = sqlParamsEntity.sql;
                var param = sqlParamsEntity.params;
                var sql1 = mysql.format(sql, param);
                console.log("   sql1:" + sql1);
                connection.query(sql, param, function (tErr, rows, fields) {
                    if (tErr) {
                        connection.rollback(function () {
                            console.log("查询失败，" + sql_param + "，ERROR：" + tErr);
                            throw tErr;
                        });
                    } else {
                        return cb(null, rows);
                    }
                })
            };
            var funcAry = [];
            funcAry.push(func);

            async.series(funcAry, function (err, results) {
                if (err) {
                    connection.rollback(function (err) {
                        console.log("   transaction error: " + err);
                        connection.release();
                        return callback(err, null);
                    });
                } else {
                    return callback(null, results[0]);
                }
            })
        });
    });
}

function execQuerySeries(sqlParamsEntities, callback) {
    pool.getConnection(function (err, connection) {
        if (err) {
            return callback(err, null);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                return callback(err, null);
            }
            console.log("   开始执行" + sqlParamsEntities.length + "个查询sql");
            var funcAry = [];
            sqlParamsEntities.forEach(function (sql_param) {
                var temp = function (cb) {
                    var sql = sql_param.sql;
                    var param = sql_param.params;
                    var sql1 = mysql.format(sql, param);
                    console.log("   sql1:" + sql1);
                    connection.query(sql, param, function (tErr, rows, fields) {
                        if (tErr) {
                            connection.rollback(function () {
                                console.log("查询失败，" + sql_param + "，ERROR：" + tErr);
                                throw tErr;
                            });
                        } else {
                            return cb(null, rows);
                        }
                    })
                };
                funcAry.push(temp);
            });

            async.series(funcAry, function (err, results) {
                if (err) {
                    connection.rollback(function (err) {
                        console.log("   transaction error: " + err);
                        connection.release();
                        return callback(err, null);
                    });
                } else {
                     return callback(null, results);
                }
            })
        });
    });
}


function getNewSqlParamEntity(sql, params, callback) {
    if (callback) {
        return callback(null, {
            sql: sql,
            params: params
        });
    }
    return {
        sql: sql,
        params: params
    };
}