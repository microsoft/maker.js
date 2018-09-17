interface Window {
    collectRequire: NodeRequireFunction;
    require: NodeRequireFunction;
    module: NodeModule;
    MakerJsPlayground: typeof MakerJsPlayground;    //this is not in this window but it is in the parent
    makerjs: typeof MakerJs;
    playgroundRender: Function;
    paramValues: any[];
}

namespace MakerJsRequireIframe {

    interface IRequireMap {
        [id: string]: any;
    }

    interface IStringMap {
        [id: string]: string;
    }

    class Counter {
        public required = 0;
        public loaded = 0;
        public complete = function () { };

        public addLoaded() {
            this.loaded++;

            if (this.loaded == this.required) {
                this.complete();
            }
        }

        public reset() {
            this.required = 0;
            this.loaded = 0;
        }
    }

    class Temp {
    }

    function runCodeIsolated(javaScript: string) {
        var mockDocument = {
            write: devNull
        };
        var Fn: any = new Function('require', 'module', 'document', 'console', 'alert', 'playgroundRender', javaScript);
        var result: any = new Fn(window.require, window.module, mockDocument, parent.console, devNull, devNull); //call function with the "new" keyword so the "this" keyword is an instance

        return window.module.exports || result;
    }

    function runCodeGlobal(javaScript: string) {
        var script: HTMLScriptElement = document.createElement('script');

        var fragment = document.createDocumentFragment();
        fragment.textContent = javaScript;

        script.appendChild(fragment);

        head.appendChild(script);
    }

    function load(id: string, requiredById: string) {

        //bookkeeping
        if (!(id in loads)) {
            loads[id] = requiredById;
        }

        //first look for an existing node to reuse its src, so it loads from cache
        var script = document.getElementById(id) as HTMLScriptElement;
        var src: string;

        if (script) {
            src = script.src;
            head.removeChild(script);
        } else {
            src = parent.MakerJsPlayground.filenameFromRequireId(id, true);
        }

        //always create a new element so it fires the onload event
        script = document.createElement('script');
        script.id = id;
        script.src = src;

        var timeout = setTimeout(function () {

            var errorDetails: MakerJsPlayground.IJavaScriptErrorDetails = {
                colno: 0,       //TBD we might be able to get this by parsing the code of loads[id] and searching for 'require'
                lineno: 0,
                message: 'Could not load module "' + id + '"' + (loads[id] ? ' required by "' + loads[id] + '"' : '') + '. Possibly a network error, or the file does not exist.',
                name: 'Load module failure'
            };

            //send error results back to parent window
            parent.MakerJsPlayground.processResult({ result: errorDetails });

        }, 5000);

        script.onload = () => {

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

        var logHtmls: string[] = [];

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

    export function getHtml() {
        return htmls.concat(getLogsHtmls()).join('');
    }

    export function resetLog() {
        htmls = [];
        logs = [];
    }

    var head: HTMLHeadElement;
    var loads: IStringMap = {};
    var reloads: string[] = [];
    var previousId: string = null;
    var collection = true;
    var counter = new Counter();
    var htmls: string[] = [];
    var logs: string[] = [];
    var error: Error = null;
    var errorReported = false;
    var required: IRequireMap = {
        'makerjs': parent.makerjs,
        './../target/js/node.maker.js': parent.makerjs
    };

    //override document.write
    document.write = function (html: string) {
        htmls.push(html);
    };

    //override console.log
    console.log = function (entry: any) {
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
        var errorEvent = window.event as ErrorEvent;
        var errorName = 'Error';

        if (error && error.name) {
            errorName = error.name;
        }

        var errorDetails: MakerJsPlayground.IJavaScriptErrorDetails = {
            colno: errorEvent.colno,
            lineno: errorEvent.lineno,
            message: errorEvent.message,
            name: errorName
        };

        //send error results back to parent window
        parent.MakerJsPlayground.processResult({ result: errorDetails });
        errorReported = true;
    };

    window.require = function (id: string) {

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

    window.module = { exports: null } as NodeModule;

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
            var captureExportedModel: MakerJs.IModel;

            parent.makerjs.exporter.toSVG = function (itemToExport: any, options?: MakerJs.exporter.ISVGRenderOptions): string {

                if (parent.makerjs.isModel(itemToExport)) {
                    captureExportedModel = itemToExport as MakerJs.IModel;

                } else if (Array.isArray(itemToExport)) {
                    captureExportedModel = {};

                    itemToExport.forEach((x, i) => {
                        if (makerjs.isModel(x)) {
                            captureExportedModel.models = captureExportedModel.models || {};
                            captureExportedModel.models[i] = x;
                        }
                        if (makerjs.isPath(x)) {
                            captureExportedModel.paths = captureExportedModel.paths || {};
                            captureExportedModel.paths[i] = x;
                        }
                    });


                } else if (parent.makerjs.isPath(itemToExport)) {
                    captureExportedModel = { paths: { "0": <MakerJs.IPath>itemToExport } };
                }

                return originalFn(itemToExport, options);
            };

            //when all requirements are collected, run the code again, using its requirements
            runCodeGlobal(javaScript);

            parent.makerjs.exporter.toSVG = originalFn;

            if (errorReported) return;

            //yield thread for the script tag to execute
            setTimeout(function () {

                var model: MakerJs.IModel;

                if (captureExportedModel) {
                    model = captureExportedModel;
                } else {

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

                var orderedDependencies: string[] = [];
                var scripts = head.getElementsByTagName('script');
                for (var i = 0; i < scripts.length; i++) {
                    if (scripts[i].hasAttribute('id')) {
                        orderedDependencies.push(scripts[i].id);
                    }
                }

                //send results back to parent window
                parent.MakerJsPlayground.processResult({ html: getHtml(), result: window.module.exports || model, orderedDependencies: orderedDependencies, paramValues: window.paramValues });

            }, 0);

        };

        function complete1() {

            if (reloads.length) {
                counter.complete = complete2;

                counter.required += reloads.length;

                for (var i = reloads.length; i--;) {
                    load(reloads[i], null);
                }

            } else {
                complete2();
            }
        }

        counter.complete = complete1;

        try {

            //run for the collection pass
            runCodeIsolated(javaScript);

        } catch (e) {

            //save the error
            error = e;

        }

        collection = false;

        //if there were no requirements, fire the complete function manually
        if (counter.required == 0) {
            counter.complete();
        }
    }

    window.playgroundRender = function (result) {
        parent.MakerJsPlayground.processResult({ html: getHtml(), result: result, paramValues: window.paramValues });
    }

    function devNull() { }

    var mockMakerJs = {} as typeof MakerJs;

    function mockWalk(src: Object, dest: Object) {

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

}

parent.MakerJsPlayground.mainThreadConstructor = function (kit, params) {
    MakerJsRequireIframe.resetLog();
    return {
        model: parent.makerjs.kit.construct(kit, params),
        html: MakerJsRequireIframe.getHtml()
    };
}; 
