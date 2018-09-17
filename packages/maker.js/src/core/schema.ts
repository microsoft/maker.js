/**
 * Schema objects for Maker.js.
 * 
 */
namespace MakerJs {

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
    export interface IPathArcInBezierCurve extends IPath {

        bezierData: IBezierRange;
    }

    //captions

    /**
     * Text annotation, diplayable natively to the output format.
     */
    export interface ICaption {

        /**
         * Caption text.
         */
        text: string;

        /**
         * Invisible line to which the text is aligned. 
         * The text will be horizontally and vertically centered on the center point of this line.
         * The text may be longer or shorter than the line, it is used only for position and angle. 
         * The anchor line's endpoints may be omitted, in which the case the text will always remain non-angled, even if the model is rotated.
         */
        anchor: IPathLine;
    }

    //models

    /**
     * Path objects by id.
     */
    export interface IPathMap {
        [id: string]: IPath | IPathArc | IPathCircle | IPathLine;
    }

    /**
     * Model objects by id.
     */
    export interface IModelMap {
        [id: string]: IModel;
    }

    /**
     * A model is a composite object which may contain a map of paths, or a map of models recursively.
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
         * Optional map of path objects in this model.
         */
        paths?: IPathMap;

        /**
         * Optional map of models within this model.
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
         * Optional Caption object.
         */
        caption?: ICaption;

        /**
         * Optional exporter options for this model.
         */
        exporterOptions?: { [exporterName: string]: any };
    }

}
