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
    function detectEnvironment() {
        if (('global' in this) && ('process' in this)) {
            return environmentTypes.NodeJs;
        }

        if (('window' in this) && ('document' in this)) {
            return environmentTypes.BrowserUI;
        }

        if (('WorkerGlobalScope' in this) && ('self' in this)) {
            return environmentTypes.WebWorker;
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
     * Numeric rounding
     * 
     * Example: round to 3 decimal places
     * ```
     * makerjs.round(3.14159, .001); //returns 3.142
     * ```
     * 
     * @param n The number to round off.
     * @param accuracy Optional exemplar of number of decimal places.
     */
    export function round(n: number, accuracy = .0000001) {
        var places = 1 / accuracy;
        return Math.round(n * places) / places;
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
                newElement = '.' + element;
            } else {
                newElement = JSON.stringify([element]);
            }
            converted.push(newElement);
        }
        return converted.join('');
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

    /**
     * @private
     */
    var x = {} as IPath;

    /**
     * @private
     */
    function reflectName(value?: any) {
        for (var prop in x) {
            delete x[prop];
            return prop;
        }
    }

    /**
     * @private
     */
    function hasNamedProperty(p: IPath, value: any) {
        var prop = reflectName();
        return (prop in p);
    }

    //points

    /**
     * An x-y point in a two-dimensional space.
     * Implemented as an array with 2 elements. The first element is x, the second element is y.
     * 
     * Examples:
     * ```
     * var p: IPoint = [0, 0];   //typescript
     * var p = [0, 0];   //javascript
     * ```
     */
    export interface IPoint {
        [index: number]: number;
    }

    /**
     * Test to see if an object implements the required properties of a point.
     * 
     * @param item The item to test.
     */
    export function isPoint(item: any) {
        return (Array.isArray(item) && (<[]>item).length == 2 && !isNaN(item[0]) && !isNaN(item[1]));
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
     * A map of measurements.
     */
    export interface IMeasureMap {
        [key: string]: IMeasure;
    }

    //paths

    /**
     * A line, curved line or other simple two dimensional shape.
     */
    export interface IPath {

        /**
         * The type of the path, e.g. "line", "circle", or "arc". These strings are enumerated in pathType.
         */
        "type": string;

        /**
         * The main point of reference for this path.
         */
        origin: IPoint;

        /**
         * Optional layer of this path.
         */
        layer?: string;
    }

    /**
     * Test to see if an object implements the required properties of a path.
     * 
     * @param item The item to test.
     */
    export function isPath(item: any): boolean {
        return item && item.type && item.origin;
    }

    /**
     * A line path.
     * 
     * Examples:
     * ```
     * var line: IPathLine = { type: 'line', origin: [0, 0], end: [1, 1] };   //typescript
     * var line = { type: 'line', origin: [0, 0], end: [1, 1] };   //javascript
     * ```
     */
    export interface IPathLine extends IPath {

        /**
         * The end point defining the line. The start point is the origin.
         */
        end: IPoint;
    }

    /**
     * Test to see if an object implements the required properties of a line.
     * 
     * @param item The item to test.
     */
    export function isPathLine(item: any): boolean {
        return isPath(item) && item.type == pathType.Line && item.end;
    }

    /**
     * A circle path.
     * 
     * Examples:
     * ```
     * var circle: IPathCircle = { type: 'circle', origin: [0, 0], radius: 7 };   //typescript
     * var circle = { type: 'circle', origin: [0, 0], radius: 7 };   //javascript
     * ```
     */
    export interface IPathCircle extends IPath {

        /**
         * The radius of the circle.
         */
        radius: number;
    }

    /**
     * Test to see if an object implements the required properties of a circle.
     * 
     * @param item The item to test.
     */
    export function isPathCircle(item: any): boolean {
        return isPath(item) && item.type == pathType.Circle && hasNamedProperty(item, (<IPathCircle>x).radius = null);
    }

    /**
     * An arc path.
     * 
     * Examples:
     * ```
     * var arc: IPathArc = { type: 'arc', origin: [0, 0], radius: 7, startAngle: 0, endAngle: 45 };   //typescript
     * var arc = { type: 'arc', origin: [0, 0], radius: 7, startAngle: 0, endAngle: 45 };   //javascript
     * ```
     */
    export interface IPathArc extends IPathCircle {

        /**
         * The angle (in degrees) to begin drawing the arc, in polar (counter-clockwise) direction.
         */
        startAngle: number;

        /**
         * The angle (in degrees) to end drawing the arc, in polar (counter-clockwise) direction. May be less than start angle if it past 360.
         */
        endAngle: number;
    }

    /**
     * Test to see if an object implements the required properties of an arc.
     * 
     * @param item The item to test.
     */
    export function isPathArc(item: any): boolean {
        return isPath(item) && item.type == pathType.Arc && hasNamedProperty(item, (<IPathArc>x).radius = null) && hasNamedProperty(item, (<IPathArc>x).startAngle = null) && hasNamedProperty(item, (<IPathArc>x).endAngle = null);
    }

    /**
     * A bezier seed defines the endpoints and control points of a bezier curve.
     */
    export interface IPathBezierSeed extends IPathLine {

        /**
         * The bezier control points. One point for quadratic, 2 points for cubic.
         */
        controls: IPoint[];

        /**
         * T values of the parent if this is a child that represents a split.
         */
        parentRange?: IBezierRange;
    }

    /**
     * Bezier t values for an arc path segment in a bezier curve.
     */
    export interface IBezierRange {

        /**
         * The bezier t-value at the starting point.
         */
        startT: number;

        /**
         * The bezier t-value at the end point.
         */
        endT: number;
    }

    /**
     * An arc path segment in a bezier curve.
     */
    export interface IPathArcInBezierCurve extends IPathArc {

        bezierData: IBezierRange;
    }

    /**
     * Test to see if an object implements the required properties of an arc in a bezier curve.
     * 
     * @param item The item to test.
     */
    export function isPathArcInBezierCurve(item: any): boolean {
        return isPathArc(item) && hasNamedProperty(item, (<IPathArcInBezierCurve>x).bezierData = null);
    }

    /**
     * A map of functions which accept a path as a parameter.
     */
    export interface IPathFunctionMap {

        /**
         * Key is the type of a path, value is a function which accepts a path object as its parameter.
         */
        [type: string]: (pathValue: IPath) => void;
    }

    /**
     * A map of functions which accept a path and an origin point as parameters.
     */
    export interface IPathOriginFunctionMap {

        /**
         * Key is the type of a path, value is a function which accepts a path object a point object as its parameters.
         */
        [type: string]: (id: string, pathValue: IPath, origin: IPoint, layer: string) => void;
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
    export interface ISimplifyOptions {

        /**
         * Optional 
         */
        pointMatchingDistance?: number;

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
     * Path objects by id.
     */
    export interface IPathMap {
        [id: string]: IPath;
    }

    /**
     * Model objects by id.
     */
    export interface IModelMap {
        [id: string]: IModel;
    }

    /**
     * A model is a composite object which may contain an array of paths, or an array of models recursively.
     * 
     * Example:
     * ```
     * var m = { 
     *   paths: { 
     *     "line1": { type: 'line', origin: [0, 0], end: [1, 1] }, 
     *     "line2": { type: 'line', origin: [0, 0], end: [-1, -1] } 
     *   } 
     * };
     * ```
     */
    export interface IModel {

        /**
         * Optional origin location of this model.
         */
        origin?: IPoint;

        /**
         * A model may want to specify its type, but this value is not employed yet.
         */
        "type"?: string;

        /**
         * Optional array of path objects in this model.
         */
        paths?: IPathMap;

        /**
         * Optional array of models within this model.
         */
        models?: IModelMap;

        /**
         * Optional unit system of this model. See UnitType for possible values.
         */
        units?: string;

        /**
         * An author may wish to add notes to this model instance.
         */
        notes?: string;

        /**
         * Optional layer of this model.
         */
        layer?: string;

        /**
         * Optional exporter options for this model.
         */
        exporterOptions?: { [exporterName: string]: any };
    }

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
        endless?: boolean
    }

    /**
     * Callback to model.findChains() with resulting array of chains and unchained paths.
     */
    export interface IChainCallback {
        (chains: IChain[], loose: IWalkPath[], layer: string): void;
    }

    /**
     * Options to pass to model.findLoops.
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
        onPath?: IWalkPathCallback;
        beforeChildWalk?: IWalkModelCancellableCallback;
        afterChildWalk?: IWalkModelCallback;
    }

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
        new (...args: any[]): IModel;

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

}

//CommonJs
module.exports = MakerJs;
