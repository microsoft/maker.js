/**
 * Root module for Maker.js.
 * 
 * Example: get a reference to Maker.js
 * ```
 * var makerjs = require('makerjs');
 * ```
 * 
 */
namespace MakerJs {

    /**
     * Version info
     */
    export var version = 'debug';

    /**
     * Enumeration of environment types.
     */
    export var environmentTypes = {
        BrowserUI: 'browser',
        NodeJs: 'node',
        WebWorker: 'worker',
        Unknown: 'unknown'
    };

    /**
     * @private
     */
    function tryEval(name: string) {
        try {
            var value = eval(name);
            return value;
        }
        catch (e) { }
        return;
    }

    /**
     * @private
     */
    function detectEnvironment() {

        if (tryEval('WorkerGlobalScope') && tryEval('self')) {
            return environmentTypes.WebWorker;
        }

        if (tryEval('window') && tryEval('document')) {
            return environmentTypes.BrowserUI;
        }

        //put node last since packagers usually add shims for it
        if (tryEval('global') && tryEval('process')) {
            return environmentTypes.NodeJs;
        }

        return environmentTypes.Unknown;
    }

    /**
     * Current execution environment type, should be one of environmentTypes.
     */
    export var environment = detectEnvironment();

    //units

    /**
     * String-based enumeration of unit types: imperial, metric or otherwise. 
     * A model may specify the unit system it is using, if any. When importing a model, it may have different units. 
     * Unit conversion function is makerjs.units.conversionScale().
     * Important: If you add to this, you must also add a corresponding conversion ratio in the unit.ts file!
     */
    export var unitType = {
        Centimeter: 'cm',
        Foot: 'foot',
        Inch: 'inch',
        Meter: 'm',
        Millimeter: 'mm'
    };

    /**
     * @private
     */
    function split(s: string, char: string) {
        var p = s.indexOf(char);
        if (p < 0) {
            return [s];
        } else if (p > 0) {
            return [s.substr(0, p), s.substr(p + 1)];
        } else {
            return ['', s];
        }
    }

    /**
     * Split a decimal into its whole and fractional parts as strings.
     * 
     * Example: get whole and fractional parts of 42.056
     * ```
     * makerjs.splitDecimal(42.056); //returns ["42", "056"]
     * ```
     * 
     * @param n The number to split.
     * @returns Array of 2 strings when n contains a decimal point, or an array of one string when n is an integer.
     */
    export function splitDecimal(n: number) {
        let s = n.toString();
        if (s.indexOf('e') > 0) {
            //max digits is 20 - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed
            s = n.toFixed(20).match(/.*[^(0+$)]/)[0];   //regex trims trailing zeros
        }
        return split(s, '.');
    }

    /**
     * Numeric rounding
     * 
     * Example: round to 3 decimal places
     * ```
     * makerjs.round(3.14159, .001); //returns 3.142
     * ```
     * 
     * @param n The number to round off.
     * @param accuracy Optional exemplar of number of decimal places.
     * @returns Rounded number.
     */
    export function round(n: number, accuracy = .0000001): number {

        //optimize for early exit for integers
        if (n % 1 === 0) return n;

        var exp = 1 - String(Math.ceil(1 / accuracy)).length;

        //Adapted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round

        // If the exp is undefined or zero...
        if (typeof exp === 'undefined' || +exp === 0) {
            return Math.round(n);
        }
        n = +n;
        exp = +exp;
        // If the value is not a number or the exp is not an integer...
        if (isNaN(n) || !(typeof exp === 'number' && exp % 1 === 0)) {
            return NaN;
        }
        // If the value is negative...
        if (n < 0) {
            return -round(-n, accuracy);
        }
        // Shift
        var a = split(n.toString(), 'e');
        n = Math.round(+(a[0] + 'e' + (a[1] ? (+a[1] - exp) : -exp)));
        // Shift back
        a = split(n.toString(), 'e');
        return +(a[0] + 'e' + (a[1] ? (+a[1] + exp) : exp));
    }

