var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var MakerJsPlayground;
(function (MakerJsPlayground) {
    var FormatOptions;
    (function (FormatOptions) {
        var BaseOptions = (function () {
            function BaseOptions(format, formatTitle, div, units) {
                this.format = format;
                this.formatTitle = formatTitle;
                this.div = div;
                this.units = units;
            }
            BaseOptions.prototype.$ = function (selector) {
                return this.div.querySelector(selector);
            };
            BaseOptions.prototype.$selectValue = function (selector) {
                var select = this.$(selector);
                return select.value;
            };
            BaseOptions.prototype.addAccuracy = function (selector, options) {
                var accuracy = +this.$selectValue(selector);
                if (accuracy >= 0) {
                    options.accuracy = accuracy;
                }
            };
            BaseOptions.prototype.getOptionObject = function () {
                throw 'not implemented';
            };
            return BaseOptions;
        }());
        var DxfOptions = (function (_super) {
            __extends(DxfOptions, _super);
            function DxfOptions() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            DxfOptions.prototype.getOptionObject = function () {
                var options = {};
                this.addAccuracy('#dxf-accuracy', options);
                return options;
            };
            return DxfOptions;
        }(BaseOptions));
        var SvgOptions = (function (_super) {
            __extends(SvgOptions, _super);
            function SvgOptions() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            SvgOptions.prototype.getOptionObject = function () {
                var options = {};
                this.addAccuracy('#svg-accuracy', options);
                return options;
            };
            return SvgOptions;
        }(BaseOptions));
        var JsonOptions = (function (_super) {
            __extends(JsonOptions, _super);
            function JsonOptions() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            JsonOptions.prototype.getOptionObject = function () {
                var options = {
                    indentation: +this.$selectValue('#json-indent')
                };
                this.addAccuracy('#json-accuracy', options);
                return options;
            };
            return JsonOptions;
        }(BaseOptions));
        var OpenJsCadOptions = (function (_super) {
            __extends(OpenJsCadOptions, _super);
            function OpenJsCadOptions() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            OpenJsCadOptions.prototype.getOptionObject = function () {
                var options = {
                    facetSize: +this.$selectValue('#openjscad-facetsize')
                };
                return options;
            };
            return OpenJsCadOptions;
        }(BaseOptions));
        var StlOptions = (function (_super) {
            __extends(StlOptions, _super);
            function StlOptions() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            StlOptions.prototype.getOptionObject = function () {
                var options = {
                    facetSize: +this.$selectValue('#stl-facetsize')
                };
                return options;
            };
            return StlOptions;
        }(BaseOptions));
        var PdfOptions = (function (_super) {
            __extends(PdfOptions, _super);
            function PdfOptions() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            PdfOptions.prototype.getOptionObject = function () {
                var options = {
                    origin: [
                        +this.$selectValue('#pdf-leftmargin') * 72,
                        +this.$selectValue('#pdf-topmargin') * 72
                    ]
                };
                return options;
            };
            return PdfOptions;
        }(BaseOptions));
        var registry = {};
        registry[MakerJsPlaygroundExport.ExportFormat.Dxf] = DxfOptions;
        registry[MakerJsPlaygroundExport.ExportFormat.Json] = JsonOptions;
        registry[MakerJsPlaygroundExport.ExportFormat.OpenJsCad] = OpenJsCadOptions;
        registry[MakerJsPlaygroundExport.ExportFormat.Pdf] = PdfOptions;
        registry[MakerJsPlaygroundExport.ExportFormat.Stl] = StlOptions;
        registry[MakerJsPlaygroundExport.ExportFormat.Svg] = SvgOptions;
        function activateOption(format, formatTitle, units) {
            var formatId = MakerJsPlaygroundExport.ExportFormat[format];
            //deselect all
            var all = document.querySelectorAll(".download-option");
            for (var i = 0; i < all.length; i++)
                all[i].classList.remove('selected');
            //select current
            var div = document.querySelector(".download-option[data-format=\"" + formatId + "\"]");
            div.classList.add('selected');
            var formatClass = registry[format];
            FormatOptions.current = new formatClass(format, formatTitle, div, units);
        }
        FormatOptions.activateOption = activateOption;
    })(FormatOptions = MakerJsPlayground.FormatOptions || (MakerJsPlayground.FormatOptions = {}));
})(MakerJsPlayground || (MakerJsPlayground = {}));
//# sourceMappingURL=format-options.js.map