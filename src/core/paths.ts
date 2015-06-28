/// <reference path="path.ts" />

module MakerJs.paths {
    
    //shortcuts

    /**
     * Class for arc path.
     * 
     * @param id The id of the new path.
     * @param origin The center point of the arc.
     * @param radius The radius of the arc.
     * @param startAngle The start angle of the arc.
     * @param endAngle The end angle of the arc.
     */
    export class Arc implements IPathArc {
        public type: string;

        constructor(public id: string, public origin: IPoint, public radius: number, public startAngle: number, public endAngle: number) {
            this.type = pathType.Arc;
        }
    }

    /**
     * Class for circle path.
     * 
     * @param id The id of the new path.
     * @param origin The center point of the circle.
     * @param radius The radius of the circle.
     */
    export class Circle implements IPathCircle {
        public type: string;

        constructor(public id: string, public origin: IPoint, public radius: number) {
            this.type = pathType.Circle;
        }
    }

    /**
     * Class for line path.
     * 
     * @param id The id of the new path.
     * @param origin The origin point of the line.
     * @param end The end point of the line.
     */
    export class Line implements IPathLine {
        public type: string;

        constructor(public id: string, public origin: IPoint, public end: IPoint) {
            this.type = pathType.Line;
        }
    }
}
