namespace MakerJsPlaygroundExport {

    export enum ExportFormat {
        Json,
        Dxf,
        Svg,
        SvgPathData,
        OpenJsCad,
        Stl,
        Pdf
    }

    interface IExportMessage {
        format: ExportFormat;
        formatTitle: string;
    }

    export interface IExportRequest extends IExportMessage {
        model: MakerJs.IModel;
        options: MakerJs.exporter.IExportOptions;
    }

    interface IFileExport {
        mediaType: string;
        fileExtension: string
    }

    export interface IExportResponse extends IExportMessage {
        error: string;
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

    formatMap[ExportFormat.SvgPathData] = {
        mediaType: 'text/plain',
        fileExtension: 'txt'
    };

    formatMap[ExportFormat.OpenJsCad] = {
        mediaType: 'text/plain',
        fileExtension: 'txt'
    };

    formatMap[ExportFormat.Stl] = {
        mediaType: 'application/stl',
        fileExtension: 'stl'
    };

    formatMap[ExportFormat.Pdf] = {
        mediaType: 'application/pdf',
        fileExtension: 'pdf'
    };

}

interface IFont {
    displayName: string;
    path: string;
    tags: string[];
}

declare var fonts: { [id: string]: IFont };
