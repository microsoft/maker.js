namespace MakerJsPlayground.FormatOptions {

    class BaseOptions {
        constructor(public format: MakerJsPlaygroundExport.ExportFormat, public formatTitle: string, public div: HTMLDivElement, public model: MakerJs.IModel) {
        }

        $(selector: string) {
            return this.div.querySelector(selector);
        }

        $number(selector: string) {
            const select = this.$(selector) as HTMLInputElement;
            if (makerjs.isNumber(select.valueAsNumber)) {
                return select.valueAsNumber;
            }
            return parseInt(select.value);
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

        validate() {
            return true;
        }
    }

    class DxfOptions extends BaseOptions {
        constructor(format: MakerJsPlaygroundExport.ExportFormat, formatTitle: string, div: HTMLDivElement, model: MakerJs.IModel) {
            super(format, formatTitle, div, model);

            // TODO:
            // inspect model to see if it contains units
            // show unit picker if it does not
        }

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

    class SvgPathDataOptions extends BaseOptions {
        getOptionObject() {
            const options: MakerJs.exporter.IExportOptions = {};
            this.addAccuracy('#svgpathdata-accuracy', options);
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

    class JscadScriptOptions extends BaseOptions {
        getOptionObject() {
            const extrude = this.$number('#openjscad-extrusion');
            if (extrude <= 0) {
                //show the UI
                return null;
            } else {
                //hide the ui
            }
            const options: MakerJs.exporter.IJscadScriptOptions = {
                extrude,
                functionName: this.$selectValue('#openjscad-name'),
                indent: this.$number('#openjscad-indent'),
                maxArcFacet: +this.$selectValue('#openjscad-facetsize')
            };
            this.addAccuracy('#openjscad-accuracy', options);
            return options;
        }
    }

    class StlOptions extends BaseOptions {
        constructor(format: MakerJsPlaygroundExport.ExportFormat, formatTitle: string, div: HTMLDivElement, model: MakerJs.IModel) {
            super(format, formatTitle, div, model);

            //modelToExport.exporterOptions['toJscadCSG'])
            // TODO:
            // inspect model to see if it contains exporterOptions.layerOptions
            // then disable extrude
        }

        getOptionObject() {
            const options: MakerJs.exporter.IJscadCsgOptions = {
                maxArcFacet: +this.$selectValue('#stl-facetsize'),
                extrude: this.$number('#stl-extrude')
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

    let classes: { [format: number]: typeof BaseOptions } = {};
    classes[MakerJsPlaygroundExport.ExportFormat.Dxf] = DxfOptions;
    classes[MakerJsPlaygroundExport.ExportFormat.Json] = JsonOptions;
    classes[MakerJsPlaygroundExport.ExportFormat.OpenJsCad] = JscadScriptOptions;
    classes[MakerJsPlaygroundExport.ExportFormat.Pdf] = PdfOptions;
    classes[MakerJsPlaygroundExport.ExportFormat.Stl] = StlOptions;
    classes[MakerJsPlaygroundExport.ExportFormat.Svg] = SvgOptions;
    classes[MakerJsPlaygroundExport.ExportFormat.SvgPathData] = SvgPathDataOptions;

    export var current: BaseOptions;

    export function activateOption(format: MakerJsPlaygroundExport.ExportFormat, formatTitle: string, model: MakerJs.IModel) {
        const formatId = MakerJsPlaygroundExport.ExportFormat[format];

        //deselect all
        const all = document.querySelectorAll(`.download-option`);
        for (let i = 0; i < all.length; i++) all[i].classList.remove('selected');

        //select current
        const div = document.querySelector(`.download-option[data-format="${formatId}"]`) as HTMLDivElement;
        div.classList.add('selected');

        let formatClass = classes[format];
        current = new formatClass(format, formatTitle, div, model);
    }

}