    /**
     * Create a string representation of a route array.
     * 
     * @param route Array of strings which are segments of a route.
     * @returns String of the flattened array.
     */
    export function createRouteKey(route: string[]) {
        var converted: string[] = [];
        for (var i = 0; i < route.length; i++) {
            var element = route[i];
            var newElement: string;
            if (i % 2 === 0) {
                newElement = (i > 0 ? '.' : '') + element;
            } else {
                newElement = JSON.stringify([element]);
            }
            converted.push(newElement);
        }
        return converted.join('');
    }

    /**
     * Travel along a route inside of a model to extract a specific node in its tree.
     * 
     * @param modelContext Model to travel within.
     * @param route String of a flattened route, or a string array of route segments.
     * @returns Model or Path object within the modelContext tree.
     */
    export function travel(modelContext: IModel, route: string | string[]) {
        if (!modelContext || !route) return null;

        var routeArray: string[];
        if (Array.isArray(route)) {
            routeArray = route;
        } else {
            routeArray = JSON.parse(route);
        }

        var props = routeArray.slice();
        var ref: any = modelContext;
        var origin = modelContext.origin || [0, 0];

        while (props.length) {
            var prop = props.shift();
            ref = ref[prop];

            if (!ref) return null;

            if (ref.origin && props.length) {
                origin = point.add(origin, ref.origin);
            }
        }

        return {
            result: <IPath | IModel>ref,
            offset: origin
        };

    }

    /**
     * @private
     */
    var clone = require('clone');

    /**
     * Clone an object.
     * 
     * @param objectToClone The object to clone.
     * @returns A new clone of the original object.
     */
    export function cloneObject<T>(objectToClone: T): T {
        return clone(objectToClone);
    }

    /**
     * Copy the properties from one object to another object.
     * 
     * Example:
     * ```
     * makerjs.extendObject({ abc: 123 }, { xyz: 789 }); //returns { abc: 123, xyz: 789 }
     * ```
     * 
     * @param target The object to extend. It will receive the new properties.
     * @param other An object containing properties to merge in.
     * @returns The original object after merging.
     */
    export function extendObject(target: Object, other: Object) {
        if (target && other) {
            for (var key in other) {
                if (typeof other[key] !== 'undefined') {
                    target[key] = other[key];
                }
            }
        }
        return target;
    }

    /**
     * Test to see if a variable is a function.
     * 
     * @param value The object to test.
     * @returns True if the object is a function type.
     */
    export function isFunction(value: any): boolean {
        return typeof value === 'function';
    }

    /**
     * Test to see if a variable is a number.
     * 
     * @param value The object to test.
     * @returns True if the object is a number type.
     */
    export function isNumber(value: any): boolean {
        return typeof value === 'number';
    }

    /**
     * Test to see if a variable is an object.
     * 
     * @param value The object to test.
     * @returns True if the object is an object type.
     */
    export function isObject(value: any): boolean {
        return typeof value === 'object';
    }

    //points

    /**
     * Test to see if an object implements the required properties of a point.
     * 
     * @param item The item to test.
     */
    export function isPoint(item: any) {
        return item && Array.isArray(item) && (item as Array<number>).length == 2 && isNumber(item[0]) && isNumber(item[1]);
    }

    /**
     * A measurement of extents, the high and low points.
     */
    export interface IMeasure {

        /**
         * The point containing both the lowest x and y values of the rectangle containing the item being measured.
         */
        low: IPoint;

        /**
         * The point containing both the highest x and y values of the rectangle containing the item being measured.
         */
        high: IPoint;
    }

    /**
     * A measurement of extents, with a center point.
     */
    export interface IMeasureWithCenter extends IMeasure {

        /**
         * The center point of the rectangle containing the item being measured.
         */
        center: IPoint;

        /**
         * The width of the rectangle containing the item being measured.
         */
        width: number;

