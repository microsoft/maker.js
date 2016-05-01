
var module = {} as NodeModule;

module.require = (id: string): any => {

    if (id in module) {
        return module[id];
    }

    return null;
};

importScripts("../../target/js/browser.maker.js");

var makerjs: typeof MakerJs = require('makerjs');
module['makerjs'] = makerjs;

function runCodeIsolated(javaScript: string) {
    var Fn: any = new Function('require', 'module', javaScript);
    var result: any = new Fn(module.require, module); //call function with the "new" keyword so the "this" keyword is an instance

    return module.exports || result;
}

var kit: MakerJs.IKit;

onmessage = (ev: MessageEvent) => {

    var request = ev.data as MakerJsPlaygroundRender.IRenderModel;

    if (request.orderedDependencies) {
        for (var id in request.orderedDependencies) {
            importScripts(request.orderedDependencies[id]);
            module[id] = module.exports;
        }
    }

    if (request.javaScript) {
        kit = runCodeIsolated(request.javaScript);
    }

    var result: MakerJsPlaygroundRender.IResponse = {
        requestId: request.requestId,
        model: makerjs.kit.construct(kit, request.paramValues)
    };

    postMessage(result);

};
