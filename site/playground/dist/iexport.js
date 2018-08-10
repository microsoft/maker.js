var MakerJsPlaygroundExport;
(function (MakerJsPlaygroundExport) {
    var ExportFormat;
    (function (ExportFormat) {
        ExportFormat[ExportFormat["Json"] = 0] = "Json";
        ExportFormat[ExportFormat["Dxf"] = 1] = "Dxf";
        ExportFormat[ExportFormat["Svg"] = 2] = "Svg";
        ExportFormat[ExportFormat["SvgPathData"] = 3] = "SvgPathData";
        ExportFormat[ExportFormat["OpenJsCad"] = 4] = "OpenJsCad";
        ExportFormat[ExportFormat["Stl"] = 5] = "Stl";
        ExportFormat[ExportFormat["Pdf"] = 6] = "Pdf";
    })(ExportFormat = MakerJsPlaygroundExport.ExportFormat || (MakerJsPlaygroundExport.ExportFormat = {}));
    MakerJsPlaygroundExport.formatMap = {};
    MakerJsPlaygroundExport.formatMap[ExportFormat.Json] = {
        mediaType: 'application/json',
        fileExtension: 'json'
    };
    MakerJsPlaygroundExport.formatMap[ExportFormat.Dxf] = {
        mediaType: 'application/dxf',
        fileExtension: 'dxf'
    };
    MakerJsPlaygroundExport.formatMap[ExportFormat.Svg] = {
        mediaType: 'image/svg+xml',
        fileExtension: 'svg'
    };
    MakerJsPlaygroundExport.formatMap[ExportFormat.SvgPathData] = {
        mediaType: 'text/plain',
        fileExtension: 'txt'
    };
    MakerJsPlaygroundExport.formatMap[ExportFormat.OpenJsCad] = {
        mediaType: 'text/plain',
        fileExtension: 'txt'
    };
    MakerJsPlaygroundExport.formatMap[ExportFormat.Stl] = {
        mediaType: 'application/stl',
        fileExtension: 'stl'
    };
    MakerJsPlaygroundExport.formatMap[ExportFormat.Pdf] = {
        mediaType: 'application/pdf',
        fileExtension: 'pdf'
    };
})(MakerJsPlaygroundExport || (MakerJsPlaygroundExport = {}));
//# sourceMappingURL=iexport.js.map