        /**
         * The height of the rectangle containing the item being measured.
         */
        height: number;
    }

    /**
     * A map of measurements.
     */
    export interface IMeasureMap {
        [key: string]: IMeasure;
    }

    //paths

    /**
     * A path that was removed in a combine operation.
     */
    export interface IPathRemoved extends IPath {

        /**
         * Reason the path was removed.
         */
        reason: string;

        /**
         * Original routekey of the path, to identify where it came from.
         */
        routeKey: string;
    }

    /**
     * Options to pass to measure.isPointInsideModel().
     */
    export interface IMeasurePointInsideOptions {

        /**
         * Optional point of reference which is outside the bounds of the modelContext.
         */
        farPoint?: IPoint;

        /**
         * Optional atlas of measurements of paths within the model (to prevent intersection calculations).
         */
        measureAtlas?: measure.Atlas;

        /**
         * Output variable which will contain an array of points where the ray intersected the model. The ray is a line from pointToCheck to options.farPoint.
         */
        out_intersectionPoints?: IPoint[];
    }

    /**
     * Test to see if an object implements the required properties of a path.
     * 
     * @param item The item to test.
     */
    export function isPath(item: any): boolean {
        return item && (item as IPath).type && isPoint((item as IPath).origin);
    }

    /**
     * Test to see if an object implements the required properties of a line.
     * 
     * @param item The item to test.
     */
    export function isPathLine(item: any): boolean {
        return isPath(item) && (<IPath>item).type == pathType.Line && isPoint((<IPathLine>item).end);
    }

    /**
     * Test to see if an object implements the required properties of a circle.
     * 
     * @param item The item to test.
     */
    export function isPathCircle(item: any): boolean {
        return isPath(item) && (<IPath>item).type == pathType.Circle && isNumber((<IPathCircle>item).radius);
    }

    /**
     * Test to see if an object implements the required properties of an arc.
     * 
     * @param item The item to test.
     */
    export function isPathArc(item: any): boolean {
        return isPath(item) && (<IPath>item).type == pathType.Arc && isNumber((<IPathArc>item).radius) && isNumber((<IPathArc>item).startAngle) && isNumber((<IPathArc>item).endAngle);
    }

    /**
     * Test to see if an object implements the required properties of an arc in a bezier curve.
     * 
     * @param item The item to test.
     */
    export function isPathArcInBezierCurve(item: any): boolean {
        return isPathArc(item) && isObject((<IPathArcInBezierCurve>item).bezierData) && isNumber((<IPathArcInBezierCurve>item).bezierData.startT) && isNumber((<IPathArcInBezierCurve>item).bezierData.endT);
    }

    /**
     * String-based enumeration of all paths types.
     * 
     * Examples: use pathType instead of string literal when creating a circle.
     * ```
     * var circle: IPathCircle = { type: pathType.Circle, origin: [0, 0], radius: 7 };   //typescript
     * var circle = { type: pathType.Circle, origin: [0, 0], radius: 7 };   //javascript
     * ```
     */
    export var pathType = {
        Line: "line",
        Circle: "circle",
        Arc: "arc",
        BezierSeed: "bezier-seed"
    };

    /**
     * Slope and y-intercept of a line.
     */
    export interface ISlope {

        /**
         * Boolean to see if line has slope or is vertical.
         */
        hasSlope: boolean;

        /**
         * Optional value of non-vertical slope.
         */
        slope?: number;

        /**
         * Line used to calculate this slope.
         */
        line: IPathLine;

        /**
         * Optional value of y when x = 0.
         */
        yIntercept?: number;
    }

    /**
     * Options to pass to path.intersection()
     */
    export interface IPathIntersectionBaseOptions {

        /**
         * Optional boolean to only return deep intersections, i.e. not on an end point or tangent.
         */
        excludeTangents?: boolean;

        /**
         * Optional output variable which will be set to true if the paths are overlapped.
         */
        out_AreOverlapped?: boolean;
    }

