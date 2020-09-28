var REST_SERVER = 'http://192.168.200.88:3333';


var TestState;
(function (TestState) {
    TestState[TestState["PASS"] = 1] = "PASS";
    TestState[TestState["FAIL"] = 2] = "FAIL";
    TestState[TestState["PENDING"] = 3] = "PENDING";
    TestState[TestState["UNKOWN"] = 4] = "UNKOWN";
})(TestState || (TestState = {}));

var zTree;
var zSetting = {
    view: {
        dblClickExpand: true,
        showLine: true,
        showIcon: true,
        showTitle: true
    },
    data: {
        key: {
            name: "folder_name"
        },
        simpleData: {
            enable: true,
            idKey: "id",
            pIdKey: "parent_id",
            rootPId: null
        }
    },
    callback: {
        onClick: zTreeOnClick
    }
};

var zNodes;

$(document).ready(function () {
    initTree("scenario");
    initModel(userId, loadModelSuccessed);
});
//加载模型
function loadModelSuccessed(mlist) {
//    modelList = mlist;
//    model = modelList[0];
    model = mlist;
    changeModelName(model.model_name);
    changeModelId(model.id);

    console.log("loadModelSuccessed : " + JSON.stringify(model));
}

function removeReportTableRows(tableId) {
    var tableBody = document.getElementById(tableId).getElementsByTagName('tbody')[0];
    var trows = tableBody.getElementsByTagName('tr');
    console.log('Table contains: ' + trows.length);
    for (var i = trows.length - 1; i > 0; i--) {
        console.log('Remove a row: ' + trows[i].tagName);
        tableBody.removeChild(trows[i]);
    }
}

function getScenarioRows(data) {
    var result = data.scenarioResultList;
    console.log("Length: " + result.length);
    var trHTML = '';
    for (i = 0; i < result.length; i++) {
        trHTML += '<tr><td><a style="cursor:pointer" data-action="caseHistory" id="' + result[i].running_number + '">' + result[i].id + '</a></td><td>' + result[i].start_time + '</td><td>' + result[i].end_time + '</td><td>' + result[i].duration + '</td><td></td><td><a class="innerLink" data-action="mailReport" id="' + result[i].running_number + '">邮件 </a><a class="innerLink" data-action="exportReport" id="' + result[i].running_number + '">导出</a></td></tr>';
    }
    return trHTML;
}

function appendScenarioTableMock() {
    $('#scenarioHistory').append(getScenarioRows(scenarioMockData));
}

function updateScenarioTable(scenarioId) {
    var service = '/api/invoke/result';

    // Clear scenario table
    removeReportTableRows('scenarioHistory');

    // Clear test result table
    removeReportTableRows('caseHistory');

    $.ajax({
        type: 'POST',
        url: REST_SERVER + service,
        contentType: "application/json; charset=utf-8",
        data: '{"scenarioId":"' + scenarioId + '"}',
        dataType: "json",
        success: function (data) {
            if (data.returnCode != 0) {
                alert("Failed to get scenario report: " + data.returnMsg);
                return;
            }

            console.log("scenarioId: " + scenarioId + ", Result: " + JSON.stringify(data));

            $('#scenarioHistory').append(getScenarioRows(data));
        },
        error: function (xhr, error, exception) {
            console.log('获取测试场景历史失败')
        }
    });
}

function createExportDom(data) {
    console.log("Result: " + data);

    var content = "<!DOCTYPE HTML><html><head><meta charset=\"utf-8\"><title>测试报告</title><style type=\"text/css\">body{text-align: center;}table{margin: 0px auto;}div{position: relative;}</style></head><body><h2>测试用例执行历史</h2>";
    content += "<table border='1'><tr><th>用例ID</th><th>执行起始时间</th><th>执行结束时间</th><th>耗时</th><th>结果</th></tr>";
    content += getTestPathRows(data, false);
    content += "</table></body></html>";

    return content;
}

function exportCaseHistory(aElement, data) {
    var blob = new Blob([createExportDom(data)]);

    aElement.setAttribute("href", window.URL.createObjectURL(blob));
    aElement.download = "report.html";
}

function composeReportMail(data) {
    var tabs4 = "\t\t\t\t";
    var tabs2 = "\t\t";
    var body = "用例ID"+ "\t" + "起始时间" + tabs4 + "结束时间" + tabs4 + "耗时" + "\t" + "结果" + "\r\n";

    for (i = 0; i < data.length; i++) {
        body += data[i].id + tabs2 + data[i].start_time + tabs2 + data[i].end_time + tabs2 + data[i].duration + tabs2 + data[i].result + "\r\n";
    }

    console.log(body);
    body = encodeURIComponent(body);
    return body;
}

function sendCaseHistory(aElement, data) {
    var obj = composeReportMail(data);
    var url = "mailto:someone@jd.com?subject=测试用例执行历史&body=" + obj;
    aElement.setAttribute("href", url);
    aElement.click;
}

function getTestPathRows(data, showLog) {
    var trHTML = '';

    for (i = 0; i < data.length; i++) {
        console.log('caseHistory' + data[i].id);
        trHTML += 
            `<tr>  
                <td>${data[i].id}</td>
                <td>${data[i].start_time}</td>
                <td>${data[i].end_time}</td>
                <td>${data[i].duration}</td>
                <td style="background-color:${data[i].result == 'pass' ? 'green' : 'red'}">${data[i].result}</td>
                ${showLog? '' : '<!--'}
                <td><a class="innerLink" data-toggle="modal" data-target="#myModal" style="cursor:pointer" onclick="showLogModal(${data[i].id})" style="cursor:pointer">查看日志</a></td>
                ${showLog? '' : '-->'}
            </tr>`;
    }

    return trHTML;
}

