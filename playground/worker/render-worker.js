var module = {};
module.require = function (id) {
    if (id in module) {
        return module[id];
    }
    return null;
};
importScripts("../../target/js/browser.maker.js");
var makerjs = require('makerjs');
module['makerjs'] = makerjs;
function runCodeIsolated(javaScript) {
    var Fn = new Function('require', 'module', javaScript);
    var result = new Fn(module.require, module); //call function with the "new" keyword so the "this" keyword is an instance
    return module.exports || result;
}
var kit;
onmessage = function (ev) {
    var request = ev.data;
    if (request.orderedDependencies) {
        for (var id in request.orderedDependencies) {
            importScripts(request.orderedDependencies[id]);
            module[id] = module.exports;
        }
    }
    if (request.javaScript) {
        kit = runCodeIsolated(request.javaScript);
    }
    var result = {
        requestId: request.requestId,
        model: makerjs.kit.construct(kit, request.paramValues)
    };
    postMessage(result);
};
//# sourceMappingURL=render-worker.js.map