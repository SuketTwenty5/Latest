/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 90.0, "KoPercent": 10.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.1111111111111111, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.18333333333333332, 500, 1500, "Open Proposal"], "isController": false}, {"data": [0.0, 500, 1500, "Login"], "isController": false}, {"data": [0.15, 500, 1500, "Search Proposal"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 90, 9, 10.0, 4870.011111111112, 208, 21005, 1699.0, 18748.20000000007, 20048.9, 21005.0, 0.3990794567198329, 63.873979125650166, 0.0], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Open Proposal", 30, 3, 10.0, 3411.7666666666664, 208, 20050, 1555.5, 18228.10000000004, 20043.95, 20050.0, 0.13813553859046496, 26.593550818625737, 0.0], "isController": false}, {"data": ["Login", 30, 3, 10.0, 7776.833333333333, 5566, 21005, 6334.5, 18974.100000000028, 20692.6, 21005.0, 0.15103914934751086, 21.509302359609112, 0.0], "isController": false}, {"data": ["Search Proposal", 30, 3, 10.0, 3421.4333333333334, 1341, 20048, 1544.5, 18218.900000000038, 20032.6, 20048.0, 0.15081515591773537, 21.90337799242405, 0.0], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;j_username&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [135720497ffa960b8243ea81a8131323, findElement {using=xpath, value=//*[@id=&quot;j_username&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:38403}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:38403/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 135720497ffa960b8243ea81a8131323", 1, 11.11111111111111, 1.1111111111111112], "isController": false}, {"data": ["500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;button-1023-btnInnerEl&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [a6b5447437546a2d25b079433a55683a, findElement {using=xpath, value=//*[@id=&quot;button-1023-btnInnerEl&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:37881}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:37881/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: a6b5447437546a2d25b079433a55683a", 1, 11.11111111111111, 1.1111111111111112], "isController": false}, {"data": ["500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [135720497ffa960b8243ea81a8131323, findElement {using=xpath, value=//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:38403}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:38403/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 135720497ffa960b8243ea81a8131323", 1, 11.11111111111111, 1.1111111111111112], "isController": false}, {"data": ["500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[contains(text(), &quot;PRK Test&quot;)]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [135720497ffa960b8243ea81a8131323, findElement {using=xpath, value=//*[contains(text(), &quot;PRK Test&quot;)]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:38403}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:38403/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 135720497ffa960b8243ea81a8131323", 1, 11.11111111111111, 1.1111111111111112], "isController": false}, {"data": ["500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [a6b5447437546a2d25b079433a55683a, findElement {using=xpath, value=//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:37881}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:37881/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: a6b5447437546a2d25b079433a55683a", 1, 11.11111111111111, 1.1111111111111112], "isController": false}, {"data": ["500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[contains(text(), &quot;Test Proposal v2-Jan8&quot;)]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [23b44690a3a996b3b310d668edb6b95f, findElement {using=xpath, value=//*[contains(text(), &quot;Test Proposal v2-Jan8&quot;)]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:42821}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:42821/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 23b44690a3a996b3b310d668edb6b95f", 1, 11.11111111111111, 1.1111111111111112], "isController": false}, {"data": ["500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [23b44690a3a996b3b310d668edb6b95f, findElement {using=xpath, value=//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:42821}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:42821/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 23b44690a3a996b3b310d668edb6b95f", 1, 11.11111111111111, 1.1111111111111112], "isController": false}, {"data": ["500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[contains(text(), &quot;TEST 2024-01-09 11:44&quot;)]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [a6b5447437546a2d25b079433a55683a, findElement {using=xpath, value=//*[contains(text(), &quot;TEST 2024-01-09 11:44&quot;)]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:37881}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:37881/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: a6b5447437546a2d25b079433a55683a", 1, 11.11111111111111, 1.1111111111111112], "isController": false}, {"data": ["500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;j_username&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [23b44690a3a996b3b310d668edb6b95f, findElement {using=xpath, value=//*[@id=&quot;j_username&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:42821}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:42821/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 23b44690a3a996b3b310d668edb6b95f", 1, 11.11111111111111, 1.1111111111111112], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 90, 9, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;j_username&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [135720497ffa960b8243ea81a8131323, findElement {using=xpath, value=//*[@id=&quot;j_username&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:38403}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:38403/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 135720497ffa960b8243ea81a8131323", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;button-1023-btnInnerEl&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [a6b5447437546a2d25b079433a55683a, findElement {using=xpath, value=//*[@id=&quot;button-1023-btnInnerEl&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:37881}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:37881/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: a6b5447437546a2d25b079433a55683a", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [135720497ffa960b8243ea81a8131323, findElement {using=xpath, value=//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:38403}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:38403/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 135720497ffa960b8243ea81a8131323", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[contains(text(), &quot;PRK Test&quot;)]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [135720497ffa960b8243ea81a8131323, findElement {using=xpath, value=//*[contains(text(), &quot;PRK Test&quot;)]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:38403}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:38403/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 135720497ffa960b8243ea81a8131323", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [a6b5447437546a2d25b079433a55683a, findElement {using=xpath, value=//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:37881}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:37881/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: a6b5447437546a2d25b079433a55683a", 1], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["Open Proposal", 30, 3, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[contains(text(), &quot;PRK Test&quot;)]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [135720497ffa960b8243ea81a8131323, findElement {using=xpath, value=//*[contains(text(), &quot;PRK Test&quot;)]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:38403}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:38403/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 135720497ffa960b8243ea81a8131323", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[contains(text(), &quot;Test Proposal v2-Jan8&quot;)]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [23b44690a3a996b3b310d668edb6b95f, findElement {using=xpath, value=//*[contains(text(), &quot;Test Proposal v2-Jan8&quot;)]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:42821}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:42821/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 23b44690a3a996b3b310d668edb6b95f", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[contains(text(), &quot;TEST 2024-01-09 11:44&quot;)]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [a6b5447437546a2d25b079433a55683a, findElement {using=xpath, value=//*[contains(text(), &quot;TEST 2024-01-09 11:44&quot;)]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:37881}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:37881/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: a6b5447437546a2d25b079433a55683a", 1, "", "", "", ""], "isController": false}, {"data": ["Login", 30, 3, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;j_username&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [135720497ffa960b8243ea81a8131323, findElement {using=xpath, value=//*[@id=&quot;j_username&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:38403}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:38403/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 135720497ffa960b8243ea81a8131323", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;button-1023-btnInnerEl&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [a6b5447437546a2d25b079433a55683a, findElement {using=xpath, value=//*[@id=&quot;button-1023-btnInnerEl&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:37881}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:37881/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: a6b5447437546a2d25b079433a55683a", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;j_username&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [23b44690a3a996b3b310d668edb6b95f, findElement {using=xpath, value=//*[@id=&quot;j_username&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:42821}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:42821/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 23b44690a3a996b3b310d668edb6b95f", 1, "", "", "", ""], "isController": false}, {"data": ["Search Proposal", 30, 3, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [135720497ffa960b8243ea81a8131323, findElement {using=xpath, value=//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:38403}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:38403/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 135720497ffa960b8243ea81a8131323", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [a6b5447437546a2d25b079433a55683a, findElement {using=xpath, value=//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:37881}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:37881/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: a6b5447437546a2d25b079433a55683a", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [23b44690a3a996b3b310d668edb6b95f, findElement {using=xpath, value=//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:42821}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:42821/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 23b44690a3a996b3b310d668edb6b95f", 1, "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
