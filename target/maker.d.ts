declare module Maker {
    /**
     * String-based enumeration of unit types: imperial, metric or otherwise.
     * A model may specify the unit system it is using, if any. When importing a model, it may have different units.
     * Unit conversion function is Maker.Units.ConversionScale().
     * Important: If you add to this, you must also add a corresponding conversion ratio in the unit.ts file!
     */
    var UnitType: {
        Centimeter: string;
        Foot: string;
        Inch: string;
        Meter: string;
        Millimeter: string;
    };
    /**
     * Copy the properties from one object to another object.
     *
     * @param target The object to extend. It will receive the new properties.
     * @param other An object containing properties to merge in.
     * @returns The original object after merging.
     */
    function ExtendObject(target: Object, other: Object): Object;
    /**
     * Things that may have an id.
     */
    interface IMakerId {
        id?: string;
    }
    /**
     * An item found in an array.
     */
    interface IMakerFound<T> {
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
    function FindById<T extends IMakerId>(arr: T[], id: string): IMakerFound<T>;
    /**
     * An x-y point in a two-dimensional space.
     */
    interface IMakerPoint {
        x: number;
        y: number;
    }
    /**
     * Test to see if an object implements the required properties of a point.
     *
     * @param item The item to test.
     */
    function IsPoint(item: any): boolean;
    /**
     * A measurement of extents, the high and low points.
     */
    interface IMakerMeasure {
        /**
         * The point containing both the lowest x and y values of the rectangle containing the item being measured.
         */
        low: IMakerPoint;
        /**
         * The point containing both the highest x and y values of the rectangle containing the item being measured.
         */
        high: IMakerPoint;
    }
    /**
     * A line, curved line or other simple two dimensional shape.
     */
    interface IMakerPath extends IMakerId {
        /**
         * The type of the path, e.g. "line", "circle", or "arc". These strings are enumerated in PathType.
         */
        type: string;
        /**
         * The main point of reference for this path.
         */
        origin: IMakerPoint;
    }
    /**
     * Test to see if an object implements the required properties of a path.
     *
     * @param item The item to test.
     */
    function IsPath(item: any): boolean;
    /**
     * A line path.
     */
    interface IMakerPathLine extends IMakerPath {
        /**
         * The end point defining the line. The start point is the origin.
         */
        end: IMakerPoint;
    }
    /**
     * A circle path.
     */
    interface IMakerPathCircle extends IMakerPath {
        /**
         * The radius of the circle.
         */
        radius: number;
    }
    /**
     * An arc path.
     */
    interface IMakerPathArc extends IMakerPathCircle {
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
    interface IMakerPathFunctionMap {
        /**
         * Key is the type of a path, value is a function which accepts a path object as its parameter.
         */
        [type: string]: (path: IMakerPath) => void;
    }
    /**
     * A map of functions which accept a path and an origin point as parameters.
     */
    interface IMakerPathOriginFunctionMap {
        /**
         * Key is the type of a path, value is a function which accepts a path object a point object as its parameters.
         */
        [type: string]: (path: IMakerPath, origin: IMakerPoint) => void;
    }
    /**
     * String-based enumeration of all paths types.
     */
    var PathType: {
        Line: string;
        Circle: string;
        Arc: string;
    };
    /**
     * A model is a composite object which may contain an array of paths, or an array of models recursively.
     */
    interface IMakerModel extends IMakerId {
        /**
         * Optional origin location of this model.
         */
        origin?: IMakerPoint;
        /**
         * A model may want to specify its type, but this value is not employed yet.
         */
        type?: string;
        /**
         * Optional array of path objects in this model.
         */
        paths?: IMakerPath[];
        /**
         * Optional array of models within this model.
         */
        models?: IMakerModel[];
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
    function IsModel(item: any): boolean;
}
declare var module: any;
declare module Maker.Angle {
    /**
     * Convert an angle from degrees to radians.
     *
     * @param angleInDegrees Angle in degrees.
     * @returns Angle in radians.
     */
    function ToRadians(angleInDegrees: number): number;
    /**
     * Convert an angle from radians to degrees.
     *
     * @param angleInRadians Angle in radians.
     * @returns Angle in degrees.
     */
    function FromRadians(angleInRadians: number): number;
    /**
     * Gets an arc's end angle, ensured to be greater than its start angle.
     *
     * @param arc An arc path object.
     * @returns End angle of arc.
     */
    function ArcEndAnglePastZero(arc: IMakerPathArc): number;
    /**
     * Angle of a line through a point.
     *
     * @param point The point to find the angle.
     * @param origin (Optional 0,0 implied) point of origin of the angle.
     * @returns Angle of the line throught the point.
     */
    function FromPointToRadians(point: IMakerPoint, origin?: IMakerPoint): number;
    /**
     * Mirror an angle on either or both x and y axes.
     *
     * @param angleInDegrees The angle to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @returns Mirrored angle.
     */
    function Mirror(angleInDegrees: number, mirrorX: boolean, mirrorY: boolean): number;
}
declare module Maker.Point {
    /**
     * Add two points together and return the result as a new point object.
     *
     * @param a First point, either as a point object, or as an array of numbers.
     * @param b Second point, either as a point object, or as an array of numbers.
     * @param subtract Optional boolean to subtract instead of add.
     * @returns A new point object.
     */
    function Add(a: IMakerPoint, b: IMakerPoint, subtract?: boolean): IMakerPoint;
    function Add(a: IMakerPoint, b: number[], subtract?: boolean): IMakerPoint;
    function Add(a: number[], b: IMakerPoint, subtract?: boolean): IMakerPoint;
    function Add(a: number[], b: number[], subtract?: boolean): IMakerPoint;
    /**
     * Clone a point into a new point.
     *
     * @param point The point to clone.
     * @returns A new point with same values as the original.
     */
    function Clone(point: IMakerPoint): IMakerPoint;
    /**
     * Ensures that an item has the properties of a point object.
     *
     * @param point The item to ensure; may be a point object, or an array of numbers, or something else which will attempt to coerce into a point.
     * @returns A new point object either with the x, y values corresponding to the input, or 0,0 coordinates.
     */
    function Ensure(point: IMakerPoint): IMakerPoint;
    function Ensure(point: number[]): IMakerPoint;
    function Ensure(): IMakerPoint;
    /**
     * Get a point from its polar coordinates.
     *
     * @param angleInRadians The angle of the polar coordinate, in radians.
     * @param radius The radius of the polar coordinate.
     * @returns A new point object.
     */
    function FromPolar(angleInRadians: number, radius: number): IMakerPoint;
    /**
     * Get the two end points of an arc path.
     *
     * @param arc The arc path object.
     * @returns Array with 2 elements: [0] is the point object corresponding to the start angle, [1] is the point object corresponding to the end angle.
     */
    function FromArc(arc: IMakerPathArc): IMakerPoint[];
    /**
     * Create a clone of a point, mirrored on either or both x and y axes.
     *
     * @param point The point to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @returns Mirrored point.
     */
    function Mirror(point: IMakerPoint, mirrorX: boolean, mirrorY: boolean): IMakerPoint;
    /**
     * Rotate a point.
     *
     * @param point The point to rotate.
     * @param angleInDegrees The amount of rotation, in degrees.
     * @param rotationOrigin The center point of rotation.
     * @returns A new point.
     */
    function Rotate(point: IMakerPoint, angleInDegrees: number, rotationOrigin: IMakerPoint): IMakerPoint;
    /**
     * Scale a point's coordinates.
     *
     * @param point The point to scale.
     * @param scale The amount of scaling.
     * @returns A new point.
     */
    function Scale(point: IMakerPoint, scale: number): IMakerPoint;
    /**
     * Subtract a point from another point, and return the result as a new point. Shortcut to Add(a, b, subtract = true).
     *
     * @param a First point, either as a point object, or as an array of numbers.
     * @param b Second point, either as a point object, or as an array of numbers.
     * @returns A new point object.
     */
    function Subtract(a: IMakerPoint, b: IMakerPoint): IMakerPoint;
    function Subtract(a: IMakerPoint, b: number[]): IMakerPoint;
    function Subtract(a: number[], b: IMakerPoint): IMakerPoint;
    function Subtract(a: number[], b: number[]): IMakerPoint;
    /**
     * A point at 0,0 coordinates.
     *
     * @returns A new point.
     */
    function Zero(): IMakerPoint;
}
declare module Maker.Path {
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
    function CreateArc(id: string, origin: IMakerPoint, radius: number, startAngle: number, endAngle: number): IMakerPathArc;
    function CreateArc(id: string, origin: number[], radius: number, startAngle: number, endAngle: number): IMakerPathArc;
    /**
     * Shortcut to create a new circle path.
     *
     * @param id The id of the new path.
     * @param origin The origin of the new path, either as a point object, or as an array of numbers.
     * @param radius The radius of the circle.
     * @returns A new POJO representing an circle path.
     */
    function CreateCircle(id: string, origin: IMakerPoint, radius: number): IMakerPathCircle;
    function CreateCircle(id: string, origin: number[], radius: number): IMakerPathCircle;
    /**
     * Shortcut to create a new line path.
     *
     * @param id The id of the new path.
     * @param origin The origin of the new path, either as a point object, or as an array of numbers.
     * @param end The end point of the line.
     * @returns A new POJO representing an line path.
     */
    function CreateLine(id: string, origin: IMakerPoint, end: IMakerPoint): IMakerPathLine;
    function CreateLine(id: string, origin: number[], end: IMakerPoint): IMakerPathLine;
    function CreateLine(id: string, origin: IMakerPoint, end: number[]): IMakerPathLine;
    function CreateLine(id: string, origin: number[], end: number[]): IMakerPathLine;
    /**
     * Create a clone of a path, mirrored on either or both x and y axes.
     *
     * @param path The path to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @param newId Optional id to assign to the new path.
     * @returns Mirrored path.
     */
    function Mirror(path: IMakerPath, mirrorX: boolean, mirrorY: boolean, newId?: string): IMakerPath;
    /**
     * Move a path's origin by a relative amount. Note: to move absolute, just set the origin property directly.
     *
     * @param path The path to move.
     * @param adjust The x & y adjustments, either as a point object, or as an array of numbers.
     * @returns The original path (for chaining).
     */
    function MoveRelative(path: IMakerPath, adjust: IMakerPoint): IMakerPath;
    function MoveRelative(path: IMakerPath, adjust: number[]): IMakerPath;
    /**
     * Rotate a path.
     *
     * @param path The path to rotate.
     * @param angleInDegrees The amount of rotation, in degrees.
     * @param rotationOrigin The center point of rotation.
     * @returns The original path (for chaining).
     */
    function Rotate(path: IMakerPath, angleInDegrees: number, rotationOrigin: IMakerPoint): IMakerPath;
    /**
     * Scale a path.
     *
     * @param path The path to scale.
     * @param scale The amount of scaling.
     * @returns The original path (for chaining).
     */
    function Scale(path: IMakerPath, scale: number): IMakerPath;
}
declare module Maker.Model {
    /**
     * Moves all children (models and paths, recursively) within a model to their absolute position. Useful when referencing points between children.
     *
     * @param model The model to flatten.
     * @param origin Optional offset reference point.
     */
    function Flatten(model: IMakerModel, origin?: IMakerPoint): IMakerModel;
    /**
     * Create a clone of a model, mirrored on either or both x and y axes.
     *
     * @param model The model to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @returns Mirrored model.
     */
    function Mirror(model: IMakerModel, mirrorX: boolean, mirrorY: boolean): IMakerModel;
    /**
     * Move a model to an absolute position. Note that this is also accomplished by directly setting the origin property. This function exists because the origin property is optional.
     *
     * @param model The model to move.
     * @param origin The new position of the model.
     * @returns The original model (for chaining).
     */
    function Move(model: IMakerModel, origin: IMakerPoint): IMakerModel;
    /**
     * Rotate a model.
     *
     * @param model The model to rotate.
     * @param angleInDegrees The amount of rotation, in degrees.
     * @param rotationOrigin The center point of rotation.
     * @returns The original model (for chaining).
     */
    function Rotate(model: IMakerModel, angleInDegrees: number, rotationOrigin: IMakerPoint): IMakerModel;
    /**
     * Scale a model.
     *
     * @param model The model to scale.
     * @param scale The amount of scaling.
     * @param scaleOrigin Optional boolean to scale the origin point. Typically false for the root model.
     * @returns The original model (for chaining).
     */
    function Scale(model: IMakerModel, scale: number, scaleOrigin?: boolean): IMakerModel;
}
declare module Maker.Units {
    /**
     * Get a conversion ratio between a source unit and a destination unit. This will lazy load the table with initial conversions,
     * then new cross-conversions will be cached in the table.
     *
     * @param srcUnitType UnitType converting from.
     * @param destUnitType UnitType converting to.
     * @returns Numeric ratio of the conversion.
     */
    function ConversionScale(srcUnitType: string, destUnitType: string): number;
}
declare module Maker.Measure {
    /**
     * Total angle of an arc between its start and end angles.
     *
     * @param arc The arc to measure.
     * @returns Angle of arc.
     */
    function ArcAngle(arc: IMakerPathArc): number;
    /**
     * Calculates the distance between two points.
     *
     * @param a First point.
     * @param b Second point.
     * @returns Distance between points.
     */
    function PointDistance(a: IMakerPoint, b: IMakerPoint): number;
    /**
     * Calculates the smallest rectangle which contains a path.
     *
     * @param path The path to measure.
     * @returns object with low and high points.
     */
    function PathExtents(path: IMakerPath): IMakerMeasure;
    /**
     * Measures the length of a path.
     *
     * @param path The path to measure.
     * @returns Length of the path.
     */
    function PathLength(path: IMakerPath): number;
    /**
     * Measures the smallest rectangle which contains a model.
     *
     * @param model The model to measure.
     * @returns object with low and high points.
     */
    function ModelExtents(model: IMakerModel): IMakerMeasure;
}
declare module Maker.Exports {
    /**
     * Class to traverse an item 's models or paths and ultimately render each path.
     */
    class Exporter {
        map: IMakerPathOriginFunctionMap;
        fixPoint: (point: IMakerPoint) => IMakerPoint;
        fixPath: (path: IMakerPath, origin: IMakerPoint) => IMakerPath;
        /**
         * @param map Object containing properties: property name is the type of path, e.g. "line", "circle"; property value
         * is a function to render a path. Function parameters are path and point.
         * @param fixPoint Optional function to modify a point prior to export. Function parameter is a point; function must return a point.
         * @param fixPath Optional function to modify a path prior to output. Function parameters are path and offset point; function must return a path.
         */
        constructor(map: IMakerPathOriginFunctionMap, fixPoint?: (point: IMakerPoint) => IMakerPoint, fixPath?: (path: IMakerPath, origin: IMakerPoint) => IMakerPath);
        /**
         * Export a path.
         *
         * @param path The path to export.
         * @param offset The offset position of the path.
         */
        exportPath(path: IMakerPath, offset: IMakerPoint): void;
        /**
         * Export a model.
         *
         * @param model The model to export.
         * @param offset The offset position of the model.
         */
        exportModel(model: IMakerModel, offset: IMakerPoint): void;
        /**
         * Export an object.
         *
         * @param item The object to export. May be a path, an array of paths, a model, or an array of models.
         * @param offset The offset position of the object.
         */
        exportItem(item: any, origin: IMakerPoint): void;
    }
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
        static EscapeString(value: string): string;
        /**
         * @param name Name of the XML tag.
         * @param attrs Optional attributes for the tag.
         */
        constructor(name: string, attrs?: IXmlTagAttrs);
        /**
         * Output the tag as a string.
         */
        ToString(): string;
    }
}
declare module Maker.Exports {
    function DXF(model: IMakerModel, options?: IDXFRenderOptions): string;
    function DXF(paths: IMakerPath[], options?: IDXFRenderOptions): string;
    function DXF(path: IMakerPath, options?: IDXFRenderOptions): string;
    /**
     * DXF rendering options.
     */
    interface IDXFRenderOptions {
        /**
         * Unit system to embed in DXF file. See UnitType for possible values.
         */
        units: string;
    }
}
declare module Maker.Exports {
    function SVG(model: IMakerModel, options?: ISVGRenderOptions): string;
    function SVG(paths: IMakerPath[], options?: ISVGRenderOptions): string;
    function SVG(path: IMakerPath, options?: ISVGRenderOptions): string;
    /**
     * SVG rendering options.
     */
    interface ISVGRenderOptions {
        /**
         * SVG stroke width of paths.
         */
        strokeWidth: number;
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
        origin: IMakerPoint;
        /**
         * Use SVG <path> elements instead of <line>, <circle> etc.
         */
        useSvgPathOnly: boolean;
    }
}
declare module Maker.Models {
    class BoltCircle implements IMakerModel {
        paths: IMakerPath[];
        constructor(boltRadius: number, holeRadius: number, boltCount: number, firstBoltAngle?: number);
    }
}
declare module Maker.Models {
    class BoltRectangle implements IMakerModel {
        paths: IMakerPath[];
        constructor(width: number, height: number, holeRadius: number);
    }
}
declare module Maker.Models {
    class ConnectTheDots implements IMakerModel {
        isClosed: boolean;
        points: IMakerPoint[];
        paths: IMakerPath[];
        constructor(isClosed: boolean, points: IMakerPoint[]);
    }
}
declare module Maker.Models {
    class RoundRectangle implements IMakerModel {
        width: number;
        height: number;
        radius: number;
        paths: IMakerPath[];
        constructor(width: number, height: number, radius: number);
    }
}
declare module Maker.Models {
    class Oval extends RoundRectangle {
        width: number;
        height: number;
        constructor(width: number, height: number);
    }
}
declare module Maker.Models {
    class OvalArc implements IMakerModel {
        startAngle: number;
        endAngle: number;
        sweepRadius: number;
        slotRadius: number;
        paths: IMakerPath[];
        constructor(startAngle: number, endAngle: number, sweepRadius: number, slotRadius: number);
    }
}
declare module Maker.Models {
    class Rectangle extends ConnectTheDots {
        width: number;
        height: number;
        constructor(width: number, height: number);
    }
}
declare module Maker.Models {
    class SCurve implements IMakerModel {
        width: number;
        height: number;
        paths: IMakerPath[];
        constructor(width: number, height: number);
    }
}
declare module Maker.Models {
    class Square extends Rectangle {
        side: number;
        constructor(side: number);
    }
}
