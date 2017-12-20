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

        return Math.ceil(length / facetSize);
    }

    /**
     * @private
     */
    function pathsToOpenJsCad(modelContext: IModel, accuracy?: number, facetSize?: number): string {

        var head = '';
        var tail = '';
        var first = true;
        var exit = false;
        var reverseTail = false;

        var beginMap: IPathDirectionalFunctionMap = {};

        beginMap[pathType.Circle] = function (circle: IPathCircle, dirPath: IPathDirectional) {
            var circleOptions: CSG.ICircleOptions = {
                center: <number[]>point.rounded(circle.origin, accuracy),
                radius: round(circle.radius, accuracy),
                resolution: facetSizeToResolution(circle, facetSize)
            };
            head = wrap('CAG.circle', JSON.stringify(circleOptions), true);
            exit = true;
        };

        beginMap[pathType.Line] = function (line: IPathLine, dirPath: IPathDirectional) {
            head = wrap('new CSG.Path2D', JSON.stringify(dirPath.reversed ? [point.rounded(dirPath.endPoints[1], accuracy), point.rounded(dirPath.endPoints[0], accuracy)] : dirPath.endPoints), true);
        };

        beginMap[pathType.Arc] = function (arc: IPathArc, dirPath: IPathDirectional) {
            var endAngle = angle.ofArcEnd(arc);
            if (dirPath.reversed) {
                reverseTail = true;
            }
            var arcOptions: CSG.IArcOptions = {
                center: <number[]>point.rounded(arc.origin, accuracy),
                radius: round(arc.radius, accuracy),
                startangle: round(arc.startAngle, accuracy),
                endangle: round(endAngle, accuracy),
                resolution: facetSizeToResolution(arc, facetSize)
            };
            head = wrap('new CSG.Path2D.arc', JSON.stringify(arcOptions), true);
        };

        var appendMap: IPathDirectionalFunctionMap = {};

        appendMap[pathType.Line] = function (line: IPathLine, dirPath: IPathDirectional) {
            var reverse = (reverseTail != dirPath.reversed);
            var endPoint = point.rounded(dirPath.endPoints[reverse ? 0 : 1], accuracy);
            append(wrap('.appendPoint', JSON.stringify(endPoint), true));
        };

        appendMap[pathType.Arc] = function (arc: IPathArc, dirPath: IPathDirectional) {
            var reverse = (reverseTail != dirPath.reversed);
            var endAngle = angle.ofArcEnd(arc);
            var arcOptions: CSG.IEllpiticalArcOptions = {
                radius: round(arc.radius, accuracy),
                clockwise: reverse,
                large: Math.abs(endAngle - arc.startAngle) > 180,
                resolution: facetSizeToResolution(arc, facetSize)
            };
            var endPoint = point.rounded(dirPath.endPoints[reverse ? 0 : 1], accuracy);
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
                    union += wrap('.union', pathsToOpenJsCad(subModel, opts.accuracy, opts.facetSize), union);
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
    interface IAdd<T> {
        cag: T;
        subtracts: T[][];
    }

    /**
     * @private
     */
    interface IOperate<T> {
        (a: T, b: T): T
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
    export function toJscadCAG(jscadCAG: typeof jscad.CAG, modelToExport: IModel, jsCadCagOptions?: IJscadCagOptions) {

        function chainToJscadCag(c: IChain, maxArcFacet: number) {
            const keyPoints = chain.toKeyPoints(c, maxArcFacet);
            keyPoints.push(keyPoints[0]);
            return jscadCAG.fromPoints(keyPoints);
        }

        function jscadCagUnion(augend: jscad.CAG, addend: jscad.CAG) {
            return augend.union(addend);
        }

        function jscadCagSubtraction(minuend: jscad.CAG, subtrahend: jscad.CAG) {
            return minuend.subtract(subtrahend);
        }

        return convertChainsTo2D<jscad.CAG>(chainToJscadCag, jscadCagUnion, jscadCagSubtraction, modelToExport, jsCadCagOptions);
    }

    /**
     * @private
     */
    function convertChainsTo2D<T>(convertToT: { (c: IChain, maxArcFacet: number): T }, union: IOperate<T>, subtraction: IOperate<T>, modelToExport: IModel, jsCadCagOptions: IJscadCagOptions = {}) {
        const adds: { [layerId: string]: IAdd<T>[] } = {};
        const status = { total: 0, complete: 0 };

        function unionize(phaseStart: number, phaseSpan: number, arr: T[]) {
            let result = arr.shift();
            arr.forEach(el => result = union(result, el));
            status.complete++;

            jsCadCagOptions.statusCallback && jsCadCagOptions.statusCallback({ progress: phaseStart + phaseSpan * status.complete / status.total });

            return result;
        }

        function subtractChains(layerId: string, cs: IChain[]) {
            const subtracts: T[] = [];
            cs.forEach(c => {
                if (!c.endless) return;
                if (c.contains) {
                    addChains(layerId, c.contains);
                }
                status.total++;
                subtracts.unshift(convertToT(c, jsCadCagOptions.maxArcFacet));
            });
            return subtracts;
        }

        function addChains(layerId: string, cs: IChain[]) {
            cs.forEach(c => {
                if (!c.endless) return;
                const add: IAdd<T> = { cag: convertToT(c, jsCadCagOptions.maxArcFacet), subtracts: [] };
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

        const resultMap: { [layerId: string]: T } = {};

        for (let layerId in adds) {
            const flatAdds = adds[layerId].map(add => {
                let result = add.cag;
                add.subtracts.forEach(subtract => {
                    const union = unionize(50, 50, subtract);
                    result = subtraction(result, union);
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
    export function toJscadCSG(jscadCAG: typeof jscad.CAG, modelToExport: IModel, options?: IJscadCsgOptions) {

        function to2D(opts: IJscadCsgOptions) {
            return toJscadCAG(jscadCAG, modelToExport, opts);
        }

        function to3D(cag: jscad.CAG, extrude: number, z: number) {
            var csg = cag.extrude({ offset: [0, 0, extrude] });
            if (z) {
                csg = csg.translate([0, 0, z]);
            }
            return csg;
        }

        function union3D(augend: jscad.CSG, addend: jscad.CSG) {
            return augend.union(addend);
        }

        return convert2Dto3D<jscad.CAG, jscad.CSG>(to2D, to3D, union3D, modelToExport, options);
    }

    /**
     * @private
     */
    function convert2Dto3D<T2D, T3D>(
        to2D: { (options: IJscadCsgOptions): T2D | { [layerId: string]: T2D } },
        to3D: { (result2D: T2D, extrude: number, z: number): T3D },
        union3D: { (a: T3D, b: T3D): T3D },
        modelToExport: IModel, options: IJscadCsgOptions = {}) {

        const originalCb = options.statusCallback;

        function makePhasedCallback(phaseStart: number, phaseSpan: number) {
            return function statusCallback(status) {
                originalCb && originalCb({ progress: phaseStart + status.progress * phaseSpan / 100 });
            }
        }

        function getDefinedNumber(a: number, b: number) {
            if (isNumber(a)) return a;
            return b;
        }

        if (modelToExport.exporterOptions) {
            extendObject(options, modelToExport.exporterOptions['toJscadCSG']);
        }

        options.byLayers = options.byLayers || (options.layerOptions && true);
        options.statusCallback = makePhasedCallback(0, 50);

        const result2D = to2D(options);
        const csgs: T3D[] = [];

        if (options.byLayers) {
            for (let layerId in result2D as { [layerId: string]: T2D }) {
                let layerOptions = options.layerOptions[layerId];
                let csg = to3D(result2D[layerId], layerOptions.extrude || options.extrude, getDefinedNumber(layerOptions.z, options.z));
                csgs.push(csg);
            }
        } else {
            let csg = to3D(result2D as T2D, options.extrude, options.z);
            csgs.push(csg);
        }

        options.statusCallback = makePhasedCallback(50, 100);

        const status = { total: csgs.length - 1, complete: 0 };

        let result = csgs.shift();
        csgs.forEach((el, i) => {
            result = union3D(result, el);
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
    export interface IJscadCagOptions extends IExportOptions, IPointMatchOptions {

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

    export interface IJscadExtrudeOptions {

        /**
         * Optional depth of 3D extrusion.
         */
        extrude?: number;

        /**
         * Optional depth of 3D extrusion.
         */
        z?: number;
    }

    export interface IJscadCsgOptions extends IJscadCagOptions, IJscadExtrudeOptions {

        /**
         * SVG options per layer.
         */
        layerOptions?: { [layerId: string]: IJscadExtrudeOptions };
    }
}
