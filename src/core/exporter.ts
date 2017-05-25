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
         * Optional unit system to embed in exported file.
         */
        units?: string;
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
        fuschia: 6,
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

}
