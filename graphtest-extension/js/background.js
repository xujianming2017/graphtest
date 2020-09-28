var GRAPHTESTAPI = 'http://localhost:9527/api/model/scriptservice';
var SERVERHOST = 'localhost';
var ENABLE_ICON1 = 'img/icon.png';
var ENABLE_ICON2 = 'img/icon-record.png';
var DISABLE_ICON = 'img/icon-disable.png';

var isWorking = true;
var workIcon = 1;
var workIconTimer = null;
var recordConfig = null;
var isModuleLoading = false;
var resultVE;
var seq=0;
var curWindowId;
var befWindowId;
var windowId;

var activeEdge='';
var activeVetex='';
var activeModel='';

// i18n
var i18n = {};
var __ = function(str){
    var args = arguments;
    str = i18n[str] || str;
    var count = 0;
    str = str.replace(/%s/g, function(){
        count ++;
        return args[count] || '';
    });
    return str;
};

// Global events port
var mapGlobalEvents = {};
var GlobalEvents = {
    on: function(type, handler){
        var arrEvents = mapGlobalEvents[type] || [];
        arrEvents.push(handler);
        mapGlobalEvents[type] = arrEvents;
    },
    emit: function(type, data){
        sendGlobalEvents({
            type: type,
            data: data
        });
    },
    _emit: function(type, data){
        var arrEvents = mapGlobalEvents[type] || [];
        arrEvents.forEach(function(handler){
            handler(data);
        });
    }
};
var mapPorts = {};
var maxPortId = 0;
chrome.extension.onConnect.addListener(function(port) {
	console.log('step into extension connect');
    var portId = maxPortId++;
    mapPorts[portId] = port;
    port.onMessage.addListener(sendGlobalEvents);
    port.onDisconnect.addListener(function(port){
        delete mapPorts[portId];
    });
});

function postJSON(url,data,sendResponse){
	//console.log('url : ' + url);
	//console.log('data : ' + data);
	var request = new XMLHttpRequest();
	request.open("POST",url);
	request.onreadystatechange = function(){
		if(request.readyState===4 && request.status===200){
			var type = request.getResponseHeader("Content-Type");
			if(type.indexOf("xml") !== -1 && request.responseXML)
				sendResponse(request.responseXML);
			else if (type === "application/json")
				sendResponse(request.responseText);
			else
				sendResponse(request.responseText);
		}
	};
	//data={"modelId":"13"};
	request.setRequestHeader("Content-Type","application/json");
	request.send(JSON.stringify(data));
}

function sendGlobalEvents(msg){
    GlobalEvents._emit(msg.type, msg.data);
    for(var portId in mapPorts){
        mapPorts[portId].postMessage(msg);
    }
}

function sendRestMessage(url,type,data){
	var message = {
		type: type,
        data: data
    };
	postJSON(url,message,function getResult(response){
		//console.log('response : ' + response);
	});
}

// set recorder work status
function setRecorderWork(enable){
    isWorking = enable;
    if(isWorking){
        chrome.browserAction.setTitle({title: __('icon_record_tip')});
        chrome.browserAction.setIcon({path: workIcon===1?ENABLE_ICON1:ENABLE_ICON2});
        workIcon *= -1;
        workIconTimer = setTimeout(function(){
            setRecorderWork(true);
        }, 1000);
    }
    else{
        clearTimeout(workIconTimer);
        chrome.browserAction.setTitle({title: __('icon_end_tip')});
        chrome.browserAction.setIcon({path: DISABLE_ICON});
    }
}

var arrTasks = [];
var lastWindow = null;
var allKeyMap = {};
var allMouseMap = {};
var beforeUnloadCmdInfo = null;
// save recoreded command
function saveCommand(windowId, frame, cmd, data, seq, edge, model, locate){
    if(isModuleLoading){
        return;
    }
    var cmdInfo = {
        window: windowId,
        frame: frame,
        cmd: cmd,
        data: data,
        fix: false,
		seq:seq,
		edge:edge,
		model:model,
		locate:locate
    };

    switch(cmd){
        case 'keyDown':
            allKeyMap[data.character] = cmdInfo;
            break;
        case 'keyUp':
            delete allKeyMap[data.character];
            break;
        case 'mouseDown':
            allMouseMap[data.button] = cmdInfo;
            break;
        case 'mouseUp':
            delete allMouseMap[data.button];
            break;
        case 'beforeUnload':
            cmdInfo.cmd = 'acceptAlert';
            beforeUnloadCmdInfo = cmdInfo;
            return;
            break;
        case 'cancelBeforeUnload':
            beforeUnloadCmdInfo = null;
            cmdInfo.cmd = 'dismissAlert';
            break;
    }

    if(beforeUnloadCmdInfo){
        execNextCommand(beforeUnloadCmdInfo);
        beforeUnloadCmdInfo = null;
    }

    checkLostKey(windowId);

    execNextCommand(cmdInfo);
}

