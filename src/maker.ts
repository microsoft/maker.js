module Maker {

    //math

    export interface IMathMinMax {
        (...values: number[]): number;
    }

    //array

    export function IsArray(item: any): boolean {
        return item && ('length' in item);
    }

    export interface IMakerId {
        id?: string;
    }

    //points

    export interface IMakerPoint {
        x: number;
        y: number;
    }

    export function IsPoint(item: any) {
        return item && ('x' in item) && ('y' in item); //values might be zero so use "in"
    }

    export interface IMakerMeasure {
        low: IMakerPoint;
        high: IMakerPoint;
    }

    //paths

    export interface IMakerPath extends IMakerId {
        type: string;
        origin: IMakerPoint;
    }

    export function IsPath(item: any): boolean {
        return item && item.type && item.origin;
    }

    export interface IMakerPathLine extends IMakerPath {
        end: IMakerPoint;
    }

    export interface IMakerPathCircle extends IMakerPath {
        radius: number;
    }

    export interface IMakerPathArc extends IMakerPathCircle {
        startAngle: number;
        endAngle: number;
    }

    export interface IMakerPathFunctionMap {
        [type: string]: (path: IMakerPath) => void;
    }

    export interface IMakerPathOriginFunctionMap {
        [type: string]: (path: IMakerPath, origin: IMakerPoint) => void;
    }

    export var PathType = {
        Line: "line",
        Circle: "circle",
        Arc: "arc"
    };

    //models

    //DXF format documentation:
    //http://images.autodesk.com/adsk/files/acad_dxf0.pdf
    //Default drawing units for AutoCAD DesignCenter blocks:
    //0 = Unitless; 1 = Inches; 2 = Feet; 3 = Miles; 4 = Millimeters; 5 = Centimeters; 6 = Meters; 7 = Kilometers; 8 = Microinches;
    export enum DXFUnitType {
        Unitless = 0,
        Inches = 1,
        Millimeters = 4
    };

    export interface IMakerModel extends IMakerId {
        paths?: IMakerPath[];
        models?: IMakerModel[];
        origin?: IMakerPoint;
        unitType?: DXFUnitType;
    }

    export function IsModel(item: any): boolean {
        return item && (item.paths || item.models);
    }

}