function showLogModal(resultId) {
    queryTestResultDetails(resultId);
}

function queryTestResultDetails(resultId) {
    var service = "/api/invoke/result/path/detail";
    var data = { "resultId": resultId};
    sendAjaxPostRequest(service, JSON.stringify(data), function(data) {
        //url = '../../img/Lighthouse.jpg';
        $('#myModal .modal-body').html(data.returnCode !== 0 ? data : generateLogData(data));
    });
}

function generateLogData(data) {
    if (data.returnCode !== 0) return data;
    var resultList = data.resultList.sort(function(result1, result2){return result1.order - result2.order;});

    var htmStr = '';
    for (i = 0; i < resultList.length; i++) {
        console.log('resultList' + resultList[i].id);

// Test data, you can enable blew code to test
//
//     resultList[i].screenshots = '../../img/Lighthouse.jpg';
//     resultList[0].title = "xxxxxasdfadsfafdaxxxxxxxxxxxasdfafdasdfaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxasdfafdadslajksdflasjfdlkaxxxxxxxxxxxlkjalkjdlfsajflajxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxasdfasfsasdfafasfda";
//     resultList[0].screenshots = "../../img/bg1.jpg";
//     resultList[3].state = 3;
//     resultList[4].state = 4;
//     resultList[4].duration = null;
//
// Test data

        var iconStyle = getIconStyleInfo(resultList[i].state);

        htmStr += 
        `<ul style="list-style-type:none">
            <li>
            <p style="display:inline; word-wrap:break-word;color:${iconStyle.color};font-weight: normal">	
                ${resultList[i].order}.${resultList[i].title}.
                <span class="${iconStyle.class}"></span>
            </p> 
            </li>
            <li>
                <div class="steps" style="font-size:12px; margin-left:30px">
                ${!!resultList[i].duration ? '' : '<!--'}
                <div class="duration">耗时: ${resultList[i].duration}ms</div>
                ${!!resultList[i].duration ? '' : '-->'}
                <div class="err">${resultList[i].err ? "错误信息: " + resultList[i].err : ''}</div>
                ${!!resultList[i].screenshots ? '' : '<!--'}
                <div class="screenshot" style="width:40px; height:30px">
                    <img src="${resultList[i].screenshots}" alt="点击查看大图" style="max-width: 100%; max-height: 100%; cursor:pointer" onclick="showBigImage('${resultList[i].screenshots}')"/>
                </div>
                ${!!resultList[i].screenshots ? '' : '-->'}
            </div>
            </li>
        </ul>`;
    }

    return htmStr;
}

function showBigImage(imgUrl) {
    $('#imgModal #imgInModalID').attr("src", decodeURI(imgUrl)); 
    $('#imgModal').modal();
}

function getIconStyleInfo(state) {
    var stateInfo = {};
    switch(state){
        case TestState.PASS:
            stateInfo["class"] = "glyphicon glyphicon-ok"; 
            stateInfo["color"] = "green"; 
            break;
        case TestState.FAIL:
            stateInfo["class"] = "glyphicon glyphicon-remove"; 
            stateInfo["color"] = "red"; 
            break;
        case TestState.PENDING:
            stateInfo["class"] = "glyphicon glyphicon-time"; 
            stateInfo["color"] = "blue"; 
            break;
        default:
            stateInfo["class"] = "glyphicon glyphicon-question-sign";
            stateInfo["color"] = "brown";  
            break;
    }

    return stateInfo;
}

function updateTestHistoryTable(data) {

    if (data == null) {
        return;
    }

    console.log("Result: " + JSON.stringify(data));

    removeReportTableRows('caseHistory');
    var details = getTestPathRows(data, true);

    console.log(details);
    $('#caseHistory').append(details);
}

function queryScenarioHistory(aElement, action) {
    var service = '/api/invoke/result/scenario/path';

    $.ajax({
        type: 'POST',
        url: REST_SERVER + service,
        contentType: "application/json; charset=utf-8",
        data: '{"invokeType":"path","runningNumber":"' + aElement.id + '"}',
        dataType: "json",
        success: function (data) {
            if (data.returnCode != 0) {
                alert("Failed to get test report: " + data.returnMsg);
                return;
            }

            console.log("Test Data: " + JSON.stringify(data));

            var actionName = $(aElement).data('action');

            if (actionName === 'caseHistory') {
                updateTestHistoryTable(data.pathResultList)
            }
            else if (actionName === 'mailReport') {
                sendCaseHistory(aElement, data.pathResultList);
            }
            else if (actionName === 'exportReport') {
                exportCaseHistory(aElement, data.pathResultList);
            }
        },
        error: function (xhr, error, exception) {
            console.log('获取测试场景历史失败')
        }
    });
}

function zTreeOnClick(event, treeId, treeNode) {
    console.log(JSON.stringify(treeNode));
    console.log(treeNode.type + ": " + treeNode.id);

    if (treeNode.type == 'scenario') {
        updateScenarioTable(treeNode.id);
    }
}

function sendAjaxPostRequest(servicePath, postData, callback) {
    $.ajax({
        type: 'POST',
        url: REST_SERVER + servicePath,
        contentType: "application/json; charset=utf-8",
        data: postData,
        dataType: "json",
        success: function (data) {
            if (data.returnCode != 0) {
                alert("Failed to get data");
                return;
            }

            console.log("Post Data: " + JSON.stringify(data));
            callback(data);
        },
        error: function (xhr, error, exception) {
            callback(`Ajax request failed, post data is ${postData}.`)
        }
    });
}