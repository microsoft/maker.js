/// <reference path="../target/makerjs.d.ts" />
declare var makerjs: typeof MakerJs;
declare class Ventgrid implements MakerJs.IModel {
    filterRadius: number;
    spacing: number;
    width: number;
    height: number;
    units: string;
    paths: MakerJs.IPath[];
    constructor(filterRadius: number, spacing: number, width: number, height: number);
}
