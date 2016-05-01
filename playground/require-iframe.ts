interface Window {
    require: NodeRequireFunction;
    module: NodeModule;
    MakerJsPlayground: typeof MakerJsPlayground;
    makerjs: typeof MakerJs;
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
        var Fn: any = new Function('require', 'module', 'document', 'console', javaScript);
        var result: any = new Fn(window.require, window.module, document, parent.console); //call function with the "new" keyword so the "this" keyword is an instance

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
            parent.MakerJsPlayground.processResult('', errorDetails);

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

    var head: HTMLHeadElement;
    var loads: IStringMap = {};
    var reloads: string[] = [];
    var previousId: string = null;
    var counter = new Counter();
    var html = '';
    var error: Error = null;
    var required: IRequireMap = {
        'makerjs': parent.makerjs,
        './../target/js/node.maker.js': parent.makerjs
    };

    //override document.write
    document.write = function (markup: string) {
        html += markup;
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
        parent.MakerJsPlayground.processResult('', errorDetails);
    };

    window.require = function (id: string) {

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
        window.alert = function () { };

        //run the code in 2 passes, first - to cache all required libraries, secondly the actual execution

        function complete2 () {

            if (error) {

                runCodeGlobal(javaScript);

            } else {
                //reset any calls to document.write
                html = '';

                //reinstate alert
                window.alert = originalAlert;

                //when all requirements are collected, run the code again, using its requirements
                runCodeGlobal(javaScript);

                //yield thread for the script tag to execute
                setTimeout(function () { 

                    //restore properties from the "this" keyword
                    var model: MakerJs.IModel = {};
                    var props = ['layer', 'models', 'notes', 'origin', 'paths', 'type', 'units'];
                    for (var i = 0; i < props.length; i++) {
                        var prop = props[i];
                        if (prop in window) {
                            model[prop] = window[prop];
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
                    parent.MakerJsPlayground.processResult(html, window.module.exports || model, orderedDependencies);

                }, 0);

            }
        };

        function complete1 () {

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

        //if there were no requirements, fire the complete function manually
        if (counter.required == 0) {
            counter.complete();
        }
    }
}
