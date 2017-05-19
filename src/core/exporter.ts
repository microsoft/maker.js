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
}
