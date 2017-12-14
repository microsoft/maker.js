namespace MakerJs.exporter {

    /**
     * @private
     */
    interface IPathDirectionalFunction {
        (pathValue: IPath, pathDirectional: IPathDirectional): void;
    }

    /**
     * @private
     */
    interface IPathDirectionalFunctionMap {
        [type: string]: IPathDirectionalFunction;
    }

    /**
     * @private
     */
    function wrap(prefix: string, content: string, condition: any): string {
        if (condition) {
            return prefix + '(' + content + ')';
        } else {
            return content;
        }
    }

    /**
     * @private
     */
    function facetSizeToResolution(arcOrCircle: IPathCircle, facetSize: number): number {
        if (!facetSize) return;

        var circle = new paths.Circle([0, 0], arcOrCircle.radius);

        var length = measure.pathLength(circle);
        if (!length) return;

        return length / facetSize;
    }

    /**
     * @private
     */
    function pathsToOpenJsCad(modelContext: IModel, facetSize?: number): string {

        var head = '';
        var tail = '';
        var first = true;
        var exit = false;
        var reverseTail = false;

        var beginMap: IPathDirectionalFunctionMap = {};

        beginMap[pathType.Circle] = function (circle: IPathCircle, dirPath: IPathDirectional) {
            var circleOptions: CSG.ICircleOptions = {
                center: <number[]>point.rounded(circle.origin),
                radius: circle.radius,
                resolution: facetSizeToResolution(circle, facetSize)
            };
            head = wrap('CAG.circle', JSON.stringify(circleOptions), true);
            exit = true;
        };

        beginMap[pathType.Line] = function (line: IPathLine, dirPath: IPathDirectional) {
            head = wrap('new CSG.Path2D', JSON.stringify(dirPath.reversed ? [dirPath.endPoints[1], dirPath.endPoints[0]] : dirPath.endPoints), true);
        };

        beginMap[pathType.Arc] = function (arc: IPathArc, dirPath: IPathDirectional) {
            var endAngle = angle.ofArcEnd(arc);
            if (dirPath.reversed) {
                reverseTail = true;
            }
            var arcOptions: CSG.IArcOptions = {
                center: <number[]>point.rounded(arc.origin),
                radius: arc.radius,
                startangle: arc.startAngle,
                endangle: endAngle,
                resolution: facetSizeToResolution(arc, facetSize)
            };
            head = wrap('new CSG.Path2D.arc', JSON.stringify(arcOptions), true);
        };

        var appendMap: IPathDirectionalFunctionMap = {};

        appendMap[pathType.Line] = function (line: IPathLine, dirPath: IPathDirectional) {
            var reverse = (reverseTail != dirPath.reversed);
            var endPoint = point.rounded(dirPath.endPoints[reverse ? 0 : 1]);
            append(wrap('.appendPoint', JSON.stringify(endPoint), true));
        };

        appendMap[pathType.Arc] = function (arc: IPathArc, dirPath: IPathDirectional) {
            var reverse = (reverseTail != dirPath.reversed);
            var endAngle = angle.ofArcEnd(arc);
            var arcOptions: CSG.IEllpiticalArcOptions = {
                radius: arc.radius,
                clockwise: reverse,
                large: Math.abs(endAngle - arc.startAngle) > 180,
                resolution: facetSizeToResolution(arc, facetSize)
            };
            var endPoint = point.rounded(dirPath.endPoints[reverse ? 0 : 1]);
            append(wrap('.appendArc', JSON.stringify(endPoint) + ',' + JSON.stringify(arcOptions), true));
        }

        function append(s: string) {
            if (reverseTail) {
                tail = s + tail;
            } else {
                tail += s;
            }
        }

        for (var pathId in modelContext.paths) {
            var pathContext = modelContext.paths[pathId];

            var fn = first ? beginMap[pathContext.type] : appendMap[pathContext.type];

            if (fn) {
                fn(pathContext, <IPathDirectional>pathContext);
            }

            if (exit) {
                return head;
            }

            first = false;
        }

        return head + tail + '.close().innerToCAG()';
    }

    export function toOpenJsCad(modelToExport: IModel, options?: IOpenJsCadOptions): string;
    export function toOpenJsCad(pathsToExport: IPath[], options?: IOpenJsCadOptions): string;
    export function toOpenJsCad(pathToExport: IPath, options?: IOpenJsCadOptions): string;

    /**
     * Creates a string of JavaScript code for execution with the OpenJsCad engine.
     * 
     * @param modelToExport Model object to export.
     * @param options Export options object.
     * @param options.extrusion Height of 3D extrusion.
     * @param options.resolution Size of facets.
     * @returns String of JavaScript containing a main() function for OpenJsCad.
     */
    export function toOpenJsCad(itemToExport: any, options?: IOpenJsCadOptions): string {
        if (!itemToExport) return '';

        var modelToExport: IModel;
        var all = '';
        var depth = 0;
        var depthModel: IModel;

        var opts: IOpenJsCadOptions = {
            extrusion: 1,
            pointMatchingDistance: .005,
            functionName: 'main'
        };

        extendObject(opts, options);

        if (isModel(itemToExport)) {
            modelToExport = itemToExport;
        } else {
            if (Array.isArray(itemToExport)) {
                modelToExport = { paths: {} };
                itemToExport.forEach((p, i) => modelToExport.paths[i] = p);
            } else {
                modelToExport = { paths: { 0: itemToExport } };
            }
        }

        if (modelToExport.exporterOptions) {
            extendObject(opts, modelToExport.exporterOptions['toOpenJsCad']);
        }

        //pass options back into calling object
        extendObject(options, opts);

        if (opts && opts.modelMap) {
            all = exportFromOptionsMap(modelToExport, opts.modelMap);
        }

        if (!all) {

            var result: string[] = [];
            var loops = model.findLoops(modelToExport, opts);

            while (depthModel = loops.models[depth]) {
                var union = '';
                for (var modelId in depthModel.models) {
                    var subModel = depthModel.models[modelId];
                    union += wrap('.union', pathsToOpenJsCad(subModel, opts.facetSize), union);
                }
                var operator = (depth % 2 == 0) ? '.union' : '.subtract';
                result.push(wrap(operator, union, result.length));
                depth++;
            }

            if (result.length === 0) {
                throw ('No closed geometries found.');
            }

            var extrudeOptions: CAG_extrude_options = { offset: [0, 0, opts.extrusion] };
            result.push(wrap('.extrude', JSON.stringify(extrudeOptions), true));

            all = 'return ' + result.join('');
        }

        return 'function ' + opts.functionName + '(){' + all + ';}';
    }

    function exportFromOptionsMap(modelToExport: IModel, optionsMap: IOpenJsCadOptionsMap): string {

        if (!modelToExport.models) return;

        var result: string[] = [];
        var union: string[] = [];
        var i = 0;

        for (var key in optionsMap) {
            var fName = 'f' + i;

            var options = optionsMap[key];
            options.functionName = fName;

            var childModel = modelToExport.models[key];
            if (childModel) {
                result.push(toOpenJsCad(childModel, options));
                union.push('(' + fName + '())');
            }
            i++;
        }

        if (!result.length) return;

        result.push('return ' + union.join('.union'));

        return result.join(' ');
    }

    /**
     * Executes a JavaScript string with the OpenJsCad engine - converts 2D to 3D.
     * 
     * @param modelToExport Model object to export.
     * @param options Export options object.
     * @param options.extrusion Height of 3D extrusion.
     * @param options.resolution Size of facets.
     * @returns String of STL format of 3D object.
     */
    export function toSTL(modelToExport: IModel, options: IOpenJsCadOptions = {}): string {
        if (!modelToExport) return '';

        var container: any;

        switch (environment) {

            case environmentTypes.BrowserUI:
                if (!('CAG' in window) || !('CSG' in window)) {
                    throw "OpenJsCad library not found. Download http://maker.js.org/external/OpenJsCad/csg.js and http://maker.js.org/external/OpenJsCad/formats.js to your website and add script tags.";
                }
                container = window;
                break;

            case environmentTypes.NodeJs:
                //this can throw if not found
                container = eval('require("openjscad-csg")');
                break;

            case environmentTypes.WebWorker:
                if (!('CAG' in self) || !('CSG' in self)) {
                    throw "OpenJsCad library not found. Download http://maker.js.org/external/OpenJsCad/csg.js and http://maker.js.org/external/OpenJsCad/formats.js to your website and add an importScripts statement.";
                }
                container = self;
                break;
        }

        var script = toOpenJsCad(modelToExport, options);
        script += 'return ' + options.functionName + '();';

        var f = new Function('CAG', 'CSG', script);

        var csg = f(container.CAG, container.CSG) as CSG;

        return csg.toStlString();
    }

    /**
     * @private
     */
    interface IAdd {
        cag: jscad.CAG;
        subtracts: jscad.CAG[][];
    }

    /**
     * Converts a model to a @jscad/csg object - 2D to 2D.
     * 
     * Example:
     * ```
     * //First, use npm install @jscad/csg from the command line in your jscad project
     * //Create a CAG instance from a model.
     * var { CAG } = require('@jscad/csg'); 
     * var model = new makerjs.models.Ellipse(70, 40);
     * var cag = makerjs.exporter.toJscadCAG(CAG, model, {maxArcFacet: 1});
     * ```
     * 
     * @param jscadCAG @jscad/csg CAG engine.
     * @param modelToExport Model object to export.
     * @param options Optional options object.
     * @param options.byLayers Optional flag to separate chains by layers.
     * @param options.pointMatchingDistance Optional max distance to consider two points as the same.
     * @param options.maxArcFacet The maximum length between points on an arc or circle.
     * @param options.statusCallback Optional callback function to get the percentage complete.
     * @returns jscad CAG object in 2D, or a map (keyed by layer id) of jscad CAG objects - if options.byLayers is true.
     */
    export function toJscadCAG(jscadCAG: typeof jscad.CAG, modelToExport: IModel, jsCadCagOptions: IJsCadCagOptions = {}) {
        const adds: { [layerId: string]: IAdd[] } = {};
        const status = { total: 0, complete: 0 };

        function unionize(phaseStart: number, phaseSpan: number, arr: jscad.CAG[]) {
            let result = arr.shift();
            arr.forEach(el => result = result.union(el));
            status.complete++;

            jsCadCagOptions.statusCallback && jsCadCagOptions.statusCallback({ progress: phaseStart + phaseSpan * status.complete / status.total });

            return result;
        }

        function chainToCag(c: IChain) {
            const keyPoints = chain.toKeyPoints(c, jsCadCagOptions.maxArcFacet);
            keyPoints.push(keyPoints[0]);
            return jscadCAG.fromPoints(keyPoints);
        }

        function subtractChains(layerId: string, cs: IChain[]) {
            const subtracts: jscad.CAG[] = [];
            cs.forEach(c => {
                if (!c.endless) return;
                if (c.contains) {
                    addChains(layerId, c.contains);
                }
                status.total++;
                subtracts.unshift(chainToCag(c));
            });
            return subtracts;
        }

        function addChains(layerId: string, cs: IChain[]) {
            cs.forEach(c => {
                if (!c.endless) return;
                const add: IAdd = { cag: chainToCag(c), subtracts: [] };
                if (c.contains) {
                    const subtracts = subtractChains(layerId, c.contains);
                    if (subtracts.length > 0) {
                        add.subtracts.push(subtracts);
                    }
                }
                status.total++;
                if (!(layerId in adds)) {
                    adds[layerId] = [];
                }
                adds[layerId].unshift(add);
            });
        }

        const options: IFindChainsOptions = {
            pointMatchingDistance: jsCadCagOptions.pointMatchingDistance,
            byLayers: jsCadCagOptions.byLayers,
            contain: true
        };

        jsCadCagOptions.statusCallback && jsCadCagOptions.statusCallback({ progress: 25 });

        const chainsResult = model.findChains(modelToExport, options);
        if (Array.isArray(chainsResult)) {
            addChains('', chainsResult);
        } else {
            for (let layerId in chainsResult) {
                addChains(layerId, chainsResult[layerId]);
            }
        }

        jsCadCagOptions.statusCallback && jsCadCagOptions.statusCallback({ progress: 50 });

        let closedCount = 0;
        for (let layerId in adds) {
            closedCount += adds[layerId].length;
        }
        if (closedCount === 0) {
            jsCadCagOptions.statusCallback && jsCadCagOptions.statusCallback({ progress: 100 });
            throw ('No closed geometries found.');
        }

        const resultMap: { [layerId: string]: jscad.CAG } = {};

        for (let layerId in adds) {
            const flatAdds = adds[layerId].map(add => {
                let result = add.cag;
                add.subtracts.forEach(subtract => {
                    const union = unionize(50, 50, subtract);
                    result = result.subtract(union);
                })
                return result;
            });
            resultMap[layerId] = unionize(50, 50, flatAdds);
        }

        jsCadCagOptions.statusCallback && jsCadCagOptions.statusCallback({ progress: 100 });

        return options.byLayers ? resultMap : resultMap[''];
    }

    /**
     * Converts a model to a @jscad/csg object - 2D to 3D.
     * 
     * Example:
     * ```
     * //First, use npm install @jscad/csg from the command line in your jscad project
     * //Create a CSG instance from a model.
     * var { CAG } = require('@jscad/csg');
     * var model = new makerjs.models.Ellipse(70, 40);
     * var csg = makerjs.exporter.toJscadCSG(CAG, model, {maxArcFacet: 1, extrude: 10});
     * ```
     * 
     * @param jscadCAG @jscad/csg CAG engine.
     * @param modelToExport Model object to export.
     * @param options Optional options object.
     * @param options.byLayers Optional flag to separate chains by layers.
     * @param options.pointMatchingDistance Optional max distance to consider two points as the same.
     * @param options.maxArcFacet The maximum length between points on an arc or circle.
     * @param options.statusCallback Optional callback function to get the percentage complete.
     * @param options.extrude Optional default extrusion distance.
     * @param options.layerOptions Optional object map of options per layer, keyed by layer name. Each value for a key is an object with 'extrude' and 'z' properties.
     * @returns jscad CAG object in 2D, or a map (keyed by layer id) of jscad CAG objects - if options.byLayers is true.
     */
    export function toJsCadCSG(jscadCAG: typeof jscad.CAG, modelToExport: IModel, options: IJsCadCsgOptions = {}) {
       
        const originalCb = options.statusCallback;

        function makePhasedCallback(phaseStart: number, phaseSpan: number) {
            return function statusCallback(status) {
                originalCb({ progress: phaseStart + status.progress * phaseSpan / 100 });
            }
        }

        function getDefinedNumber(a: number, b: number) {
            if (isNumber(a)) return a;
            return b;
        }

        if (modelToExport.exporterOptions) {
            extendObject(options, modelToExport.exporterOptions['toJsCadCSG']);
        }

        options.byLayers = options.byLayers || (options.layerOptions && true);
        options.statusCallback = makePhasedCallback(0, 50);

        const cagResult = toJscadCAG(jscadCAG, modelToExport, options);
        const csgs: jscad.CSG[] = [];

        function addCagToCsg(cag: jscad.CAG, extrude: number, z: number) {
            var csg = cag.extrude({ offset: [0, 0, extrude] });
            if (z) {
                csg = csg.translate([0, 0, z]);
            }
            csgs.push(csg);
        }

        if (options.byLayers) {
            for (let layerId in cagResult as { [layerId: string]: jscad.CAG }) {
                let layerOptions = options.layerOptions[layerId];
                addCagToCsg(cagResult[layerId], layerOptions.extrude || options.extrude, getDefinedNumber(layerOptions.z, options.z));
            }
        } else {
            addCagToCsg(cagResult as jscad.CAG, options.extrude, options.z);
        }

        options.statusCallback = makePhasedCallback(50, 100);

        const status = { total: csgs.length - 1, complete: 0 };

        let result = csgs.shift();
        csgs.forEach((el, i) => {
            result = result.union(el);
            status.complete++;
            options.statusCallback({ progress: status.complete / status.total });
        });

        return result;
    }

    /**
     * OpenJsCad export options.
     */
    export interface IOpenJsCadOptions extends IFindLoopsOptions, IExportOptions {

        /**
         * Optional depth of 3D extrusion.
         */
        extrusion?: number;

        /**
         * Optional size of curve facets.
         */
        facetSize?: number;

        /**
         * Optional override of function name, default is "main".
         */
        functionName?: string;

        /**
         * Optional options applied to specific first-child models by model id.
         */
        modelMap?: IOpenJsCadOptionsMap;
    }

    /**
     * Map of OpenJsCad export options.
     */
    export interface IOpenJsCadOptionsMap {
        [modelId: string]: IOpenJsCadOptions;
    }

    /**
     * JsCad CAG export options.
     */
    export interface IJsCadCagOptions extends IExportOptions, IPointMatchOptions {

        /**
         * Flag to separate chains by layers.
         */
        byLayers?: boolean;

        /**
         * The maximum length between points on an arc or circle.
         */
        maxArcFacet?: number;

        /**
         * Optional callback to get status during the export.
         */
        statusCallback?: IStatusCallback;
    }

    export interface IJsCadExtrudeOptions {

        /**
         * Optional depth of 3D extrusion.
         */
        extrude?: number;

        /**
         * Optional depth of 3D extrusion.
         */
        z?: number;
    }

    export interface IJsCadCsgOptions extends IJsCadCagOptions, IJsCadExtrudeOptions {

        /**
         * SVG options per layer.
         */
        layerOptions?: { [layerId: string]: IJsCadExtrudeOptions };
    }
}