// 补足丢失的事件
function checkLostKey(windowId){
    if(windowId !== lastWindow){
        var cmdInfo;
        for(var key in allKeyMap){
            cmdInfo = allKeyMap[key];
            execNextCommand({
                window: cmdInfo.window,
                frame: cmdInfo.frame,
                cmd: 'keyUp',
                data: cmdInfo.data,
                fix: true
            });
        }
        allKeyMap = {};
        for(var button in allMouseMap){
            cmdInfo = allMouseMap[button];
            execNextCommand({
                window: cmdInfo.window,
                frame: cmdInfo.frame,
                cmd: 'mouseUp',
                data: cmdInfo.data,
                fix: true
            });
        }
        allMouseMap = {};
        lastWindow = windowId;
    }
}

var isRunning = false;
function execNextCommand(newCmdInfo){
    if(newCmdInfo){
        arrTasks.push(newCmdInfo);
    }
    if(arrTasks.length > 0 && isRunning === false){
        var cmdInfo = arrTasks.shift();		
        console.log('cmdInfo: { window: '+cmdInfo.window+', frame: '+cmdInfo.frame+', cmd: '+cmdInfo.cmd+ ', data:', JSON.stringify(cmdInfo.data) + ', fix: '+cmdInfo.fix+ ', model: '+cmdInfo.model+ ', edge: '+cmdInfo.edge + ', locate: '+JSON.stringify(cmdInfo.locate) + ', seq: ' + cmdInfo.seq + ' }');
        isRunning = true;
        //sendWsMessage('saveCmd', cmdInfo);
		sendRestMessage(GRAPHTESTAPI,'record',cmdInfo);
        setTimeout(function(){
            isRunning = false;
            execNextCommand();
        }, 200);
    }
}

// manage window id
var arrWindows = [];
function getWindowId(tabId){
    for(var i=0,len=arrWindows.length;i<len;i++){
        if(arrWindows[i] === tabId){
            return i;
        }
    }
    return -1;
}
function addWindowId(tabId){
    arrWindows.push(tabId);
    var windowId = arrWindows.length -1;
    checkLostKey(windowId);
    console.log('newWindow { id: '+ windowId + ' }');
    return windowId;
}

function delWindowId(tabId){
    var windowId = getWindowId(tabId);
    if(windowId !== -1){
        arrWindows.splice(windowId, 1);
        console.log('closeWindow: { id: '+ windowId + ' }');
    }
}

// catch incognito window
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (!tab.incognito && isWorking) {
		console.log('tabId: '+ tabId);
        var windowId = getWindowId(tabId);
        if(windowId === -1){
            windowId = addWindowId(tabId);
        }
    }
});

// catch url
chrome.webNavigation.onCommitted.addListener(function(navInfo){
    if(isWorking){
        var tabId = navInfo.tabId;
        var type = navInfo.transitionType;
        var url = navInfo.url;
        var windowId = getWindowId(tabId);
        if(windowId !== -1 && /^(typed|reload|auto_bookmark)$/.test(type) && /^https?:\/\//.test(url)){
            checkLostKey(-1);
            saveCommand(windowId, null, 'url', {
                url: url
            });
        }
    }
});

// catch window close
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){
    var windowId = getWindowId(tabId);
    if(windowId !== -1){
        delWindowId(tabId);
        if(windowId !== 0 ){
            saveCommand(windowId, null, 'closeWindow');
        }
    }
    if(arrWindows.length === 0){
        setRecorderWork(false);
    }
});

