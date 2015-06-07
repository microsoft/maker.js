declare module makerjs {
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
    function findById<T extends IMakerId>(arr: T[], id: string): IMakerFound<T>;
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
    function isPoint(item: any): boolean;
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
        * The type of the path, e.g. "line", "circle", or "arc". These strings are enumerated in pathType.
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
    function isPath(item: any): boolean;
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
        [type: string]: (pathValue: IMakerPath) => void;
    }
    /**
    * A map of functions which accept a path and an origin point as parameters.
    */
    interface IMakerPathOriginFunctionMap {
        /**
        * Key is the type of a path, value is a function which accepts a path object a point object as its parameters.
        */
        [type: string]: (pathValue: IMakerPath, origin: IMakerPoint) => void;
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
    function createArc(id: string, origin: IMakerPoint, radius: number, startAngle: number, endAngle: number): IMakerPathArc;
    function createArc(id: string, origin: number[], radius: number, startAngle: number, endAngle: number): IMakerPathArc;
    /**
    * Shortcut to create a new circle path.
    *
    * @param id The id of the new path.
    * @param origin The origin of the new path, either as a point object, or as an array of numbers.
    * @param radius The radius of the circle.
    * @returns A new POJO representing an circle path.
    */
    function createCircle(id: string, origin: IMakerPoint, radius: number): IMakerPathCircle;
    function createCircle(id: string, origin: number[], radius: number): IMakerPathCircle;
    /**
    * Shortcut to create a new line path.
    *
    * @param id The id of the new path.
    * @param origin The origin of the new path, either as a point object, or as an array of numbers.
    * @param end The end point of the line.
    * @returns A new POJO representing an line path.
    */
    function createLine(id: string, origin: IMakerPoint, end: IMakerPoint): IMakerPathLine;
    function createLine(id: string, origin: number[], end: IMakerPoint): IMakerPathLine;
    function createLine(id: string, origin: IMakerPoint, end: number[]): IMakerPathLine;
    function createLine(id: string, origin: number[], end: number[]): IMakerPathLine;
}
declare var module: any;
declare module makerjs.angle {
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
    function arcEndAnglePastZero(arc: IMakerPathArc): number;
    /**
    * Angle of a line through a point.
    *
    * @param pointToFindAngle The point to find the angle.
    * @param origin (Optional 0,0 implied) point of origin of the angle.
    * @returns Angle of the line throught the point.
    */
    function fromPointToRadians(pointToFindAngle: IMakerPoint, origin?: IMakerPoint): number;
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
declare module makerjs.point {
    /**
    * Add two points together and return the result as a new point object.
    *
    * @param a First point, either as a point object, or as an array of numbers.
    * @param b Second point, either as a point object, or as an array of numbers.
    * @param subtract Optional boolean to subtract instead of add.
    * @returns A new point object.
    */
    function add(a: IMakerPoint, b: IMakerPoint, subtract?: boolean): IMakerPoint;
    /**
    * Clone a point into a new point.
    *
    * @param pointToClone The point to clone.
    * @returns A new point with same values as the original.
    */
    function clone(pointToClone: IMakerPoint): IMakerPoint;
    /**
    * Ensures that an item has the properties of a point object.
    *
    * @param pointToEnsure The object to ensure; may be a point object, or an array of numbers, or something else which will attempt to coerce into a point.
    * @returns A new point object either with the x, y values corresponding to the input, or 0,0 coordinates.
    */
    function ensure(pointToEnsure: IMakerPoint): IMakerPoint;
    function ensure(pointToEnsure: number[]): IMakerPoint;
    function ensure(): IMakerPoint;
    /**
    * Get a point from its polar coordinates.
    *
    * @param angleInRadians The angle of the polar coordinate, in radians.
    * @param radius The radius of the polar coordinate.
    * @returns A new point object.
    */
    function fromPolar(angleInRadians: number, radius: number): IMakerPoint;
    /**
    * Get the two end points of an arc path.
    *
    * @param arc The arc path object.
    * @returns Array with 2 elements: [0] is the point object corresponding to the start angle, [1] is the point object corresponding to the end angle.
    */
    function fromArc(arc: IMakerPathArc): IMakerPoint[];
    /**
    * Create a clone of a point, mirrored on either or both x and y axes.
    *
    * @param pointToMirror The point to mirror.
    * @param mirrorX Boolean to mirror on the x axis.
    * @param mirrorY Boolean to mirror on the y axis.
    * @returns Mirrored point.
    */
    function mirror(pointToMirror: IMakerPoint, mirrorX: boolean, mirrorY: boolean): IMakerPoint;
    /**
    * Rotate a point.
    *
    * @param pointToRotate The point to rotate.
    * @param angleInDegrees The amount of rotation, in degrees.
    * @param rotationOrigin The center point of rotation.
    * @returns A new point.
    */
    function rotate(pointToRotate: IMakerPoint, angleInDegrees: number, rotationOrigin: IMakerPoint): IMakerPoint;
    /**
    * Scale a point's coordinates.
    *
    * @param pointToScale The point to scale.
    * @param scaleValue The amount of scaling.
    * @returns A new point.
    */
    function scale(pointToScale: IMakerPoint, scaleValue: number): IMakerPoint;
    /**
    * Subtract a point from another point, and return the result as a new point. Shortcut to Add(a, b, subtract = true).
    *
    * @param a First point, either as a point object, or as an array of numbers.
    * @param b Second point, either as a point object, or as an array of numbers.
    * @returns A new point object.
    */
    function subtract(a: IMakerPoint, b: IMakerPoint): IMakerPoint;
    function subtract(a: IMakerPoint, b: number[]): IMakerPoint;
    function subtract(a: number[], b: IMakerPoint): IMakerPoint;
    function subtract(a: number[], b: number[]): IMakerPoint;
    /**
    * A point at 0,0 coordinates.
    *
    * @returns A new point.
    */
    function zero(): IMakerPoint;
}
declare module makerjs.path {
    /**
    * Create a clone of a path, mirrored on either or both x and y axes.
    *
    * @param pathToMirror The path to mirror.
    * @param mirrorX Boolean to mirror on the x axis.
    * @param mirrorY Boolean to mirror on the y axis.
    * @param newId Optional id to assign to the new path.
    * @returns Mirrored path.
    */
    function mirror(pathToMirror: IMakerPath, mirrorX: boolean, mirrorY: boolean, newId?: string): IMakerPath;
    /**
    * Move a path's origin by a relative amount. Note: to move absolute, just set the origin property directly.
    *
    * @param pathToMove The path to move.
    * @param adjust The x & y adjustments, either as a point object, or as an array of numbers.
    * @returns The original path (for chaining).
    */
    function moveRelative(pathToMove: IMakerPath, adjust: IMakerPoint): IMakerPath;
    function moveRelative(pathToMove: IMakerPath, adjust: number[]): IMakerPath;
    /**
    * Rotate a path.
    *
    * @param pathToRotate The path to rotate.
    * @param angleInDegrees The amount of rotation, in degrees.
    * @param rotationOrigin The center point of rotation.
    * @returns The original path (for chaining).
    */
    function rotate(pathToRotate: IMakerPath, angleInDegrees: number, rotationOrigin: IMakerPoint): IMakerPath;
    /**
    * Scale a path.
    *
    * @param pathToScale The path to scale.
    * @param scaleValue The amount of scaling.
    * @returns The original path (for chaining).
    */
    function scale(pathToScale: IMakerPath, scaleValue: number): IMakerPath;
}
declare module makerjs.model {
    /**
    * Moves all children (models and paths, recursively) within a model to their absolute position. Useful when referencing points between children.
    *
    * @param modelToFlatten The model to flatten.
    * @param origin Optional offset reference point.
    */
    function flatten(modelToFlatten: IMakerModel, origin?: IMakerPoint): IMakerModel;
    /**
    * Create a clone of a model, mirrored on either or both x and y axes.
    *
    * @param modelToMirror The model to mirror.
    * @param mirrorX Boolean to mirror on the x axis.
    * @param mirrorY Boolean to mirror on the y axis.
    * @returns Mirrored model.
    */
    function mirror(modelToMirror: IMakerModel, mirrorX: boolean, mirrorY: boolean): IMakerModel;
    function move(modelToMove: IMakerModel, origin: IMakerPoint): IMakerModel;
    function move(modelToMove: IMakerModel, origin: number[]): IMakerModel;
    /**
    * Rotate a model.
    *
    * @param modelToRotate The model to rotate.
    * @param angleInDegrees The amount of rotation, in degrees.
    * @param rotationOrigin The center point of rotation.
    * @returns The original model (for chaining).
    */
    function rotate(modelToRotate: IMakerModel, angleInDegrees: number, rotationOrigin: IMakerPoint): IMakerModel;
    /**
    * Scale a model.
    *
    * @param modelToScale The model to scale.
    * @param scaleValue The amount of scaling.
    * @param scaleOrigin Optional boolean to scale the origin point. Typically false for the root model.
    * @returns The original model (for chaining).
    */
    function scale(modelToScale: IMakerModel, scaleValue: number, scaleOrigin?: boolean): IMakerModel;
}
declare module makerjs.units {
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
declare module makerjs.measure {
    /**
    * Total angle of an arc between its start and end angles.
    *
    * @param arc The arc to measure.
    * @returns Angle of arc.
    */
    function arcAngle(arc: IMakerPathArc): number;
    /**
    * Calculates the distance between two points.
    *
    * @param a First point.
    * @param b Second point.
    * @returns Distance between points.
    */
    function pointDistance(a: IMakerPoint, b: IMakerPoint): number;
    /**
    * Calculates the smallest rectangle which contains a path.
    *
    * @param pathToMeasure The path to measure.
    * @returns object with low and high points.
    */
    function pathExtents(pathToMeasure: IMakerPath): IMakerMeasure;
    /**
    * Measures the length of a path.
    *
    * @param pathToMeasure The path to measure.
    * @returns Length of the path.
    */
    function pathLength(pathToMeasure: IMakerPath): number;
    /**
    * Measures the smallest rectangle which contains a model.
    *
    * @param modelToMeasure The model to measure.
    * @returns object with low and high points.
    */
    function modelExtents(modelToMeasure: IMakerModel): IMakerMeasure;
}
declare module makerjs.exporter {
    interface IMakerExportOptions {
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
        public map: IMakerPathOriginFunctionMap;
        public fixPoint: (pointToFix: IMakerPoint) => IMakerPoint;
        public fixPath: (pathToFix: IMakerPath, origin: IMakerPoint) => IMakerPath;
        /**
        * @param map Object containing properties: property name is the type of path, e.g. "line", "circle"; property value
        * is a function to render a path. Function parameters are path and point.
        * @param fixPoint Optional function to modify a point prior to export. Function parameter is a point; function must return a point.
        * @param fixPath Optional function to modify a path prior to output. Function parameters are path and offset point; function must return a path.
        */
        constructor(map: IMakerPathOriginFunctionMap, fixPoint?: (pointToFix: IMakerPoint) => IMakerPoint, fixPath?: (pathToFix: IMakerPath, origin: IMakerPoint) => IMakerPath);
        /**
        * Export a path.
        *
        * @param pathToExport The path to export.
        * @param offset The offset position of the path.
        */
        public exportPath(pathToExport: IMakerPath, offset: IMakerPoint): void;
        /**
        * Export a model.
        *
        * @param modelToExport The model to export.
        * @param offset The offset position of the model.
        */
        public exportModel(modelToExport: IMakerModel, offset: IMakerPoint): void;
        /**
        * Export an object.
        *
        * @param item The object to export. May be a path, an array of paths, a model, or an array of models.
        * @param offset The offset position of the object.
        */
        public exportItem(itemToExport: any, origin: IMakerPoint): void;
    }
}
declare module makerjs.exporter {
    function toDXF(modelToExport: IMakerModel, options?: IDXFRenderOptions): string;
    function toDXF(pathsToExport: IMakerPath[], options?: IDXFRenderOptions): string;
    function toDXF(pathToExport: IMakerPath, options?: IDXFRenderOptions): string;
    /**
    * DXF rendering options.
    */
    interface IDXFRenderOptions extends IMakerExportOptions {
    }
}
declare module makerjs.exporter {
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
        public name: string;
        public attrs: IXmlTagAttrs;
        /**
        * Text between the opening and closing tags.
        */
        public innerText: string;
        /**
        * Boolean to indicate that the innerText has been escaped.
        */
        public innerTextEscaped: boolean;
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
        * Output the tag as a string.
        */
        public toString(): string;
    }
}
declare module makerjs.exporter {
    /**
    * The default stroke width in millimeters.
    */
    var defaultStrokeWidth: number;
    function toSVG(modelToExport: IMakerModel, options?: ISVGRenderOptions): string;
    function toSVG(pathsToExport: IMakerPath[], options?: ISVGRenderOptions): string;
    function toSVG(pathToExport: IMakerPath, options?: ISVGRenderOptions): string;
    /**
    * SVG rendering options.
    */
    interface ISVGRenderOptions extends IMakerExportOptions {
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
        origin: IMakerPoint;
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
declare module makerjs.models {
    class BoltCircle implements IMakerModel {
        public paths: IMakerPath[];
        constructor(boltRadius: number, holeRadius: number, boltCount: number, firstBoltAngle?: number);
    }
}
declare module makerjs.models {
    class BoltRectangle implements IMakerModel {
        public paths: IMakerPath[];
        constructor(width: number, height: number, holeRadius: number);
    }
}
declare module makerjs.models {
    class ConnectTheDots implements IMakerModel {
        public isClosed: boolean;
        public points: IMakerPoint[];
        public paths: IMakerPath[];
        constructor(isClosed: boolean, points: IMakerPoint[]);
    }
}
declare module makerjs.models {
    class RoundRectangle implements IMakerModel {
        public width: number;
        public height: number;
        public radius: number;
        public paths: IMakerPath[];
        constructor(width: number, height: number, radius: number);
    }
}
declare module makerjs.models {
    class Oval extends RoundRectangle {
        public width: number;
        public height: number;
        constructor(width: number, height: number);
    }
}
declare module makerjs.models {
    class OvalArc implements IMakerModel {
        public startAngle: number;
        public endAngle: number;
        public sweepRadius: number;
        public slotRadius: number;
        public paths: IMakerPath[];
        constructor(startAngle: number, endAngle: number, sweepRadius: number, slotRadius: number);
    }
}
declare module makerjs.models {
    class Rectangle extends ConnectTheDots {
        public width: number;
        public height: number;
        constructor(width: number, height: number);
    }
}
declare module makerjs.models {
    class SCurve implements IMakerModel {
        public width: number;
        public height: number;
        public paths: IMakerPath[];
        constructor(width: number, height: number);
    }
}
declare module makerjs.models {
    class Square extends Rectangle {
        public side: number;
        constructor(side: number);
    }
}
