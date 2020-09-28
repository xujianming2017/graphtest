var Bookshelf = require('bookshelf').mysqlAuth;

module.exports = function() {
    var bookshelf = {};

    bookshelf.ApiUser = Bookshelf.Model.extend({
        tableName: 'user',
        modelFolder:function(){
            return this.hasMany(bookshelf.ApiUserFolder)
        }
    });

    bookshelf.ApiScenario = Bookshelf.Model.extend({
        tableName: 'scenario'
    });

    bookshelf.ApiFolder = Bookshelf.Model.extend({
        tableName: 'folder'

    });

    bookshelf.ApiUserFolder = Bookshelf.Model.extend({
        tableName: 'user_folder',
        user:function(){
            return this.belongsTo(bookshelf.ApiUser);
        },

    });

    bookshelf.ApiModel = Bookshelf.Model.extend({
        tableName: 'model'
    });

    bookshelf.ApiPath = Bookshelf.Model.extend({
        tableName: 'graph_path'
    });
    
    bookshelf.ApiResult = Bookshelf.Model.extend({
        tableName: 'invoke_result'
    });
    
    bookshelf.ApiVariable = Bookshelf.Model.extend({
        tableName: 'user_variable'
    });

    bookshelf.ApiResultDetail = Bookshelf.Model.extend({
        tableName: 'invoke_result_detail'
    });

    bookshelf.ApiVertexEdgeScript = Bookshelf.Model.extend({
        tableName: 'vertexedge_script'
    });

    bookshelf.ApiScenarioPath = Bookshelf.Model.extend({
        tableName: 'scenario_path'
    });

    bookshelf.ApiScenarioPathData = Bookshelf.Model.extend({
        tableName: 'scenario_path_data'
    });

    return bookshelf;
}