    /**
     * Options to pass to path.intersection()
     */
    export interface IPathIntersectionOptions extends IPathIntersectionBaseOptions {

        /**
         * Optional boolean to only return deep intersections, i.e. not on an end point or tangent.
         */
        path1Offset?: IPoint;

        /**
         * Optional output variable which will be set to true if the paths are overlapped.
         */
        path2Offset?: IPoint;
    }

    /**
     * An intersection of two paths.
     */
    export interface IPathIntersection {

        /**
         * Array of points where the two paths intersected. The length of the array may be either 1 or 2 points.
         */
        intersectionPoints: IPoint[];

        /**
         * This Array property will only be defined if the first parameter passed to pathIntersection is either an Arc or a Circle.
         * It contains the angles of intersection relative to the first path parameter. 
         * The length of the array may be either 1 or 2.
         */
        path1Angles?: number[];

        /**
         * This Array property will only be defined if the second parameter passed to pathIntersection is either an Arc or a Circle.
         * It contains the angles of intersection relative to the second path parameter. 
         * The length of the array may be either 1 or 2.
         */
        path2Angles?: number[];
    }

    /**
     * Options when matching points
     */
    export interface IPointMatchOptions {

        /**
         * Max distance to consider two points as the same.
         */
        pointMatchingDistance?: number;
    }

    /**
     * Options to pass to model.combine.
     */
    export interface ICombineOptions extends IPointMatchOptions {

        /**
         * Flag to remove paths which are not part of a loop.
         */
        trimDeadEnds?: boolean;

        /**
         * Point which is known to be outside of the model.
         */
        farPoint?: IPoint;

        /**
         * Cached measurements for model A.
         */
        measureA?: measure.Atlas;

        /**
         * Cached measurements for model B.
         */
        measureB?: measure.Atlas;

        /**
         * Output array of 2 models (corresponding to the input models) containing paths that were deleted in the combination.
         * Each path will be of type IPathRemoved, which has a .reason property describing why it was removed.
         */
        out_deleted?: IModel[];
    }

    /**
     * Options to pass to measure.isPointOnPath.
     */
    export interface IIsPointOnPathOptions {

        /**
         * The slope of the line, if applicable. This will be added to the options object if it did not exist.
         */
        cachedLineSlope?: ISlope;
    }

    /**
     * Options to pass to model.findLoops.
     */
    export interface IFindLoopsOptions extends IPointMatchOptions {

        /**
         * Flag to remove looped paths from the original model.
         */
        removeFromOriginal?: boolean;
    }

    /**
     * Options to pass to model.simplify()
     */
    export interface ISimplifyOptions extends IPointMatchOptions {

        /**
         * Optional 
         */
        scalarMatchingDistance?: number;

    }

    /**
     * A path that may be indicated to "flow" in either direction between its endpoints.
     */
    export interface IPathDirectional extends IPath {

        /**
         * The endpoints of the path.
         */
        endPoints: IPoint[];

        /**
         * Path flows forwards or reverse.
         */
        reversed?: boolean;
    }

    //models

    /**
     * Callback signature for model.walkPaths().
     */
    export interface IModelPathCallback {
        (modelContext: IModel, pathId: string, pathContext: IPath): void;
    }

    /**
     * Test to see if an object implements the required properties of a model.
     */
    export function isModel(item: any): boolean {
        return item && (item.paths || item.models);
    }

    /**
     * Reference to a path id within a model.
     */
    export interface IRefPathIdInModel {
        modelContext: IModel;
        pathId: string;
    }

    /**
     * A route to either a path or a model, and the absolute offset of it.
     */
    export interface IRouteOffset {
        layer: string;
        offset: IPoint;
        route: string[];
        routeKey: string;
    }

    /**
     * A path reference in a walk.
     */
    export interface IWalkPath extends IRefPathIdInModel, IRouteOffset {
        pathContext: IPath;
    }

    /**
     * Callback signature for path in model.walk().
     */
    export interface IWalkPathCallback {
        (context: IWalkPath): void;
    }

