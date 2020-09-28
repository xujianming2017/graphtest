var data = require('../models/auth')();
module.exports = FolderModel;
 function FolderModel(){

   //查找父节点的插入的顺序号码 weight
   this.nextWeight = function(parent,callback){
        //查询自定义条件
        data.ApiFolder.query(function(qb){
            qb.where("parent_id",parent.id);
            qb.orderBy('weight', 'asc')
        }).fetchAll().then(function(models){
            var weight=1;
            if(models){
                var lastFolder = models.pop();
                if(lastFolder){
                    weight = lastFolder.attributes.weight+1;
                }
            }
            callback(weight);
        }).catch(function(error){
            console.log("获取目录的节点顺序异常，请检查,"+error);
        });
    }

    //向父节点，添加子节点
     this.appendChild = function(parent,child,callback,t){
         var parentid_list =this.makeSelfAsNewParentIds(parent);
         var self = this;
         //找到顺序号码
         this.nextWeight(parent,function(weight){
            child.parent_id=parent.id;
            child.parentid_list=parentid_list;
            child.weight=weight;
            self.saveFolder(child,callback,t);
        });
    }

    //查询子节点
     this.findChildren = function(parent,type,callback){
         self=this;

        data.ApiFolder.query(function(qb){
            qb.where("parentid_list", 'like',self.makeSelfAsNewParentIds(parent)+'%');
            qb.where("type",'like',type+'%')
        }).fetchAll().then(function(models){
            callback(models);
        }).catch(function(error){
            console.log("获取目录的节点顺序异常，请检查,"+error);
        });

    }

     this.makeSelfAsNewParentIds = function(parent){
        return parent.attributes.parentid_list+parent.attributes.id+"/";
    }


    this.findUserFolder = function(user,callback){
        //查询用户的根目录
        var userId ;
        if(user.id){
            userId = user.id;
        }else{
            userId = user.get("id");
        }

        new data.ApiUserFolder({user_id:userId}).fetch().then(function(folderUser){
            if(folderUser){
                //查找用户的跟目录
                new data.ApiFolder({id:folderUser.get("folder_root_id")}).fetch().then(function(folder){
                    callback(folder);
                });
            }else {
                callback(null);
            }
        });
    }


    this.initUserFolder = function(user,callback){

        var folder = {};
        folder.folder_name = user.attributes.name+"的根目录";
        folder.folder_desc = "根目录，保存所有的测试资源信息，包括路径、场景";
        folder.parent_id = 0;
        folder.parentid_list = "0/";
        folder.weight = 0;
        folder.type = "root";

        //保存用户的资源根目录
        new data.ApiFolder(folder).save().then(function(folder){

            if(folder){
                //    初始化用例根目录及场景根目录
                var caseRootFolder = {};
                caseRootFolder.folder_name = user.attributes.name+"的路径根目录";
                caseRootFolder.folder_desc = "路径根目录，包括路径";
                caseRootFolder.parent_id = folder.attributes.id;
                caseRootFolder.parentid_list = folder.attributes.parentid_list+folder.attributes.id+"/";
                caseRootFolder.weight = 0;
                caseRootFolder.type = "case_root";
                new data.ApiFolder(caseRootFolder).save().catch(function(error){
                    console.log(user.attributes.name+"初始化目录异常："+error);
                });
                var caseScenarioFolder = {};
                caseScenarioFolder.folder_name = user.attributes.name+"的场景根目录";
                caseScenarioFolder.folder_desc = "场景根目录，保存场景";
                caseScenarioFolder.parent_id = folder.attributes.id;
                caseScenarioFolder.parentid_list = folder.attributes.parentid_list+folder.attributes.id+"/";
                caseScenarioFolder.weight = 0;
                caseScenarioFolder.type = "scenario_root";
                new data.ApiFolder(caseScenarioFolder).save().catch(function(error){

                    console.log(user.attributes.name+"初始化目录异常："+error);

                });

                //    保存根目录与用户的关系
                new data.ApiUserFolder({folder_root_id:folder.attributes.id,user_id:user.attributes.id}).save().then(function(folderUser){
                    if(folderUser){
                        console.log("用户与根目录的关系创建完成");
                        callback(folderUser);
                    }
                });
            }


        }).catch(function(error){
            callback(folderUser);
            console.log(user.attributes.name+"初始化目录异常："+error);

        });
    }


    this.saveFolder =function(folder,callback,t){
        var result = "" ;

        // new data.ApiFolder().save(folder,{ transacting: t }).then(function(folder){
         data.ApiFolder.forge(folder).save().then(function(folder){
            if(folder){
                result = {returnCode:0,returnMsg:folder};
            }else {
                result = {returnCode:-1,returnMsg:'根据id:'+folder.id+'找不到测试场景，查询失败！'};
            }
            callback(result);
        }).catch(function(error){
            result = {returnCode:-1,returnMsg:error};
            callback(result);
        });
    }

}


