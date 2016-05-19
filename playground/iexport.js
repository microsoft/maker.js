var MakerJsPlaygroundExport;
(function (MakerJsPlaygroundExport) {
    (function (ExportFormat) {
        ExportFormat[ExportFormat["Json"] = 0] = "Json";
        ExportFormat[ExportFormat["Dxf"] = 1] = "Dxf";
        ExportFormat[ExportFormat["Svg"] = 2] = "Svg";
        ExportFormat[ExportFormat["OpenJsCad"] = 3] = "OpenJsCad";
        ExportFormat[ExportFormat["Stl"] = 4] = "Stl";
        ExportFormat[ExportFormat["Pdf"] = 5] = "Pdf";
    })(MakerJsPlaygroundExport.ExportFormat || (MakerJsPlaygroundExport.ExportFormat = {}));
    var ExportFormat = MakerJsPlaygroundExport.ExportFormat;
    ;
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