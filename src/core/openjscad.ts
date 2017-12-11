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
     * var cag = makerjs.exporter.toJscadCAG(CAG, model, 1);
     * ```
     * 
     * @param jscadCAG @jscad/csg CAG engine.
     * @param modelToExport Model object to export.
     * @param maxArcFacet The maximum length between points on an arc or circle.
     * @param options Optional IFindChainsOptions options object.
     * @param options.byLayers Optional flag to separate chains by layers.
     * @param options.pointMatchingDistance Optional max distance to consider two points as the same.
     * @param options.statusCallback Optional callback function to get the percentage complete.
     * @returns jscad CAG object in 2D.
     */
    export function toJscadCAG(jscadCAG: typeof jscad.CAG, modelToExport: IModel, maxArcFacet: number, jsCadCagOptions?: IJsCadCagOptions) {
        const adds: IAdd[] = [];
        const status = { total: 0, complete: 0 };

        function unionize(phaseStart: number, phaseSpan: number, arr: jscad.CAG[]) {
            let result = arr.shift();
            arr.forEach(el => result = result.union(el));
            status.complete++;

            jsCadCagOptions && jsCadCagOptions.statusCallback && jsCadCagOptions.statusCallback({ progress: phaseStart + phaseSpan * status.complete / status.total });

            return result;
        }

        function chainToCag(c: IChain) {
            const keyPoints = chain.toKeyPoints(c, maxArcFacet);
            keyPoints.push(keyPoints[0]);
            return jscadCAG.fromPoints(keyPoints);
        }

        function subtractChains(cs: IChain[]) {
            const subtracts: jscad.CAG[] = [];
            cs.forEach(c => {
                if (!c.endless) return;
                if (c.contains) {
                    addChains(c.contains);
                }
                status.total++;
                subtracts.unshift(chainToCag(c));
            });
            return subtracts;
        }

        function addChains(cs: IChain[]) {
            cs.forEach(c => {
                if (!c.endless) return;
                const add: IAdd = { cag: chainToCag(c), subtracts: [] };
                if (c.contains) {
                    const subtracts = subtractChains(c.contains);
                    if (subtracts.length > 0) {
                        add.subtracts.push(subtracts);
                    }
                }
                status.total++;
                adds.unshift(add);
            });
        }

        const options: IFindChainsOptions = jsCadCagOptions ? cloneObject(jsCadCagOptions) : {};
        options.contain = true;

        jsCadCagOptions && jsCadCagOptions.statusCallback && jsCadCagOptions.statusCallback({ progress: 25 });

        const chainsResult = model.findChains(modelToExport, options);
        if (Array.isArray(chainsResult)) {
            addChains(chainsResult);
        } else {
            for (let layer in chainsResult) {
                addChains(chainsResult[layer]);
            }
        }

        jsCadCagOptions && jsCadCagOptions.statusCallback && jsCadCagOptions.statusCallback({ progress: 50 });

        if (adds.length === 0) {
            jsCadCagOptions && jsCadCagOptions.statusCallback && jsCadCagOptions.statusCallback({ progress: 100 });
            throw ('No closed geometries found.');
        }

        const flatAdds = adds.map(add => {
            let result = add.cag;
            add.subtracts.forEach(subtract => {
                const union = unionize(50, 50, subtract);
                result = result.subtract(union);
            })
            return result;
        });
        const result = unionize(50, 50, flatAdds);

        jsCadCagOptions && jsCadCagOptions.statusCallback && jsCadCagOptions.statusCallback({ progress: 100 });

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

    export interface IOpenJsCadOptionsMap {
        [modelId: string]: IOpenJsCadOptions;
    }

    export interface IJsCadCagOptions extends IFindChainsOptions {
        statusCallback?: IStatusCallback;
    }
}
