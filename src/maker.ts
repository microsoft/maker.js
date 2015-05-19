module Maker {

    //math

    export interface IMathMinMax {
        (...values: number[]): number;
    }

    //units

    export var UnitType = {
        Centimeter: 'cm',
        Foot: 'foot',
        Inch: 'inch',
        Meter: 'm',
        Millimeter: 'mm'
    };

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

    export interface IMakerModel extends IMakerId {
        type?: string;
        paths?: IMakerPath[];
        models?: IMakerModel[];
        origin?: IMakerPoint;
        units?: string;
    }

    export function IsModel(item: any): boolean {
        return item && (item.paths || item.models);
    }

}

//CommonJs
var module: any = <any>module || {};
module.exports = Maker;
