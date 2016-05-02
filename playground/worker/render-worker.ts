
/* module system */

var module = {} as NodeModule;
var requireError = '';

module.require = (id: string): any => {

    if (id in module) {
        return module[id];
    }

    requireError = 'could not require module "' + id + '"';

    return null;
};

function load(id, src) {
    importScripts(src);
    module[id] = module.exports;
}

//add the makerjs module
importScripts('../../target/js/browser.maker.js');
var makerjs: typeof MakerJs = require('makerjs');
module['makerjs'] = makerjs;
module['./../target/js/node.maker.js'] = makerjs;

function runCodeIsolated(javaScript: string) {
    var Fn: any = new Function('require', 'module', javaScript);
    var result: any = new Fn(module.require, module); //call function with the "new" keyword so the "this" keyword is an instance

    return module.exports || result;
}

function postError(requestId: number, error: string) {

    var response: MakerJsPlaygroundRender.IRenderResponse = {
        requestId: requestId,
        error: error
    };

    postMessage(response);
}

var kit: MakerJs.IKit;

onmessage = (ev: MessageEvent) => {

    var request = ev.data as MakerJsPlaygroundRender.IRenderRequest;

    if (request.orderedDependencies) {
        for (var id in request.orderedDependencies) {
            load(id, request.orderedDependencies[id]);
        }
    }

    if (requireError) {
        postError(request.requestId, requireError);
        return;
    }

    if (request.javaScript) {
        kit = runCodeIsolated(request.javaScript);
    }

    if (requireError) {
        postError(request.requestId, requireError);
        return;
    }

    if (!kit) {
        postError(request.requestId, 'kit was not created');

    } else {
        try {
            var model = makerjs.kit.construct(kit, request.paramValues);

            var response: MakerJsPlaygroundRender.IRenderResponse = {
                requestId: request.requestId,
                model: model
            };

            postMessage(response);

        } catch (e) {
            postError(request.requestId, 'runtime error');
        }
    }

};