    /**
     * Callback for returning a boolean from an IWalkPath.
     */
    export interface IWalkPathBooleanCallback {
        (context: IWalkPath): boolean;
    }

    /**
     * A link in a chain, with direction of flow.
     */
    export interface IChainLink {

        /**
         * Reference to the path.
         */
        walkedPath: IWalkPath;

        /**
         * Path flows forwards or reverse.
         */
        reversed: boolean;

        /**
         * The endpoints of the path, in absolute coords.
         */
        endPoints: IPoint[];

        /**
         * Length of the path.
         */
        pathLength: number;
    }

    /**
     * A chain of paths which connect end to end.
     */
    export interface IChain {

        /**
         * The links in this chain.
         */
        links: IChainLink[];

        /**
         * Flag if this chain forms a loop end to end.
         */
        endless: boolean

        /**
         * Total length of all paths in the chain.
         */
        pathLength: number;

        /**
         * Chains that are contained within this chain. Populated when chains are found with the 'contain' option 
         */
        contains?: IChain[]
    }

    /**
     * A map of chains by layer.
     */
    export interface IChainsMap {
        [layer: string]: IChain[];
    }

    /**
     * Test to see if an object implements the required properties of a chain.
     * 
     * @param item The item to test.
     */
    export function isChain(item: any): boolean {
        var x = item as IChain;
        return x && x.links && Array.isArray(x.links) && isNumber(x.pathLength);
    }

    /**
     * Callback to model.findChains() with resulting array of chains and unchained paths.
     */
    export interface IChainCallback {
        (chains: IChain[], loose: IWalkPath[], layer: string, ignored?: IWalkPath[]): void;
    }

    /**
     * Options to pass to model.findChains.
     */
    export interface IFindChainsOptions extends IPointMatchOptions {

        /**
         * Flag to separate chains by layers.
         */
        byLayers?: boolean;

        /**
         * Flag to not recurse models, look only within current model's immediate paths.
         */
        shallow?: boolean;

        /**
         * Flag to order chains in a heirarchy by their paths being within one another.
         */
        contain?: boolean | IContainChainsOptions;

        /**
         * Flag to flatten BezierCurve arc segments into IPathBezierSeeds.
         */
        unifyBeziers?: boolean;
    }

    /**
     * Sub-options to pass to model.findChains.contain option.
     */
    export interface IContainChainsOptions {

        /**
         * Flag to alternate direction of contained chains.
         */
        alternateDirection?: boolean;
    }

    /**
     * Reference to a model within a model.
     */
    export interface IRefModelInModel {
        parentModel: IModel;
        childId: string;
        childModel: IModel;
    }

    /**
     * A model reference in a walk.
     */
    export interface IWalkModel extends IRefModelInModel, IRouteOffset {
    }

    /**
     * Callback signature for model.walk().
     */
    export interface IWalkModelCallback {
        (context: IWalkModel): void;
    }

    /**
     * Callback signature for model.walk(), which may return false to halt any further walking.
     */
    export interface IWalkModelCancellableCallback {
        (context: IWalkModel): boolean;
    }

    /**
     * Options to pass to model.walk().
     */
    export interface IWalkOptions {

        /**
         * Callback for every path in every model.
         */
        onPath?: IWalkPathCallback;

        /**
         * Callback for every child model in every model. Return false to stop walking down further models.
         */
        beforeChildWalk?: IWalkModelCancellableCallback;

        /**
         * Callback for every child model in every model, after all of its children have been walked.
         */
        afterChildWalk?: IWalkModelCallback;
    }

    /**
     * A hexagon which surrounds a model.
     */
    export interface IBoundingHex extends IModel {

        /**
         * Radius of the hexagon, which is also the length of a side.
         */
        radius: number;
    }

    //kits

    /**
     * Describes a parameter and its limits.
     */
    export interface IMetaParameter {

        /**
         * Display text of the parameter.
         */
        title: string;

