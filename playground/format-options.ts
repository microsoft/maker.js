namespace MakerJsPlayground.FormatOptions {

    class BaseOptions {
        constructor(public format: MakerJsPlaygroundExport.ExportFormat, public formatTitle: string, public div: HTMLDivElement, public units: string) {
        }

        $(selector: string) {
            return this.div.querySelector(selector);
        }

        $selectValue(selector: string) {
            const select = this.$(selector) as HTMLSelectElement;
            return select.value;
        }

        addAccuracy(selector: string, options: MakerJs.exporter.IExportOptions) {
            const accuracy = +this.$selectValue(selector);
            if (accuracy >= 0) {
                options.accuracy = accuracy;
            }
        }

        getOptionObject(): MakerJs.exporter.IExportOptions {
            throw 'not implemented';
        }
    }

    class DxfOptions extends BaseOptions {
        getOptionObject() {
            const options: MakerJs.exporter.IDXFRenderOptions = {};
            this.addAccuracy('#dxf-accuracy', options);
            return options;
        }
    }

    class SvgOptions extends BaseOptions {
        getOptionObject() {
            const options: MakerJs.exporter.ISVGRenderOptions = {};
            this.addAccuracy('#svg-accuracy', options);
            return options;
        }
    }

    class JsonOptions extends BaseOptions {
        getOptionObject() {
            const options: MakerJs.exporter.IJsonExportOptions = {
                indentation: +this.$selectValue('#json-indent')
            };
            this.addAccuracy('#json-accuracy', options);
            return options;
        }
    }

    class OpenJsCadOptions extends BaseOptions {
        getOptionObject() {
            const options: MakerJs.exporter.IOpenJsCadOptions = {
                facetSize: +this.$selectValue('#openjscad-facetsize')
            };
            return options;
        }
    }

    class StlOptions extends BaseOptions {
        getOptionObject() {
            const options: MakerJs.exporter.IOpenJsCadOptions = {
                facetSize: +this.$selectValue('#stl-facetsize')
            };
            return options;
        }
    }

    class PdfOptions extends BaseOptions {
        getOptionObject() {
            const options: MakerJs.exporter.IPDFRenderOptions = {
                origin: [
                    +this.$selectValue('#pdf-leftmargin') * 72,
                    +this.$selectValue('#pdf-topmargin') * 72
                ]
            };
            return options;
        }
    }

    let registry: { [format: number]: typeof BaseOptions } = {};
    registry[MakerJsPlaygroundExport.ExportFormat.Dxf] = DxfOptions;
    registry[MakerJsPlaygroundExport.ExportFormat.Json] = JsonOptions;
    registry[MakerJsPlaygroundExport.ExportFormat.OpenJsCad] = OpenJsCadOptions;
    registry[MakerJsPlaygroundExport.ExportFormat.Pdf] = PdfOptions;
    registry[MakerJsPlaygroundExport.ExportFormat.Stl] = StlOptions;
    registry[MakerJsPlaygroundExport.ExportFormat.Svg] = SvgOptions;

    export var current: BaseOptions;

    export function activateOption(format: MakerJsPlaygroundExport.ExportFormat, formatTitle: string, units: string) {
        const formatId = MakerJsPlaygroundExport.ExportFormat[format];

        //deselect all
        const all = document.querySelectorAll(`.download-option`);
        for (let i = 0; i < all.length; i++) all[i].classList.remove('selected');

        //select current
        const div = document.querySelector(`.download-option[data-format="${formatId}"]`) as HTMLDivElement;
        div.classList.add('selected');

        let formatClass = registry[format];
        current = new formatClass(format, formatTitle, div, units);
    }

}