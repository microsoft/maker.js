var MakerJsRequireIframe;
(function (MakerJsRequireIframe) {
    var Counter = /** @class */ (function () {
        function Counter() {
            this.required = 0;
            this.loaded = 0;
            this.complete = function () { };
        }
        Counter.prototype.addLoaded = function () {
            this.loaded++;
            if (this.loaded == this.required) {
                this.complete();
            }
        };
        Counter.prototype.reset = function () {
            this.required = 0;
            this.loaded = 0;
        };
        return Counter;
    }());
    var Temp = /** @class */ (function () {
        function Temp() {
        }
        return Temp;
    }());
    function runCodeIsolated(javaScript) {
        var mockDocument = {
            write: devNull
        };
        var Fn = new Function('require', 'module', 'document', 'console', 'alert', 'playgroundRender', javaScript);
        var result = new Fn(window.require, window.module, mockDocument, parent.console, devNull, devNull); //call function with the "new" keyword so the "this" keyword is an instance
        return window.module.exports || result;
    }
    function runCodeGlobal(javaScript) {
        var script = document.createElement('script');
        var fragment = document.createDocumentFragment();
        fragment.textContent = javaScript;
        script.appendChild(fragment);
        head.appendChild(script);
    }
    function load(id, requiredById) {
        //bookkeeping
        if (!(id in loads)) {
            loads[id] = requiredById;
        }
        //first look for an existing node to reuse its src, so it loads from cache
        var script = document.getElementById(id);
        var src;
        if (script) {
            src = script.src;
            head.removeChild(script);
        }
        else {
            src = parent.MakerJsPlayground.filenameFromRequireId(id, true);
        }
        //always create a new element so it fires the onload event
        script = document.createElement('script');
        script.id = id;
        script.src = src;
        var timeout = setTimeout(function () {
            var errorDetails = {
                colno: 0,
                lineno: 0,
                message: 'Could not load module "' + id + '"' + (loads[id] ? ' required by "' + loads[id] + '"' : '') + '. Possibly a network error, or the file does not exist.',
                name: 'Load module failure'
            };
            //send error results back to parent window
            parent.MakerJsPlayground.processResult({ result: errorDetails });
        }, 5000);
        script.onload = function () {
            clearTimeout(timeout);
            //save the required module
            required[id] = window.module.exports;
            //reset so it does not get picked up again
            window.module.exports = null;
            //increment the counter
            counter.addLoaded();
        };
        head.appendChild(script);
    }
    function getLogsHtmls() {
        var logHtmls = [];
        if (logs.length > 0) {
            logHtmls.push('<div class="section"><div class="separator"><span class="console">console:</span></div>');
            logs.forEach(function (log) {
                var logDiv = new makerjs.exporter.XmlTag('div', { "class": "console" });
                logDiv.innerText = log;
                logHtmls.push(logDiv.toString());
            });
            logHtmls.push('</div>');
        }
        return logHtmls;
    }
    function getHtml() {
        return htmls.concat(getLogsHtmls()).join('');
    }
    MakerJsRequireIframe.getHtml = getHtml;
    function resetLog() {
        htmls = [];
        logs = [];
    }
    MakerJsRequireIframe.resetLog = resetLog;
    var head;
    var loads = {};
    var reloads = [];
    var previousId = null;
    var collection = true;
    var counter = new Counter();
    var htmls = [];
    var logs = [];
    var error = null;
    var errorReported = false;
    var required = {
        'makerjs': parent.makerjs,
        './../target/js/node.maker.js': parent.makerjs
    };
    //override document.write
    document.write = function (html) {
        htmls.push(html);
    };
    //override console.log
    console.log = function (entry) {
        switch (typeof entry) {
            case 'number':
                logs.push('' + entry);
                break;
            case 'string':
                logs.push(entry);
                break;
            default:
                logs.push(JSON.stringify(entry));
        }
    };
    window.onerror = function () {
        var errorEvent = window.event;
        var errorName = 'Error';
        if (error && error.name) {
            errorName = error.name;
        }
        var errorDetails = {
            colno: errorEvent.colno,
            lineno: errorEvent.lineno,
            message: errorEvent.message,
            name: errorName
        };
        //send error results back to parent window
        parent.MakerJsPlayground.processResult({ result: errorDetails });
        errorReported = true;
    };
    window.require = function (id) {
        if (collection && id === 'makerjs') {
            return mockMakerJs;
        }
        if (id in required) {
            //return cached required file
            return required[id];
        }
        counter.required++;
        if (previousId) {
            reloads.push(previousId);
        }
        load(id, previousId);
        previousId = id;
        //return an object that may be treated like a class
        return Temp;
    };
    window.module = { exports: null };
    window.onload = function () {
        head = document.getElementsByTagName('head')[0];
        //get the code from the editor
        var javaScript = parent.MakerJsPlayground.codeMirrorEditor.getDoc().getValue();
        var originalAlert = window.alert;
        window.alert = devNull;
        //run the code in 2 passes, first - to cache all required libraries, secondly the actual execution
        function complete2() {
            //reset any calls to document.write
            resetLog();
            //reinstate alert
            window.alert = originalAlert;
            var originalFn = parent.makerjs.exporter.toSVG;
            var captureExportedModel;
            parent.makerjs.exporter.toSVG = function (itemToExport, options) {
                if (parent.makerjs.isModel(itemToExport)) {
                    captureExportedModel = itemToExport;
                }
                else if (Array.isArray(itemToExport)) {
                    captureExportedModel = {};
                    itemToExport.forEach(function (x, i) {
                        if (makerjs.isModel(x)) {
                            captureExportedModel.models = captureExportedModel.models || {};
                            captureExportedModel.models[i] = x;
                        }
                        if (makerjs.isPath(x)) {
                            captureExportedModel.paths = captureExportedModel.paths || {};
                            captureExportedModel.paths[i] = x;
                        }
                    });
                }
                else if (parent.makerjs.isPath(itemToExport)) {
                    captureExportedModel = { paths: { "0": itemToExport } };
                }
                return originalFn(itemToExport, options);
            };
            //when all requirements are collected, run the code again, using its requirements
            runCodeGlobal(javaScript);
            parent.makerjs.exporter.toSVG = originalFn;
            if (errorReported)
                return;
            //yield thread for the script tag to execute
            setTimeout(function () {
                var model;
                if (captureExportedModel) {
                    model = captureExportedModel;
                }
                else {
                    //restore properties from the "this" keyword
                    model = {};
                    var props = ['layer', 'models', 'notes', 'origin', 'paths', 'type', 'units', 'caption', 'exporterOptions'];
                    var hasProps = false;
                    for (var i = 0; i < props.length; i++) {
                        var prop = props[i];
                        if (prop in window) {
                            model[prop] = window[prop];
                            hasProps = true;
                        }
                    }
                    if (!hasProps) {
                        model = null;
                    }
                }
                var orderedDependencies = [];
                var scripts = head.getElementsByTagName('script');
                for (var i = 0; i < scripts.length; i++) {
                    if (scripts[i].hasAttribute('id')) {
                        orderedDependencies.push(scripts[i].id);
                    }
                }
                //send results back to parent window
                parent.MakerJsPlayground.processResult({ html: getHtml(), result: window.module.exports || model, orderedDependencies: orderedDependencies, paramValues: window.paramValues });
            }, 0);
        }
        ;
        function complete1() {
            if (reloads.length) {
                counter.complete = complete2;
                counter.required += reloads.length;
                for (var i = reloads.length; i--;) {
                    load(reloads[i], null);
                }
            }
            else {
                complete2();
            }
        }
        counter.complete = complete1;
        try {
            //run for the collection pass
            runCodeIsolated(javaScript);
        }
        catch (e) {
            //save the error
            error = e;
        }
        collection = false;
        //if there were no requirements, fire the complete function manually
        if (counter.required == 0) {
            counter.complete();
        }
    };
    window.playgroundRender = function (result) {
        parent.MakerJsPlayground.processResult({ html: getHtml(), result: result, paramValues: window.paramValues });
    };
    function devNull() { }
    var mockMakerJs = {};
    function mockWalk(src, dest) {
        for (var id in src) {
            switch (typeof src[id]) {
                case 'function':
                    dest[id] = devNull;
                    break;
                case 'object':
                    dest[id] = {};
                    mockWalk(src[id], dest[id]);
                    break;
                default:
                    dest[id] = src[id];
                    break;
            }
        }
    }
    mockWalk(parent.makerjs, mockMakerJs);
})(MakerJsRequireIframe || (MakerJsRequireIframe = {}));
parent.MakerJsPlayground.mainThreadConstructor = function (kit, params) {
    MakerJsRequireIframe.resetLog();
    return {
        model: parent.makerjs.kit.construct(kit, params),
        html: MakerJsRequireIframe.getHtml()
    };
};
//# sourceMappingURL=require-iframe.js.map