        /**
         * Type of the parameter. Currently supports "range".
         */
        type: string;

        /**
         * Optional minimum value of the range.
         */
        min?: number;

        /**
         * Optional maximum value of the range.
         */
        max?: number;

        /**
         * Optional step value between min and max.
         */
        step?: number;

        /**
         * Initial sample value for this parameter.
         */
        value: any;
    }

    /**
     * An IKit is a model-producing class with some sample parameters. Think of it as a packaged model with instructions on how to best use it.
     */
    export interface IKit {

        /**
         * The constructor. The kit must be "new-able" and it must produce an IModel.
         * It can have any number of any type of parameters.
         */
        new(...args: any[]): IModel;

        /**
         * Attached to the constructor is a property named metaParameters which is an array of IMetaParameter objects.
         * Each element of the array corresponds to a parameter of the constructor, in order.
         */
        metaParameters?: IMetaParameter[];

        /**
         * Information about this kit, in plain text or markdown format.
         */
        notes?: string;
    }

    //cascades
    /**
     * A container that allows a series of functions to be called upon an object.
     */
    export interface ICascade {

        /**
         * The initial context object of the cascade.
         */
        $initial: any;

        /**
         * The current final value of the cascade.
         */
        $result: any;

        /**
         * Use the $original as the $result.
         */
        $reset: () => this;
    }

    /**
     * @private
     */
    class Cascade<T> implements ICascade {
        public $result: any;

        constructor(private _module: any, public $initial: T) {
            for (var methodName in this._module) this._shadow(methodName);
            this.$result = $initial;
        }

        private _shadow(methodName: string) {
            var _this = this;
            this[methodName] = function () {
                return _this._apply(_this._module[methodName], arguments);
            }
        }

        private _apply(fn: Function, carriedArguments: IArguments) {
            var args = [].slice.call(carriedArguments);
            args.unshift(this.$result);
            this.$result = fn.apply(undefined, args);
            return this;
        }

        public $reset() {
            this.$result = this.$initial;
            return this;
        }
    }

    /**
     * Create a container to cascade a series of functions upon a model. This allows JQuery-style method chaining, e.g.:
     * ```
     * makerjs.$(shape).center().rotate(45).$result
     * ```
     * The output of each function call becomes the first parameter input to the next function call.
     * The returned value of the last function call is available via the `.$result` property.
     * 
     * @param modelContext The initial model to execute functions upon.
     * @returns A new cascade container with ICascadeModel methods.
     */
    export function $(modelContext: IModel): ICascadeModel;

    /**
     * Create a container to cascade a series of functions upon a path. This allows JQuery-style method chaining, e.g.:
     * ```
     * makerjs.$(path).center().rotate(90).$result
     * ```
     * The output of each function call becomes the first parameter input to the next function call.
     * The returned value of the last function call is available via the `.$result` property.
     * 
     * @param pathContext The initial path to execute functions upon.
     * @returns A new cascade container with ICascadePath methods.
     */
    export function $(pathContext: IModel): ICascadePath;

    /**
     * Create a container to cascade a series of functions upon a point. This allows JQuery-style method chaining, e.g.:
     * ```
     * makerjs.$([1,0]).scale(5).rotate(60).$result
     * ```
     * The output of each function call becomes the first parameter input to the next function call.
     * The returned value of the last function call is available via the `.$result` property.
     * 
     * @param pointContext The initial point to execute functions upon.
     * @returns A new cascade container with ICascadePoint methods.
     */
    export function $(pointContext: IPoint): ICascadePoint;

    export function $(context: any): ICascade {
        if (isModel(context)) {
            return new Cascade<IModel>(model, context);
        } else if (isPath(context)) {
            return new Cascade<IPath>(path, context);
        } else if (isPoint(context)) {
            return new Cascade<IPoint>(point, context);
        }
    }
}

//CommonJs
module.exports = MakerJs;

declare module "makerjs" {
    export = MakerJs;
}
