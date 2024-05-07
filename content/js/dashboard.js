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

    var data = {"OkPercent": 91.11111111111111, "KoPercent": 8.88888888888889};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.15, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.2, 500, 1500, "Open Proposal"], "isController": false}, {"data": [0.0, 500, 1500, "Login"], "isController": false}, {"data": [0.25, 500, 1500, "Search Proposal"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 90, 8, 8.88888888888889, 4790.477777777776, 189, 20254, 1842.0, 8375.800000000001, 20048.7, 20254.0, 0.46912383305446526, 75.2765234552143, 0.0], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Open Proposal", 30, 3, 10.0, 3412.7000000000003, 189, 20043, 1630.5, 18367.500000000036, 20035.85, 20043.0, 0.1633862341651508, 31.218918321859988, 0.0], "isController": false}, {"data": ["Login", 30, 2, 6.666666666666667, 7580.700000000001, 5630, 20254, 6604.5, 8375.800000000001, 20253.45, 20254.0, 0.15919510952623536, 23.095743545633276, 0.0], "isController": false}, {"data": ["Search Proposal", 30, 3, 10.0, 3378.0333333333338, 1414, 20059, 1501.0, 18239.70000000004, 20055.15, 20059.0, 0.1633559853633037, 23.72472363910851, 0.0], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;j_username&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [154fe9af9260e538fd70b8508981c252, findElement {using=xpath, value=//*[@id=&quot;j_username&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:33697}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:33697/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 154fe9af9260e538fd70b8508981c252", 1, 12.5, 1.1111111111111112], "isController": false}, {"data": ["500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[contains(text(), &quot;TEST 2024-01-08 04:50&quot;)]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [01d52038eacffe1bceae0aee5afd5edb, findElement {using=xpath, value=//*[contains(text(), &quot;TEST 2024-01-08 04:50&quot;)]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:43241}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:43241/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 01d52038eacffe1bceae0aee5afd5edb", 1, 12.5, 1.1111111111111112], "isController": false}, {"data": ["500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [154fe9af9260e538fd70b8508981c252, findElement {using=xpath, value=//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:33697}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:33697/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 154fe9af9260e538fd70b8508981c252", 1, 12.5, 1.1111111111111112], "isController": false}, {"data": ["500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[contains(text(), &quot;TEST 2024-01-08 05:03&quot;)]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [56f6690de3d778554748f11fa493b606, findElement {using=xpath, value=//*[contains(text(), &quot;TEST 2024-01-08 05:03&quot;)]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:35375}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:35375/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 56f6690de3d778554748f11fa493b606", 1, 12.5, 1.1111111111111112], "isController": false}, {"data": ["500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[contains(text(), &quot;TEST 2024-01-08 05:06&quot;)]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [154fe9af9260e538fd70b8508981c252, findElement {using=xpath, value=//*[contains(text(), &quot;TEST 2024-01-08 05:06&quot;)]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:33697}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:33697/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 154fe9af9260e538fd70b8508981c252", 1, 12.5, 1.1111111111111112], "isController": false}, {"data": ["500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [01d52038eacffe1bceae0aee5afd5edb, findElement {using=xpath, value=//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:43241}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:43241/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 01d52038eacffe1bceae0aee5afd5edb", 1, 12.5, 1.1111111111111112], "isController": false}, {"data": ["500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;j_username&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [56f6690de3d778554748f11fa493b606, findElement {using=xpath, value=//*[@id=&quot;j_username&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:35375}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:35375/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 56f6690de3d778554748f11fa493b606", 1, 12.5, 1.1111111111111112], "isController": false}, {"data": ["500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [56f6690de3d778554748f11fa493b606, findElement {using=xpath, value=//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:35375}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:35375/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 56f6690de3d778554748f11fa493b606", 1, 12.5, 1.1111111111111112], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 90, 8, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;j_username&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [154fe9af9260e538fd70b8508981c252, findElement {using=xpath, value=//*[@id=&quot;j_username&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:33697}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:33697/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 154fe9af9260e538fd70b8508981c252", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[contains(text(), &quot;TEST 2024-01-08 04:50&quot;)]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [01d52038eacffe1bceae0aee5afd5edb, findElement {using=xpath, value=//*[contains(text(), &quot;TEST 2024-01-08 04:50&quot;)]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:43241}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:43241/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 01d52038eacffe1bceae0aee5afd5edb", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [154fe9af9260e538fd70b8508981c252, findElement {using=xpath, value=//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:33697}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:33697/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 154fe9af9260e538fd70b8508981c252", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[contains(text(), &quot;TEST 2024-01-08 05:03&quot;)]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [56f6690de3d778554748f11fa493b606, findElement {using=xpath, value=//*[contains(text(), &quot;TEST 2024-01-08 05:03&quot;)]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:35375}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:35375/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 56f6690de3d778554748f11fa493b606", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[contains(text(), &quot;TEST 2024-01-08 05:06&quot;)]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [154fe9af9260e538fd70b8508981c252, findElement {using=xpath, value=//*[contains(text(), &quot;TEST 2024-01-08 05:06&quot;)]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:33697}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:33697/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 154fe9af9260e538fd70b8508981c252", 1], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["Open Proposal", 30, 3, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[contains(text(), &quot;TEST 2024-01-08 04:50&quot;)]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [01d52038eacffe1bceae0aee5afd5edb, findElement {using=xpath, value=//*[contains(text(), &quot;TEST 2024-01-08 04:50&quot;)]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:43241}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:43241/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 01d52038eacffe1bceae0aee5afd5edb", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[contains(text(), &quot;TEST 2024-01-08 05:03&quot;)]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [56f6690de3d778554748f11fa493b606, findElement {using=xpath, value=//*[contains(text(), &quot;TEST 2024-01-08 05:03&quot;)]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:35375}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:35375/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 56f6690de3d778554748f11fa493b606", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[contains(text(), &quot;TEST 2024-01-08 05:06&quot;)]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [154fe9af9260e538fd70b8508981c252, findElement {using=xpath, value=//*[contains(text(), &quot;TEST 2024-01-08 05:06&quot;)]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:33697}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:33697/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 154fe9af9260e538fd70b8508981c252", 1, "", "", "", ""], "isController": false}, {"data": ["Login", 30, 2, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;j_username&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [154fe9af9260e538fd70b8508981c252, findElement {using=xpath, value=//*[@id=&quot;j_username&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:33697}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:33697/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 154fe9af9260e538fd70b8508981c252", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;j_username&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [56f6690de3d778554748f11fa493b606, findElement {using=xpath, value=//*[@id=&quot;j_username&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:35375}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:35375/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 56f6690de3d778554748f11fa493b606", 1, "", "", "", "", "", ""], "isController": false}, {"data": ["Search Proposal", 30, 3, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [154fe9af9260e538fd70b8508981c252, findElement {using=xpath, value=//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:33697}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:33697/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 154fe9af9260e538fd70b8508981c252", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [01d52038eacffe1bceae0aee5afd5edb, findElement {using=xpath, value=//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:43241}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:43241/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 01d52038eacffe1bceae0aee5afd5edb", 1, "500/javax.script.ScriptException: org.openqa.selenium.NoSuchElementException: no such element: Unable to locate element: {&quot;method&quot;:&quot;xpath&quot;,&quot;selector&quot;:&quot;//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]&quot;}\\n  (Session info: chrome=124.0.6367.78)\\nFor documentation on this error, please visit: https://www.selenium.dev/documentation/webdriver/troubleshooting/errors#no-such-element-exception\\nBuild info: version: '4.13.0', revision: 'ba948ece5b*'\\nSystem info: os.name: 'Linux', os.arch: 'amd64', os.version: '5.15.0-1061-azure', java.version: '11.0.22'\\nDriver info: org.openqa.selenium.chrome.ChromeDriver\\nCommand: [56f6690de3d778554748f11fa493b606, findElement {using=xpath, value=//*[@id=&quot;iBEComboBox-1270-trigger-picker&quot;]}]\\nCapabilities {acceptInsecureCerts: true, browserName: chrome, browserVersion: 124.0.6367.78, chrome: {chromedriverVersion: 123.0.6312.122 (31f8248cdd9..., userDataDir: /tmp/.org.chromium.Chromium...}, fedcm:accounts: true, goog:chromeOptions: {debuggerAddress: localhost:35375}, networkConnectionEnabled: false, pageLoadStrategy: normal, platformName: linux, proxy: Proxy(system), se:cdp: ws://localhost:35375/devtoo..., se:cdpVersion: 124.0.6367.78, setWindowRect: true, strictFileInteractability: false, timeouts: {implicit: 0, pageLoad: 300000, script: 30000}, unhandledPromptBehavior: dismiss and notify, webauthn:extension:credBlob: true, webauthn:extension:largeBlob: true, webauthn:extension:minPinLength: true, webauthn:extension:prf: true, webauthn:virtualAuthenticators: true}\\nSession ID: 56f6690de3d778554748f11fa493b606", 1, "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
