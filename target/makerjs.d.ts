/// <reference path="../typings/tsd.d.ts" />
declare module MakerJs {
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
     * Numeric rounding
     *
     * @param n The number to round off.
     * @param accuracy Optional exemplar of number of decimal places.
     */
    function round(n: number, accuracy?: number): number;
    /**
     * Copy the properties from one object to another object.
     *
     * @param target The object to extend. It will receive the new properties.
     * @param other An object containing properties to merge in.
     * @returns The original object after merging.
     */
    function extendObject(target: Object, other: Object): Object;
    /**
     * Things that may have an id.
     */
    interface IHaveId {
        id?: string;
    }
    /**
     * An item found in an array.
     */
    interface IFound<T> {
        /**
         * Position of the item within the array.
         */
        index: number;
        /**
         * The found item.
         */
        item: T;
    }
    /**
     * Search within an array to find an item by its id property.
     *
     * @param arr Array to search.
     * @param id Id of the item to find.
     * @returns object with item and its position.
     */
    function findById<T extends IHaveId>(arr: T[], id: string): IFound<T>;
    /**
     * An x-y point in a two-dimensional space.
     */
    interface IPoint {
        [index: number]: number;
    }
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
     * A line, curved line or other simple two dimensional shape.
     */
    interface IPath extends IHaveId {
        /**
         * The type of the path, e.g. "line", "circle", or "arc". These strings are enumerated in pathType.
         */
        type: string;
        /**
         * The main point of reference for this path.
         */
        origin: IPoint;
    }
    /**
     * Test to see if an object implements the required properties of a path.
     *
     * @param item The item to test.
     */
    function isPath(item: any): boolean;
    /**
     * A line path.
     */
    interface IPathLine extends IPath {
        /**
         * The end point defining the line. The start point is the origin.
         */
        end: IPoint;
    }
    /**
     * A circle path.
     */
    interface IPathCircle extends IPath {
        /**
         * The radius of the circle.
         */
        radius: number;
    }
    /**
     * An arc path.
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
     * A map of functions which accept a path as a parameter.
     */
    interface IPathFunctionMap {
        /**
         * Key is the type of a path, value is a function which accepts a path object as its parameter.
         */
        [type: string]: (pathValue: IPath) => void;
    }
    /**
     * A map of functions which accept a path and an origin point as parameters.
     */
    interface IPathOriginFunctionMap {
        /**
         * Key is the type of a path, value is a function which accepts a path object a point object as its parameters.
         */
        [type: string]: (pathValue: IPath, origin: IPoint) => void;
    }
    /**
     * String-based enumeration of all paths types.
     */
    var pathType: {
        Line: string;
        Circle: string;
        Arc: string;
    };
    /**
     * A model is a composite object which may contain an array of paths, or an array of models recursively.
     */
    interface IModel extends IHaveId {
        /**
         * Optional origin location of this model.
         */
        origin?: IPoint;
        /**
         * A model may want to specify its type, but this value is not employed yet.
         */
        type?: string;
        /**
         * Optional array of path objects in this model.
         */
        paths?: IPath[];
        /**
         * Optional array of models within this model.
         */
        models?: IModel[];
        /**
         * Optional unit system of this model. See UnitType for possible values.
         */
        units?: string;
        /**
         * An author may wish to add notes to this model instance.
         */
        notes?: string;
    }
    /**
     * Test to see if an object implements the required properties of a model.
     */
    function isModel(item: any): boolean;
    /**
     * Shortcut to create a new arc path.
     *
     * @param id The id of the new path.
     * @param origin The origin of the new path, either as a point object, or as an array of numbers.
     * @param radius The radius of the arc.
     * @param startAngle The start angle of the arc.
     * @param endAngle The end angle of the arc.
     * @returns A new POJO representing an arc path.
     */
    function createArc(id: string, origin: IPoint, radius: number, startAngle: number, endAngle: number): IPathArc;
    /**
     * Shortcut to create a new circle path.
     *
     * @param id The id of the new path.
     * @param origin The origin of the new path, either as a point object, or as an array of numbers.
     * @param radius The radius of the circle.
     * @returns A new POJO representing an circle path.
     */
    function createCircle(id: string, origin: IPoint, radius: number): IPathCircle;
    /**
     * Shortcut to create a new line path.
     *
     * @param id The id of the new path.
     * @param origin The origin of the new path, either as a point object, or as an array of numbers.
     * @param end The end point of the line.
     * @returns A new POJO representing an line path.
     */
    function createLine(id: string, origin: IPoint, end: IPoint): IPathLine;
}
declare module MakerJs.angle {
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
     * Gets an arc's end angle, ensured to be greater than its start angle.
     *
     * @param arc An arc path object.
     * @returns End angle of arc.
     */
    function arcEndAnglePastZero(arc: IPathArc): number;
    /**
     * Angle of a line through a point.
     *
     * @param pointToFindAngle The point to find the angle.
     * @param origin (Optional 0,0 implied) point of origin of the angle.
     * @returns Angle of the line throught the point.
     */
    function fromPointToRadians(pointToFindAngle: IPoint, origin?: IPoint): number;
    /**
     * Mirror an angle on either or both x and y axes.
     *
     * @param angleInDegrees The angle to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @returns Mirrored angle.
     */
    function mirror(angleInDegrees: number, mirrorX: boolean, mirrorY: boolean): number;
}
declare module MakerJs.point {
    /**
     * Add two points together and return the result as a new point object.
     *
     * @param a First point, either as a point object, or as an array of numbers.
     * @param b Second point, either as a point object, or as an array of numbers.
     * @param subtract Optional boolean to subtract instead of add.
     * @returns A new point object.
     */
    function add(a: IPoint, b: IPoint, subtract?: boolean): IPoint;
    /**
     * Clone a point into a new point.
     *
     * @param pointToClone The point to clone.
     * @returns A new point with same values as the original.
     */
    function clone(pointToClone: IPoint): IPoint;
    /**
     * Get a point from its polar coordinates.
     *
     * @param angleInRadians The angle of the polar coordinate, in radians.
     * @param radius The radius of the polar coordinate.
     * @returns A new point object.
     */
    function fromPolar(angleInRadians: number, radius: number): IPoint;
    /**
     * Get the two end points of an arc path.
     *
     * @param arc The arc path object.
     * @returns Array with 2 elements: [0] is the point object corresponding to the start angle, [1] is the point object corresponding to the end angle.
     */
    function fromArc(arc: IPathArc): IPoint[];
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
     * Rotate a point.
     *
     * @param pointToRotate The point to rotate.
     * @param angleInDegrees The amount of rotation, in degrees.
     * @param rotationOrigin The center point of rotation.
     * @returns A new point.
     */
    function rotate(pointToRotate: IPoint, angleInDegrees: number, rotationOrigin: IPoint): IPoint;
    /**
     * Scale a point's coordinates.
     *
     * @param pointToScale The point to scale.
     * @param scaleValue The amount of scaling.
     * @returns A new point.
     */
    function scale(pointToScale: IPoint, scaleValue: number): IPoint;
    /**
     * Subtract a point from another point, and return the result as a new point. Shortcut to Add(a, b, subtract = true).
     *
     * @param a First point, either as a point object, or as an array of numbers.
     * @param b Second point, either as a point object, or as an array of numbers.
     * @returns A new point object.
     */
    function subtract(a: IPoint, b: IPoint): IPoint;
    function subtract(a: IPoint, b: number[]): IPoint;
    function subtract(a: number[], b: IPoint): IPoint;
    function subtract(a: number[], b: number[]): IPoint;
    /**
     * A point at 0,0 coordinates.
     *
     * @returns A new point.
     */
    function zero(): IPoint;
}
declare module MakerJs.path {
    /**
     * Create a clone of a path, mirrored on either or both x and y axes.
     *
     * @param pathToMirror The path to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @param newId Optional id to assign to the new path.
     * @returns Mirrored path.
     */
    function mirror(pathToMirror: IPath, mirrorX: boolean, mirrorY: boolean, newId?: string): IPath;
    /**
     * Move a path's origin by a relative amount. Note: to move absolute, just set the origin property directly.
     *
     * @param pathToMove The path to move.
     * @param adjust The x & y adjustments, either as a point object, or as an array of numbers.
     * @returns The original path (for chaining).
     */
    function moveRelative(pathToMove: IPath, adjust: IPoint): IPath;
    /**
     * Rotate a path.
     *
     * @param pathToRotate The path to rotate.
     * @param angleInDegrees The amount of rotation, in degrees.
     * @param rotationOrigin The center point of rotation.
     * @returns The original path (for chaining).
     */
    function rotate(pathToRotate: IPath, angleInDegrees: number, rotationOrigin: IPoint): IPath;
    /**
     * Scale a path.
     *
     * @param pathToScale The path to scale.
     * @param scaleValue The amount of scaling.
     * @returns The original path (for chaining).
     */
    function scale(pathToScale: IPath, scaleValue: number): IPath;
}
declare module MakerJs.model {
    /**
     * Moves all children (models and paths, recursively) within a model to their absolute position. Useful when referencing points between children.
     *
     * @param modelToFlatten The model to flatten.
     * @param origin Optional offset reference point.
     */
    function flatten(modelToFlatten: IModel, origin?: IPoint): IModel;
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
     * Move a model to an absolute position. Note that this is also accomplished by directly setting the origin property. This function exists because the origin property is optional.
     *
     * @param modelToMove The model to move.
     * @param origin The new position of the model.
     * @returns The original model (for chaining).
     */
    function move(modelToMove: IModel, origin: IPoint): IModel;
    /**
     * Rotate a model.
     *
     * @param modelToRotate The model to rotate.
     * @param angleInDegrees The amount of rotation, in degrees.
     * @param rotationOrigin The center point of rotation.
     * @returns The original model (for chaining).
     */
    function rotate(modelToRotate: IModel, angleInDegrees: number, rotationOrigin: IPoint): IModel;
    /**
     * Scale a model.
     *
     * @param modelToScale The model to scale.
     * @param scaleValue The amount of scaling.
     * @param scaleOrigin Optional boolean to scale the origin point. Typically false for the root model.
     * @returns The original model (for chaining).
     */
    function scale(modelToScale: IModel, scaleValue: number, scaleOrigin?: boolean): IModel;
}
declare module MakerJs.units {
    /**
     * Get a conversion ratio between a source unit and a destination unit. This will lazy load the table with initial conversions,
     * then new cross-conversions will be cached in the table.
     *
     * @param srcUnitType unitType converting from.
     * @param destUnitType unitType converting to.
     * @returns Numeric ratio of the conversion.
     */
    function conversionScale(srcUnitType: string, destUnitType: string): number;
}
declare module MakerJs.measure {
    /**
     * Total angle of an arc between its start and end angles.
     *
     * @param arc The arc to measure.
     * @returns Angle of arc.
     */
    function arcAngle(arc: IPathArc): number;
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
    function pathExtents(pathToMeasure: IPath): IMeasure;
    /**
     * Measures the length of a path.
     *
     * @param pathToMeasure The path to measure.
     * @returns Length of the path.
     */
    function pathLength(pathToMeasure: IPath): number;
    /**
     * Measures the smallest rectangle which contains a model.
     *
     * @param modelToMeasure The model to measure.
     * @returns object with low and high points.
     */
    function modelExtents(modelToMeasure: IModel): IMeasure;
}
declare module MakerJs.exporter {
    interface IExportOptions {
        /**
         * Unit system to embed in exported file.
         */
        units?: string;
    }
    /**
     * Try to get the unit system from a model
     */
    function tryGetModelUnits(itemToExport: any): string;
    /**
     * Class to traverse an item 's models or paths and ultimately render each path.
     */
    class Exporter {
        private map;
        private fixPoint;
        private fixPath;
        private beginModel;
        private endModel;
        /**
         * @param map Object containing properties: property name is the type of path, e.g. "line", "circle"; property value
         * is a function to render a path. Function parameters are path and point.
         * @param fixPoint Optional function to modify a point prior to export. Function parameter is a point; function must return a point.
         * @param fixPath Optional function to modify a path prior to output. Function parameters are path and offset point; function must return a path.
         */
        constructor(map: IPathOriginFunctionMap, fixPoint?: (pointToFix: IPoint) => IPoint, fixPath?: (pathToFix: IPath, origin: IPoint) => IPath, beginModel?: (modelContext: IModel) => void, endModel?: (modelContext: IModel) => void);
        /**
         * Export a path.
         *
         * @param pathToExport The path to export.
         * @param offset The offset position of the path.
         */
        exportPath(pathToExport: IPath, offset: IPoint): void;
        /**
         * Export a model.
         *
         * @param modelToExport The model to export.
         * @param offset The offset position of the model.
         */
        exportModel(modelToExport: IModel, offset: IPoint): void;
        /**
         * Export an object.
         *
         * @param item The object to export. May be a path, an array of paths, a model, or an array of models.
         * @param offset The offset position of the object.
         */
        exportItem(itemToExport: any, origin: IPoint): void;
    }
}
declare module MakerJs.exporter {
    function toDXF(modelToExport: IModel, options?: IDXFRenderOptions): string;
    function toDXF(pathsToExport: IPath[], options?: IDXFRenderOptions): string;
    function toDXF(pathToExport: IPath, options?: IDXFRenderOptions): string;
    /**
     * DXF rendering options.
     */
    interface IDXFRenderOptions extends IExportOptions {
    }
}
declare module MakerJs.exporter {
    /**
     * Attributes for an XML tag.
     */
    interface IXmlTagAttrs {
        [name: string]: any;
    }
    /**
     * Class for an XML tag.
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
declare module MakerJs.exporter {
    /**
     * The default stroke width in millimeters.
     */
    var defaultStrokeWidth: number;
    function toSVG(modelToExport: IModel, options?: ISVGRenderOptions): string;
    function toSVG(pathsToExport: IPath[], options?: ISVGRenderOptions): string;
    function toSVG(pathToExport: IPath, options?: ISVGRenderOptions): string;
    /**
     * SVG rendering options.
     */
    interface ISVGRenderOptions extends IExportOptions {
        /**
         * SVG stroke width of paths. This is in the same unit system as the units property.
         */
        strokeWidth?: number;
        /**
         * SVG color of the rendered paths.
         */
        stroke: string;
        /**
         * Scale of the SVG rendering.
         */
        scale: number;
        /**
         *  Indicate that the id's of paths should be rendered as SVG text elements.
         */
        annotate: boolean;
        /**
         * Rendered reference origin.
         */
        origin: IPoint;
        /**
         * Use SVG <path> elements instead of <line>, <circle> etc.
         */
        useSvgPathOnly: boolean;
        /**
         * Flag to use SVG viewbox.
         */
        viewBox: boolean;
    }
}
declare module MakerJs.models {
    class BoltCircle implements IModel {
        id: string;
        paths: IPath[];
        constructor(id: string, boltRadius: number, holeRadius: number, boltCount: number, firstBoltAngle?: number);
    }
}
declare module MakerJs.models {
    class BoltRectangle implements IModel {
        id: string;
        paths: IPath[];
        constructor(id: string, width: number, height: number, holeRadius: number);
    }
}
declare module MakerJs.models {
    class ConnectTheDots implements IModel {
        id: string;
        paths: IPath[];
        constructor(id: string, isClosed: boolean, points: IPoint[]);
    }
}
declare module MakerJs.models {
    class RoundRectangle implements IModel {
        id: string;
        paths: IPath[];
        constructor(id: string, width: number, height: number, radius: number);
    }
}
declare module MakerJs.models {
    class Oval extends RoundRectangle {
        id: string;
        constructor(id: string, width: number, height: number);
    }
}
declare module MakerJs.models {
    class OvalArc implements IModel {
        id: string;
        paths: IPath[];
        constructor(id: string, startAngle: number, endAngle: number, sweepRadius: number, slotRadius: number);
    }
}
declare module MakerJs.models {
    class Rectangle extends ConnectTheDots {
        id: string;
        constructor(id: string, width: number, height: number);
    }
}
declare module MakerJs.models {
    class SCurve implements IModel {
        id: string;
        paths: IPath[];
        constructor(id: string, width: number, height: number);
    }
}
declare module MakerJs.models {
    class Square extends Rectangle {
        id: string;
        constructor(id: string, side: number);
    }
}
