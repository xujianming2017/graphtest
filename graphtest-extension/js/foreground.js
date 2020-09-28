(function(){
    var isIframe = self !== top;	
    var isRecording = false;
    var isStopEvent = false;
    var isBodyReady = false;
    var isOnload = false;

    // dom selector
    var divDomSelector = null;
    var lastSelectDom = null;
    var domSelectorCallback = null;
    var spanShowDomPath = null;
    var expectGetValueCallback = null;

    // 全局配置
    var arrPathAttrs = ['data-id', 'data-name', 'type', 'data-type', 'data-role', 'data-value'];
    var reAttrValueBlack = /^$/;
	var testVars = {};
	
	//智能修复
	//var seq=0;
	var locate={};
	
	var vetexscript;
	var edgescript;
	var scriptcontent;
	var befVetexScriptContent;
	
	//获取模型相关的顶点与边
	var vetexesResult;
	var edgesResult;
	var activeUser;
	var activeModel;
	var activeEdge;
	var activeVetex;
	var varName;
	
	var variablesResult;
	
	function myrefresh(){
       window.location.reload();
	}
	
	//cookie操作
	function getCookie(cName){
		var cookieString = document.cookie;
		var cookieArray = cookieString.split("; ");
		for(var i = 0; i < cookieArray.length; i++){
			var cookieNum = cookieArray[i].split("=");
			var cookieName = cookieNum[0];
			var cookieValue = cookieNum[1];
			if(cookieName == cName){
				return cookieValue;
			}
		}
		return false;
	}

	function setCookie(name,value,expires,path,domain,secure){
		document.cookie=name+"="+encodeURI(value)+
		((expires) ? "; expires=" + expires : "")+
		((path) ? "; path=" + path : "")+
		((domain) ? "; domain=" + domain : "")+
		((secure) ? "; secure=" + secure : "");
	}
	
	chrome.runtime.sendMessage({
        type: 'getModel'
    },function(response){
		console.log("getModel response : " + response);
		var jsonResult = JSON.parse(response);
		activeModel=jsonResult.modelId;
		activeModelName = jsonResult.modelName;
		activeUser=jsonResult.userId;
		chrome.runtime.sendMessage({
			type: 'getVetexEdge',
			model: activeModel
		},function(response){
			console.log("getVetexEdge response : " + response);
			var jsonResult = JSON.parse(response);
			vetexesResult=jsonResult.vetexes;
			edgesResult=jsonResult.edges;  
		});
	});	
	
	// 模型配置
	var modelId = new Array();
	
	//本地存储localStorage
	function set(key,value){
		localStorage.setItem(key,value);
	}
	
	function get(key){
		var val = localStorage.getItem(key);
		return val;
	}	
	
	//接收背景页消息
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		console.log(sender.tab?"from a content script:" + sender.tab.url : "from the extension");
		if (request.greeting == "hello")  
			sendResponse({farewell: "goodbye"});
	});

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

    // 全局事件
    var mapGlobalEvents = {};
    var eventPort = chrome.extension.connect();
    var GlobalEvents = {
        on: function(type, handler){
            var arrEvents = mapGlobalEvents[type] || [];
            arrEvents.push(handler);
            mapGlobalEvents[type] = arrEvents;
        },
        emit: function(type, data){
            eventPort.postMessage({
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
    eventPort.onMessage.addListener(function(msg) {
        GlobalEvents._emit(msg.type, msg.data);
    });

    var reHoverClass = /(^|[^a-z0-9])(on)?(hover|hovered|over|active|current|focus|focused)([^a-z0-9]|$)/i;
	
	//select下拉框增删改操作	
	function jsSelectIsExitItem(objSelect, objItemValue) {        
		var isExit = false;        
		for (var i = 0; i < objSelect.options.length; i++) {        
			if (objSelect.options[i].value == objItemValue) {        
				isExit = true;        
				break;        
			}        
		}        
		return isExit;        
	}          
	
	function jsAddItemToSelect(objSelect, objItemText, objItemValue) {        
		//判断是否存在        
		if (jsSelectIsExitItem(objSelect, objItemValue)) {        
			console.log("该Item的Value值已经存在");        
		} else {        
			var varItem = new Option(objItemText, objItemValue);      
			objSelect.options.add(varItem);     
			//alert("成功加入");     
		}        
	}
	
	function jsBatchAddItemToSelect(objSelect,objItemTexts){
		//var objItemArray=objItemTexts.split(",");
		var objItemArray=objItemTexts;		
		if(objItemArray instanceof Array && objItemArray.length>0){
			for(var i=0,len=objItemArray.length;i<len;i++){
				if (jsSelectIsExitItem(objSelect, objItemArray[i])) {        
					console.log("该Item的Value值已经存在");        
				} else {        
					//var varItem = new Option(objItemArray[i], i);
					var varItem = new Option(objItemArray[i], objItemArray[i]);					
					objSelect.options.add(varItem);    
				}  
			}
		}		
	}
	
	function jsBatchAddItemToSelectSplitByComma(objSelect,objItemTexts){
		var objItemArray=objItemTexts.split(",");
		//var objItemArray=objItemTexts;		
		if(objItemArray instanceof Array && objItemArray.length>0){
			for(var i=0,len=objItemArray.length;i<len;i++){
				if (jsSelectIsExitItem(objSelect, objItemArray[i])) {        
					console.log("该Item的Value值已经存在");        
				} else {        
					//var varItem = new Option(objItemArray[i], i);
					var varItem = new Option(objItemArray[i], objItemArray[i]);					
					objSelect.options.add(varItem);    
				}  
			}
		}		
	}

    // get selector path
    function getDomPath(target){
        var relativeNode = target.ownerDocument, relativePath = '';
		var tempPath;
        var tagName = target.nodeName.toLowerCase();        
        var idValue = target.getAttribute && target.getAttribute('id');
        var nameValue = target.getAttribute && target.getAttribute('name');
		var className = target.getAttribute && target.getAttribute('class');
        var typeValue = target.getAttribute && target.getAttribute('type');
        var valueValue = target.getAttribute && target.getAttribute('value');
		//console.log("id: " + idValue);
        //console.log("name: " + nameValue);
        //console.log("type: " + typeValue);
        //console.log("value: " + valueValue);
		if(idValue && reAttrValueBlack.test(idValue) === false && checkUniqueSelector(relativeNode, '#'+idValue)){
			locate.id=idValue;
		}
		if(nameValue && reAttrValueBlack.test(nameValue) === false && checkUniqueSelector(relativeNode, '*[name='+nameValue+']')){
			locate.name=nameValue;
		}
		if(className && reAttrValueBlack.test(className) === false && checkUniqueSelector(relativeNode, '.'+className)){
			locate.class=className;
		}
        // 检查目标元素自身是否有唯一id
        if(idValue && reAttrValueBlack.test(idValue) === false && checkUniqueSelector(relativeNode, '#'+idValue)){
            // id定位
			//console.log('id locate path : ' + '#' + idValue);
			
			//console.log('locate : ' + JSON.stringify(locate));
            return '#'+idValue;
        }
        else if(tagName === 'input'){
            // 表单项特殊校验
            tempPath = nameValue ? tagName + '[name="'+nameValue+'"]' : tagName;
            switch(typeValue){
                case 'radio':
                case 'checkbox':
                    tempPath += '[value="'+valueValue+'"]';
                    break;
            }
            tempPath += (childPath ? ' > ' + childPath : '');
            if(checkUniqueSelector(relativeNode, tempPath)){
				console.log('input locate path : ' + tempPath);
                return tempPath;
            }
        }
        else if(nameValue){
            // 非input，但有name值
            tempPath = tagName + '[name="'+nameValue+'"]'
            if(tempPath && reAttrValueBlack.test(nameValue) === false && checkUniqueSelector(relativeNode, tempPath)){
				console.log('not input,the name locate path : ' + tempPath);
                return tempPath;
            }
        }
        else{
            // 检查目标是否有父容器有唯一id
            var idNodeInfo = getClosestIdNode(target);
			//console.log('closest id node is : ' + idNodeInfo);
            if(idNodeInfo){
                relativeNode = idNodeInfo.node;
				//console.log('relativeNode : ' + relativeNode);
                relativePath = idNodeInfo.path + ' ';
				//console.log('relativePath : ' + relativePath);
            }
        }
        var current = target;
        var childPath = '';
        while(current !== null){
            if(current !== relativeNode){
                childPath = getSelectorElement(current, relativeNode, childPath);
                if(childPath.substr(0,1) === '!'){
					//console.log('relativePath plus childPath : ' + relativePath + childPath.substr(1));
                    return relativePath + childPath.substr(1);
                }
                current = current.parentNode;
            }
            else{
                current = null;
            }
        }
        return null;
    }
	
    // 读取最近的id唯一节点
    function getClosestIdNode(target){
        var current = target;
        var body = target.ownerDocument.body;
        while(current !== null){
            if(current.nodeName !== 'HTML'){
                var idValue = current.getAttribute && current.getAttribute('id');
                if(idValue && reAttrValueBlack.test(idValue) === false && checkUniqueSelector(body, '#'+idValue)){
                    return {
                        node: current,
                        path: '#'+idValue
                    };
                }
                current = current.parentNode;
            }
            else{
                current = null;
            }
        }
        return null;
    }
	
    // 获取节点CSS选择器
    function getSelectorElement(target, relativeNode, childPath){
        var tagName = target.nodeName.toLowerCase();
        var elementPath = tagName, tempPath;
        // 校验tagName是否能唯一定位
        tempPath = elementPath + (childPath ? ' > ' + childPath : '');
        if(checkUniqueSelector(relativeNode, tempPath)){
			//console.log('locate by tagName is : ' + '!' + tempPath);
            return '!' + tempPath;
        }
        // 校验class能否定位
        var relativeClass = null;
        var classValue = target.getAttribute && target.getAttribute('class');
        if(classValue){
            var arrClass = classValue.split(/\s+/);
            for(var i in arrClass){
                var className = arrClass[i];
                if(className && reHoverClass.test(className) === false){
                    tempPath = elementPath + '.'+arrClass[i] + (childPath ? ' > ' + childPath : '');
                    if(checkUniqueSelector(relativeNode, tempPath)){
						//console.log('locate by class is : ' + '!' + tempPath);
                        return '!' + tempPath;						
                    }
                    else{
                        // 无法绝对定位,再次测试是否可以在父节点中相对定位自身
                        var parent = target.parentNode;
                        if(parent){
                            var element = parent.querySelectorAll('.'+className);
                            if(element.length === 1){
                                relativeClass = className;
                            }
                        }
                    }
                }
            }
        }
        // 校验属性是否能定位
        var attrName, attrValue;
        for(var i in arrPathAttrs){
            attrName = arrPathAttrs[i];
            attrValue = target.getAttribute && target.getAttribute(attrName);
            if(attrValue && reAttrValueBlack.test(attrValue) === false){
                elementPath += '['+attrName+'="'+attrValue+'"]';
                tempPath = elementPath + (childPath ? ' > ' + childPath : '');
                if(checkUniqueSelector(relativeNode, tempPath)){
					//console.log('locate by attributes is : ' + '!' + tempPath);
                    return '!' + tempPath;
                }
            }
        }
        // 父元素定位
        if(relativeClass){ 
            elementPath += '.' + relativeClass;
        }
        else{
            var index = getChildIndex(target);
            if(index !== -1){
                elementPath += ':nth-child('+index+')';
            }
        }
        tempPath = elementPath + (childPath ? ' > ' + childPath : '');
        if(checkUniqueSelector(relativeNode, tempPath)){
			console.log('locate by parent is : ' + '!' + tempPath);
            return '!' + tempPath;
        }
        return tempPath;
    }
	
    function curCSS(elem, name){
        var curStyle = elem.currentStyle;
        var style = elem.style;
        return (curStyle && curStyle[name]) || (style && style[name]);
    }
	
    function isHidden(elem){
        return ( elem.offsetWidth === 0 && elem.offsetHeight === 0 ) || (curCSS( elem, "display" ) === "none");
    }
	
    function checkUniqueSelector(relativeNode, path){
        try{
            var elements = relativeNode.querySelectorAll(path);
            var count = 0;
            for(var i=0;i<elements.length;i++){
                if(!isHidden(elements[i]))count ++;
            }
            return count === 1;
        }
        catch(e){return false;}
    }
	
	function split(str){
		var strs=new Array();
		strs=str.split(",");
		return strs;
	}
	
    function getChildIndex(el){
        var index = -1;
        var parentNode = el.parentNode;
        if(parentNode){
            var childNodes = parentNode.childNodes;
            var total = 0;
            var node;
            for (var i = 0, len=childNodes.length; i < len; i++) {
                node = childNodes[i];
                if(node.nodeType === 1){
                    total++;
                    if ( node === el) {
                        index = total;
                    }
                }
            }
        }
        if(total === 1){
            index = -1;
        }
        return index;
    }

    function findDomPathElement(path){
        var elements = document.querySelectorAll(path);
        var newElements = [], element;
        for(var i=0;i<elements.length;i++){
            element = elements[i];
            if(!isHidden(element))newElements.push(element);
        }
        return newElements;
    }

    // get frame id
    function getFrameId(){
        var frame = null;
        if(isIframe){
            try{
                var frameElement = window.frameElement;
                if(frameElement !== null){
                    frame = getDomPath(frameElement);
                }
                else{
                    var parentFrames = parent.frames;
                    for(var i=0,len=parentFrames.length;i<len;i++){
                        if(parentFrames[i] === window){
                            frame = i;
                            break;
                        }
                    }
                }
            }
            catch(e){}
        }
        return frame;
    }

    // save command
    function saveCommand(cmd, data){
        var frameId = getFrameId();
		//console.log('frameId : ' + frameId);
		//console.log('model : ' + activeModel);
		//console.log('edge : ' + activeEdge);
		/*
		if(cmd=='mouseDown' && data.path!== ''){
			seq=seq+1;
		}
		*/
        var cmdData = {
            frame: frameId,
            cmd: cmd,
            data: data,
			edge: activeEdge,
			model:activeModel,
			locate:locate
        };
        if(typeof frameId === 'number'){
            parent.postMessage({
                type: 'uiRecorderFrameCommmand',
                data: cmdData
            }, '*');
        }
        else{
            chrome.runtime.sendMessage({
                type: 'command',
                data: cmdData
            });
        }
    }

    window.addEventListener('message', function(e){
        var data = e.data;
        var type = data && data.type;
        if(type === 'uiRecorderAlertCommand'){
            var cmdInfo = data.cmdInfo;
            saveCommand(cmdInfo.cmd, cmdInfo.data);
        }
        else if(type === 'uiRecorderFrameCommmand'){
            data = data.data;
            // fix frameId to path
            var frameWindow = window.frames[data.frame];
            var arrIframes = document.getElementsByTagName("iframe");
            var frameDom = null;
            for(var i =0, len = arrIframes.length;i<len;i++){
                frameDom = arrIframes[i];
                if(frameDom.contentWindow === frameWindow){
                    break;
                }
            }
            data.frame = getDomPath(frameDom);
            chrome.runtime.sendMessage({
                type: 'command',
                data: data
            });
        }
    }, true);

    function simulateMouseEvent(target, type, bubbles, cancelable, view, detail, screenX, screenY, clientX, clientY){
        try{
            var customEvent = document.createEvent("MouseEvents");
            customEvent.initMouseEvent(type, bubbles, cancelable, view, detail, screenX, screenY, clientX, clientY);
            target.dispatchEvent(customEvent);
        }
        catch(e){}
    }

    // 计算字节长度,中文两个字节
    function byteLen(text){
        var count = 0;
        for(var i=0,len=text.length;i<len;i++){
            char = text.charCodeAt(i);
            count += char > 255 ? 2 : 1;
        }
        return count;
    }

    // 从左边读取限制长度的字符串
    function leftstr(text, limit){
        var substr = '';
        var count = 0;
        var char;
        for(var i=0,len=text.length;i<len;i++){
            char = text.charCodeAt(i);
            substr += text.charAt(i);
            count += char > 255 ? 2 : 1;
            if(count >= limit){
                return substr;
            }
        }
        return substr;
    }

    function getTargetText(target){
        var nodeName = target.nodeName;
        var id = target.getAttribute('id');
        var text = '';
        if(nodeName === 'INPUT'){
            var type = target.getAttribute('type');
            switch(type){
                case 'button':
                case 'reset':
                case 'submit':
                    text = target.getAttribute('value');
                    break;
                default:
                    var parentNode = target.parentNode;
                    if(parentNode.nodeName === 'LABEL'){
                        text = parentNode.textContent;
                    }
                    else if(id){
                        var labelForElement = findDomPathElement('label[for="'+id+'"]');
                        if(labelForElement.length > 0){
                            text = labelForElement[0].textContent;
                        }
                        else{
                            text = target.getAttribute('name');
                        }
                    }
                    else{
                        text = target.getAttribute('name');
                    }
            }
        }
        else if(nodeName === 'SELECT'){
            text = target.getAttribute('name');
        }
        else{
            text = target.textContent;
        }
        text = text || '';
        text = text.replace(/\s*\r?\n\s*/g,' ');
        text = text.replace(/^\s+|\s+$/g, '');
        var textLen = byteLen(text);
        if(textLen <= 60){
            text = textLen > 20 ? leftstr(text, 20) + '...' : text;
        }
        else{
            text = '';
        }
        return text;
    }

    // 调整label为for的表单DOM,以增加PATH稳定性
    function getLabelTarget(target){
        var labelDom;
        if(target.nodeName !== 'INPUT'){
            if(target.nodeName === 'LABEL'){
                labelDom = target;
            }
            else if(target.parentNode.nodeName === 'LABEL'){
                labelDom = target.parentNode;
            }
        }
        if(labelDom){
            // label标签，替换为目标表单项
            var forValue = labelDom.getAttribute && labelDom.getAttribute('for');
            var labelTargets;
            if(forValue){
                // 有指定for
                labelTargets = findDomPathElement('#'+forValue);
                if(labelTargets.length === 1 && isDomVisible(labelTargets[0])){
                    return labelTargets[0];
                }
            }
            else{
                // 没有指定for
                labelTargets = labelDom.querySelectorAll('input');
                if(labelTargets.length === 1 && isDomVisible(labelTargets[0])){
                    return labelTargets[0];
                }
            }
        }
    }

    // 检测dom是否可见
    function isDomVisible(target){
        var offset = target.getBoundingClientRect();
        return offset.width > 0 && offset.height > 0;
    }

    // show loading
    var divLoading;
    function showLoading(){
        divLoading = document.createElement("div");
        divLoading.id = 'uirecorder-loading';
        divLoading.innerHTML = '<style>#uirecorder-loading{display:block;position:fixed;z-index:2147483647;left:0;top:0;width:100%;height:100%;}#uirecorder-loading div{z-index:0;background:#000;width:100%;height:100%;opacity:0.6}#uirecorder-loading span{z-index:1;position:fixed;top:50%;left:50%;margin-left:-80px;margin-top:-20px;color:white;font-size:30px;}</style><div></div><span>'+__('loading')+'</span>';
        document.body.appendChild(divLoading);
    }

    function onBodyReady(){
        if(isBodyReady === false){
            isBodyReady = true;
            //hookAlert();
            showLoading();
        }
    }

    function onLoad(){
        onBodyReady();
        isOnload = true;
        if(isIframe === false){
            saveCommand('waitBody');
        }
        if(isIframe && location.href === 'about:blank'){
            // 富文本延后初始化
            setTimeout(function(){
                initRecorderEvent();
                initRecorderDom();
                divLoading.style.display = 'none';
            }, 500);
        }
        else{
            initRecorderEvent();
            initRecorderDom();
            divLoading.style.display = 'none';
			
        }
    }

    function checkBodyReady(){
        var body = document.getElementsByTagName("body");
        if(body && body.length===1){
            onBodyReady();
        }
        else{
            setTimeout(checkBodyReady, 10);
        }
    }

    checkBodyReady();

    if(document.readyState === 'complete'){
        onLoad();
		console.log("load success");
    }
    else{
        window.addEventListener('load', onLoad, true);
    }

    // 工作模式变更
    GlobalEvents.on('modeChange', function(mode){
        switch(mode){
            case 'record':
                removeSelector();
                isRecording = true;
                isStopEvent = false;
                break;
            case 'pauseAll':
                removeSelector();
                isRecording = false;
                isStopEvent = true;
                break;
            case 'pauseRecord':
                removeSelector();
                isRecording = false;
                isStopEvent = false;
                break;
            case 'select':
                initDomSelecter();
                isRecording = false;
                isStopEvent = true;
        }
    });
	
    // 设置全局工作模式
    function setGlobalWorkMode(mode){
        GlobalEvents.emit('modeChange', mode);
    }
	
	// dom选择器hover事件
    GlobalEvents.on('selecterHover', function(event){
        var frameId = getFrameId();
		console.log('frameId : ' + frameId);
        if(frameId !== event.frame){
            // 清空选择器其余的iframe浮层
            divDomSelector.style.display = 'none';
        }
        if(isIframe === false){
            // 主窗口显示path路径
			console.log('event path : ' + event.path);
			//spanShowDomPath.innerHTML = event.path;			           
        }
    });
	
	 // 添加悬停命令
    GlobalEvents.on('addHover', function(event){
        var frameId = getFrameId();
        if(frameId === event.frame){
            var elements = findDomPathElement(event.path);
            if(elements.length === 1){
                var target = elements[0];
                GlobalEvents.emit('showDomPath', event.path);
                saveCommand('mouseMove', {
                    path: event.path,
                    text: getTargetText(target)
                });
                simulateMouseEvent(target, 'mouseover', true, true, null);
                simulateMouseEvent(target, 'mousemove', true, true, null, 1, event.screenX, event.screenY, event.clientX, event.clientY);
            }
        }
    });
	
	// 插入变量
    GlobalEvents.on('setVar', function(event){
        var frameId = getFrameId();
        if(frameId === event.frame){
            var path = event.path;
            var elements = findDomPathElement(path);
            if(elements.length === 1){
                var target = elements[0];
                target.focus();
				console.log('event varinfo : ' + JSON.stringify(event.varinfo));
                var varinfo = event.varinfo;
                target.value = varinfo.value;
				/*
                GlobalEvents.emit('showDomPath', path);
                saveCommand('setVar', {
                    path: path,
                    varinfo: varinfo,
                    text: getTargetText(target)
                });
				*/
            }
        }
    });
	
	// 添加断言命令
    GlobalEvents.on('addExpect', function(event){
        var frameId = getFrameId();
        if(frameId === event.frame){
			console.log('event data for addExpect : ' + JSON.stringify(event.data));
            saveCommand('expect', event.data);
        }
    });

    // 主窗口
    if(isIframe === false){
        // DOM选择器点击事件
        GlobalEvents.on('selecterClick', function(event){
            domSelectorCallback({
                frame: event.frame,
                path: event.path
            }, event.ctrlKey);
        });
        // 返回断言默认值
        GlobalEvents.on('returnExpectValue', function(value){
            expectGetValueCallback(value);
        });
        function getExpectValue(type, domInfo, param, callback){
            expectGetValueCallback = callback;
            GlobalEvents.emit('getExpectValue', {
                type: type,
                domInfo: domInfo,
                param: param
            });
        }
    }    
	
    // 初始化选择器
    function initDomSelecter(){
        divDomSelector = document.createElement("div");
        divDomSelector.id = 'uirecorder-selecter-mask';
        divDomSelector.className = 'uirecorder';
        divDomSelector.innerHTML = '<style>#uirecorder-selecter-mask{display:none;background:rgba(151, 232, 81,0.5);position:fixed;z-index:2147483647;}</style>';
        divDomSelector.addEventListener('click', function(event){
            event.stopPropagation();
            event.preventDefault();
            endDomSelector();
        });
        document.body.appendChild(divDomSelector);
    }

    // 显示当前hover的dom
    function showSelecterHover(clientX, clientY){
        divDomSelector.style.display = 'none';
        var newSelectDom = document.elementFromPoint(clientX, clientY);
        if(newSelectDom && isNotInToolsPannel(newSelectDom) && /^(HTML|IFRAME)$/i.test(newSelectDom.tagName) === false){
            divDomSelector.style.display = 'block';
            if(newSelectDom !== lastSelectDom){
                var rect = newSelectDom.getBoundingClientRect();
                divDomSelector.style.left = rect.left+'px';
                divDomSelector.style.top = rect.top+'px';
                divDomSelector.style.width = rect.width+'px';
                divDomSelector.style.height = rect.height+'px';
                var frameId = getFrameId();
                GlobalEvents.emit('selecterHover', {
                    frame: frameId,
                    path: getDomPath(newSelectDom)
                });
                lastSelectDom = newSelectDom;
            }
        }
    }

    // 结束DOM选择器
    function endDomSelector(){
        if(lastSelectDom !== null){
            var frameId = getFrameId();
            setGlobalWorkMode('pauseAll');
			console.log('path : ' + getDomPath(lastSelectDom));
            GlobalEvents.emit('selecterClick', {
                frame: frameId,
                path: getDomPath(lastSelectDom),
                ctrlKey: event.ctrlKey
            });
        }
    }

    // 清除dom选择器
    function removeSelector(){
        if(divDomSelector){
            document.body.removeChild(divDomSelector);
            divDomSelector = null;
        }
    }

    // 判断事件是否在工具面板
    function isNotInToolsPannel(target){
        while(target){
            if(/uirecorder/.test(target.className)){
                return false;
            }
            target = target.parentNode;
        }
        return true;
    }

    // 初始化事件
    function initRecorderEvent(){

        document.addEventListener('mousemove', function(event){
            var target = event.target;
            if(divDomSelector){
                event.stopPropagation();
                event.preventDefault();
                showSelecterHover(event.clientX, event.clientY);
            }
            else if(isNotInToolsPannel(target) && !isRecording && isStopEvent){
                event.stopPropagation();
                event.preventDefault();
            }
        }, true);

        document.addEventListener('mouseover', function(event){
            if(isNotInToolsPannel(event.target) && !isRecording && isStopEvent){
                event.stopPropagation();
                event.preventDefault();
            }
        }, true);

        document.addEventListener('mouseout', function(event){
            if(isNotInToolsPannel(event.target) && !isRecording && isStopEvent){
                event.stopPropagation();
                event.preventDefault();
            }
        }, true);

        document.addEventListener('dblclick', function(event){
            if(isNotInToolsPannel(event.target) && !isRecording && isStopEvent){
                event.stopPropagation();
                event.preventDefault();
            }
        }, true);
        // catch event
        document.addEventListener('mousedown', function(event){
			//console.log('mouse down,model : ' + activeModel);
			//console.log('mouse down,edge : ' + activeEdge);
			console.log('catch mouse down event');			
			console.log('selected edge : ' + $('#edge').find("option:selected").text());
			activeEdge = $('#edge').find("option:selected").text();			
			if(activeEdge){
				console.log('update background activeEdge');
				chrome.runtime.sendMessage({
					type: 'updateEdge',
					edge : activeEdge
				},function(response){
					console.log("response : " + response);					
				});
			}
            var target = event.target;
            if(isNotInToolsPannel(target)){
                if(isRecording){
                    if(/^(html|select|optgroup|option)$/i.test(target.tagName) === false && isFileInput(target) === false){
                        var labelTarget = getLabelTarget(target);
                        if(labelTarget){
                            target = labelTarget;
                        }
                        saveParentsOffset(target);
                        var path = getDomPath(target);
						//console.log('mousedown event path : ' + path);
                        if(path !== null){
                            var offset = target.getBoundingClientRect();
                            var x,y;
                            if(labelTarget){
                                x = Math.floor(offset.width / 2);
                                y = Math.floor(offset.height / 2);
                            }
                            else{
                                x = event.clientX-offset.left;
                                y = event.clientY-offset.top;
                            }
                            GlobalEvents.emit('showDomPath', path);
							console.log('send mouse down event to backend');
                            saveCommand('mouseDown', {
                                path: path,
                                x: x,
                                y: y,
                                button: event.button,
                                text: getTargetText(target),
								model:activeModel,
								edge:activeEdge
                            });
                        }
                    }
                }
                else if(isStopEvent){
                    event.stopPropagation();
                    event.preventDefault();
                }
            }
        }, true);

        document.addEventListener('mouseup', function(event){
            var target = event.target;
            if(isNotInToolsPannel(target)){
                if(isRecording){
                    var tagName = target.tagName;
                    if(/^(html|select|optgroup|option)$/i.test(tagName) === false && isFileInput(target) === false){
                        // get offset of the fixed parent
                        var labelTarget = getLabelTarget(target);
                        if(labelTarget){
                            target = labelTarget;
                        }
                        var fixedParent = getFixedParent(target);
                        if(fixedParent !== null){
                            var offset = target.getBoundingClientRect();
                            var x,y;
                            if(labelTarget){
                                x = Math.floor(offset.width / 2);
                                y = Math.floor(offset.height / 2);
                            }
                            else{
                                x = event.clientX-fixedParent.left;
                                y = event.clientY-fixedParent.top;
                            }
                            GlobalEvents.emit('showDomPath', fixedParent.path);
                            saveCommand('mouseUp', {
                                path: fixedParent.path,
                                x: x,
                                y: y,
                                button: event.button,
                                text: getTargetText(target),
								model:activeModel,
								edge:activeEdge
                            });
                        }
                    }
                }
                else if(isStopEvent){
                    event.stopPropagation();
                    event.preventDefault();
                }
            }
        }, true);
		
        // save all parents offset
        var mapParentsOffset = {};
        function saveParentsOffset(target){
            var documentElement = document.documentElement;
            mapParentsOffset = {};
            while(target !== null){
                var nodeName = target.nodeName.toLowerCase();
                var path = getDomPath(target);
                var rect = target.getBoundingClientRect();
                mapParentsOffset[path] = {
                    left: parseInt(rect.left, 10),
                    top: parseInt(rect.top, 10)
                };
                if(nodeName === 'html'){
                    target = null;
                }
                else{
                    target = target.parentNode;
                }
            }
        }

        // get the fixed offset parent
        function getFixedParent(target){
            var documentElement = document.documentElement;
            var node = target;
            var nodeName, path, offset, left, top, savedParent;
            while(node !== null){
                nodeName = node.nodeName.toLowerCase();
                path = getDomPath(node);
                if(path === null){
                    break;
                }
                offset = node.getBoundingClientRect();
                left = parseInt(offset.left, 10);
                top = parseInt(offset.top, 10);
                savedParent = mapParentsOffset[path];
                if(savedParent && left === savedParent.left && top === savedParent.top){
                    return {
                        path: path,
                        left: left,
                        top: top
                    };
                }
                if(nodeName === 'html'){
                    node = null;
                }
                else{
                    node = node.parentNode;
                }
            }
            path = getDomPath(target);
            if(path !== null){
                offset = target.getBoundingClientRect();
                return {
                    path: path,
                    left: offset.left,
                    top: offset.top
                };
            }
            else{
                return null;
            }
        }

        var modifierKeys = {
            17: 'CTRL', // Ctrl
            18: 'ALT', // Alt
            16: 'SHIFT', // Shift
            91: 'META' // Command/Meta
        };

        var NonTextKeys = {
            8: 'BACK_SPACE', // BACK_SPACE
            9: 'TAB', // TAB
            13: 'ENTER', // ENTER
            19: 'PAUSE', // PAUSE
            27: 'ESCAPE', // ESCAPE
            33: 'PAGE_UP', // PAGE_UP
            34: 'PAGE_DOWN', // PAGE_DOWN
            35: 'END', // END
            36: 'HOME', // HOME
            37: 'LEFT', // LEFT
            38: 'UP', // UP
            39: 'RIGHT', // RIGHT
            40: 'DOWN', // DOWN
            45: 'INSERT', // INSERT
            46: 'DELETE' // DELETE
        };

        // catch keydown event
        var lastModifierKeydown = null;
        var isModifierKeyRecord = false; // 是否记录控制键
        document.addEventListener('keydown', function(event){
            var target = event.target;
            if(isNotInToolsPannel(target)){
                var keyCode = event.keyCode;
                var modifierKey = modifierKeys[keyCode];
                var NonTextKey = NonTextKeys[keyCode];
                if(isRecording){
                    var stickModifierKey;
                    if(event.ctrlKey){
                        stickModifierKey = 'CTRL';
                    }
                    else if(event.altKey){
                        stickModifierKey = 'ALT';
                    }
                    else if(event.shiftKey){
                        stickModifierKey = 'SHIFT';
                    }
                    else if(event.metaKey){
                        stickModifierKey = 'META';
                    }
                    if(modifierKey){
                        // 控制键只触发一次keyDown
                        if(isModifierKeyRecord && modifierKey !== lastModifierKeydown){
                            lastModifierKeydown = modifierKey;
                            saveCommand('keyDown', {
                                character: modifierKey
                            });
                        }
                    }
                    else if(NonTextKey){
                        if(stickModifierKey && isModifierKeyRecord === false){
                            isModifierKeyRecord = true;
                            saveCommand('keyDown', {
                                character: stickModifierKey
                            });
                        }
                        saveCommand('sendKeys', {
                            keys: '{'+NonTextKey+'}'
                        });
                    }
                    else if(stickModifierKey === 'CTRL'){
                        var typedCharacter = String.fromCharCode(keyCode);
                        if(/^[azcxv]$/i.test(typedCharacter)){
                            if(isModifierKeyRecord === false){
                                isModifierKeyRecord = true;
                                saveCommand('keyDown', {
                                    character: stickModifierKey
                                });
                            }
                            saveCommand('sendKeys', {
                                keys: typedCharacter.toLowerCase()
                            });
                        }
                    }
                }
                else if(isStopEvent){
                    event.stopPropagation();
                    event.preventDefault();
                }
            }
        }, true);

        // catch keyup event
        document.addEventListener('keyup', function(event){
            var target= event.target;
            if(isNotInToolsPannel(target)){
                var modifierKey = modifierKeys[event.keyCode];
                if(isRecording){
                    if(isModifierKeyRecord && modifierKey){
                        isModifierKeyRecord = false;
                        lastModifierKeydown = null;
                        saveCommand('keyUp', {
                            character: modifierKey
                        });
                    }
                }
                else{
                    if(!isRecording && event.keyCode === 27){
                        setGlobalWorkMode('record');
                    }
                    if(isStopEvent){
                        event.stopPropagation();
                        event.preventDefault();
                    }
                }
            }
        }, true);

        // catch keypress event
        document.addEventListener('keypress', function(event){
            var target = event.target;
            if(isNotInToolsPannel(target) && /^(HTML|IFRAME)$/i.test(target.tagName) === false){
                if(isRecording){
                    var typedCharacter = String.fromCharCode(event.keyCode);
                    if(typedCharacter !== '' && /[\r\n]/.test(typedCharacter) === false){
						console.log('send keypress event to backend');
                        saveCommand('sendKeys', {
                            keys: typedCharacter
                        });
                    }
                }
                else if(isStopEvent){
                    event.stopPropagation();
                    event.preventDefault();
                }
            }
        }, true);

        document.addEventListener('compositionend', function(event){
            var target = event.target;
            if(isNotInToolsPannel(target)){
                if(isRecording){
					console.log('send compositioned event to backend');
                    saveCommand('sendKeys', {
                        keys:event.data
                    });
                }
                else if(isStopEvent){
                    event.stopPropagation();
                    event.preventDefault();
                }
            }
        }, true);

        var lastScroll = {};
        var scrollEventTimer = null;
        document.addEventListener('scroll', function(event){
            var target = event.target;
            if(isNotInToolsPannel(target)){
                if(isRecording){
                    var pageOffset = {
                        x: window.pageXOffset,
                        y: window.pageYOffset
                    };
                    if(pageOffset.x !== lastScroll.x || pageOffset.y !== lastScroll.y){
                        scrollEventTimer && clearTimeout(scrollEventTimer);
                        scrollEventTimer = setTimeout(function(){
                            saveCommand('scrollTo', pageOffset);
                        }, 500);
                        lastScroll = pageOffset;
                    }
                }
                else if(isStopEvent){
                    event.stopPropagation();
                    event.preventDefault();
                }
            }
        }, true);

        // catch file change
        function isFileInput(target){
            return target.tagName === 'INPUT' && target.getAttribute('type') === 'file';
        }
        document.addEventListener('change', function(event){
            var target = event.target;
            if(isNotInToolsPannel(target)){
                if(isRecording){
                    if(isFileInput(target)){
                        var path = getDomPath(target);
                        var filepath = target.value || '';
                        var match = filepath.match(/[^\\\/]+$/);
                        if(path !== null && match !== null){
                            GlobalEvents.emit('showDomPath', path);
                            saveCommand('uploadFile', {
                                path: path,
                                filename: match[0],
                                text: getTargetText(target)
                            });
                        }
                    }
                    else if(target.tagName === 'SELECT'){
                        if(isDomVisible(target)){
                            // no record invisible select
                            var path = getDomPath(target);
							console.log('SELECT path : ' + path);
                            if(path !== null){
                                var index = target.selectedIndex;
                                var option = target.options[index];
                                var value = option.getAttribute('value');
                                var type;
                                if(value){
                                    type = 'value';
                                }
                                else{
                                    type = 'index';
                                    value = index;
                                }
                                GlobalEvents.emit('showDomPath', path);
                                saveCommand('select', {
                                    path: path,
                                    type: type,
                                    value: value,
                                    text: getTargetText(target)
                                });
                            }
                        }
                    }
                }
                else if(isStopEvent){
                    event.stopPropagation();
                    event.preventDefault();
                }
            }
        }, true);
    }

    // 初始化dom
    function initRecorderDom(){
        var recorderLoaded = document.getElementById('uirecorderloaded');
        if(recorderLoaded){
            // 定时探测DOM是否被破坏
            setTimeout(initRecorderDom, 200);
            return;
        }

        // 加载探测
        recorderLoaded = document.createElement("span");
        recorderLoaded.id = 'uirecorderloaded';
        recorderLoaded.style.display = 'none';
        document.body.appendChild(recorderLoaded);

        // 初始化工具面板
        function initToolsPannel(){
            // tools pannel
            var baseUrl = chrome.extension.getURL("/");
			console.log('baseUrl : ' + baseUrl);
            var divDomToolsPannel = document.createElement("div");
            divDomToolsPannel.id = 'uirecorder-tools-pannel';
            divDomToolsPannel.className = 'uirecorder';
            var arrHTML = [                
                '<div><span class="uirecorder-button"><a name="graphtest-start">开始</a></span><span class="uirecorder-button"><a name="graphtest-end">结束</a></span><span>模型</span><span><select id="model"></select></span><span>页面</span><span><select id="vetex"></select></span><span class="uirecorder-button"><a name="node-edit">编辑</a></span><span>操作</span><span><select id="edge"></select></span><span class="uirecorder-button"><a name="edge-edit">编辑</a></span></div></n>',
				'<div><span class="uirecorder-button"><a name="uirecorder-expect"><img src="'+baseUrl+'img/expect.png" alt="">'+'添加断言'+'</a></span><span class="uirecorder-button"><a name="uirecorder-vars"><img src="'+baseUrl+'img/vars.png" alt="">'+'使用变量'+'</a></span>' + '</div>',
                '<style>#uirecorder-tools-pannel{position:fixed;z-index:2147483647;padding:20px;width:730px;box-sizing:border-box;border:1px solid #ccc;line-height:1;background:rgba(241,241,241,0.8);box-shadow: 5px 5px 10px #888888;bottom:10px;left:10px;cursor:move;}.uirecorder-button{cursor:pointer;margin: 8px;}.uirecorder-button a{text-decoration: none;color:#333333;font-family: arial, sans-serif;font-size: 13px;color: #777;text-shadow: 1px 1px 0px white;background: -webkit-linear-gradient(top, #ffffff 0%,#dfdfdf 100%);border-radius: 3px;box-shadow: 0 1px 3px 0px rgba(0,0,0,0.4);padding: 6px 12px;}.uirecorder-button a:hover{background: -webkit-linear-gradient(top, #ffffff 0%,#eee 100%);box-shadow: 0 1px 3px 0px rgba(0,0,0,0.4);}.uirecorder-button a:active{background: -webkit-linear-gradient(top, #dfdfdf 0%,#f1f1f1 100%);box-shadow: 0px 1px 1px 1px rgba(0,0,0,0.2) inset, 0px 1px 1px 0 rgba(255,255,255,1);}.uirecorder-button a img{padding-right: 8px;position: relative;top: 2px;vertical-align:baseline;}</style>'
            ];
			
            divDomToolsPannel.innerHTML = arrHTML.join('');			
            var diffX = 0, diffY =0;
            var isDrag = false, isMove = false;
            divDomToolsPannel.addEventListener('selectstart', function(event){
                event.stopPropagation();
                event.preventDefault();
            });
            function onMouseDown(event){
                var touchEvent = event.targetTouches ? event.targetTouches[0] : event;
                diffX = touchEvent.clientX - divDomToolsPannel.offsetLeft;
                diffY = touchEvent.clientY - divDomToolsPannel.offsetTop;
                isDrag = true;
            }
            divDomToolsPannel.addEventListener('mousedown', onMouseDown);
            divDomToolsPannel.addEventListener('touchstart', onMouseDown);
            function onMouseMove(event){
                var touchEvent = event.targetTouches ? event.targetTouches[0] : event;
                if(isDrag && touchEvent.clientX > 0 && touchEvent.clientY > 0){
                    isMove = true;
                    event.stopPropagation();
                    event.preventDefault();
                    divDomToolsPannel.style.left = touchEvent.clientX - diffX + 'px';
                    divDomToolsPannel.style.top = touchEvent.clientY - diffY + 'px';
                    divDomToolsPannel.style.bottom = 'auto';
                    divDomToolsPannel.style.right = 'auto';
                }
            }
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('touchmove', onMouseMove);
            function onMouseUp(event){
                if(isMove){
                    event.stopPropagation();
                    event.preventDefault();
                }
                isMove = false;
                isDrag = false;
            }
            divDomToolsPannel.addEventListener('mouseup', onMouseUp);
            divDomToolsPannel.addEventListener('touchend', onMouseUp);
            divDomToolsPannel.addEventListener('click', function(event){
                event.stopPropagation();
                event.preventDefault();
                var target = event.target;
                if(target.tagName === 'IMG'){
                    target = target.parentNode;
                }
                var name = target.name;
				//console.log('target.name : ' + name);
                switch(name){
					case 'node-edit':
						console.log('node edit');
						showNodeEditDailog();
						break;
					case 'edge-edit':
						//console.log('edge-edit');
						showEdgeEditDailog();
						break;
					case 'uirecorder-expect':
                        hideDialog();
                        showSelector(function(domInfo, requirePause){
                            showExpectDailog(domInfo, function(frameId, expectData){
                                GlobalEvents.emit('addExpect', {
                                    frame: frameId,
                                    data: expectData
                                })
                                setGlobalWorkMode(requirePause?'pauseAll':'record');
                            });
                        });
                        break;
					case 'uirecorder-vars':
                        hideDialog();
                        showSelector(function(domInfo, requirePause){
                            showVarsDailog(function(varInfo){								
								console.log('varInfo : ' + varInfo);
                                GlobalEvents.emit('setVar', {
                                    frame: domInfo.frame,
                                    path: domInfo.path,
                                    varinfo: varInfo
                                });								
								saveCommand('sendKeys', {
									keys: '$$' + varName + ''
								});
                                setGlobalWorkMode(requirePause?'pauseAll':'record');
                            });
                        });
                        break;
                    case 'graphtest-end':
						//seq=0;
						console.log('stop graphtest recorder');						
						setGlobalWorkMode('pauseRecord');
						//console.log('isRecording : ' + isRecording);
						//console.log('isStopEvent : ' + isStopEvent);
						chrome.runtime.sendMessage({
                            type: 'end'
                        });
						
                        break;
					case 'graphtest-start':
						//seq=0;
						console.log('start graphtest recorder');
						//removeSelector();
						//isRecording=true;
						//isStopEvent=false;
						setGlobalWorkMode('record');
						//console.log('isRecording : ' + isRecording);
						//console.log('isStopEvent : ' + isStopEvent);
						chrome.runtime.sendMessage({
                            type: 'start'
                        });
						myrefresh();
						break;
                }
            });
            function showSelector(callback){
                domSelectorCallback = callback;
                setGlobalWorkMode('select');
            }
            document.body.appendChild(divDomToolsPannel);
			
			// 对话框
            var divDomDialog = document.createElement("div");
            var okCallback = null;
            var cancelCallback = null;
            divDomDialog.id = 'uirecorder-dialog';
            divDomDialog.className = 'uirecorder';
            var arrHTML = [
                '<h2 id="uirecorder-dialog-title"></h2>',
                '<div id="uirecorder-dialog-content"></div>',
                '<div style="padding-bottom:10px;text-align:center;"><span class="uirecorder-button"><a name="uirecorder-ok"><img src="'+baseUrl+'img/ok.png" alt="">'+'更新'+'</a></span><span class="uirecorder-button"><a name="uirecorder-cancel"><img src="'+baseUrl+'img/cancel.png" alt="">'+'取消'+'</a></span></div>',
                '<style>#uirecorder-dialog{display:none;position:fixed;z-index:2147483647;padding:20px;top:50%;left:50%;width:480px;margin-left:-240px;margin-top:-160px;box-sizing:border-box;border:1px solid #ccc;background:rgba(241,241,241,1);box-shadow: 5px 5px 10px #888888;}#uirecorder-dialog h2{padding-bottom:10px;border-bottom: solid 1px #ccc;margin-bottom:10px;color:#333;}#uirecorder-dialog ul{list-style:none;padding:0;}#uirecorder-dialog li{padding: 5px 0 5px 30px;}#uirecorder-dialog li label{display:inline-block;width:100px;color:#666}#uirecorder-dialog li input,#uirecorder-dialog li select,#uirecorder-dialog li textarea{display:inline-block;font-size:16px;border:1px solid #ccc;border-radius:2px;padding:5px;}#uirecorder-dialog li input,#uirecorder-dialog li textarea{width:250px;}</style>'
            ];
            divDomDialog.innerHTML = arrHTML.join('');
            document.body.appendChild(divDomDialog);
            var domDialogTitle = document.getElementById('uirecorder-dialog-title');
            var domDialogContent = document.getElementById('uirecorder-dialog-content');
            divDomDialog.addEventListener('click', function(event){
                event.stopPropagation();
                event.preventDefault();
                var target = event.target;
                if(target.tagName === 'IMG'){
                    target = target.parentNode;
                }
                var name = target.name;
                switch(name){
                    case 'uirecorder-ok':
                        hideDialog();
                        okCallback();
                        break;
                    case 'uirecorder-cancel':
                        hideDialog();
                        cancelCallback();
                        break;
                }
            });
			//显示对话框
			function showDialog(title, content, events){
                domDialogTitle.innerHTML = title;
                domDialogContent.innerHTML = content;
                var onInit = events.onInit;
                if(onInit){
                    onInit();
                }
                okCallback = events.onOk;
                cancelCallback = events.onCancel;
                divDomDialog.style.display = 'block';
            }
			
            // 隐藏对话框
            function hideDialog(){
                domDialogTitle.innerHTML = '';
                domDialogContent.innerHTML = '';
                divDomDialog.style.display = 'none';
            }
			
			function showExpectDailog(expectTarget, callback){
                var arrHtmls = [
                    '<ul>',
                    '<li><label>断言类型: </label><select id="uirecorder-expect-type" value=""><option>val</option><option>text</option><option>displayed</option><option>enabled</option><option>selected</option><option>attr</option><option>css</option><option>url</option><option>title</option><option>cookie</option><option>localStorage</option><option>sessionStorage</option></select></li>',
                    '<li id="uirecorder-expect-dom-div"><label>断言DOM: </label><input id="uirecorder-expect-dom" type="text" /></li>',
                    '<li id="uirecorder-expect-param-div"><label>断言参数: </label><input id="uirecorder-expect-param" type="text" /></li>',
                    '<li><label>比较方式: </label><select id="uirecorder-expect-compare"><option>equal</option><option>contain</option><option>regexp</option></select></li>',
                    '<li><label>断言结果: </label><textarea id="uirecorder-expect-to"></textarea></li>',
                    '</ul>'
                ];
                var domExpectDomDiv, domExpectParamDiv, domExpectType, domExpectDom, domExpectParam, domExpectCompare, domExpectTo;
                var reDomRequire = /^(val|text|displayed|enabled|selected|attr|css)$/;
                var reParamRequire = /^(attr|css|cookie|localStorage|sessionStorage)$/;
                showDialog('添加断言', arrHtmls.join(''), {
                    onInit: function(){
                        // 初始化dom及事件
                        domExpectDomDiv = document.getElementById('uirecorder-expect-dom-div');
                        domExpectParamDiv = document.getElementById('uirecorder-expect-param-div');
                        domExpectType = document.getElementById('uirecorder-expect-type');
                        domExpectDom = document.getElementById('uirecorder-expect-dom');
                        domExpectParam = document.getElementById('uirecorder-expect-param');
                        domExpectCompare = document.getElementById('uirecorder-expect-compare');
                        domExpectTo = document.getElementById('uirecorder-expect-to');
                        domExpectType.onchange = function(){
                            var type = domExpectType.value;
                            domExpectDomDiv.style.display = reDomRequire.test(type) ? 'block' : 'none';
                            domExpectParamDiv.style.display = reParamRequire.test(type) ? 'block' : 'none';
                            refreshToValue();
                        };
                        domExpectParam.onchange = refreshToValue
                        function refreshToValue(){
                            var type = domExpectType.value;
                            var param = domExpectParam.value;
                            switch(type){
                                case 'url':
                                    domExpectTo.value = location.href;
                                    break;
                                case 'title':
                                    domExpectTo.value = document.title;
                                    break;
                                case 'cookie':
                                    if(param){
                                        domExpectTo.value = getCookie(param) || '';
                                    }
                                    break;
                                case 'localStorage':
                                    if(param){
                                        domExpectTo.value = localStorage.getItem(param) || '';
                                    }
                                    break;
                                case 'sessionStorage':
                                    if(param){
                                        domExpectTo.value = sessionStorage.getItem(param) || '';
                                    }
                                    break;
                                default:
                                    // 到iframe中获取默认值
                                    getExpectValue(type, expectTarget, param, function(value){
                                        domExpectTo.value = value;
                                    });
                            }
                        }
                        // 初始化默认值
                        domExpectType.value = 'val';
                        domExpectDom.value = expectTarget.path;
                        domExpectParam.value = '';
                        domExpectCompare.value = 'equal';
                        domExpectTo.value = '';
                        domExpectType.onchange();
                    },
                    onOk: function(){
                        var type = domExpectType.value;
                        var arrParams = [];
                        reDomRequire.test(type) && arrParams.push(domExpectDom.value);
                        reParamRequire.test(type) && arrParams.push(domExpectParam.value);
                        var compare = domExpectCompare.value;
                        var to = domExpectTo.value;
                        if(compare === 'regexp'){
                            try{
                                eval(to);
                            }
                            catch(e){
                                domExpectTo.focus();
                                return alert('请输入合法的正则表达式!');
                            }
                        }
                        var expectData = {
                            type: type,
                            params: arrParams,
                            compare:compare,
                            to: to,
							model:activeModel,
							vertex:activeVetex
                        };
                        callback(expectTarget.frame, expectData);
                    },
                    onCancel: function(){
                        setGlobalWorkMode('record');
                    }
                });
            }
			
			function showVarsDailog(callback){
                var arrHtmls = [
                    '<ul>',
                    '<li><label>变量类型: </label><select id="uirecorder-vars-type"><option value="db" selected>数据库变量</option></select></li>',
                    '<li><label>变量名: </label><select id="uirecorder-vars-name"></select></li>',
					'<li><label>变量值: </label><input id="uirecorder-vars-value" type="text"/></li>',
					'</ul>'
                ];                       
                var domVarsType, domVarsName;
                showDialog('插入变量: ', arrHtmls.join(''), {
                    onInit: function(){
                        // 初始化dom及事件
                        domVarsType = document.getElementById('uirecorder-vars-type');
                        domVarsName = document.getElementById('uirecorder-vars-name');
						domVarsValue = document.getElementById('uirecorder-vars-value');
						chrome.runtime.sendMessage({
							type: 'getUserVarNameList',
							user : activeUser
						},function(response){
							console.log("getUserVarNameList response : " + response);
							varName = JSON.parse(response).varNameList[0];
							console.log('initial varName : ' + varName);
							jsBatchAddItemToSelect(domVarsName,JSON.parse(response).varNameList);
							chrome.runtime.sendMessage({
								type: 'getVarValue',
								user : activeUser,
								varname : varName
							},function(response){
								console.log("getVarValue response : " + response);
								domVarsValue.value = JSON.parse(response).varValue || '';							
							});							
						});
                        domVarsType.onchange = function(){                            
                            domVarsName.parentNode.style.display = 'block';                            
                            domVarsName.onchange();                            
                        }                        
                        domVarsName.onchange = function(){							
                            varName = domVarsName.value;
							chrome.runtime.sendMessage({
								type: 'getVarValue',
								user : activeUser,
								varname : varName
							},function(response){
								console.log("getVarValue response : " + response);
								domVarsValue.value = JSON.parse(response).varValue || '';							
							});							                        
                        };					
                        domVarsName.onchange();						
                    },
                    onOk: function(){						
                        var type = domVarsType.value;                        
                        callback({
                            type: type,
                            name: domVarsName.value,
							value: domVarsValue.value
                        });                        
                    },
                    onCancel: function(){
                        setGlobalWorkMode('record');
                    }
                });
            }
			
			function showNodeEditDailog(){
                var arrHtmls = [
                    '<textarea id= "vetexscript" rows="10" cols="60">',
					'',
                    '</textarea>'
                ];                
                //setGlobalWorkMode('pauseAll');
                	
                showDialog('页面', arrHtmls.join(''), {
                    onInit: function(){
					   activeVetex = $('#vetex').find("option:selected").text();
					   console.log('activeVetex : ' + activeVetex);
                       vetexscript = document.getElementById("vetexscript");
					   chrome.runtime.sendMessage({
							type: 'getVetexScript',
							model : activeModel,
							vetexedge : activeVetex
						},function(response){
							console.log("response : " + response);
							var jsonResult = JSON.parse(response);
							befVetexScriptContent = jsonResult.result.script_content;
							vetexscript.value=jsonResult.result.script_content;
							//console.log("vetexscript : " + vetexscript.value);
						});
					   
                    },
                    onOk: function(){
                        setGlobalWorkMode('pauseRecord');
						scriptcontent = vetexscript.value;
						console.log('vetexscript : ' + scriptcontent);
						if(befVetexScriptContent){
							chrome.runtime.sendMessage({
								type: 'setVetexScript',
								model : activeModel,
								vetexedge : activeVetex,
								vetexscript : scriptcontent
							},function(response){
								console.log("response : " + response);
								//var jsonResult = JSON.parse(response);
								//vetexscript.value=jsonResult.result.script_content;
								//console.log("vetexscript : " + vetexscript.value);
							});
							
						} else {
							chrome.runtime.sendMessage({
								type: 'createVetexScript',
								model : activeModel,
								vetexedge : activeVetex,
								vetexscript : scriptcontent
							},function(response){
								console.log("response : " + response);
								//var jsonResult = JSON.parse(response);
								//vetexscript.value=jsonResult.result.script_content;
								//console.log("vetexscript : " + vetexscript.value);
							});
						}
						
                    },
                    onCancel: function(){
                        setGlobalWorkMode('record');
                    }
                });
            }
			
			function showEdgeEditDailog(){
                var arrHtmls = [
                    '<textarea id= "edgescript" rows="10" cols="60">',
					'',
                    '</textarea>'
                ];                
                //setGlobalWorkMode('pauseAll');
                //var domSpecName = document.getElementById('uirecorder-vars-type');
                showDialog('操作', arrHtmls.join(''), {
                    onInit: function(){
                       edgescript = document.getElementById("edgescript");
					   activeEdge = $('#edge').find("option:selected").text();					   
					   //console.log('activeEdge of getEdgeScript : ' + activeEdge);
					   chrome.runtime.sendMessage({
							type: 'getEdgeScript',
							model : activeModel,
							vetexedge : activeEdge
						},function(response){
							//console.log("response : " + response);
							var jsonResult = JSON.parse(response);
							console.log('jsonResult : ' + response);
							if(jsonResult.returnCode == 0){
								befEdgeScriptContent = jsonResult.result.script_content;
								edgescript.value=jsonResult.result.script_content;
								//console.log("vetexscript : " + vetexscript.value);
							} else {
								alert(jsonResult.returnMsg);
							}
							
						});
                    },
                    onOk: function(){
                        setGlobalWorkMode('pauseRecord');
                        scriptcontent = edgescript.value;
						console.log('vetexscript : ' + scriptcontent);
						if(befEdgeScriptContent){
							chrome.runtime.sendMessage({
								type: 'setEdgeScript',
								model : activeModel,
								vetexedge : activeEdge,
								edgescript : scriptcontent
							},function(response){
								console.log("response : " + response);
								//var jsonResult = JSON.parse(response);
								//vetexscript.value=jsonResult.result.script_content;
								//console.log("vetexscript : " + vetexscript.value);
							});
							
						} else {
							chrome.runtime.sendMessage({
								type: 'createEdgeScript',
								model : activeModel,
								vetexedge : activeEdge,
								edgescript : scriptcontent
							},function(response){
								console.log("response : " + response);
								//var jsonResult = JSON.parse(response);
								//vetexscript.value=jsonResult.result.script_content;
								//console.log("vetexscript : " + vetexscript.value);
							});
						}
                    },
                    onCancel: function(){
                        setGlobalWorkMode('record');
                    }
                });
            }
			
			console.log('model list : ' + model.toString());
			
			$("#edge").change(function(){
				activeEdge = $('#edge').find("option:selected").text();
				console.log(activeEdge);
				
				chrome.runtime.sendMessage({
					type: 'updateEdge',
					model : activeModel,
					edge : activeEdge
				},function(response){
					console.log("response : " + response);
					
				});
				
			});		
			
			$("#vetex").change(function(){
				activeVetex = $('#vetex').find("option:selected").text();
				console.log('activeVetex : ' + activeVetex);
				chrome.runtime.sendMessage({
					type: 'updateVetex',
					model : activeModel,
					vetex : activeVetex
				},function(response){
					console.log("response : " + response);
					
				});
			});			
							
			jsAddItemToSelect(document.getElementById("model"),activeModelName,activeModelName);
			jsBatchAddItemToSelect(document.getElementById("vetex"),vetexesResult);
			jsBatchAddItemToSelect(document.getElementById("edge"),edgesResult);			
			
			console.log('activeModel : ' + activeModel);
			if(activeModel){
				chrome.runtime.sendMessage({
					type: 'updateModel',
					model : activeModel
				},function(response){
					console.log("response : " + response);					
				});
			}
			console.log('selected vetex : ' + $('#vetex').find("option:selected").text());
			activeVetex = $('#vetex').find("option:selected").text();
			console.log('selected edge : ' + $('#edge').find("option:selected").text());
			activeEdge = $('#edge').find("option:selected").text();
			console.log('initial activeEdge : ' + activeEdge);
			/*
			if(activeEdge){
				chrome.runtime.sendMessage({
					type: 'updateEdge',
					edge : activeEdge
				},function(response){
					console.log("response : " + response);					
				});
			}
			*/
			chrome.runtime.sendMessage({
				type: 'showBackVetexEdge'
			},function(response){
				console.log("response from background by showBackEdge : " + JSON.stringify(response));
				//console.log("response edge from background by showBackEdge : " + response.edge);
				$("#vetex").val(response.vetex);				
				$("#edge").val(response.edge);	
				activeVetex = response.vetex;				
				activeEdge = response.edge;				
			});
						
        }

        if(isIframe === false){
            initToolsPannel();
        }
        isRecording = true;		
		
        // 定时探测DOM是否被破坏
        setTimeout(initRecorderDom, 200);
    }

})();
