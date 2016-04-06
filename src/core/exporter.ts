namespace MakerJs.exporter {

    /**
     * @private
     */
    export interface IExportOptions {
        /**
         * Unit system to embed in exported file.
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
     * Class to traverse an item 's models or paths and ultimately render each path.
     * @private
     */
    export class Exporter {

    /**
     * @param map Object containing properties: property name is the type of path, e.g. "line", "circle"; property value 
     * is a function to render a path. Function parameters are path and point.
     * @param fixPoint Optional function to modify a point prior to export. Function parameter is a point; function must return a point.
     * @param fixPath Optional function to modify a path prior to output. Function parameters are path and offset point; function must return a path.
     */
        constructor(
            private map: IPathOriginFunctionMap,
            private fixPoint?: (pointToFix: IPoint) => IPoint,
            private fixPath?: (pathToFix: IPath, origin: IPoint) => IPath,
            private beginModel?: (id: string, modelContext: IModel) => void,
            private endModel?: (modelContext: IModel) => void
            ) {
        }

        /**
         * Export a path.
         * 
         * @param pathToExport The path to export.
         * @param offset The offset position of the path. 
         */
        public exportPath(id: string, pathToExport: IPath, offset: IPoint, layer: string) {
            if (pathToExport) {
                var fn = this.map[pathToExport.type];
                if (fn) {
                    fn(id, this.fixPath ? this.fixPath(pathToExport, offset) : pathToExport, offset, layer);
                }
            }
        }

        /**
         * Export a model.
         * 
         * @param modelToExport The model to export.
         * @param offset The offset position of the model.
         */
        public exportModel(modelId: string, modelToExport: IModel, offset: IPoint) {

            if (this.beginModel) {
                this.beginModel(modelId, modelToExport);
            }

            var newOffset = point.add((this.fixPoint ? this.fixPoint(modelToExport.origin) : modelToExport.origin), offset);

            if (modelToExport.paths) {
                for (var id in modelToExport.paths) {
                    var currPath = modelToExport.paths[id];
                    if (!currPath) continue;
                    this.exportPath(id, currPath, newOffset, currPath.layer || modelToExport.layer);
                }
            }

            if (modelToExport.models) {
                for (var id in modelToExport.models) {
                    var currModel = modelToExport.models[id];
                    if (!currModel) continue;
                    this.exportModel(id, currModel, newOffset);
                }
            }

            if (this.endModel) {
                this.endModel(modelToExport);
            }

        }

        /**
         * Export an object.
         * 
         * @param item The object to export. May be a path, an array of paths, a model, or an array of models.
         * @param offset The offset position of the object.
         */
        public exportItem(itemId: string, itemToExport: any, origin: IPoint) {

            if (isModel(itemToExport)) {
                this.exportModel(itemId, <IModel>itemToExport, origin);

            } else if (isPath(itemToExport)) {
                this.exportPath(itemId, <IPath>itemToExport, origin, null);

            } else {
                for (var id in itemToExport) {
                    this.exportItem(id, itemToExport[id], origin);
                }

            }
        }

    }
}
