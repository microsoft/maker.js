// Type definitions for CSG from OpenJsCad.js
// Project: https://github.com/joostn/OpenJsCad

declare class CxG {
    toStlString(): string;
}
declare class CSG extends CxG {
}
declare module CSG {
    interface IRadiusOptions {
        radius?: number;
        resolution?: number;
    }
    interface ICircleOptions extends IRadiusOptions {
        center?: number[];
    }
    interface IArcOptions extends ICircleOptions {
        startangle?: number;
        endangle?: number;
        maketangent?: boolean;
    }
    interface IEllpiticalArcOptions extends IRadiusOptions {
        clockwise?: boolean;
        large?: boolean;
        xaxisrotation?: number;
        xradius?: number;
        yradius?: number;
    }
    class Path2D extends CxG {
        closed: boolean;
        constructor(points: number[], closed?: boolean);
        static arc(options: IArcOptions): Path2D;
        appendPoint(point: number[]): Path2D;
        appendPoints(points: number[][]): Path2D;
        close(): Path2D;
        expandToCAG(pathradius: number, resolution: number): CAG;
        innerToCAG(): CAG;
        appendArc(endpoint: number[], options: IEllpiticalArcOptions): Path2D;
    }
}
declare class CAG extends CxG {
    static circle(options: CSG.ICircleOptions): CAG;
    union(cag: CAG[]): CAG;
    union(cag: CAG): CAG;
    subtract(cag: CAG[]): CAG;
    subtract(cag: CAG): CAG;
    extrude(options: CAG.CAG_extrude_options): CSG;
}
declare module CAG {
    interface CAG_extrude_options {
        offset?: number[];
        twistangle?: number;
        twiststeps?: number;
    }
}