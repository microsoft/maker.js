/// <reference path="../typings/tsd.d.ts" />
/// <reference path="playground.ts" />

interface MockNodeModule {
    exports?: any;
}

interface Window {
    require: NodeRequireFunction;
    module: MockNodeModule;
    MakerJsPlayground: typeof MakerJsPlayground;
    makerjs: typeof MakerJs;
}

module MakerJsRequireIframe {

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

    class Dummy {
    }

    function runCode(javaScript) {
        var Fn: any = new Function('require', 'module', 'document', 'console', javaScript);
        var result: any = new Fn(window.require, window.module, document, parent.console); //call function with the "new" keyword so the "this" keyword is an instance

        return window.module.exports || result;
    }

    var counter = new Counter();
    var html = '';
    var required = {
        'makerjs': parent.makerjs,
        './../target/js/node.maker.js': parent.makerjs
    };

    //override document.write
    document.write = function (markup) {
        html += markup;
    };

    window.onerror = function (e) {
        var ee = e;
    };

    window.require = function (id: string) {

        if (id in required) {
            //return cached required file
            return required[id];
        }

        counter.required++;

        var script: HTMLScriptElement = document.createElement('script');
        script.id = id;
        script.src = parent.MakerJsPlayground.filenameFromRequireId(id) + '?' + new Date().getMilliseconds();

        script.onload = () => {
            
            //save the requred module
            required[id] = window.module.exports;

            //reset so it does not get picked up again
            window.module.exports = null;

            //increment the counter
            counter.addLoaded();
        };

        document.getElementsByTagName('head')[0].appendChild(script);

        //return an object that may be treated like a class
        return Dummy;
    };

    window.module = { exports: null };

    window.onload = function () {

        //get the code from the editor
        var javaScript = parent.MakerJsPlayground.codeMirrorEditor.getDoc().getValue();

        var originalAlert = window.alert;
        window.alert = function () { };

        //run the code in 2 passes, first - to cache all required libraries, secondly the actual execution

        counter.complete = function () {
            
            //reset any calls to document.write
            html = '';

            //reinstate alert
            window.alert = originalAlert;

            //when all requirements are collected, run the code again, using its requirements
            var result = runCode(javaScript);

            //send results back to parent window
            parent.MakerJsPlayground.processResult(html, result);
        };

        //run for the collection pass
        runCode(javaScript);

        //if there were no requirements, fire the complete function manually
        if (counter.required == 0) {
            counter.complete();
        }
    }
}
