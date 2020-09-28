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
});

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
        trHTML += '<tr><td><a data-action="caseHistory" id="' + result[i].running_number + '">' + result[i].id + '</a></td><td>' + result[i].start_time + '</td><td>' + result[i].end_time + '</td><td>' + result[i].duration + '</td><td></td><td><a class="innerLink" data-action="mailReport" id="' + result[i].running_number + '">邮件</a><a class="innerLink" data-action="exportReport" id="' + result[i].running_number + '">导出</a></td></tr>';
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
    content += getTestPathRows(data);
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
        body += data[i].id + tabs2 + data[i].start_time + "\t" + data[i].end_time + "\t" + data[i].duration + "\t" + data[i].result + "\r\n";
    }

    console.log(body);
    body = encodeURIComponent(body);
    return body;
}

function sendCaseHistory(aElement, data) {
    var obj = composeReportMail(data);
    var url = "mailto:someone@mail.com?subject=测试用例执行历史&body=" + obj;
    aElement.setAttribute("href", url);
    aElement.click;
}

function getTestPathRows(data) {
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
                <td><a class="innerLink" data-toggle="modal" data-target="#myModal" style="cursor:pointer" onclick="showLogModal(${data[i].id})" style="cursor:pointer">查看日志</a></td>
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
        $('#myModal .modal-body').html(data.returnCode !== 0 ? data : generateLogData(data));
    });
}

function generateLogData(data) {
    if (data.returnCode !== 0) return data;

    var resultList = data.resultList;
    var htmStr = '';
    for (i = 0; i < resultList.length; i++) {
        console.log('resultList' + resultList[i].id);

        var iconStyle = getIconStyleInfo(resultList[i].state);
        htmStr += 
            `<div class="title">
                <span class="${iconStyle.class}" style="color:${iconStyle.color}; font-weight: normal">
                    <p style="float:left; display:inline-block; display:inline; margin-left: 20px;">${resultList[i].id}: ${resultList[i].title}</p>
                </span>
            </div>
            <div class="steps" style="font-size:12px; margin-left:60px">
                <div class="duration">耗时: ${resultList[i].duration}ms</div>
                <div class="err">${resultList[i].err ? "错误信息: " + resultList[i].err : ''}</div>
                <div class="order">${resultList[i].order ? "Order: " + resultList[i].order : ''}</div>
            </div>`;
    }

    return htmStr
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
            stateInfo["color"] = "000088"; 
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
    var details = getTestPathRows(data);

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