// catch current window events
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	console.log('isWorking current : ' + isWorking);
	var data = {};
	data.userId = request.user;
	data.modelId = request.model;	
	data.vertexedge = request.vetexedge;
	data.varName = request.varname;
	console.log('data : ' + JSON.stringify(data));
	if(request.type=='start'){
		seq=0;
		console.log('step into background start recorder');
		startRecorder();
		console.log('isWorking after start: ' + isWorking);
		return true;
	}
	if(request.type=='getModel'){	
		postJSON("http://localhost:9527/storage",data,sendResponse);	
	}
	if(request.type=='getVetexEdge'){	
		postJSON('http://' + SERVERHOST + ':3333/api/model/getVetexEdge',data,sendResponse);	
	}
	if(request.type=='getVetexScript'){
		data.type='vertex';
		postJSON('http://' + SERVERHOST + ':3333/api/vertexedge/script',data,sendResponse);	
	}
	if(request.type=='setVetexScript'){
		data.type='vertex';
		data.scriptContent=request.vetexscript;		
		postJSON('http://' + SERVERHOST + ':3333/api/vertexedge/script/update',data,sendResponse);	
	}
	if(request.type=='showBackVetexEdge'){
		console.log('activeEdge and activeVetex in showBackEdge : ' + activeEdge + ',' + activeVetex);
		var data1 ={'edge':activeEdge,'vetex':activeVetex};
		
		return sendResponse(data1);
	}	
	if(request.type=='createVetexScript'){
		data.type='vertex';
		data.scriptContent=request.vetexscript;
		
		postJSON('http://' + SERVERHOST + ':3333/api/vertexedge/script/create',data,sendResponse);	
	}	
	if(request.type=='updateEdge'){
		if(request.edge){
			console.log('update activeEdge in background');
			console.log('activeEdge before update: ' + activeEdge);
			activeEdge=request.edge;
			console.log('activeEdge after update : ' + activeEdge);
		}			
	}
	if(request.type=='updateVetex'){
		if(request.vetex){
			console.log('update activeVetex in background');
			console.log('activeVetex before update: ' + activeVetex);
			activeVetex=request.vetex;
			console.log('activeVetex after update : ' + activeVetex);
		}		
	}	
	if(request.type=='updateModel'){
		if(request.model){
			console.log('update model in background');
			console.log('activeModel : ' + activeModel);
			activeModel=request.model;
		}		
	}
	if(request.type=='getEdgeScript'){
		data.type='edge';		
		postJSON('http://' + SERVERHOST + ':3333/api/vertexedge/script',data,sendResponse);	
	}
	if(request.type=='getUserVarNameList'){
		postJSON('http://' + SERVERHOST + ':3333/api/variable/getUserVarNameList',data,sendResponse);	
	}
	if(request.type=='getVarValue'){
		postJSON('http://' + SERVERHOST + ':3333/api/variable/getVarValue',data,sendResponse);	
	}
	if(request.type=='setEdgeScript'){
		data.type='edge';
		data.scriptContent=request.edgescript;
		
		postJSON('http://' + SERVERHOST + ':3333/api/vertexedge/script/update',data,sendResponse);	
	}
	if(request.type=='createEdgeScript'){
		data.type='edge';
		data.scriptContent=request.edgescript;
		
		postJSON('http://' + SERVERHOST + ':3333/api/vertexedge/script/create',data,sendResponse);	
	}
    if(isWorking && sender && sender.tab){
        var tabId = sender.tab.id;
		befWindowId = windowId;
        windowId = getWindowId(tabId);
		curWindowId = windowId;
		/*
		if(curWindowId!==befWindowId){
			seq = seq;
		}else{
			if(data.cmd=='mouseDown'){
				seq=seq+1;
			}
		}
		*/
		console.log('windowId : ' + windowId);
		console.log('request.type : ' + request.type);
		if(request.type=='end'){
			console.log('step into background end recorder');
            endRecorder();
			console.log('isWorking after end : ' + isWorking);
			return true;
		}
        if(windowId !== -1){
            chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
                if(tabs.length > 0 && tabId === tabs[0].id){
                    var type = request.type;
					console.log('type : ' + type);
                    var data = request.data;					
                    switch(type){
                        case 'end':
							seq=0;
							console('step into background end recorder');
                            endRecorder();
                            break;
                        case 'getConfig':
                            sendResponse(recordConfig);
                            break;
                        case 'command':
							if(data.cmd=='mouseDown' && data.data.path!== ''){
								seq=seq+1;
							}														
							console.log('frame : ' + data.frame + ', ' + 'cmd : ' + data.cmd + ', data : ' + JSON.stringify(data.data) + ', seq : ' + seq + ', edge : ' + activeEdge+ ', model : ' + activeModel + ', locate : ' + data.locate);
                            saveCommand(windowId, data.frame, data.cmd, data.data, seq, activeEdge, activeModel, data.locate);
                            break;

                    }
                }
            });
            return true;
        }
    }
});

// on action clicked
chrome.browserAction.onClicked.addListener(function(tab){
    if(isWorking){
        endRecorder();
    }
    else{
        startRecorder();
    }
});

// on windows removed
chrome.windows.onRemoved.addListener(function(){
    endRecorder();
})

// end recorder
function endRecorder(){
    setRecorderWork(false);
    //sendWsMessage('end');
}

//start graphtest recorder
function startRecorder(){
	setRecorderWork(true);
	//sendWsMessage('start');
}

chrome.tabs.query({active: true, currentWindow: true},function(tabs) {
	console.log("tab id : " + tabs[0].id);
	chrome.tabs.sendRequest(tabs[0].id,{},function(response){		
		//console.log(response.farewell);
    });
	console.log('send message to content script success');
});

setRecorderWork(true);