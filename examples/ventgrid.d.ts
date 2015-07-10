/// <reference path="../target/ts/makerjs.d.ts" />
declare var makerjs: typeof MakerJs;
declare class Ventgrid implements MakerJs.IModel {
    filterRadius: number;
    spacing: number;
    width: number;
    height: number;
    units: string;
    paths: MakerJs.IPathMap;
    constructor(filterRadius: number, spacing: number, width: number, height: number);
}
