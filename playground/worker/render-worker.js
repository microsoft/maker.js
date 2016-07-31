/*
    Some libraries are not web-worker aware, they are either browser or Node.
    A web worker should use the browser flavor.
    So trick libs into thinking this is a browser, by existence of a 'window' in the global space.
*/
var window = {
    alert: function () {
    }
};
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
importScripts('../../target/js/browser.maker.js', '../../external/bezier-js/bezier.js', '../../external/opentype/opentype.js');
var makerjs = require('makerjs');
module['makerjs'] = makerjs;
module['./../target/js/node.maker.js'] = makerjs;
function runCodeIsolated(javaScript) {
    var Fn = new Function('require', 'module', 'playgroundRender', 'alert', 'opentype', javaScript);
    var result = new Fn(module.require, module, playgroundRender, window.alert, window['opentype']); //call function with the "new" keyword so the "this" keyword is an instance
    return module.exports || result;
}
function playgroundRender(model) {
    var response = {
        requestId: activeRequestId,
        model: model
    };
    postMessage(response);
}
function postError(requestId, error) {
    var response = {
        requestId: requestId,
        error: error
    };
    postMessage(response);
}
var kit;
var activeRequestId;
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
        activeRequestId = request.requestId;
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