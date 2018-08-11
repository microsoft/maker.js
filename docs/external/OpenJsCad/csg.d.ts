//minimial OpenJscad - CSG declaration

declare class CxG {
    toStlString(): string;
}

declare class CSG extends CxG {
    polygons: CSG.Polygon[];
}

declare namespace CSG {
    interface IRadiusOptions {
        radius?: number;
        resolution?: number;
    }
    interface ICircleOptions extends IRadiusOptions {
        center?: Vector2D | number[];
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
    class Vector2D extends CxG {
    }
    class Path2D extends CxG {
        static arc(options: IArcOptions): Path2D;
        appendPoint(point: Vector2D): Path2D;
        appendPoints(points: Vector2D[]): Path2D;
        close(): Path2D;
        innerToCAG(): CAG;
        appendArc(endpoint: Vector2D, options: IEllpiticalArcOptions): Path2D;
    }
    class Polygon extends CxG {
        toStlString(): string;
    }
}
declare class CAG extends CxG {
    static fromPoints(points: CSG.Vector2D[]): CAG;
    static circle(options: CSG.ICircleOptions): CAG;
    union(cag: CAG[]): CAG;
    union(cag: CAG): CAG;
    subtract(cag: CAG[]): CAG;
    subtract(cag: CAG): CAG;
    extrude(options: CAG_extrude_options): CSG;
}
declare interface CAG_extrude_options {
    offset?: number[];
}
