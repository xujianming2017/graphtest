

var config;
try {
    config = require('../config/app.dev.conf.js');
} catch(e) {
    try {
        // 生产环境配置文件
        config = require('../config/app.conf.js');
    } catch(e) {
        console.log('启动失败，没有配置文件可以读取！');
    }
}

module.exports = config;