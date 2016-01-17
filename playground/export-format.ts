/// <reference path="../src/core/maker.ts" />
/// <reference path="../src/core/angle.ts" />
/// <reference path="../src/core/path.ts" />
/// <reference path="../src/core/intersect.ts" />
/// <reference path="../src/core/loops.ts" />
/// <reference path="../src/core/break.ts" />
/// <reference path="../src/core/dxf.ts" />
/// <reference path="../src/core/svg.ts" />
/// <reference path="../src/core/openjscad.ts" />

module MakerJsPlaygroundExport {

    export enum ExportFormat {
        Json,
        Dxf,
        Svg,
        OpenJsCad,
        Stl
    };

    export interface IExportRequest {
        format: ExportFormat;
        formatTitle: string;
        model: MakerJs.IModel;
    }

    interface IFileExport {
        mediaType: string;
        fileExtension: string
    }

    export interface IExportResponse {
        request: IExportRequest;
        text: string;
        percentComplete: number;
    }

    interface IFormatToFileExportMap {
        [format: number]: IFileExport;
    }

    export var formatMap: IFormatToFileExportMap = {};

    formatMap[ExportFormat.Json] = {
        mediaType: 'application/json',
        fileExtension: 'json'
    };

    formatMap[ExportFormat.Dxf] = {
        mediaType: 'application/dxf',
        fileExtension: 'dxf'
    };

    formatMap[ExportFormat.Svg] = {
        mediaType: 'image/svg+xml',
        fileExtension: 'svg'
    };

    formatMap[ExportFormat.OpenJsCad] = {
        mediaType: 'text/plain',
        fileExtension: 'txt'
    };

    formatMap[ExportFormat.Stl] = {
        mediaType: 'application/stl',
        fileExtension: 'stl'
    };

}