var Fiber = require('fibers');

var asyncUtil = require('../async-test1-execTrans.js');

exports.selectElement = function(paramsArray) {
    // 数组实例深拷贝，返回一个新的数组实例，但对于数组中的对象元素却没有执行深复制，而只是复制了引用，并不是真正的深复制
    // 直接使用paramsArray仍然会是同一个对象，会出现回调函数中只使用最后一次paramsArray对象
    let paramArrayLocal = paramsArray.slice();
    console.log("==== select.selectElement before ==== exe_step_order:" + paramsArray[0]
        + " " + paramsArray[1].toString().split(" ")[1].split("{")[0]
        + " " + paramArrayLocal[1].toString().split(" ")[1].split("{")[0] );
    var sql = "SELECT ol.`select_string` FROM `object_lib` ol WHERE ol.`assembly_script_id` = 1 AND ol.`order` = ? ORDER BY id ASC";
    var param = [paramsArray[0]];
    var sqlParamsEntity = asyncUtil.getNewSqlParamEntity(sql, param);

    asyncUtil.execQuerySingle(sqlParamsEntity, function(err, selects){
        if(err){
            console.error("查询数据库失败");
        }else{
            if(selects != undefined && typeof selects !== 'undefined' && selects.length > 0){
                for (let i=0; i<1; i++){
                    let select= selects[i];
                    var byStr = select.select_string;
                    console.log("==== select.selectElement    exe_step_order:" + paramArrayLocal[0]
                        + " " + paramsArray[1].toString().split(" ")[1].split("{")[0]
                        + " " + paramArrayLocal[1].toString().split(" ")[1].split("{")[0]
                        + " query database. select_string:" + byStr);
                    var userName = driver.findElement(eval(byStr));
                    if(paramArrayLocal.length >= 2 && typeof paramArrayLocal[1] == "function"){
                        paramArrayLocal[1](userName);
                    }
                }
                //selects.forEach(function (select) { });
            } else {

            }
        }
    });

};


