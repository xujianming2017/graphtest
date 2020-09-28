var gui = require('nw.gui');
var login = false;
var stateListHover = false;
var win = gui.Window.get();

// 最大化事件监听
win.on('maximize',function(){
	// 恢复到上一状态
    win.restore();
});

chrome.extension.addListener(function(request, sender) {
	if(request == 'finish'){
		
		 var win = gui.Window.get();
		 win.resizeTo(316,540);
		 win.moveTo(window.screen.width-320,100);
		
	}
});