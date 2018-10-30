namespace MakerJs.exporter {

    /**
     * @private
     */
    interface IChainLinkFunction {
        (pathValue: IPath, link: IChainLink): void;
    }

    /**
     * @private
     */
    interface IChainLinkFunctionMap {
        [type: string]: IChainLinkFunction;
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
    function chainToJscadScript(chainContext: IChain, facetSize?: number, accuracy?: number): string {

        var head = '';
        var tail = '';
        var first = true;
        var exit = false;
        var reverseTail = false;

        var beginMap: IChainLinkFunctionMap = {};

        beginMap[pathType.Circle] = function (circle: IPathCircle, link: IChainLink) {
            var circleOptions: jscad.CSG.ICircleOptions = {
                center: <number[]>point.rounded(point.add(circle.origin, link.walkedPath.offset), accuracy),
                radius: round(circle.radius, accuracy),
                resolution: facetSizeToResolution(circle, facetSize)
            };
            head = wrap('CAG.circle', JSON.stringify(circleOptions), true);
            exit = true;
        };

        beginMap[pathType.Line] = function (line: IPathLine, link: IChainLink) {
            let points = link.endPoints.map(p => point.rounded(p, accuracy));
            if (link.reversed) {
                points.reverse();
            }
            head = wrap('new CSG.Path2D',
                JSON.stringify(points), true);
        };

        beginMap[pathType.Arc] = function (arc: IPathArc, link: IChainLink) {
            var endAngle = angle.ofArcEnd(arc);
            if (link.reversed) {
                reverseTail = true;
            }
            var arcOptions: jscad.CSG.IArcOptions = {
                center: <number[]>point.rounded(point.add(arc.origin, link.walkedPath.offset), accuracy),
                radius: round(arc.radius, accuracy),
                startangle: round(arc.startAngle, accuracy),
                endangle: round(endAngle, accuracy),
                resolution: facetSizeToResolution(arc, facetSize)
            };
            head = wrap('new CSG.Path2D.arc', JSON.stringify(arcOptions), true);
        };

        var appendMap: IChainLinkFunctionMap = {};

        appendMap[pathType.Line] = function (line: IPathLine, link: IChainLink) {
            var reverse = (reverseTail != link.reversed);
            var endPoint = point.rounded(link.endPoints[reverse ? 0 : 1], accuracy);
            append(wrap('.appendPoint', JSON.stringify(endPoint), true));
        };

        appendMap[pathType.Arc] = function (arc: IPathArc, link: IChainLink) {
            var reverse = (reverseTail != link.reversed);
            var endAngle = angle.ofArcEnd(arc);
            var arcOptions: jscad.CSG.IEllpiticalArcOptions = {
                radius: round(arc.radius, accuracy),
                clockwise: reverse,
                large: Math.abs(endAngle - arc.startAngle) > 180,
                resolution: facetSizeToResolution(arc, facetSize)
            };
            var endPoint = point.rounded(link.endPoints[reverse ? 0 : 1], accuracy);
            append(wrap('.appendArc', JSON.stringify(endPoint) + ',' + JSON.stringify(arcOptions), true));
        }

        function append(s: string) {
            if (reverseTail) {
                tail = s + tail;
            } else {
                tail += s;
            }
        }

        for (let i = 0; i < chainContext.links.length; i++) {
            let link = chainContext.links[i];
            var pathContext = link.walkedPath.pathContext;

            var fn = first ? beginMap[pathContext.type] : appendMap[pathContext.type];

            if (fn) {
                fn(pathContext, link);
            }

            if (exit) {
                return head;
            }

            first = false;
        }

        return head + tail + '.close().innerToCAG()';
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
     * @private
     */
    function makePhasedCallback(originalCb: IStatusCallback, phaseStart: number, phaseSpan: number) {
        return function statusCallback(status) {
            originalCb && originalCb({ progress: phaseStart + status.progress * phaseSpan / 100 });
        }
    }

    /**
     * Converts a model to a @jscad/csg CAG object - 2D to 2D. See https://en.wikibooks.org/wiki/OpenJSCAD_User_Guide#2D_Paths
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
     * @param jscadCAG @jscad/csg CAG engine, see https://www.npmjs.com/package/@jscad/csg
     * @param modelToExport Model object to export.
     * @param options Optional options object.
     * @param options.byLayers Optional flag to separate chains by layers.
     * @param options.pointMatchingDistance Optional max distance to consider two points as the same.
     * @param options.maxArcFacet The maximum length between points on an arc or circle.
     * @param options.statusCallback Optional callback function to get the percentage complete.
     * @returns jscad CAG object in 2D, or a map (keyed by layer id) of jscad CAG objects - if options.byLayers is true.
     */
    export function toJscadCAG(jscadCAG: typeof jscad.CAG, modelToExport: IModel, jsCadCagOptions?: IJscadCagOptions): jscad.CAG | { [layerId: string]: jscad.CAG } {

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
     * Converts a model to a @jscad/csg CSG object - 2D to 3D.
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
     * @param jscadCAG @jscad/csg CAG engine, see https://www.npmjs.com/package/@jscad/csg
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
    export function toJscadCSG(jscadCAG: typeof jscad.CAG, modelToExport: IModel, options?: IJscadCsgOptions): jscad.CSG {

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

        function getDefinedNumber(a: number, b: number) {
            if (isNumber(a)) return a;
            return b;
        }

        if (modelToExport.exporterOptions) {
            extendObject(options, modelToExport.exporterOptions['toJscadCSG']);
        }

        options.byLayers = options.byLayers || (options.layerOptions && true);
        options.statusCallback = makePhasedCallback(originalCb, 0, 50);

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

        options.statusCallback = makePhasedCallback(originalCb, 50, 100);

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
     * Creates a string of JavaScript code for execution with a Jscad environment.
     * 
     * @param modelToExport Model object to export.
     * @param options Export options object.
     * @param options.byLayers Optional flag to separate chains by layers.
     * @param options.pointMatchingDistance Optional max distance to consider two points as the same.
     * @param options.maxArcFacet The maximum length between points on an arc or circle.
     * @param options.statusCallback Optional callback function to get the percentage complete.
     * @param options.extrude Optional default extrusion distance.
     * @param options.layerOptions Optional object map of options per layer, keyed by layer name. Each value for a key is an object with 'extrude' and 'z' properties.
     * @returns String of JavaScript containing a main() function for Jscad.
     */
    export function toJscadScript(modelToExport: IModel, options: IJscadScriptOptions = {}) {

        function _chainToJscadScript(c: IChain, maxArcFacet: number) {
            return wrap(chainToJscadScript(c, maxArcFacet, options.accuracy));
        }

        function scriptUnion(augend: string, addend: string) {
            return augend + `.union(${addend})`;
        }

        function scriptSubtraction(minuend: string, subtrahend: string) {
            return minuend + `.subtract(${subtrahend})`;
        }

        function to2D(opts: IJscadCsgOptions) {
            return convertChainsTo2D<string>(_chainToJscadScript, scriptUnion, scriptSubtraction, modelToExport, options);
        }

        function to3D(cag: string, extrude: number, z: number) {
            var csg = cag + `.extrude({ offset: [0, 0, ${extrude}] })`;
            if (z) {
                csg = csg + `.translate([0, 0, ${z}])`;
            }
            return csg;
        }

        function wrap(s: string) {
            return `${nl}${indent}${s}${nl}`;
        }

        const indent = new Array((options.indent || 0) + 1).join(' ');
        const nl = options.indent ? '\n' : '';

        const result = convert2Dto3D<string, string>(to2D, to3D, scriptUnion, modelToExport, options).trim();

        return `function ${options.functionName || 'main'}(){${wrap(`return ${result};`)}}${nl}`;
    }

    /**
     * Exports a model in STL format - 2D to 3D.
     * 
     * @param jscadCAG @jscad/csg CAG engine, see https://www.npmjs.com/package/@jscad/csg
     * @param stlSerializer @jscad/stl-serializer, see https://www.npmjs.com/package/@jscad/stl-serializer
     * @param modelToExport Model object to export.
     * @param options Optional options object.
     * @param options.byLayers Optional flag to separate chains by layers.
     * @param options.pointMatchingDistance Optional max distance to consider two points as the same.
     * @param options.maxArcFacet The maximum length between points on an arc or circle.
     * @param options.statusCallback Optional callback function to get the percentage complete.
     * @param options.extrude Optional default extrusion distance.
     * @param options.layerOptions Optional object map of options per layer, keyed by layer name. Each value for a key is an object with 'extrude' and 'z' properties.
     * @returns String in STL ASCII format.
     */
    export function toJscadSTL(CAG: typeof jscad.CAG, stlSerializer: jscad.StlSerializer, modelToExport: IModel, options?: IJscadCsgOptions) {
        const originalCb = options.statusCallback;
        options.statusCallback = makePhasedCallback(originalCb, 0, 50);
        const csg = toJscadCSG(CAG, modelToExport, options);
        return stlSerializer.serialize(csg, { binary: false, statusCallback: makePhasedCallback(originalCb, 50, 50) });
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
     * Jscad CAG export options.
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

    /**
     * Jscad CAG extrusion options.
     */
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

    /**
     * Jscad CSG export options.
     */
    export interface IJscadCsgOptions extends IJscadCagOptions, IJscadExtrudeOptions {

        /**
         * SVG options per layer.
         */
        layerOptions?: { [layerId: string]: IJscadExtrudeOptions };
    }

    /**
     * Jscad Script export options.
     */
    export interface IJscadScriptOptions extends IJscadCsgOptions {

        /**
         * Optional override of function name, default is "main".
         */
        functionName?: string;

        /**
         * Optional number of spaces to indent.
         */
        indent?: number;
    }
}
