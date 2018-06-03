// Type definitions for Maker.js 0.9.93
// Project: https://github.com/Microsoft/maker.js
// Definitions by: Dan Marshall <https://github.com/danmarshall>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/// <reference path="external/jscad/csg.d.ts" />
/// <reference path="external/jscad/io.d.ts" />
/// <reference path="external/jscad/stl-serializer.d.ts" />
/// <reference types="opentype.js" />
/// <reference types="pdfkit" />
/// <reference types="bezier-js" />
/**
 * Schema objects for Maker.js.
 *
 */
declare namespace MakerJs {
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
    interface IPoint {
        [index: number]: number;
    }
    /**
     * A line, curved line or other simple two dimensional shape.
     */
    interface IPath {
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
     * A line path.
     *
     * Examples:
     * ```
     * var line: IPathLine = { type: 'line', origin: [0, 0], end: [1, 1] };   //typescript
     * var line = { type: 'line', origin: [0, 0], end: [1, 1] };   //javascript
     * ```
     */
    interface IPathLine extends IPath {
        /**
         * The end point defining the line. The start point is the origin.
         */
        end: IPoint;
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
    interface IPathCircle extends IPath {
        /**
         * The radius of the circle.
         */
        radius: number;
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
    interface IPathArc extends IPathCircle {
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
     * A bezier seed defines the endpoints and control points of a bezier curve.
     */
    interface IPathBezierSeed extends IPathLine {
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
    interface IBezierRange {
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
    interface IPathArcInBezierCurve extends IPath {
        bezierData: IBezierRange;
    }
    /**
     * Path objects by id.
     */
    interface IPathMap {
        [id: string]: IPath | IPathArc | IPathCircle | IPathLine;
    }
    /**
     * Model objects by id.
     */
    interface IModelMap {
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
    interface IModel {
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
        exporterOptions?: {
            [exporterName: string]: any;
        };
    }
}
/**
 * Root module for Maker.js.
 *
 * Example: get a reference to Maker.js
 * ```
 * var makerjs = require('makerjs');
 * ```
 *
 */
declare namespace MakerJs {
    /**
     * Version info
     */
    var version: string;
    /**
     * Enumeration of environment types.
     */
    var environmentTypes: {
        BrowserUI: string;
        NodeJs: string;
        WebWorker: string;
        Unknown: string;
    };
    /**
     * Current execution environment type, should be one of environmentTypes.
     */
    var environment: string;
    /**
     * String-based enumeration of unit types: imperial, metric or otherwise.
     * A model may specify the unit system it is using, if any. When importing a model, it may have different units.
     * Unit conversion function is makerjs.units.conversionScale().
     * Important: If you add to this, you must also add a corresponding conversion ratio in the unit.ts file!
     */
    var unitType: {
        Centimeter: string;
        Foot: string;
        Inch: string;
        Meter: string;
        Millimeter: string;
    };
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
    function splitDecimal(n: number): string[];
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
    function round(n: number, accuracy?: number): number;
    /**
     * Create a string representation of a route array.
     *
     * @param route Array of strings which are segments of a route.
     * @returns String of the flattened array.
     */
    function createRouteKey(route: string[]): string;
    /**
     * Travel along a route inside of a model to extract a specific node in its tree.
     *
     * @param modelContext Model to travel within.
     * @param route String of a flattened route, or a string array of route segments.
     * @returns Model or Path object within the modelContext tree.
     */
    function travel(modelContext: IModel, route: string | string[]): {
        result: IPath | IModel;
        offset: IPoint;
    };
    /**
     * Clone an object.
     *
     * @param objectToClone The object to clone.
     * @returns A new clone of the original object.
     */
    function cloneObject<T>(objectToClone: T): T;
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
    function extendObject(target: Object, other: Object): Object;
    /**
     * Test to see if a variable is a function.
     *
     * @param value The object to test.
     * @returns True if the object is a function type.
     */
    function isFunction(value: any): boolean;
    /**
     * Test to see if a variable is a number.
     *
     * @param value The object to test.
     * @returns True if the object is a number type.
     */
    function isNumber(value: any): boolean;
    /**
     * Test to see if a variable is an object.
     *
     * @param value The object to test.
     * @returns True if the object is an object type.
     */
    function isObject(value: any): boolean;
    /**
     * Test to see if an object implements the required properties of a point.
     *
     * @param item The item to test.
     */
    function isPoint(item: any): boolean;
    /**
     * A measurement of extents, the high and low points.
     */
    interface IMeasure {
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
    interface IMeasureWithCenter extends IMeasure {
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
    interface IMeasureMap {
        [key: string]: IMeasure;
    }
    /**
     * A path that was removed in a combine operation.
     */
    interface IPathRemoved extends IPath {
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
    interface IMeasurePointInsideOptions {
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
    function isPath(item: any): boolean;
    /**
     * Test to see if an object implements the required properties of a line.
     *
     * @param item The item to test.
     */
    function isPathLine(item: any): boolean;
    /**
     * Test to see if an object implements the required properties of a circle.
     *
     * @param item The item to test.
     */
    function isPathCircle(item: any): boolean;
    /**
     * Test to see if an object implements the required properties of an arc.
     *
     * @param item The item to test.
     */
    function isPathArc(item: any): boolean;
    /**
     * Test to see if an object implements the required properties of an arc in a bezier curve.
     *
     * @param item The item to test.
     */
    function isPathArcInBezierCurve(item: any): boolean;
    /**
     * String-based enumeration of all paths types.
     *
     * Examples: use pathType instead of string literal when creating a circle.
     * ```
     * var circle: IPathCircle = { type: pathType.Circle, origin: [0, 0], radius: 7 };   //typescript
     * var circle = { type: pathType.Circle, origin: [0, 0], radius: 7 };   //javascript
     * ```
     */
    var pathType: {
        Line: string;
        Circle: string;
        Arc: string;
        BezierSeed: string;
    };
    /**
     * Slope and y-intercept of a line.
     */
    interface ISlope {
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
    interface IPathIntersectionBaseOptions {
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
    interface IPathIntersectionOptions extends IPathIntersectionBaseOptions {
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
    interface IPathIntersection {
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
    interface IPointMatchOptions {
        /**
         * Max distance to consider two points as the same.
         */
        pointMatchingDistance?: number;
    }
    /**
     * Options to pass to model.combine.
     */
    interface ICombineOptions extends IPointMatchOptions {
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
    interface IIsPointOnPathOptions {
        /**
         * The slope of the line, if applicable. This will be added to the options object if it did not exist.
         */
        cachedLineSlope?: ISlope;
    }
    /**
     * Options to pass to model.findLoops.
     */
    interface IFindLoopsOptions extends IPointMatchOptions {
        /**
         * Flag to remove looped paths from the original model.
         */
        removeFromOriginal?: boolean;
    }
    /**
     * Options to pass to model.simplify()
     */
    interface ISimplifyOptions extends IPointMatchOptions {
        /**
         * Optional
         */
        scalarMatchingDistance?: number;
    }
    /**
     * A path that may be indicated to "flow" in either direction between its endpoints.
     */
    interface IPathDirectional extends IPath {
        /**
         * The endpoints of the path.
         */
        endPoints: IPoint[];
        /**
         * Path flows forwards or reverse.
         */
        reversed?: boolean;
    }
    /**
     * Callback signature for model.walkPaths().
     */
    interface IModelPathCallback {
        (modelContext: IModel, pathId: string, pathContext: IPath): void;
    }
    /**
     * Test to see if an object implements the required properties of a model.
     */
    function isModel(item: any): boolean;
    /**
     * Reference to a path id within a model.
     */
    interface IRefPathIdInModel {
        modelContext: IModel;
        pathId: string;
    }
    /**
     * A route to either a path or a model, and the absolute offset of it.
     */
    interface IRouteOffset {
        layer: string;
        offset: IPoint;
        route: string[];
        routeKey: string;
    }
    /**
     * A path reference in a walk.
     */
    interface IWalkPath extends IRefPathIdInModel, IRouteOffset {
        pathContext: IPath;
    }
    /**
     * Callback signature for path in model.walk().
     */
    interface IWalkPathCallback {
        (context: IWalkPath): void;
    }
    /**
     * Callback for returning a boolean from an IWalkPath.
     */
    interface IWalkPathBooleanCallback {
        (context: IWalkPath): boolean;
    }
    /**
     * A link in a chain, with direction of flow.
     */
    interface IChainLink {
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
    interface IChain {
        /**
         * The links in this chain.
         */
        links: IChainLink[];
        /**
         * Flag if this chain forms a loop end to end.
         */
        endless: boolean;
        /**
         * Total length of all paths in the chain.
         */
        pathLength: number;
        /**
         * Chains that are contained within this chain. Populated when chains are found with the 'contain' option
         */
        contains?: IChain[];
    }
    /**
     * A map of chains by layer.
     */
    interface IChainsMap {
        [layer: string]: IChain[];
    }
    /**
     * Test to see if an object implements the required properties of a chain.
     *
     * @param item The item to test.
     */
    function isChain(item: any): boolean;
    /**
     * Callback to model.findChains() with resulting array of chains and unchained paths.
     */
    interface IChainCallback {
        (chains: IChain[], loose: IWalkPath[], layer: string, ignored?: IWalkPath[]): void;
    }
    /**
     * Options to pass to model.findChains.
     */
    interface IFindChainsOptions extends IPointMatchOptions {
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
    interface IContainChainsOptions {
        /**
         * Flag to alternate direction of contained chains.
         */
        alternateDirection?: boolean;
    }
    /**
     * Reference to a model within a model.
     */
    interface IRefModelInModel {
        parentModel: IModel;
        childId: string;
        childModel: IModel;
    }
    /**
     * A model reference in a walk.
     */
    interface IWalkModel extends IRefModelInModel, IRouteOffset {
    }
    /**
     * Callback signature for model.walk().
     */
    interface IWalkModelCallback {
        (context: IWalkModel): void;
    }
    /**
     * Callback signature for model.walk(), which may return false to halt any further walking.
     */
    interface IWalkModelCancellableCallback {
        (context: IWalkModel): boolean;
    }
    /**
     * Options to pass to model.walk().
     */
    interface IWalkOptions {
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
    interface IBoundingHex extends IModel {
        /**
         * Radius of the hexagon, which is also the length of a side.
         */
        radius: number;
    }
    /**
     * Describes a parameter and its limits.
     */
    interface IMetaParameter {
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
    interface IKit {
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
    /**
     * A container that allows a series of functions to be called upon an object.
     */
    interface ICascade {
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
    function $(modelContext: IModel): ICascadeModel;
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
    function $(pathContext: IModel): ICascadePath;
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
    function $(pointContext: IPoint): ICascadePoint;
}
declare module "makerjs" {
    export = MakerJs;
}
declare namespace MakerJs {
    interface ICascadeModel extends ICascade {
        /**
         * Add a model as a child. This is basically equivalent to:
```
parentModel.models[childModelId] = childModel;
```
with additional checks to make it safe for cascading.
         *
         * @param childModel The model to add.
         * @param childModelId The id of the child model.
         * @param overWrite (default false) Optional flag to overwrite any model referenced by childModelId. Default is false, which will create an id similar to childModelId.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        addModel(childModel: IModel, childModelId: string, overWrite?: boolean): ICascadeModel;
        /**
         * Add a path as a child. This is basically equivalent to:
```
parentModel.paths[childPathId] = childPath;
```
with additional checks to make it safe for cascading.
         *
         * @param pathContext The path to add.
         * @param pathId The id of the path.
         * @param overWrite (default false) Optional flag to overwrite any path referenced by pathId. Default is false, which will create an id similar to pathId.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        addPath(pathContext: IPath, pathId: string, overWrite?: boolean): ICascadeModel;
        /**
         * Add a model as a child of another model. This is basically equivalent to:
```
parentModel.models[childModelId] = childModel;
```
with additional checks to make it safe for cascading.
         *
         * @param parentModel The model to add to.
         * @param childModelId The id of the child model.
         * @param overWrite (default false) Optional flag to overwrite any model referenced by childModelId. Default is false, which will create an id similar to childModelId.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        addTo(parentModel: IModel, childModelId: string, overWrite?: boolean): ICascadeModel;
        /**
         * DEPRECATED
Break a model's paths everywhere they intersect with another path.
         *
         * @param modelToIntersect Optional model containing paths to look for intersection, or else the modelToBreak will be used.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        breakPathsAtIntersections(modelToIntersect?: IModel): ICascadeModel;
        /**
         * Center a model at [0, 0].
         *
         * @param centerX (default true) Boolean to center on the x axis. Default is true.
         * @param centerY (default true) Boolean to center on the y axis. Default is true.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        center(centerX?: boolean, centerY?: boolean): ICascadeModel;
        /**
         * Clone a model. Alias of makerjs.cloneObject(modelToClone)
         *
         * @returns this cascade container, this.$result will be A clone of the model you passed.

         */
        clone(): ICascadeModel;
        /**
         * Combine 2 models. Each model will be modified accordingly.
         *
         * @param modelB Second model to combine.
         * @param includeAInsideB (default false) Flag to include paths from modelA which are inside of modelB.
         * @param includeAOutsideB (default true) Flag to include paths from modelA which are outside of modelB.
         * @param includeBInsideA (default false) Flag to include paths from modelB which are inside of modelA.
         * @param includeBOutsideA (default true) Flag to include paths from modelB which are outside of modelA.
         * @param options Optional ICombineOptions object.
         * @returns this cascade container, this.$result will be A new model containing both of the input models as "a" and "b".

         */
        combine(modelB: IModel, includeAInsideB?: boolean, includeAOutsideB?: boolean, includeBInsideA?: boolean, includeBOutsideA?: boolean, options?: ICombineOptions): ICascadeModel;
        /**
         * Combine 2 models, resulting in a intersection. Each model will be modified accordingly.
         *
         * @param modelB Second model to combine.
         * @returns this cascade container, this.$result will be A new model containing both of the input models as "a" and "b".

         */
        combineIntersection(modelB: IModel): ICascadeModel;
        /**
         * Combine 2 models, resulting in a subtraction of B from A. Each model will be modified accordingly.
         *
         * @param modelB Second model to combine.
         * @returns this cascade container, this.$result will be A new model containing both of the input models as "a" and "b".

         */
        combineSubtraction(modelB: IModel): ICascadeModel;
        /**
         * Combine 2 models, resulting in a union. Each model will be modified accordingly.
         *
         * @param modelB Second model to combine.
         * @returns this cascade container, this.$result will be A new model containing both of the input models as "a" and "b".

         */
        combineUnion(modelB: IModel): ICascadeModel;
        /**
         * Convert a model to match a different unit system.
         *
         * @param destUnitType The unit system.
         * @returns this cascade container, this.$result will be The scaled model (for cascading).

         */
        convertUnits(destUnitType: string): ICascadeModel;
        /**
         * Expand all paths in a model, then combine the resulting expansions.
         *
         * @param distance Distance to expand.
         * @param joints (default 0) Number of points at a joint between paths. Use 0 for round joints, 1 for pointed joints, 2 for beveled joints.
         * @param combineOptions (default {}) Optional object containing combine options.
         * @returns this cascade container, this.$result will be Model which surrounds the paths of the original model.

         */
        expandPaths(distance: number, joints?: number, combineOptions?: ICombineOptions): ICascadeModel;
        /**
         * Find paths that have common endpoints and form loops.
         *
         * @param options Optional options object.
         * @returns this cascade container, this.$result will be A new model with child models ranked according to their containment within other found loops. The paths of models will be IPathDirectionalWithPrimeContext.

         */
        findLoops(options?: IFindLoopsOptions): ICascadeModel;
        /**
         * Set the layer of a model. This is equivalent to:
```
modelContext.layer = layer;
```
         *
         * @param layer The layer name.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        layer(layer: string): ICascadeModel;
        /**
         * Create a clone of a model, mirrored on either or both x and y axes.
         *
         * @param mirrorX Boolean to mirror on the x axis.
         * @param mirrorY Boolean to mirror on the y axis.
         * @returns this cascade container, this.$result will be Mirrored model.

         */
        mirror(mirrorX: boolean, mirrorY: boolean): ICascadeModel;
        /**
         * Move a model to an absolute point. Note that this is also accomplished by directly setting the origin property. This function exists for cascading.
         *
         * @param origin The new position of the model.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        move(origin: IPoint): ICascadeModel;
        /**
         * Move a model's origin by a relative amount.
         *
         * @param delta The x & y adjustments as a point object.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        moveRelative(delta: IPoint): ICascadeModel;
        /**
         * Moves all of a model's children (models and paths, recursively) in reference to a single common origin. Useful when points between children need to connect to each other.
         *
         * @param origin Optional offset reference point.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        originate(origin?: IPoint): ICascadeModel;
        /**
         * Outline a model by a specified distance. Useful for accommodating for kerf.
         *
         * @param distance Distance to outline.
         * @param joints (default 0) Number of points at a joint between paths. Use 0 for round joints, 1 for pointed joints, 2 for beveled joints.
         * @param inside (default false) Optional boolean to draw lines inside the model instead of outside.
         * @param options (default {}) Options to send to combine() function.
         * @returns this cascade container, this.$result will be Model which surrounds the paths outside of the original model.

         */
        outline(distance: number, joints?: number, inside?: boolean, options?: ICombineOptions): ICascadeModel;
        /**
         * Prefix the ids of paths in a model.
         *
         * @param prefix The prefix to prepend on paths ids.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        prefixPathIds(prefix: string): ICascadeModel;
        /**
         * Remove paths from a model which have endpoints that do not connect to other paths.
         *
         * @param pointMatchingDistance Optional max distance to consider two points as the same.
         * @param keep Optional callback function (which should return a boolean) to decide if a dead end path should be kept instead.
         * @param trackDeleted Optional callback function which will log discarded paths and the reason they were discarded.
         * @returns this cascade container, this.$result will be The input model (for cascading).

         */
        removeDeadEnds(pointMatchingDistance?: number, keep?: IWalkPathBooleanCallback, trackDeleted?: undefined): ICascadeModel;
        /**
         * Rotate a model.
         *
         * @param angleInDegrees The amount of rotation, in degrees.
         * @param rotationOrigin (default [0, 0]) The center point of rotation.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        rotate(angleInDegrees: number, rotationOrigin?: IPoint): ICascadeModel;
        /**
         * Scale a model.
         *
         * @param scaleValue The amount of scaling.
         * @param scaleOrigin (default false) Optional boolean to scale the origin point. Typically false for the root model.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        scale(scaleValue: number, scaleOrigin?: boolean): ICascadeModel;
        /**
         * Simplify a model's paths by reducing redundancy: combine multiple overlapping paths into a single path. The model must be originated.
         *
         * @param options Optional options object.
         * @returns this cascade container, this.$result will be The simplified model (for cascading).

         */
        simplify(options?: ISimplifyOptions): ICascadeModel;
        /**
         * Recursively walk through all child models and paths for a given model.
         *
         * @param options Object containing callbacks.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        walk(options: IWalkOptions): ICascadeModel;
        /**
         * Move a model so its bounding box begins at [0, 0].
         *
         * @param zeroX (default true) Boolean to zero on the x axis. Default is true.
         * @param zeroY (default true) Boolean to zero on the y axis. Default is true.
         * @returns this cascade container, this.$result will be The original model (for cascading).

         */
        zero(zeroX?: boolean, zeroY?: boolean): ICascadeModel;
    }
    interface ICascadePath extends ICascade {
        /**
         * Add a path to a model. This is basically equivalent to:
```
parentModel.paths[pathId] = childPath;
```
with additional checks to make it safe for cascading.
         *
         * @param parentModel The model to add to.
         * @param pathId The id of the path.
         * @param overwrite (default false) Optional flag to overwrite any path referenced by pathId. Default is false, which will create an id similar to pathId.
         * @returns this cascade container, this.$result will be The original path (for cascading).

         */
        addTo(parentModel: IModel, pathId: string, overwrite?: boolean): ICascadePath;
        /**
         * Alter a path by lengthening or shortening it.
         *
         * @param distance Numeric amount of length to add or remove from the path. Use a positive number to lengthen, negative to shorten. When shortening: this function will not alter the path and will return null if the resulting path length is less than or equal to zero.
         * @param useOrigin (default false) Optional flag to alter from the origin instead of the end of the path.
         * @returns this cascade container, this.$result will be The original path (for cascading), or null if the path could not be altered.

         */
        alterLength(distance: number, useOrigin?: boolean): ICascadePath;
        /**
         * Breaks a path in two. The supplied path will end at the supplied pointOfBreak,
a new path is returned which begins at the pointOfBreak and ends at the supplied path's initial end point.
For Circle, the original path will be converted in place to an Arc, and null is returned.
         *
         * @param pointOfBreak The point at which to break the path.
         * @returns this cascade container, this.$result will be A new path of the same type, when path type is line or arc. Returns null for circle.

         */
        breakAtPoint(pointOfBreak: IPoint): ICascadePath;
        /**
         * Center a path at [0, 0].
         *
         * @returns this cascade container, this.$result will be The original path (for cascading).

         */
        center(): ICascadePath;
        /**
         * Create a clone of a path. This is faster than cloneObject.
         *
         * @param offset Optional point to move path a relative distance.
         * @returns this cascade container, this.$result will be Cloned path.

         */
        clone(offset?: IPoint): ICascadePath;
        /**
         * Copy the schema properties of one path to another.
         *
         * @param destPath The destination path to copy property values to.
         * @returns this cascade container, this.$result will be The source path.

         */
        copyProps(destPath: IPath): ICascadePath;
        /**
         * Set the layer of a path. This is equivalent to:
```
pathContext.layer = layer;
```
         *
         * @param layer The layer name.
         * @returns this cascade container, this.$result will be The original path (for cascading).

         */
        layer(layer: string): ICascadePath;
        /**
         * Create a clone of a path, mirrored on either or both x and y axes.
         *
         * @param mirrorX Boolean to mirror on the x axis.
         * @param mirrorY Boolean to mirror on the y axis.
         * @returns this cascade container, this.$result will be Mirrored path.

         */
        mirror(mirrorX: boolean, mirrorY: boolean): ICascadePath;
        /**
         * Move a path to an absolute point.
         *
         * @param origin The new origin for the path.
         * @returns this cascade container, this.$result will be The original path (for cascading).

         */
        move(origin: IPoint): ICascadePath;
        /**
         * Move a path's origin by a relative amount.
         *
         * @param delta The x & y adjustments as a point object.
         * @param subtract Optional boolean to subtract instead of add.
         * @returns this cascade container, this.$result will be The original path (for cascading).

         */
        moveRelative(delta: IPoint, subtract?: boolean): ICascadePath;
        /**
         * Rotate a path.
         *
         * @param angleInDegrees The amount of rotation, in degrees.
         * @param rotationOrigin (default [0, 0]) The center point of rotation.
         * @returns this cascade container, this.$result will be The original path (for cascading).

         */
        rotate(angleInDegrees: number, rotationOrigin?: IPoint): ICascadePath;
        /**
         * Scale a path.
         *
         * @param scaleValue The amount of scaling.
         * @returns this cascade container, this.$result will be The original path (for cascading).

         */
        scale(scaleValue: number): ICascadePath;
        /**
         * Move a path so its bounding box begins at [0, 0].
         *
         * @returns this cascade container, this.$result will be The original path (for cascading).

         */
        zero(): ICascadePath;
    }
    interface ICascadePoint extends ICascade {
        /**
         * Add two points together and return the result as a new point object.
         *
         * @param b Second point.
         * @param subtract Optional boolean to subtract instead of add.
         * @returns this cascade container, this.$result will be A new point object.

         */
        add(b: IPoint, subtract?: boolean): ICascadePoint;
        /**
         * Get the average of two points.
         *
         * @param b Second point.
         * @returns this cascade container, this.$result will be New point object which is the average of a and b.

         */
        average(b: IPoint): ICascadePoint;
        /**
         * Clone a point into a new point.
         *
         * @returns this cascade container, this.$result will be A new point with same values as the original.

         */
        clone(): ICascadePoint;
        /**
         * From an array of points, find the closest point to a given reference point.
         *
         * @param pointOptions Array of points to choose from.
         * @returns this cascade container, this.$result will be The first closest point from the pointOptions.

         */
        closest(pointOptions: IPoint[]): ICascadePoint;
        /**
         * Distort a point's coordinates.
         *
         * @param scaleX The amount of x scaling.
         * @param scaleY The amount of y scaling.
         * @returns this cascade container, this.$result will be A new point.

         */
        distort(scaleX: number, scaleY: number): ICascadePoint;
        /**
         * Create a clone of a point, mirrored on either or both x and y axes.
         *
         * @param mirrorX Boolean to mirror on the x axis.
         * @param mirrorY Boolean to mirror on the y axis.
         * @returns this cascade container, this.$result will be Mirrored point.

         */
        mirror(mirrorX: boolean, mirrorY: boolean): ICascadePoint;
        /**
         * Rotate a point.
         *
         * @param angleInDegrees The amount of rotation, in degrees.
         * @param rotationOrigin (default [0, 0]) The center point of rotation.
         * @returns this cascade container, this.$result will be A new point.

         */
        rotate(angleInDegrees: number, rotationOrigin?: IPoint): ICascadePoint;
        /**
         * Round the values of a point.
         *
         * @param accuracy Optional exemplar number of decimal places.
         * @returns this cascade container, this.$result will be A new point with the values rounded.

         */
        rounded(accuracy?: number): ICascadePoint;
        /**
         * Scale a point's coordinates.
         *
         * @param scaleValue The amount of scaling.
         * @returns this cascade container, this.$result will be A new point.

         */
        scale(scaleValue: number): ICascadePoint;
        /**
         * Subtract a point from another point, and return the result as a new point. Shortcut to Add(a, b, subtract = true).
         *
         * @param b Second point.
         * @returns this cascade container, this.$result will be A new point object.

         */
        subtract(b: IPoint): ICascadePoint;
    }
}
declare namespace MakerJs.angle {
    /**
     * Ensures an angle is not greater than 360
     *
     * @param angleInDegrees Angle in degrees.
     * @returns Same polar angle but not greater than 360 degrees.
     */
    function noRevolutions(angleInDegrees: number): number;
    /**
     * Convert an angle from degrees to radians.
     *
     * @param angleInDegrees Angle in degrees.
     * @returns Angle in radians.
     */
    function toRadians(angleInDegrees: number): number;
    /**
     * Convert an angle from radians to degrees.
     *
     * @param angleInRadians Angle in radians.
     * @returns Angle in degrees.
     */
    function toDegrees(angleInRadians: number): number;
    /**
     * Get an arc's end angle, ensured to be greater than its start angle.
     *
     * @param arc An arc path object.
     * @returns End angle of arc.
     */
    function ofArcEnd(arc: IPathArc): number;
    /**
     * Get the angle in the middle of an arc's start and end angles.
     *
     * @param arc An arc path object.
     * @param ratio Optional number between 0 and 1 specifying percentage between start and end angles. Default is .5
     * @returns Middle angle of arc.
     */
    function ofArcMiddle(arc: IPathArc, ratio?: number): number;
    /**
     * Total angle of an arc between its start and end angles.
     *
     * @param arc The arc to measure.
     * @returns Angle of arc.
     */
    function ofArcSpan(arc: IPathArc): number;
    /**
     * Angle of a line path.
     *
     * @param line The line path to find the angle of.
     * @returns Angle of the line path, in degrees.
     */
    function ofLineInDegrees(line: IPathLine): number;
    /**
     * Angle of a line through a point, in degrees.
     *
     * @param pointToFindAngle The point to find the angle.
     * @param origin Point of origin of the angle.
     * @returns Angle of the line throught the point, in degrees.
     */
    function ofPointInDegrees(origin: IPoint, pointToFindAngle: IPoint): number;
    /**
     * Angle of a line through a point, in radians.
     *
     * @param pointToFindAngle The point to find the angle.
     * @param origin Point of origin of the angle.
     * @returns Angle of the line throught the point, in radians.
     */
    function ofPointInRadians(origin: IPoint, pointToFindAngle: IPoint): number;
    /**
     * Mirror an angle on either or both x and y axes.
     *
     * @param angleInDegrees The angle to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @returns Mirrored angle.
     */
    function mirror(angleInDegrees: number, mirrorX: boolean, mirrorY: boolean): number;
    /**
     * Get the angle of a joint between 2 chain links.
     *
     * @param linkA First chain link.
     * @param linkB Second chain link.
     * @returns Angle between chain links.
     */
    function ofChainLinkJoint(linkA: IChainLink, linkB: IChainLink): number;
}
declare namespace MakerJs.point {
    /**
     * Add two points together and return the result as a new point object.
     *
     * @param a First point.
     * @param b Second point.
     * @param subtract Optional boolean to subtract instead of add.
     * @returns A new point object.
     */
    function add(a: IPoint, b: IPoint, subtract?: boolean): IPoint;
    /**
     * Get the average of two points.
     *
     * @param a First point.
     * @param b Second point.
     * @returns New point object which is the average of a and b.
     */
    function average(a: IPoint, b: IPoint): IPoint;
    /**
     * Clone a point into a new point.
     *
     * @param pointToClone The point to clone.
     * @returns A new point with same values as the original.
     */
    function clone(pointToClone: IPoint): IPoint;
    /**
     * From an array of points, find the closest point to a given reference point.
     *
     * @param referencePoint The reference point.
     * @param pointOptions Array of points to choose from.
     * @returns The first closest point from the pointOptions.
     */
    function closest(referencePoint: IPoint, pointOptions: IPoint[]): IPoint;
    /**
     * Get a point from its polar coordinates.
     *
     * @param angleInRadians The angle of the polar coordinate, in radians.
     * @param radius The radius of the polar coordinate.
     * @returns A new point object.
     */
    function fromPolar(angleInRadians: number, radius: number): IPoint;
    /**
     * Get a point on a circle or arc path, at a given angle.
     * @param angleInDegrees The angle at which you want to find the point, in degrees.
     * @param circle A circle or arc.
     * @returns A new point object.
     */
    function fromAngleOnCircle(angleInDegrees: number, circle: IPathCircle): IPoint;
    /**
     * Get the two end points of an arc path.
     *
     * @param arc The arc path object.
     * @returns Array with 2 elements: [0] is the point object corresponding to the start angle, [1] is the point object corresponding to the end angle.
     */
    function fromArc(arc: IPathArc): IPoint[];
    /**
     * Get the two end points of a path.
     *
     * @param pathContext The path object.
     * @returns Array with 2 elements: [0] is the point object corresponding to the origin, [1] is the point object corresponding to the end.
     */
    function fromPathEnds(pathContext: IPath, pathOffset?: IPoint): IPoint[];
    /**
     * Calculates the intersection of slopes of two lines.
     *
     * @param lineA First line to use for slope.
     * @param lineB Second line to use for slope.
     * @param options Optional IPathIntersectionOptions.
     * @returns point of intersection of the two slopes, or null if the slopes did not intersect.
     */
    function fromSlopeIntersection(lineA: IPathLine, lineB: IPathLine, options?: IPathIntersectionBaseOptions): IPoint;
    /**
     * Get the middle point of a path.
     *
     * @param pathContext The path object.
     * @param ratio Optional ratio (between 0 and 1) of point along the path. Default is .5 for middle.
     * @returns Point on the path, in the middle of the path.
     */
    function middle(pathContext: IPath, ratio?: number): IPoint;
    /**
     * Create a clone of a point, mirrored on either or both x and y axes.
     *
     * @param pointToMirror The point to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @returns Mirrored point.
     */
    function mirror(pointToMirror: IPoint, mirrorX: boolean, mirrorY: boolean): IPoint;
    /**
     * Round the values of a point.
     *
     * @param pointContext The point to serialize.
     * @param accuracy Optional exemplar number of decimal places.
     * @returns A new point with the values rounded.
     */
    function rounded(pointContext: IPoint, accuracy?: number): IPoint;
    /**
     * Rotate a point.
     *
     * @param pointToRotate The point to rotate.
     * @param angleInDegrees The amount of rotation, in degrees.
     * @param rotationOrigin The center point of rotation.
     * @returns A new point.
     */
    function rotate(pointToRotate: IPoint, angleInDegrees: number, rotationOrigin?: IPoint): IPoint;
    /**
     * Scale a point's coordinates.
     *
     * @param pointToScale The point to scale.
     * @param scaleValue The amount of scaling.
     * @returns A new point.
     */
    function scale(pointToScale: IPoint, scaleValue: number): IPoint;
    /**
     * Distort a point's coordinates.
     *
     * @param pointToDistort The point to distort.
     * @param scaleX The amount of x scaling.
     * @param scaleY The amount of y scaling.
     * @returns A new point.
     */
    function distort(pointToDistort: IPoint, scaleX: number, scaleY: number): IPoint;
    /**
     * Subtract a point from another point, and return the result as a new point. Shortcut to Add(a, b, subtract = true).
     *
     * @param a First point.
     * @param b Second point.
     * @returns A new point object.
     */
    function subtract(a: IPoint, b: IPoint): IPoint;
    /**
     * A point at 0,0 coordinates.
     * NOTE: It is important to call this as a method, with the empty parentheses.
     *
     * @returns A new point.
     */
    function zero(): IPoint;
}
declare namespace MakerJs.path {
    /**
     * Add a path to a model. This is basically equivalent to:
     * ```
     * parentModel.paths[pathId] = childPath;
     * ```
     * with additional checks to make it safe for cascading.
     *
     * @param childPath The path to add.
     * @param parentModel The model to add to.
     * @param pathId The id of the path.
     * @param overwrite Optional flag to overwrite any path referenced by pathId. Default is false, which will create an id similar to pathId.
     * @returns The original path (for cascading).
     */
    function addTo(childPath: IPath, parentModel: IModel, pathId: string, overwrite?: boolean): IPath;
    /**
     * Create a clone of a path. This is faster than cloneObject.
     *
     * @param pathToClone The path to clone.
     * @param offset Optional point to move path a relative distance.
     * @returns Cloned path.
     */
    function clone(pathToClone: IPath, offset?: IPoint): IPath;
    /**
     * Copy the schema properties of one path to another.
     *
     * @param srcPath The source path to copy property values from.
     * @param destPath The destination path to copy property values to.
     * @returns The source path.
     */
    function copyProps(srcPath: IPath, destPath: IPath): IPath;
    /**
     * Set the layer of a path. This is equivalent to:
     * ```
     * pathContext.layer = layer;
     * ```
     *
     * @param pathContext The path to set the layer.
     * @param layer The layer name.
     * @returns The original path (for cascading).
     */
    function layer(pathContext: IPath, layer: string): IPath;
    /**
     * Create a clone of a path, mirrored on either or both x and y axes.
     *
     * @param pathToMirror The path to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @returns Mirrored path.
     */
    function mirror(pathToMirror: IPath, mirrorX: boolean, mirrorY: boolean): IPath;
    /**
     * Move a path to an absolute point.
     *
     * @param pathToMove The path to move.
     * @param origin The new origin for the path.
     * @returns The original path (for cascading).
     */
    function move(pathToMove: IPath, origin: IPoint): IPath;
    /**
     * Move a path's origin by a relative amount.
     *
     * @param pathToMove The path to move.
     * @param delta The x & y adjustments as a point object.
     * @param subtract Optional boolean to subtract instead of add.
     * @returns The original path (for cascading).
     */
    function moveRelative(pathToMove: IPath, delta: IPoint, subtract?: boolean): IPath;
    /**
     * Move some paths relatively during a task execution, then unmove them.
     *
     * @param pathsToMove The paths to move.
     * @param deltas The x & y adjustments as a point object array.
     * @param task The function to call while the paths are temporarily moved.
     */
    function moveTemporary(pathsToMove: IPath[], deltas: IPoint[], task: Function): void;
    /**
     * Rotate a path.
     *
     * @param pathToRotate The path to rotate.
     * @param angleInDegrees The amount of rotation, in degrees.
     * @param rotationOrigin The center point of rotation.
     * @returns The original path (for cascading).
     */
    function rotate(pathToRotate: IPath, angleInDegrees: number, rotationOrigin?: IPoint): IPath;
    /**
     * Scale a path.
     *
     * @param pathToScale The path to scale.
     * @param scaleValue The amount of scaling.
     * @returns The original path (for cascading).
     */
    function scale(pathToScale: IPath, scaleValue: number): IPath;
    /**
     * Distort a path - scale x and y individually.
     *
     * @param pathToDistort The path to distort.
     * @param scaleX The amount of x scaling.
     * @param scaleY The amount of y scaling.
     * @returns A new IModel (for circles and arcs) or IPath (for lines and bezier seeds).
     */
    function distort(pathToDistort: IPath, scaleX: number, scaleY: number): IModel | IPath;
    /**
     * Connect 2 lines at their slope intersection point.
     *
     * @param lineA First line to converge.
     * @param lineB Second line to converge.
     * @param useOriginA Optional flag to converge the origin point of lineA instead of the end point.
     * @param useOriginB Optional flag to converge the origin point of lineB instead of the end point.
     * @returns point of convergence.
     */
    function converge(lineA: IPathLine, lineB: IPathLine, useOriginA?: boolean, useOriginB?: boolean): IPoint;
    /**
     * Alter a path by lengthening or shortening it.
     *
     * @param pathToAlter Path to alter.
     * @param distance Numeric amount of length to add or remove from the path. Use a positive number to lengthen, negative to shorten. When shortening: this function will not alter the path and will return null if the resulting path length is less than or equal to zero.
     * @param useOrigin Optional flag to alter from the origin instead of the end of the path.
     * @returns The original path (for cascading), or null if the path could not be altered.
     */
    function alterLength(pathToAlter: IPath, distance: number, useOrigin?: boolean): IPath;
    /**
     * Get points along a path.
     *
     * @param pathContext Path to get points from.
     * @param numberOfPoints Number of points to divide the path.
     * @returns Array of points which are on the path spread at a uniform interval.
     */
    function toPoints(pathContext: IPath, numberOfPoints: number): IPoint[];
    /**
     * Get key points (a minimal a number of points) along a path.
     *
     * @param pathContext Path to get points from.
     * @param maxArcFacet Optional maximum length between points on an arc or circle.
     * @returns Array of points which are on the path.
     */
    function toKeyPoints(pathContext: IPath, maxArcFacet?: number): IPoint[];
    /**
     * Center a path at [0, 0].
     *
     * @param pathToCenter The path to center.
     * @returns The original path (for cascading).
     */
    function center(pathToCenter: IPath): IPath;
    /**
     * Move a path so its bounding box begins at [0, 0].
     *
     * @param pathToZero The path to zero.
     * @returns The original path (for cascading).
     */
    function zero(pathToZero: IPath): IPath;
}
declare namespace MakerJs.path {
    /**
     * Breaks a path in two. The supplied path will end at the supplied pointOfBreak,
     * a new path is returned which begins at the pointOfBreak and ends at the supplied path's initial end point.
     * For Circle, the original path will be converted in place to an Arc, and null is returned.
     *
     * @param pathToBreak The path to break.
     * @param pointOfBreak The point at which to break the path.
     * @returns A new path of the same type, when path type is line or arc. Returns null for circle.
     */
    function breakAtPoint(pathToBreak: IPath, pointOfBreak: IPoint): IPath;
}
declare namespace MakerJs.paths {
    /**
     * Class for arc path.
     */
    class Arc implements IPathArc {
        origin: IPoint;
        radius: number;
        startAngle: number;
        endAngle: number;
        type: string;
        /**
         * Class for arc path, created from origin point, radius, start angle, and end angle.
         *
         * @param origin The center point of the arc.
         * @param radius The radius of the arc.
         * @param startAngle The start angle of the arc.
         * @param endAngle The end angle of the arc.
         */
        constructor(origin: IPoint, radius: number, startAngle: number, endAngle: number);
        /**
         * Class for arc path, created from 2 points, radius, large Arc flag, and clockwise flag.
         *
         * @param pointA First end point of the arc.
         * @param pointB Second end point of the arc.
         * @param radius The radius of the arc.
         * @param largeArc Boolean flag to indicate clockwise direction.
         * @param clockwise Boolean flag to indicate clockwise direction.
         */
        constructor(pointA: IPoint, pointB: IPoint, radius: number, largeArc: boolean, clockwise: boolean);
        /**
         * Class for arc path, created from 2 points and optional boolean flag indicating clockwise.
         *
         * @param pointA First end point of the arc.
         * @param pointB Second end point of the arc.
         * @param clockwise Boolean flag to indicate clockwise direction.
         */
        constructor(pointA: IPoint, pointB: IPoint, clockwise?: boolean);
        /**
         * Class for arc path, created from 3 points.
         *
         * @param pointA First end point of the arc.
         * @param pointB Middle point on the arc.
         * @param pointC Second end point of the arc.
         */
        constructor(pointA: IPoint, pointB: IPoint, pointC: IPoint);
    }
    /**
     * Class for circle path.
     */
    class Circle implements IPathCircle {
        type: string;
        origin: IPoint;
        radius: number;
        /**
         * Class for circle path, created from radius. Origin will be [0, 0].
         *
         * Example:
         * ```
         * var c = new makerjs.paths.Circle(7);
         * ```
         *
         * @param radius The radius of the circle.
         */
        constructor(radius: number);
        /**
         * Class for circle path, created from origin point and radius.
         *
         * Example:
         * ```
         * var c = new makerjs.paths.Circle([10, 10], 7);
         * ```
         *
         * @param origin The center point of the circle.
         * @param radius The radius of the circle.
         */
        constructor(origin: IPoint, radius: number);
        /**
         * Class for circle path, created from 2 points.
         *
         * Example:
         * ```
         * var c = new makerjs.paths.Circle([5, 15], [25, 15]);
         * ```
         *
         * @param pointA First point on the circle.
         * @param pointB Second point on the circle.
         */
        constructor(pointA: IPoint, pointB: IPoint);
        /**
         * Class for circle path, created from 3 points.
         *
         * Example:
         * ```
         * var c = new makerjs.paths.Circle([0, 0], [0, 10], [20, 0]);
         * ```
         *
         * @param pointA First point on the circle.
         * @param pointB Second point on the circle.
         * @param pointC Third point on the circle.
         */
        constructor(pointA: IPoint, pointB: IPoint, pointC: IPoint);
    }
    /**
     * Class for line path.
     */
    class Line implements IPathLine {
        type: string;
        origin: IPoint;
        end: IPoint;
        /**
         * Class for line path, constructed from array of 2 points.
         *
         * @param points Array of 2 points.
         */
        constructor(points: IPoint[]);
        /**
         * Class for line path, constructed from 2 points.
         *
         * @param origin The origin point of the line.
         * @param end The end point of the line.
         */
        constructor(origin: IPoint, end: IPoint);
    }
    /**
     * Class for chord, which is simply a line path that connects the endpoints of an arc.
     *
     * @param arc Arc to use as the basic for the chord.
     */
    class Chord implements IPathLine {
        type: string;
        origin: IPoint;
        end: IPoint;
        constructor(arc: IPathArc);
    }
    /**
     * Class for a parallel line path.
     *
     * @param toLine A line to be parallel to.
     * @param distance Distance between parallel and original line.
     * @param nearPoint Any point to determine which side of the line to place the parallel.
     */
    class Parallel implements IPathLine {
        type: string;
        origin: IPoint;
        end: IPoint;
        constructor(toLine: IPathLine, distance: number, nearPoint: IPoint);
    }
}
declare namespace MakerJs.model {
    /**
     * Add a path as a child. This is basically equivalent to:
     * ```
     * parentModel.paths[childPathId] = childPath;
     * ```
     * with additional checks to make it safe for cascading.
     *
     * @param modelContext The model to add to.
     * @param pathContext The path to add.
     * @param pathId The id of the path.
     * @param overWrite Optional flag to overwrite any path referenced by pathId. Default is false, which will create an id similar to pathId.
     * @returns The original model (for cascading).
     */
    function addPath(modelContext: IModel, pathContext: IPath, pathId: string, overWrite?: boolean): IModel;
    /**
     * Add a model as a child. This is basically equivalent to:
     * ```
     * parentModel.models[childModelId] = childModel;
     * ```
     * with additional checks to make it safe for cascading.
     *
     * @param parentModel The model to add to.
     * @param childModel The model to add.
     * @param childModelId The id of the child model.
     * @param overWrite Optional flag to overwrite any model referenced by childModelId. Default is false, which will create an id similar to childModelId.
     * @returns The original model (for cascading).
     */
    function addModel(parentModel: IModel, childModel: IModel, childModelId: string, overWrite?: boolean): IModel;
    /**
     * Add a model as a child of another model. This is basically equivalent to:
     * ```
     * parentModel.models[childModelId] = childModel;
     * ```
     * with additional checks to make it safe for cascading.
     *
     * @param childModel The model to add.
     * @param parentModel The model to add to.
     * @param childModelId The id of the child model.
     * @param overWrite Optional flag to overwrite any model referenced by childModelId. Default is false, which will create an id similar to childModelId.
     * @returns The original model (for cascading).
     */
    function addTo(childModel: IModel, parentModel: IModel, childModelId: string, overWrite?: boolean): IModel;
    /**
     * Clone a model. Alias of makerjs.cloneObject(modelToClone)
     *
     * @param modelToClone The model to clone.
     * @returns A clone of the model you passed.
     */
    function clone(modelToClone: IModel): IModel;
    /**
     * Count the number of child models within a given model.
     *
     * @param modelContext The model containing other models.
     * @returns Number of child models.
     */
    function countChildModels(modelContext: IModel): number;
    /**
     * Get an unused id in the models map with the same prefix.
     *
     * @param modelContext The model containing the models map.
     * @param modelId The id to use directly (if unused), or as a prefix.
     */
    function getSimilarModelId(modelContext: IModel, modelId: string): string;
    /**
     * Get an unused id in the paths map with the same prefix.
     *
     * @param modelContext The model containing the paths map.
     * @param pathId The id to use directly (if unused), or as a prefix.
     */
    function getSimilarPathId(modelContext: IModel, pathId: string): string;
    /**
     * Set the layer of a model. This is equivalent to:
     * ```
     * modelContext.layer = layer;
     * ```
     *
     * @param modelContext The model to set the layer.
     * @param layer The layer name.
     * @returns The original model (for cascading).
     */
    function layer(modelContext: IModel, layer: string): IModel;
    /**
     * Moves all of a model's children (models and paths, recursively) in reference to a single common origin. Useful when points between children need to connect to each other.
     *
     * @param modelToOriginate The model to originate.
     * @param origin Optional offset reference point.
     * @returns The original model (for cascading).
     */
    function originate(modelToOriginate: IModel, origin?: IPoint): IModel;
    /**
     * Center a model at [0, 0].
     *
     * @param modelToCenter The model to center.
     * @param centerX Boolean to center on the x axis. Default is true.
     * @param centerY Boolean to center on the y axis. Default is true.
     * @returns The original model (for cascading).
     */
    function center(modelToCenter: IModel, centerX?: boolean, centerY?: boolean): IModel;
    /**
     * Create a clone of a model, mirrored on either or both x and y axes.
     *
     * @param modelToMirror The model to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @returns Mirrored model.
     */
    function mirror(modelToMirror: IModel, mirrorX: boolean, mirrorY: boolean): IModel;
    /**
     * Move a model to an absolute point. Note that this is also accomplished by directly setting the origin property. This function exists for cascading.
     *
     * @param modelToMove The model to move.
     * @param origin The new position of the model.
     * @returns The original model (for cascading).
     */
    function move(modelToMove: IModel, origin: IPoint): IModel;
    /**
     * Move a model's origin by a relative amount.
     *
     * @param modelToMove The model to move.
     * @param delta The x & y adjustments as a point object.
     * @returns The original model (for cascading).
     */
    function moveRelative(modelToMove: IModel, delta: IPoint): IModel;
    /**
     * Prefix the ids of paths in a model.
     *
     * @param modelToPrefix The model to prefix.
     * @param prefix The prefix to prepend on paths ids.
     * @returns The original model (for cascading).
     */
    function prefixPathIds(modelToPrefix: IModel, prefix: string): IModel;
    /**
     * Rotate a model.
     *
     * @param modelToRotate The model to rotate.
     * @param angleInDegrees The amount of rotation, in degrees.
     * @param rotationOrigin The center point of rotation.
     * @returns The original model (for cascading).
     */
    function rotate(modelToRotate: IModel, angleInDegrees: number, rotationOrigin?: IPoint): IModel;
    /**
     * Scale a model.
     *
     * @param modelToScale The model to scale.
     * @param scaleValue The amount of scaling.
     * @param scaleOrigin Optional boolean to scale the origin point. Typically false for the root model.
     * @returns The original model (for cascading).
     */
    function scale(modelToScale: IModel, scaleValue: number, scaleOrigin?: boolean): IModel;
    /**
     * Convert a model to match a different unit system.
     *
     * @param modeltoConvert The model to convert.
     * @param destUnitType The unit system.
     * @returns The scaled model (for cascading).
     */
    function convertUnits(modeltoConvert: IModel, destUnitType: string): IModel;
    /**
     * DEPRECATED - use model.walk instead.
     * Recursively walk through all paths for a given model.
     *
     * @param modelContext The model to walk.
     * @param callback Callback for each path.
     */
    function walkPaths(modelContext: IModel, callback: IModelPathCallback): void;
    /**
     * Recursively walk through all child models and paths for a given model.
     *
     * @param modelContext The model to walk.
     * @param options Object containing callbacks.
     * @returns The original model (for cascading).
     */
    function walk(modelContext: IModel, options: IWalkOptions): IModel;
    /**
     * Move a model so its bounding box begins at [0, 0].
     *
     * @param modelToZero The model to zero.
     * @param zeroX Boolean to zero on the x axis. Default is true.
     * @param zeroY Boolean to zero on the y axis. Default is true.
     * @returns The original model (for cascading).
     */
    function zero(modelToZero: IModel, zeroX?: boolean, zeroY?: boolean): IModel;
}
declare namespace MakerJs.model {
    /**
     * DEPRECATED - use measure.isPointInsideModel instead.
     * Check to see if a path is inside of a model.
     *
     * @param pathContext The path to check.
     * @param modelContext The model to check against.
     * @param farPoint Optional point of reference which is outside the bounds of the modelContext.
     * @returns Boolean true if the path is inside of the modelContext.
     */
    function isPathInsideModel(pathContext: IPath, modelContext: IModel, pathOffset?: IPoint, farPoint?: IPoint, measureAtlas?: measure.Atlas): boolean;
    /**
     * DEPRECATED
     * Break a model's paths everywhere they intersect with another path.
     *
     * @param modelToBreak The model containing paths to be broken.
     * @param modelToIntersect Optional model containing paths to look for intersection, or else the modelToBreak will be used.
     * @returns The original model (for cascading).
     */
    function breakPathsAtIntersections(modelToBreak: IModel, modelToIntersect?: IModel): IModel;
    /**
     * Combine 2 models. Each model will be modified accordingly.
     *
     * @param modelA First model to combine.
     * @param modelB Second model to combine.
     * @param includeAInsideB Flag to include paths from modelA which are inside of modelB.
     * @param includeAOutsideB Flag to include paths from modelA which are outside of modelB.
     * @param includeBInsideA Flag to include paths from modelB which are inside of modelA.
     * @param includeBOutsideA Flag to include paths from modelB which are outside of modelA.
     * @param options Optional ICombineOptions object.
     * @returns A new model containing both of the input models as "a" and "b".
     */
    function combine(modelA: IModel, modelB: IModel, includeAInsideB?: boolean, includeAOutsideB?: boolean, includeBInsideA?: boolean, includeBOutsideA?: boolean, options?: ICombineOptions): IModel;
    /**
     * Combine 2 models, resulting in a intersection. Each model will be modified accordingly.
     *
     * @param modelA First model to combine.
     * @param modelB Second model to combine.
     * @returns A new model containing both of the input models as "a" and "b".
     */
    function combineIntersection(modelA: IModel, modelB: IModel): IModel;
    /**
     * Combine 2 models, resulting in a subtraction of B from A. Each model will be modified accordingly.
     *
     * @param modelA First model to combine.
     * @param modelB Second model to combine.
     * @returns A new model containing both of the input models as "a" and "b".
     */
    function combineSubtraction(modelA: IModel, modelB: IModel): IModel;
    /**
     * Combine 2 models, resulting in a union. Each model will be modified accordingly.
     *
     * @param modelA First model to combine.
     * @param modelB Second model to combine.
     * @returns A new model containing both of the input models as "a" and "b".
     */
    function combineUnion(modelA: IModel, modelB: IModel): IModel;
}
declare namespace MakerJs {
    /**
     * Compare keys to see if they are equal.
     */
    interface ICollectionKeyComparer<K> {
        (a: K, b: K): boolean;
    }
    /**
     * A collection for items that share a common key.
     */
    interface ICollection<K, T> {
        key: K;
        items: T[];
    }
    /**
     * Collects items that share a common key.
     */
    class Collector<K, T> {
        private comparer;
        collections: ICollection<K, T>[];
        constructor(comparer?: ICollectionKeyComparer<K>);
        addItemToCollection(key: K, item: T): void;
        findCollection(key: K, action?: (index: number) => void): T[];
        removeCollection(key: K): boolean;
        removeItemFromCollection(key: K, item: T): boolean;
        getCollectionsOfMultiple(cb: (key: K, items: T[]) => void): void;
    }
}
declare namespace MakerJs.model {
    /**
     * Simplify a model's paths by reducing redundancy: combine multiple overlapping paths into a single path. The model must be originated.
     *
     * @param modelContext The originated model to search for similar paths.
     * @param options Optional options object.
     * @returns The simplified model (for cascading).
     */
    function simplify(modelToSimplify: IModel, options?: ISimplifyOptions): IModel;
}
declare namespace MakerJs.path {
    /**
     * Expand path by creating a model which surrounds it.
     *
     * @param pathToExpand Path to expand.
     * @param expansion Distance to expand.
     * @param isolateCaps Optional flag to put the end caps into a separate model named "caps".
     * @returns Model which surrounds the path.
     */
    function expand(pathToExpand: IPath, expansion: number, isolateCaps?: boolean): IModel;
    /**
     * Represent an arc using straight lines.
     *
     * @param arc Arc to straighten.
     * @param bevel Optional flag to bevel the angle to prevent it from being too sharp.
     * @param prefix Optional string prefix to apply to path ids.
     * @param close Optional flag to make a closed geometry by connecting the endpoints.
     * @returns Model of straight lines with same endpoints as the arc.
     */
    function straighten(arc: IPathArc, bevel?: boolean, prefix?: string, close?: boolean): IModel;
}
declare namespace MakerJs.model {
    /**
     * Expand all paths in a model, then combine the resulting expansions.
     *
     * @param modelToExpand Model to expand.
     * @param distance Distance to expand.
     * @param joints Number of points at a joint between paths. Use 0 for round joints, 1 for pointed joints, 2 for beveled joints.
     * @param combineOptions Optional object containing combine options.
     * @returns Model which surrounds the paths of the original model.
     */
    function expandPaths(modelToExpand: IModel, distance: number, joints?: number, combineOptions?: ICombineOptions): IModel;
    /**
     * Outline a model by a specified distance. Useful for accommodating for kerf.
     *
     * @param modelToOutline Model to outline.
     * @param distance Distance to outline.
     * @param joints Number of points at a joint between paths. Use 0 for round joints, 1 for pointed joints, 2 for beveled joints.
     * @param inside Optional boolean to draw lines inside the model instead of outside.
     * @param options Options to send to combine() function.
     * @returns Model which surrounds the paths outside of the original model.
     */
    function outline(modelToOutline: IModel, distance: number, joints?: number, inside?: boolean, options?: ICombineOptions): IModel;
}
declare namespace MakerJs.units {
    /**
     * Get a conversion ratio between a source unit and a destination unit.
     *
     * @param srcUnitType unitType converting from.
     * @param destUnitType unitType converting to.
     * @returns Numeric ratio of the conversion.
     */
    function conversionScale(srcUnitType: string, destUnitType: string): number;
    /**
     * Check to see if unit type is a valid Maker.js unit.
     *
     * @param tryUnit unit type to check.
     * @returns Boolean true if unit type is valid.
     */
    function isValidUnit(tryUnit: string): boolean;
}
declare namespace MakerJs.measure {
    /**
     * Find out if two angles are equal.
     *
     * @param angleA First angle.
     * @param angleB Second angle.
     * @returns true if angles are the same, false if they are not
     */
    function isAngleEqual(angleA: number, angleB: number, accuracy?: number): boolean;
    /**
     * Find out if two paths are equal.
     *
     * @param pathA First path.
     * @param pathB Second path.
     * @returns true if paths are the same, false if they are not
     */
    function isPathEqual(pathA: IPath, pathB: IPath, withinPointDistance?: number, pathAOffset?: IPoint, pathBOffset?: IPoint): boolean;
    /**
     * Find out if two points are equal.
     *
     * @param a First point.
     * @param b Second point.
     * @param withinDistance Optional distance to consider points equal.
     * @returns true if points are the same, false if they are not
     */
    function isPointEqual(a: IPoint, b: IPoint, withinDistance?: number): boolean;
    /**
     * Find out if a point is distinct among an array of points.
     *
     * @param pointToCheck point to check.
     * @param pointArray array of points.
     * @param withinDistance Optional distance to consider points equal.
     * @returns false if point is equal to any point in the array.
     */
    function isPointDistinct(pointToCheck: IPoint, pointArray: IPoint[], withinDistance?: number): boolean;
    /**
     * Find out if point is on a slope.
     *
     * @param p Point to check.
     * @param b Slope.
     * @param withinDistance Optional distance of tolerance.
     * @returns true if point is on the slope
     */
    function isPointOnSlope(p: IPoint, slope: ISlope, withinDistance?: number): boolean;
    /**
     * Find out if point is on a circle.
     *
     * @param p Point to check.
     * @param circle Circle.
     * @param withinDistance Optional distance of tolerance.
     * @returns true if point is on the circle
     */
    function isPointOnCircle(p: IPoint, circle: IPathCircle, withinDistance?: number): boolean;
    /**
     * Find out if a point lies on a path.
     * @param pointToCheck point to check.
     * @param onPath path to check against.
     * @param withinDistance Optional distance to consider point on the path.
     * @param pathOffset Optional offset of path from [0, 0].
     * @param options Optional IIsPointOnPathOptions to cache computation.
     */
    function isPointOnPath(pointToCheck: IPoint, onPath: IPath, withinDistance?: number, pathOffset?: IPoint, options?: IIsPointOnPathOptions): boolean;
    /**
     * Check for slope equality.
     *
     * @param slopeA The ISlope to test.
     * @param slopeB The ISlope to check for equality.
     * @returns Boolean true if slopes are equal.
     */
    function isSlopeEqual(slopeA: ISlope, slopeB: ISlope): boolean;
    /**
     * Check for parallel slopes.
     *
     * @param slopeA The ISlope to test.
     * @param slopeB The ISlope to check for parallel.
     * @returns Boolean true if slopes are parallel.
     */
    function isSlopeParallel(slopeA: ISlope, slopeB: ISlope): boolean;
}
declare namespace MakerJs.measure {
    /**
     * Increase a measurement by an additional measurement.
     *
     * @param baseMeasure The measurement to increase.
     * @param addMeasure The additional measurement.
     * @param addOffset Optional offset point of the additional measurement.
     * @returns The increased original measurement (for cascading).
     */
    function increase(baseMeasure: IMeasure, addMeasure: IMeasure): IMeasure;
    /**
     * Check for arc being concave or convex towards a given point.
     *
     * @param arc The arc to test.
     * @param towardsPoint The point to test.
     * @returns Boolean true if arc is concave towards point.
     */
    function isArcConcaveTowardsPoint(arc: IPathArc, towardsPoint: IPoint): boolean;
    /**
     * DEPRECATED - use isArcSpanOverlapping() instead.
     */
    function isArcOverlapping(arcA: IPathArc, arcB: IPathArc, excludeTangents: boolean): boolean;
    /**
     * Check for arc overlapping another arc.
     *
     * @param arcA The arc to test.
     * @param arcB The arc to check for overlap.
     * @param excludeTangents Boolean to exclude exact endpoints and only look for deep overlaps.
     * @returns Boolean true if arcA is overlapped with arcB.
     */
    function isArcSpanOverlapping(arcA: IPathArc, arcB: IPathArc, excludeTangents: boolean): boolean;
    /**
     * Check if a given number is between two given limits.
     *
     * @param valueInQuestion The number to test.
     * @param limitA First limit.
     * @param limitB Second limit.
     * @param exclusive Flag to exclude equaling the limits.
     * @returns Boolean true if value is between (or equal to) the limits.
     */
    function isBetween(valueInQuestion: number, limitA: number, limitB: number, exclusive: boolean): boolean;
    /**
     * Check if a given angle is between an arc's start and end angles.
     *
     * @param angleInQuestion The angle to test.
     * @param arc Arc to test against.
     * @param exclusive Flag to exclude equaling the start or end angles.
     * @returns Boolean true if angle is between (or equal to) the arc's start and end angles.
     */
    function isBetweenArcAngles(angleInQuestion: number, arc: IPathArc, exclusive: boolean): boolean;
    /**
     * Check if a given point is between a line's end points.
     *
     * @param pointInQuestion The point to test.
     * @param line Line to test against.
     * @param exclusive Flag to exclude equaling the origin or end points.
     * @returns Boolean true if point is between (or equal to) the line's origin and end points.
     */
    function isBetweenPoints(pointInQuestion: IPoint, line: IPathLine, exclusive: boolean): boolean;
    /**
     * Check if a given bezier seed has all points on the same slope.
     *
     * @param seed The bezier seed to test.
     * @param exclusive Optional boolean to test only within the boundary of the endpoints.
     * @returns Boolean true if bezier seed has control points on the line slope and between the line endpoints.
     */
    function isBezierSeedLinear(seed: IPathBezierSeed, exclusive?: boolean): boolean;
    /**
     * Check for flow of paths in a chain being clockwise or not.
     *
     * @param chainContext The chain to test.
     * @param out_result Optional output object, if provided, will be populated with convex hull results.
     * @returns Boolean true if paths in the chain flow clockwise.
     */
    function isChainClockwise(chainContext: IChain, out_result?: {
        hullPoints?: IPoint[];
        keyPoints?: IPoint[];
    }): boolean;
    /**
     * Check for array of points being clockwise or not.
     *
     * @param points The array of points to test.
     * @param out_result Optional output object, if provided, will be populated with convex hull results.
     * @returns Boolean true if points flow clockwise.
     */
    function isPointArrayClockwise(points: IPoint[], out_result?: {
        hullPoints?: IPoint[];
        keyPoints?: IPoint[];
    }): boolean;
    /**
     * Check for line overlapping another line.
     *
     * @param lineA The line to test.
     * @param lineB The line to check for overlap.
     * @param excludeTangents Boolean to exclude exact endpoints and only look for deep overlaps.
     * @returns Boolean true if lineA is overlapped with lineB.
     */
    function isLineOverlapping(lineA: IPathLine, lineB: IPathLine, excludeTangents: boolean): boolean;
    /**
     * Check for measurement overlapping another measurement.
     *
     * @param measureA The measurement to test.
     * @param measureB The measurement to check for overlap.
     * @returns Boolean true if measureA is overlapped with measureB.
     */
    function isMeasurementOverlapping(measureA: IMeasure, measureB: IMeasure): boolean;
    /**
     * Gets the slope of a line.
     */
    function lineSlope(line: IPathLine): ISlope;
    /**
     * Calculates the distance between two points.
     *
     * @param a First point.
     * @param b Second point.
     * @returns Distance between points.
     */
    function pointDistance(a: IPoint, b: IPoint): number;
    /**
     * Calculates the smallest rectangle which contains a path.
     *
     * @param pathToMeasure The path to measure.
     * @returns object with low and high points.
     */
    function pathExtents(pathToMeasure: IPath, addOffset?: IPoint): IMeasure;
    /**
     * Measures the length of a path.
     *
     * @param pathToMeasure The path to measure.
     * @returns Length of the path.
     */
    function pathLength(pathToMeasure: IPath): number;
    /**
     * Measures the length of all paths in a model.
     *
     * @param modelToMeasure The model containing paths to measure.
     * @returns Length of all paths in the model.
     */
    function modelPathLength(modelToMeasure: IModel): number;
    /**
     * Measures the smallest rectangle which contains a model.
     *
     * @param modelToMeasure The model to measure.
     * @param atlas Optional atlas to save measurements.
     * @returns object with low and high points.
     */
    function modelExtents(modelToMeasure: IModel, atlas?: Atlas): IMeasureWithCenter;
    /**
     * Augment a measurement - add more properties such as center point, height and width.
     *
     * @param measureToAugment The measurement to augment.
     * @returns Measurement object with augmented properties.
     */
    function augment(measureToAugment: IMeasure): IMeasureWithCenter;
    /**
     * A list of maps of measurements.
     *
     * @param modelToMeasure The model to measure.
     * @param atlas Optional atlas to save measurements.
     * @returns object with low and high points.
     */
    class Atlas {
        modelContext: IModel;
        /**
         * Flag that models have been measured.
         */
        modelsMeasured: boolean;
        /**
         * Map of model measurements, mapped by routeKey.
         */
        modelMap: IMeasureMap;
        /**
         * Map of path measurements, mapped by routeKey.
         */
        pathMap: IMeasureMap;
        /**
         * Constructor.
         * @param modelContext The model to measure.
         */
        constructor(modelContext: IModel);
        measureModels(): void;
    }
    /**
     * Measures the minimum bounding hexagon surrounding a model. The hexagon is oriented such that the right and left sides are vertical, and the top and bottom are pointed.
     *
     * @param modelToMeasure The model to measure.
     * @returns IBoundingHex object which is a hexagon model, with an additional radius property.
     */
    function boundingHexagon(modelToMeasure: IModel): IBoundingHex;
    /**
     * Check to see if a point is inside of a model.
     *
     * @param pointToCheck The point to check.
     * @param modelContext The model to check against.
     * @param options Optional IMeasurePointInsideOptions object.
     * @returns Boolean true if the path is inside of the modelContext.
     */
    function isPointInsideModel(pointToCheck: IPoint, modelContext: IModel, options?: IMeasurePointInsideOptions): boolean;
}
declare namespace MakerJs.exporter {
    /**
     * @private
     */
    interface IExportOptions {
        /**
         * Optional exemplar of number of decimal places.
         */
        accuracy?: number;
        /**
         * Optional unit system to embed in exported file, if the export format allows alternate unit systems.
         */
        units?: string;
    }
    /**
     * Options for JSON export.
     */
    interface IJsonExportOptions extends IExportOptions {
        /**
         * Optional number of characters to indent after a newline.
         */
        indentation?: number;
    }
    /**
     * Renders an item in JSON.
     *
     * @param itemToExport Item to render: may be a path, an array of paths, or a model object.
     * @param options Rendering options object.
     * @param options.accuracy Optional exemplar of number of decimal places.
     * @param options.indentation Optional number of characters to indent after a newline.
     * @returns String of DXF content.
     */
    function toJson(itemToExport: any, options?: MakerJs.exporter.IJsonExportOptions): string;
    /**
     * Try to get the unit system from a model
     * @private
     */
    function tryGetModelUnits(itemToExport: any): string;
    /**
     * Named colors, safe for CSS and DXF
     * 17 colors from https://www.w3.org/TR/CSS21/syndata.html#value-def-color mapped to DXF equivalent AutoDesk Color Index
     */
    var colors: {
        black: number;
        red: number;
        yellow: number;
        lime: number;
        aqua: number;
        blue: number;
        fuchsia: number;
        white: number;
        gray: number;
        maroon: number;
        orange: number;
        olive: number;
        green: number;
        teal: number;
        navy: number;
        purple: number;
        silver: number;
    };
    interface IStatusCallback {
        (status: {
            progress?: number;
        }): void;
    }
}
declare namespace MakerJs.importer {
    /**
     * Create a numeric array from a string of numbers. The numbers may be delimited by anything non-numeric.
     *
     * Example:
     * ```
     * var n = makerjs.importer.parseNumericList('5, 10, 15.20 25-30-35 4e1 .5');
     * ```
     *
     * @param s The string of numbers.
     * @returns Array of numbers.
     */
    function parseNumericList(s: string): number[];
}
declare namespace MakerJs.exporter {
    function toDXF(modelToExport: IModel, options?: IDXFRenderOptions): string;
    function toDXF(pathsToExport: IPath[], options?: IDXFRenderOptions): string;
    function toDXF(pathToExport: IPath, options?: IDXFRenderOptions): string;
    /**
     * DXF layer options.
     */
    interface IDXFLayerOptions {
        /**
         * DXF layer color.
         */
        color: number;
    }
    /**
     * DXF rendering options.
     */
    interface IDXFRenderOptions extends IExportOptions {
        /**
         * DXF options per layer.
         */
        layerOptions?: {
            [layerId: string]: IDXFLayerOptions;
        };
        /**
         * Flag to use POLYLINE
         */
        usePOLYLINE?: boolean;
    }
}
declare namespace MakerJs.solvers {
    /**
     * Solves for the altitude of an equilateral triangle when you know its side length.
     *
     * @param sideLength Length of a side of the equilateral triangle (all 3 sides are equal).
     * @returns Altitude of the equilateral triangle.
     */
    function equilateralAltitude(sideLength: number): number;
    /**
     * Solves for the side length of an equilateral triangle when you know its altitude.
     *
     * @param altitude Altitude of the equilateral triangle.
     * @returns Length of the side of the equilateral triangle (all 3 sides are equal).
     */
    function equilateralSide(altitude: number): number;
    /**
     * Solves for the angle of a triangle when you know lengths of 3 sides.
     *
     * @param lengthA Length of side of triangle, opposite of the angle you are trying to find.
     * @param lengthB Length of any other side of the triangle.
     * @param lengthC Length of the remaining side of the triangle.
     * @returns Angle opposite of the side represented by the first parameter.
     */
    function solveTriangleSSS(lengthA: number, lengthB: number, lengthC: number): number;
    /**
     * Solves for the length of a side of a triangle when you know length of one side and 2 angles.
     *
     * @param oppositeAngleInDegrees Angle which is opposite of the side you are trying to find.
     * @param lengthOfSideBetweenAngles Length of one side of the triangle which is between the provided angles.
     * @param otherAngleInDegrees An other angle of the triangle.
     * @returns Length of the side of the triangle which is opposite of the first angle parameter.
     */
    function solveTriangleASA(oppositeAngleInDegrees: number, lengthOfSideBetweenAngles: number, otherAngleInDegrees: number): number;
    /**
     * Solves for the angles of the tangent lines between 2 circles.
     *
     * @param a First circle.
     * @param b Second circle.
     * @param inner Boolean to use inner tangents instead of outer tangents.
     * @returns Array of angles in degrees where 2 lines between the circles will be tangent to both circles.
     */
    function circleTangentAngles(a: IPathCircle, b: IPathCircle, inner?: boolean): number[];
}
declare namespace MakerJs.path {
    /**
     * Find the point(s) where 2 paths intersect.
     *
     * @param path1 First path to find intersection.
     * @param path2 Second path to find intersection.
     * @param options Optional IPathIntersectionOptions.
     * @returns IPathIntersection object, with points(s) of intersection (and angles, when a path is an arc or circle); or null if the paths did not intersect.
     */
    function intersection(path1: IPath, path2: IPath, options?: IPathIntersectionOptions): IPathIntersection;
}
declare namespace MakerJs.path {
    /**
     * Adds a round corner to the outside angle between 2 lines. The lines must meet at one point.
     *
     * @param lineA First line to fillet, which will be modified to fit the fillet.
     * @param lineB Second line to fillet, which will be modified to fit the fillet.
     * @returns Arc path object of the new fillet.
     */
    function dogbone(lineA: IPathLine, lineB: IPathLine, filletRadius: number, options?: IPointMatchOptions): IPathArc;
    /**
     * Adds a round corner to the inside angle between 2 paths. The paths must meet at one point.
     *
     * @param pathA First path to fillet, which will be modified to fit the fillet.
     * @param pathB Second path to fillet, which will be modified to fit the fillet.
     * @param filletRadius Radius of the fillet.
     * @param options Optional IPointMatchOptions object to specify pointMatchingDistance.
     * @returns Arc path object of the new fillet.
     */
    function fillet(pathA: IPath, pathB: IPath, filletRadius: number, options?: IPointMatchOptions): IPathArc;
}
declare namespace MakerJs.chain {
    /**
     * Adds a dogbone fillet between each link in a chain. Each path will be cropped to fit a fillet, and all fillets will be returned as paths in a returned model object.
     *
     * @param chainToFillet The chain to add fillets to.
     * @param filletRadius Radius of the fillet.
     * @returns Model object containing paths which fillet the joints in the chain.
     */
    function dogbone(chainToFillet: IChain, filletRadius: number): IModel;
    /**
     * Adds a dogbone fillet between each link in a chain. Each path will be cropped to fit a fillet, and all fillets will be returned as paths in a returned model object.
     *
     * @param chainToFillet The chain to add fillets to.
     * @param filletRadii Object specifying directional radii.
     * @param filletRadii.left Radius of left turning fillets.
     * @param filletRadii.right Radius of right turning fillets.
     * @returns Model object containing paths which fillet the joints in the chain.
     */
    function dogbone(chainToFillet: IChain, filletRadii: {
        left?: number;
        right?: number;
    }): IModel;
    /**
     * Adds a fillet between each link in a chain. Each path will be cropped to fit a fillet, and all fillets will be returned as paths in a returned model object.
     *
     * @param chainToFillet The chain to add fillets to.
     * @param filletRadius Radius of the fillet.
     * @returns Model object containing paths which fillet the joints in the chain.
     */
    function fillet(chainToFillet: IChain, filletRadius: number): IModel;
    /**
     * Adds a fillet between each link in a chain. Each path will be cropped to fit a fillet, and all fillets will be returned as paths in a returned model object.
     *
     * @param chainToFillet The chain to add fillets to.
     * @param filletRadii Object specifying directional radii.
     * @param filletRadii.left Radius of left turning fillets.
     * @param filletRadii.right Radius of right turning fillets.
     * @returns Model object containing paths which fillet the joints in the chain.
     */
    function fillet(chainToFillet: IChain, filletRadii: {
        left?: number;
        right?: number;
    }): IModel;
}
declare namespace MakerJs.kit {
    /**
     * Helper function to use the JavaScript "apply" function in conjunction with the "new" keyword.
     *
     * @param ctor The constructor for the class which is an IKit.
     * @param args The array of parameters passed to the constructor.
     * @returns A new instance of the class, which implements the IModel interface.
     */
    function construct(ctor: IKit, args: any): IModel;
    /**
     * Extract just the initial sample values from a kit.
     *
     * @param ctor The constructor for the class which is an IKit.
     * @returns Array of the inital sample values provided in the metaParameters array.
     */
    function getParameterValues(ctor: IKit): any[];
}
declare namespace MakerJs.model {
    /**
     * Find a single chain within a model, across all layers. Shorthand of findChains; useful when you know there is only one chain to find in your model.
     *
     * @param modelContext The model to search for a chain.
     * @returns A chain object or null if chains were not found.
     */
    function findSingleChain(modelContext: IModel): IChain;
    /**
     * Find paths that have common endpoints and form chains.
     *
     * @param modelContext The model to search for chains.
     * @param options Optional options object.
     * @returns An array of chains, or a map (keyed by layer id) of arrays of chains - if options.byLayers is true.
     */
    function findChains(modelContext: IModel, options?: IFindChainsOptions): IChain[] | IChainsMap;
    /**
     * Find paths that have common endpoints and form chains.
     *
     * @param modelContext The model to search for chains.
     * @param callback Callback function when chains are found.
     * @param options Optional options object.
     * @returns An array of chains, or a map (keyed by layer id) of arrays of chains - if options.byLayers is true.
     */
    function findChains(modelContext: IModel, callback: IChainCallback, options?: IFindChainsOptions): IChain[] | IChainsMap;
}
declare namespace MakerJs.chain {
    /**
     * Shift the links of an endless chain.
     *
     * @param chainContext Chain to cycle through. Must be endless.
     * @param amount Optional number of links to shift. May be negative to cycle backwards.
     * @returns The chainContext for cascading.
     */
    function cycle(chainContext: IChain, amount?: number): IChain;
    /**
     * Reverse the links of a chain.
     *
     * @param chainContext Chain to reverse.
     * @returns The chainContext for cascading.
     */
    function reverse(chainContext: IChain): IChain;
    /**
     * Set the beginning of an endless chain to a known routeKey of a path.
     *
     * @param chainContext Chain to cycle through. Must be endless.
     * @param routeKey RouteKey of the desired path to start the chain with.
     * @returns The chainContext for cascading.
     */
    function startAt(chainContext: IChain, routeKey: string): IChain;
    /**
     * Convert a chain to a new model, independent of any model from where the chain was found.
     *
     * @param chainContext Chain to convert to a model.
     * @param detachFromOldModel Flag to remove the chain's paths from their current parent model. If false, each path will be cloned. If true, the original path will be re-parented into the resulting new model. Default is false.
     * @returns A new model containing paths from the chain.
     */
    function toNewModel(chainContext: IChain, detachFromOldModel?: boolean): IModel;
    /**
     * Get points along a chain of paths.
     *
     * @param chainContext Chain of paths to get points from.
     * @param distance Numeric distance along the chain between points, or numeric array of distances along the chain between each point.
     * @param maxPoints Maximum number of points to retrieve.
     * @returns Array of points which are on the chain spread at a uniform interval.
     */
    function toPoints(chainContext: IChain, distanceOrDistances: number | number[], maxPoints?: number): IPoint[];
    /**
     * Get key points (a minimal a number of points) along a chain of paths.
     *
     * @param chainContext Chain of paths to get points from.
     * @param maxArcFacet The maximum length between points on an arc or circle.
     * @returns Array of points which are on the chain.
     */
    function toKeyPoints(chainContext: IChain, maxArcFacet?: number): IPoint[];
}
declare namespace MakerJs.model {
    /**
     * Find paths that have common endpoints and form loops.
     *
     * @param modelContext The model to search for loops.
     * @param options Optional options object.
     * @returns A new model with child models ranked according to their containment within other found loops. The paths of models will be IPathDirectionalWithPrimeContext.
     */
    function findLoops(modelContext: IModel, options?: IFindLoopsOptions): IModel;
    /**
     * Remove all paths in a loop model from the model(s) which contained them.
     *
     * @param loopToDetach The model to search for loops.
     */
    function detachLoop(loopToDetach: IModel): void;
    /**
     * Remove paths from a model which have endpoints that do not connect to other paths.
     *
     * @param modelContext The model to search for dead ends.
     * @param pointMatchingDistance Optional max distance to consider two points as the same.
     * @param keep Optional callback function (which should return a boolean) to decide if a dead end path should be kept instead.
     * @param trackDeleted Optional callback function which will log discarded paths and the reason they were discarded.
     * @returns The input model (for cascading).
     */
    function removeDeadEnds(modelContext: IModel, pointMatchingDistance?: number, keep?: IWalkPathBooleanCallback, trackDeleted?: (wp: IWalkPath, reason: string) => void): IModel;
}
declare namespace MakerJs.exporter {
    /**
     * Attributes for an XML tag.
     * @private
     */
    interface IXmlTagAttrs {
        [name: string]: any;
    }
    /**
     * Class for an XML tag.
     * @private
     */
    class XmlTag {
        name: string;
        attrs: IXmlTagAttrs;
        /**
         * Text between the opening and closing tags.
         */
        innerText: string;
        /**
         * Boolean to indicate that the innerText has been escaped.
         */
        innerTextEscaped: boolean;
        /**
         * Flag to explicitly close XML tags.
         */
        closingTags?: boolean;
        /**
         * Escapes certain characters within a string so that it can appear in a tag or its attribute.
         *
         * @returns Escaped string.
         */
        static escapeString(value: string): string;
        /**
         * @param name Name of the XML tag.
         * @param attrs Optional attributes for the tag.
         */
        constructor(name: string, attrs?: IXmlTagAttrs);
        /**
         * Get the opening tag.
         *
         * @param selfClose Flag to determine if opening tag should be self closing.
         */
        getOpeningTag(selfClose: boolean): string;
        /**
         * Get the inner text.
         */
        getInnerText(): string;
        /**
         * Get the closing tag.
         */
        getClosingTag(): string;
        /**
         * Output the entire tag as a string.
         */
        toString(): string;
    }
}
declare namespace MakerJs.exporter {
    function toOpenJsCad(modelToExport: IModel, options?: IOpenJsCadOptions): string;
    function toOpenJsCad(pathsToExport: IPath[], options?: IOpenJsCadOptions): string;
    function toOpenJsCad(pathToExport: IPath, options?: IOpenJsCadOptions): string;
    /**
     * DEPRECATED - use .toJscadSTL() instead.
     * Executes a JavaScript string with the OpenJsCad engine - converts 2D to 3D.
     *
     * @param modelToExport Model object to export.
     * @param options Export options object.
     * @param options.extrusion Height of 3D extrusion.
     * @param options.resolution Size of facets.
     * @returns String of STL format of 3D object.
     */
    function toSTL(modelToExport: IModel, options?: IOpenJsCadOptions): string;
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
    function toJscadCAG(jscadCAG: typeof jscad.CAG, modelToExport: IModel, jsCadCagOptions?: IJscadCagOptions): jscad.CAG | {
        [layerId: string]: jscad.CAG;
    };
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
    function toJscadCSG(jscadCAG: typeof jscad.CAG, modelToExport: IModel, options?: IJscadCsgOptions): jscad.CSG;
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
    function toJscadScript(modelToExport: IModel, options?: IJscadScriptOptions): string;
    /**
     * Exports a model in STL format - 2D to 3D.
     *
     * @param jscadCAG @jscad/csg CAG engine.
     * @param stlSerializer @jscad/stl-serializer (require('@jscad/stl-serializer')).
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
    function toJscadSTL(CAG: typeof jscad.CAG, stlSerializer: jscad.StlSerializer, modelToExport: IModel, options?: IJscadCsgOptions): string | ArrayBuffer[];
    /**
     * OpenJsCad export options.
     */
    interface IOpenJsCadOptions extends IFindLoopsOptions, IExportOptions {
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
    interface IOpenJsCadOptionsMap {
        [modelId: string]: IOpenJsCadOptions;
    }
    /**
     * Jscad CAG export options.
     */
    interface IJscadCagOptions extends IExportOptions, IPointMatchOptions {
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
    interface IJscadExtrudeOptions {
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
    interface IJscadCsgOptions extends IJscadCagOptions, IJscadExtrudeOptions {
        /**
         * SVG options per layer.
         */
        layerOptions?: {
            [layerId: string]: IJscadExtrudeOptions;
        };
    }
    /**
     * Jscad Script export options.
     */
    interface IJscadScriptOptions extends IJscadCsgOptions {
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
declare namespace MakerJs.exporter {
    /**
     * Injects drawing into a PDFKit document.
     *
     * @param modelToExport Model object to export.
     * @param options Export options object.
     * @returns String of PDF file contents.
     */
    function toPDF(doc: PDFKit.PDFDocument, modelToExport: IModel, options?: IPDFRenderOptions): void;
    /**
     * PDF rendering options.
     */
    interface IPDFRenderOptions extends IExportOptions {
        /**
         * Rendered reference origin.
         */
        origin?: IPoint;
        /**
         * SVG color of the rendered paths.
         */
        stroke?: string;
    }
}
declare namespace MakerJs.exporter {
    /**
     * Map of SVG Path Data by layer name.
     */
    interface IPathDataByLayerMap {
        [layer: string]: string;
    }
    /**
     * Convert a chain to SVG path data.
     *
     * @param chain Chain to convert.
     * @param offset IPoint relative offset point.
     * @param accuracy Optional accuracy of SVG path data.
     * @returns String of SVG path data.
     */
    function chainToSVGPathData(chain: IChain, offset: IPoint, accuracy?: number): string;
    /**
     * Export a path to SVG path data.
     *
     * @param pathToExport IPath to export.
     * @param pathOffset IPoint relative offset of the path object.
     * @param exportOffset IPoint relative offset point of the export.
     * @param accuracy Optional accuracy of SVG path data.
     * @param clockwiseCircle Optional flag to use clockwise winding for circles.
     * @returns String of SVG path data.
     */
    function pathToSVGPathData(pathToExport: IPath, pathOffset: IPoint, exportOffset: IPoint, accuracy?: number, clockwiseCircle?: boolean): string;
    /**
     * Convert a model to SVG path data.
     *
     * @param modelToExport Model to export.
     * @param options Optional ISVGPathDataRenderOptions object.
     * @param options.accuracy Optional accuracy of SVG decimals.
     * @param options.byLayers Optional boolean flag (default false) to return a map of path data by layer.
     * @param options.fillRule Optional SVG fill rule: 'evenodd' (default) or 'nonzero'.
     * @param options.origin Optional origin. Default x = 0, y = topmost y point in the model. Use [0, 0] to use the same origin as Maker.js, which will translate to negative Y values in SVG.
     * @returns String of SVG path data (if options.byLayers is false) or an object map of path data by layer .
     */
    function toSVGPathData(modelToExport: IModel, options?: ISVGPathDataRenderOptions): IPathDataByLayerMap | string;
    /**
     * Convert a model to SVG path data.
     *
     * @param modelToExport Model to export.
     * @param byLayers Optional boolean flag to return a map of path data by layer.
     * @param origin Optional origin. Default x = 0, y = topmost y point in the model. Use [0, 0] to use the same origin as Maker.js, which will translate to negative Y values in SVG.
     * @param accuracy Optional accuracy of SVG decimals.
     * @returns String of SVG path data (if byLayers is false) or an object map of path data by layer .
     */
    function toSVGPathData(modelToExport: IModel, byLayers?: boolean, origin?: IPoint, accuracy?: number): IPathDataByLayerMap | string;
    function toSVG(modelToExport: IModel, options?: ISVGRenderOptions): string;
    function toSVG(pathsToExport: IPath[], options?: ISVGRenderOptions): string;
    function toSVG(pathToExport: IPath, options?: ISVGRenderOptions): string;
    /**
     * Map of MakerJs unit system to SVG unit system
     */
    interface svgUnitConversion {
        [unitType: string]: {
            svgUnitType: string;
            scaleConversion: number;
        };
    }
    /**
     * Map of MakerJs unit system to SVG unit system
     */
    var svgUnit: svgUnitConversion;
    /**
     * SVG rendering options.
     */
    interface ISVGElementRenderOptions {
        /**
         * SVG fill color.
         */
        fill?: string;
        /**
         * SVG color of the rendered paths.
         */
        stroke?: string;
        /**
         * SVG stroke width of paths. This may have a unit type suffix, if not, the value will be in the same unit system as the units property.
         */
        strokeWidth?: string;
        /**
         * CSS style to apply to elements.
         */
        cssStyle?: string;
    }
    /**
     *  Annotate paths with directional flow marks.
     */
    interface IFlowAnnotation {
        /**
         * Size of flow marks (arrows and circle).
         */
        size: number;
    }
    /**
     * SVG rendering options.
     */
    interface ISVGRenderOptions extends IExportOptions, ISVGElementRenderOptions {
        /**
         * Optional attributes to add to the root svg tag.
         */
        svgAttrs?: IXmlTagAttrs;
        /**
         * SVG font size and font size units.
         */
        fontSize?: string;
        /**
         * Scale of the SVG rendering.
         */
        scale?: number;
        /**
         *  Indicate that the id's of paths should be rendered as SVG text elements.
         */
        annotate?: boolean;
        /**
         *  Options to show direction of path flow.
         */
        flow?: IFlowAnnotation;
        /**
         * Rendered reference origin.
         */
        origin?: IPoint;
        /**
         * Use SVG < path > elements instead of < line >, < circle > etc.
         */
        useSvgPathOnly?: boolean;
        /**
         * Flag to use SVG viewbox.
         */
        viewBox?: boolean;
        /**
         * SVG fill rule.
         */
        fillRule?: 'nonzero' | 'evenodd';
        /**
         * SVG stroke linecap.
         */
        strokeLineCap?: string;
        /**
         * SVG options per layer.
         */
        layerOptions?: {
            [layerId: string]: ISVGElementRenderOptions;
        };
        /**
         * Flag to remove the "vector-effect: non-scaling-stroke" attribute.
         */
        scalingStroke?: boolean;
        /**
         * Flag to explicitly close XML tags.
         */
        closingTags?: boolean;
    }
    /**
     * SVG Path Data rendering options.
     */
    interface ISVGPathDataRenderOptions extends IExportOptions {
        /**
         * Optional boolean flag to return a map of path data by layer.
         */
        byLayers?: boolean;
        /**
         * SVG fill-rule.
         */
        fillRule?: 'nonzero' | 'evenodd';
        /**
         * Optional origin. Default x = 0, y = topmost y point in the model. Use [0, 0] to use the same origin as Maker.js, which will translate to negative Y values in SVG.
         */
        origin?: IPoint;
    }
}
declare namespace MakerJs.importer {
    /**
     * SVG importing options.
     */
    interface ISVGImportOptions {
        /**
         * Optional accuracy of Bezier curves and elliptic paths.
         */
        bezierAccuracy?: number;
    }
    /**
     * Create a model from SVG path data.
     *
     * @param pathData SVG path data.
     * @param options ISVGImportOptions object.
     * @param options.bezierAccuracy Optional accuracy of Bezier curves.
     * @returns An IModel object.
     */
    function fromSVGPathData(pathData: string, options?: ISVGImportOptions): IModel;
}
declare namespace MakerJs.layout {
    /**
     * Layout the children of a model along a path.
     * The x-position of each child will be projected onto the path so that the proportion between children is maintained.
     * Each child will be rotated such that it will be perpendicular to the path at the child's x-center.
     *
     * @param parentModel The model containing children to lay out.
     * @param onPath The path on which to lay out.
     * @param baseline Numeric percentage value of vertical displacement from the path. Default is zero.
     * @param reversed Flag to travel along the path in reverse. Default is false.
     * @param contain Flag to contain the children layout within the length of the path. Default is false.
     * @param rotate Flag to rotate the child to perpendicular. Default is true.
     * @returns The parentModel, for cascading.
     */
    function childrenOnPath(parentModel: IModel, onPath: IPath, baseline?: number, reversed?: boolean, contain?: boolean, rotate?: boolean): IModel;
    /**
     * Layout the children of a model along a chain.
     * The x-position of each child will be projected onto the chain so that the proportion between children is maintained.
     * The projected positions of the children will become an array of points that approximate the chain.
     * Each child will be rotated such that it will be mitered according to the vertex angles formed by this series of points.
     *
     * @param parentModel The model containing children to lay out.
     * @param onChain The chain on which to lay out.
     * @param baseline Numeric percentage value of vertical displacement from the chain. Default is zero.
     * @param reversed Flag to travel along the chain in reverse. Default is false.
     * @param contain Flag to contain the children layout within the length of the chain. Default is false.
     * @param rotate Flag to rotate the child to mitered angle. Default is true.
     * @returns The parentModel, for cascading.
     */
    function childrenOnChain(parentModel: IModel, onChain: IChain, baseline?: number, reversed?: boolean, contain?: boolean, rotated?: boolean): IModel;
    /**
     * Layout clones in a radial format.
     *
     * Example:
     * ```
     * //daisy petals
     * var makerjs = require('makerjs');
     *
     * var belt = new makerjs.models.Belt(5, 50, 20);
     *
     * makerjs.model.move(belt, [25, 0]);
     *
     * var petals = makerjs.layout.cloneToRadial(belt, 8, 45);
     *
     * document.write(makerjs.exporter.toSVG(petals));
     * ```
     *
     * @param itemToClone: Either a model or a path object.
     * @param count Number of clones in the radial result.
     * @param angleInDegrees angle of rotation between clones..
     * @returns A new model with clones in a radial format.
     */
    function cloneToRadial(itemToClone: IModel | IPath, count: number, angleInDegrees: number, rotationOrigin?: IPoint): IModel;
    /**
     * Layout clones in a column format.
     *
     * Example:
     * ```
     * //Grooves for a finger joint
     * var m = require('makerjs');
     *
     * var dogbone = new m.models.Dogbone(50, 20, 2, -1, false);
     *
     * var grooves = m.layout.cloneToColumn(dogbone, 5, 20);
     *
     * document.write(m.exporter.toSVG(grooves));
     * ```
     *
     * @param itemToClone: Either a model or a path object.
     * @param count Number of clones in the column.
     * @param margin Optional distance between each clone.
     * @returns A new model with clones in a column.
     */
    function cloneToColumn(itemToClone: IModel | IPath, count: number, margin?: number): IModel;
    /**
     * Layout clones in a row format.
     *
     * Example:
     * ```
     * //Tongue and grooves for a box joint
     * var m = require('makerjs');
     * var tongueWidth = 60;
     * var grooveWidth = 50;
     * var grooveDepth = 30;
     * var groove = new m.models.Dogbone(grooveWidth, grooveDepth, 5, 0, true);
     *
     * groove.paths['leftTongue'] = new m.paths.Line([-tongueWidth / 2, 0], [0, 0]);
     * groove.paths['rightTongue'] = new m.paths.Line([grooveWidth, 0], [grooveWidth + tongueWidth / 2, 0]);
     *
     * var tongueAndGrooves = m.layout.cloneToRow(groove, 3);
     *
     * document.write(m.exporter.toSVG(tongueAndGrooves));
     * ```
     *
     * @param itemToClone: Either a model or a path object.
     * @param count Number of clones in the row.
     * @param margin Optional distance between each clone.
     * @returns A new model with clones in a row.
     */
    function cloneToRow(itemToClone: IModel | IPath, count: number, margin?: number): IModel;
    /**
     * Layout clones in a grid format.
     *
     * Example:
     * ```
     * //Grid of squares
     * var m = require('makerjs');
     * var square = new m.models.Square(43);
     * var grid = m.layout.cloneToGrid(square, 5, 5, 7);
     * document.write(m.exporter.toSVG(grid));
     * ```
     *
     * @param itemToClone: Either a model or a path object.
     * @param xCount Number of columns in the grid.
     * @param yCount Number of rows in the grid.
     * @param margin Optional numeric distance between each clone. Can also be a 2 dimensional array of numbers, to specify distances in x and y dimensions.
     * @returns A new model with clones in a grid layout.
     */
    function cloneToGrid(itemToClone: IModel | IPath, xCount: number, yCount: number, margin?: number | IPoint): IModel;
    /**
     * Layout clones in a brick format. Alternating rows will have an additional item in each row.
     *
     * Examples:
     * ```
     * //Brick wall
     * var m = require('makerjs');
     * var brick = new m.models.RoundRectangle(50, 30, 4);
     * var wall = m.layout.cloneToBrick(brick, 8, 6, 3);
     * document.write(m.exporter.toSVG(wall));
     * ```
     *
     * ```
     * //Fish scales
     * var m = require('makerjs');
     * var arc = new m.paths.Arc([0, 0], 50, 20, 160);
     * var scales = m.layout.cloneToBrick(arc, 8, 20);
     * document.write(m.exporter.toSVG(scales));
     * ```
     *
     * @param itemToClone: Either a model or a path object.
     * @param xCount Number of columns in the brick grid.
     * @param yCount Number of rows in the brick grid.
     * @param margin Optional numeric distance between each clone. Can also be a 2 dimensional array of numbers, to specify distances in x and y dimensions.
     * @returns A new model with clones in a brick layout.
     */
    function cloneToBrick(itemToClone: IModel | IPath, xCount: number, yCount: number, margin?: number | IPoint): IModel;
    /**
     * Layout clones in a honeycomb format. Alternating rows will have an additional item in each row.
     *
     * Examples:
     * ```
     * //Honeycomb
     * var m = require('makerjs');
     * var hex = new m.models.Polygon(6, 50, 30);
     * var pattern = m.layout.cloneToHoneycomb(hex, 8, 9, 10);
     * document.write(m.exporter.toSVG(pattern));
     * ```
     *
     * @param itemToClone: Either a model or a path object.
     * @param xCount Number of columns in the honeycomb grid.
     * @param yCount Number of rows in the honeycomb grid.
     * @param margin Optional distance between each clone.
     * @returns A new model with clones in a honeycomb layout.
     */
    function cloneToHoneycomb(itemToClone: IModel | IPath, xCount: number, yCount: number, margin?: number): IModel;
}
declare namespace MakerJs.models {
    class BezierCurve implements IModel {
        models: IModelMap;
        paths: IPathMap;
        origin: IPoint;
        type: string;
        seed: IPathBezierSeed;
        accuracy: number;
        constructor(points: IPoint[], accuracy?: number);
        constructor(seed: IPathBezierSeed, accuracy?: number);
        constructor(origin: IPoint, control: IPoint, end: IPoint, accuracy?: number);
        constructor(origin: IPoint, controls: IPoint[], end: IPoint, accuracy?: number);
        constructor(origin: IPoint, control1: IPoint, control2: IPoint, end: IPoint, accuracy?: number);
        static typeName: string;
        static getBezierSeeds(curve: BezierCurve, options?: IFindChainsOptions): IPath[] | {
            [layer: string]: IPath[];
        };
        static computeLength(seed: IPathBezierSeed): number;
        static computePoint(seed: IPathBezierSeed, t: number): IPoint;
    }
}
declare var Bezier: typeof BezierJs.Bezier;
declare namespace MakerJs.models {
    class Ellipse implements IModel {
        models: IModelMap;
        origin: IPoint;
        /**
         * Class for Ellipse created with 2 radii.
         *
         * @param radiusX The x radius of the ellipse.
         * @param radiusY The y radius of the ellipse.
         * @param accuracy Optional accuracy of the underlying BezierCurve.
         */
        constructor(radiusX: number, radiusY: number, accuracy?: number);
        /**
         * Class for Ellipse created at a specific origin and 2 radii.
         *
         * @param origin The center of the ellipse.
         * @param radiusX The x radius of the ellipse.
         * @param radiusY The y radius of the ellipse.
         * @param accuracy Optional accuracy of the underlying BezierCurve.
         */
        constructor(origin: IPoint, radiusX: number, radiusY: number, accuracy?: number);
        /**
         * Class for Ellipse created at a specific x, y and 2 radii.
         *
         * @param cx The x coordinate of the center of the ellipse.
         * @param cy The y coordinate of the center of the ellipse.
         * @param rX The x radius of the ellipse.
         * @param rY The y radius of the ellipse.
         * @param accuracy Optional accuracy of the underlying BezierCurve.
         */
        constructor(cx: number, cy: number, rx: number, ry: number, accuracy?: number);
    }
    class EllipticArc implements IModel {
        models: IModelMap;
        /**
         * Class for Elliptic Arc created by distorting a circular arc.
         *
         * @param arc The circular arc to use as the basis of the elliptic arc.
         * @param radiusX The x radius of the ellipse.
         * @param radiusY The y radius of the ellipse.
         * @param accuracy Optional accuracy of the underlying BezierCurve.
         */
        constructor(startAngle: number, endAngle: number, radiusX: number, radiusY: number, accuracy?: number);
        /**
         * Class for Elliptic Arc created by distorting a circular arc.
         *
         * @param arc The circular arc to use as the basis of the elliptic arc.
         * @param distortX The x scale of the ellipse.
         * @param distortY The y scale of the ellipse.
         * @param accuracy Optional accuracy of the underlying BezierCurve.
         */
        constructor(arc: IPathArc, distortX: number, distortY: number, accuracy?: number);
    }
}
declare namespace MakerJs.models {
    class ConnectTheDots implements IModel {
        paths: IPathMap;
        /**
         * Create a model by connecting points designated in a string. The model will be 'closed' - i.e. the last point will connect to the first point.
         *
         * Example:
         * ```
         * var c = new makerjs.models.ConnectTheDots('-10 0 10 0 0 20'); // 3 coordinates to form a triangle
         * ```
         *
         * @param numericList String containing a list of numbers which can be delimited by spaces, commas, or anything non-numeric (Note: [exponential notation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toExponential) is allowed).
         */
        constructor(numericList: string);
        /**
         * Create a model by connecting points designated in a string. The model may be closed, or left open.
         *
         * Example:
         * ```
         * var c = new makerjs.models.ConnectTheDots(false, '-10 0 10 0 0 20'); // 3 coordinates to form a polyline
         * ```
         *
         * @param isClosed Flag to specify if last point should connect to the first point.
         * @param numericList String containing a list of numbers which can be delimited by spaces, commas, or anything non-numeric (Note: [exponential notation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toExponential) is allowed).
         */
        constructor(isClosed: boolean, numericList: string);
        /**
         * Create a model by connecting points designated in a numeric array. The model will be 'closed' - i.e. the last point will connect to the first point.
         *
         * Example:
         * ```
         * var c = new makerjs.models.ConnectTheDots([-10, 0, 10, 0, 0, 20]); // 3 coordinates to form a triangle
         * ```
         *
         * @param coords Array of coordinates.
         */
        constructor(coords: number[]);
        /**
         * Create a model by connecting points designated in a numeric array. The model may be closed, or left open.
         *
         * Example:
         * ```
         * var c = new makerjs.models.ConnectTheDots(false, [-10, 0, 10, 0, 0, 20]); // 3 coordinates to form a polyline
         * ```
         *
         * @param isClosed Flag to specify if last point should connect to the first point.
         * @param coords Array of coordinates.
         */
        constructor(isClosed: boolean, coords: number[]);
        /**
         * Create a model by connecting points designated in an array of points. The model may be closed, or left open.
         *
         * Example:
         * ```
         * var c = new makerjs.models.ConnectTheDots(false, [[-10, 0], [10, 0], [0, 20]]); // 3 coordinates left open
         * ```
         *
         * @param isClosed Flag to specify if last point should connect to the first point.
         * @param points Array of IPoints.
         */
        constructor(isClosed: boolean, points: IPoint[]);
    }
}
declare namespace MakerJs.models {
    class Polygon implements IModel {
        paths: IPathMap;
        constructor(numberOfSides: number, radius: number, firstCornerAngleInDegrees?: number, circumscribed?: boolean);
        static circumscribedRadius(radius: number, angleInRadians: number): number;
        static getPoints(numberOfSides: number, radius: number, firstCornerAngleInDegrees?: number, circumscribed?: boolean): IPoint[];
    }
}
declare namespace MakerJs.models {
    class Holes implements IModel {
        paths: IPathMap;
        /**
         * Create an array of circles of the same radius from an array of center points.
         *
         * Example:
         * ```
         * //Create some holes from an array of points
         * var makerjs = require('makerjs');
         * var model = new makerjs.models.Holes(10, [[0, 0],[50, 0],[25, 40]]);
         * var svg = makerjs.exporter.toSVG(model);
         * document.write(svg);
         * ```
         *
         * @param holeRadius Hole radius.
         * @param points Array of points for origin of each hole.
         * @param ids Optional array of corresponding path ids for the holes.
         */
        constructor(holeRadius: number, points: IPoint[], ids?: string[]);
    }
}
declare namespace MakerJs.models {
    class BoltCircle implements IModel {
        paths: IPathMap;
        constructor(boltRadius: number, holeRadius: number, boltCount: number, firstBoltAngleInDegrees?: number);
    }
}
declare namespace MakerJs.models {
    class BoltRectangle implements IModel {
        paths: IPathMap;
        constructor(width: number, height: number, holeRadius: number);
    }
}
declare namespace MakerJs.models {
    class Dogbone implements IModel {
        paths: IPathMap;
        /**
         * Create a dogbone from width, height, corner radius, style, and bottomless flag.
         *
         * Example:
         * ```
         * var d = new makerjs.models.Dogbone(50, 100, 5);
         * ```
         *
         * @param width Width of the rectangle.
         * @param height Height of the rectangle.
         * @param radius Corner radius.
         * @param style Optional corner style: 0 (default) for dogbone, 1 for vertical, -1 for horizontal.
         * @param bottomless Optional flag to omit the bottom line and bottom corners (default false).
         */
        constructor(width: number, height: number, radius: number, style?: number, bottomless?: boolean);
    }
}
declare namespace MakerJs.models {
    class Dome implements IModel {
        paths: IPathMap;
        constructor(width: number, height: number, radius?: number, bottomless?: boolean);
    }
}
declare namespace MakerJs.models {
    class RoundRectangle implements IModel {
        origin: IPoint;
        paths: IPathMap;
        /**
         * Create a round rectangle from width, height, and corner radius.
         *
         * Example:
         * ```
         * var r = new makerjs.models.RoundRectangle(100, 50, 5);
         * ```
         *
         * @param width Width of the rectangle.
         * @param height Height of the rectangle.
         * @param radius Corner radius.
         */
        constructor(width: number, height: number, radius: number);
        /**
         * Create a round rectangle which will surround a model.
         *
         * Example:
         * ```
         * var b = new makerjs.models.BoltRectangle(30, 20, 1); //draw a bolt rectangle so we have something to surround
         * var r = new makerjs.models.RoundRectangle(b, 2.5);   //surround it
         * ```
         *
         * @param modelToSurround IModel object.
         * @param margin Distance from the model. This will also become the corner radius.
         */
        constructor(modelToSurround: IModel, margin: number);
    }
}
declare namespace MakerJs.models {
    class Oval implements IModel {
        paths: IPathMap;
        constructor(width: number, height: number);
    }
}
declare namespace MakerJs.models {
    class OvalArc implements IModel {
        paths: IPathMap;
        models: IModelMap;
        constructor(startAngle: number, endAngle: number, sweepRadius: number, slotRadius: number, selfIntersect?: boolean, isolateCaps?: boolean);
    }
}
declare namespace MakerJs.models {
    class Rectangle implements IModel {
        paths: IPathMap;
        origin: IPoint;
        /**
         * Create a rectangle from width and height.
         *
         * Example:
         * ```
         * //Create a rectangle from width and height
         * var makerjs = require('makerjs');
         * var model = new makerjs.models.Rectangle(50, 100);
         * var svg = makerjs.exporter.toSVG(model);
         * document.write(svg);
         * ```
         *
         * @param width Width of the rectangle.
         * @param height Height of the rectangle.
         */
        constructor(width: number, height: number);
        /**
         * Create a rectangle which will surround a model.
         *
         * Example:
         * ```
         * //Create a rectangle which will surround a model
         * var makerjs = require('makerjs');
         * var e = new makerjs.models.Ellipse(17, 10); // draw an ellipse so we have something to surround.
         * var r = new makerjs.models.Rectangle(e, 3); // draws a rectangle surrounding the ellipse by 3 units.
         * var svg = makerjs.exporter.toSVG({ models: { e: e, r: r }});
         * document.write(svg);
         * ```
         *
         * @param modelToSurround IModel object.
         * @param margin Optional distance from the model.
         */
        constructor(modelToSurround: IModel, margin?: number);
        /**
         * Create a rectangle from a measurement.
         *
         * Example:
         * ```
         * //Create a rectangle from a measurement.
         * var makerjs = require('makerjs');
         * var e = new makerjs.models.Ellipse(17, 10); // draw an ellipse so we have something to measure.
         * var m = makerjs.measure.modelExtents(e);    // measure the ellipse.
         * var r = new makerjs.models.Rectangle(m);    // draws a rectangle surrounding the ellipse.
         * var svg = makerjs.exporter.toSVG({ models: { e: e, r: r }});
         * document.write(svg);
         * ```
         *
         * @param measurement IMeasure object. See http://maker.js.org/docs/api/modules/makerjs.measure.html#pathextents and http://maker.js.org/docs/api/modules/makerjs.measure.html#modelextents to get measurements of paths and models.
         */
        constructor(measurement: IMeasure);
    }
}
declare namespace MakerJs.models {
    class Ring implements IModel {
        paths: IPathMap;
        constructor(outerRadius: number, innerRadius?: number);
    }
}
declare namespace MakerJs.models {
    class Belt implements IModel {
        paths: IPathMap;
        constructor(leftRadius: number, distance: number, rightRadius: number);
    }
}
declare namespace MakerJs.models {
    class SCurve implements IModel {
        paths: IPathMap;
        constructor(width: number, height: number);
    }
}
declare namespace MakerJs.models {
    class Slot implements IModel {
        paths: IPathMap;
        origin: IPoint;
        models: IModelMap;
        constructor(origin: IPoint, endPoint: IPoint, radius: number, isolateCaps?: boolean);
    }
}
declare namespace MakerJs.models {
    class Square implements IModel {
        paths: IPathMap;
        constructor(side: number);
    }
}
declare namespace MakerJs.models {
    class Star implements IModel {
        paths: IPathMap;
        constructor(numberOfPoints: number, outerRadius: number, innerRadius?: number, skipPoints?: number);
        static InnerRadiusRatio(numberOfPoints: number, skipPoints: number): number;
    }
}
declare namespace MakerJs.models {
    class Text implements IModel {
        models: IModelMap;
        constructor(font: opentype.Font, text: string, fontSize: number, combine?: boolean, centerCharacterOrigin?: boolean, bezierAccuracy?: number, opentypeOptions?: opentype.RenderOptions);
    }
}
