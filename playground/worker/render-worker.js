/* module system */
var module = {};
var requireError = '';
module.require = function (id) {
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
var makerjs = require('makerjs');
module['makerjs'] = makerjs;
module['./../target/js/node.maker.js'] = makerjs;
function runCodeIsolated(javaScript) {
    var Fn = new Function('require', 'module', javaScript);
    var result = new Fn(module.require, module); //call function with the "new" keyword so the "this" keyword is an instance
    return module.exports || result;
}
function postError(requestId, error) {
    var response = {
        requestId: requestId,
        error: error
    };
    postMessage(response);
}
var kit;
onmessage = function (ev) {
    var request = ev.data;
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
    }
    else {
        try {
            var model = makerjs.kit.construct(kit, request.paramValues);
            var response = {
                requestId: request.requestId,
                model: model
            };
            postMessage(response);
        }
        catch (e) {
            postError(request.requestId, 'runtime error');
        }
    }
};
//# sourceMappingURL=render-worker.js.map