namespace MakerJs.exporter {

    /**
     * @private
     */
    export interface IExportOptions {

        /**
         * Optional exemplar of number of decimal places.
         */
        accuracy?: number;

        /**
         * Optional unit system to embed in exported file, if the export format allows alternate unit systems.
         */
        units?: string;
    }

    /**
     * Options for JSON export.
     */
    export interface IJsonExportOptions extends IExportOptions {

        /**
         * Optional number of characters to indent after a newline.
         */
        indentation?: number;
    }

    /**
     * Renders an item in JSON.
     * 
     * @param itemToExport Item to render: may be a path, an array of paths, or a model object.
     * @param options Rendering options object.
     * @param options.accuracy Optional exemplar of number of decimal places.
     * @param options.indentation Optional number of characters to indent after a newline.
     * @returns String of DXF content.
     */
    export function toJson(itemToExport: any, options: MakerJs.exporter.IJsonExportOptions = {}) {
        function replacer(key: string, value: any) {
            if (isNumber(value)) {
                const newValue = round(value, options.accuracy);
                return newValue
            }
            if (isPoint(value)) {
                const newPoint = point.rounded(value, options.accuracy);
                return newPoint;
            }
            return value;
        }
        return JSON.stringify(itemToExport, options.accuracy && replacer, options.indentation);
    }

    /**
     * Try to get the unit system from a model
     * @private
     */
    export function tryGetModelUnits(itemToExport: any) {
        if (isModel(itemToExport)) {
            return (<IModel>itemToExport).units;
        }
    }

    /**
     * Named colors, safe for CSS and DXF
     * 17 colors from https://www.w3.org/TR/CSS21/syndata.html#value-def-color mapped to DXF equivalent AutoDesk Color Index
     */
    export var colors = {
        black: 0,
        red: 1,
        yellow: 2,
        lime: 3,
        aqua: 4,
        blue: 5,
        fuchsia: 6,
        white: 7,
        gray: 9,
        maroon: 14,
        orange: 30,
        olive: 58,
        green: 94,
        teal: 134,
        navy: 174,
        purple: 214,
        silver: 254
    }

    export interface IStatusCallback {
        (status: { progress?: number }): void;
    }
}
