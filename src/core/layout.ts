namespace MakerJs.layout {

    /**
     * @private
     */
    function cloneTo(dimension: number, itemToClone: IModel | IPath, count: number, margin: number): IModel {
        var result: IModel = {};
        var add: IPathMap | IModelMap;
        var measureFn: (x: IModel | IPath) => IMeasure;
        var moveFn: (x: IModel | IPath, origin: IPoint) => IModel | IPath;

        if (isModel(itemToClone)) {
            measureFn = measure.modelExtents;
            add = result.models = {};
            moveFn = model.move;
        } else {
            measureFn = measure.pathExtents;
            add = result.paths = {};
            moveFn = path.move;
        }

        var m = measureFn(itemToClone);
        var size = m.high[dimension] - m.low[dimension];

        for (var i = 0; i < count; i++) {
            var origin: IPoint = [0, 0];
            origin[dimension] = i * (size + margin);
            add[i] = moveFn(cloneObject(itemToClone), origin);
        }

        return result;
    }

    /**
     * Layout clones in a column format.
     * 
     * @param itemToClone: Either a model or a path object.
     * @param count Number of clones in the column.
     * @param margin Optional distance between each clone.
     * @returns A new model with clones in a column.
     */
    export function cloneToColumn(itemToClone: IModel | IPath, count: number, margin = 0): IModel {
        return cloneTo(1, itemToClone, count, margin);
    }

    /**
     * Layout clones in a row format.
     * 
     * @param itemToClone: Either a model or a path object.
     * @param count Number of clones in the row.
     * @param margin Optional distance between each clone.
     * @returns A new model with clones in a row.
     */
    export function cloneToRow(itemToClone: IModel | IPath, count: number, margin = 0): IModel {
        return cloneTo(0, itemToClone, count, margin);
    }

    /**
     * Layout clones in a grid format.
     * 
     * @param itemToClone: Either a model or a path object.
     * @param xCount Number of columns in the grid.
     * @param yCount Number of rows in the grid.
     * @param margin Optional numeric distance between each clone. Can also be a 2 dimensional array of numbers, to specify distances in x and y dimensions.
     * @returns A new model with clones in a grid layout.
     */
    export function cloneToGrid(itemToClone: IModel | IPath, xCount: number, yCount: number, margin?: number | IPoint): IModel {
        var margins = getMargins(margin);
        return cloneToColumn(cloneToRow(itemToClone, xCount, margins[0]), yCount, margins[1]);
    }

    /**
     * @private
     */
    function getMargins(margin?: number | IPoint) : IPoint {
        if (Array.isArray(margin)) {
            return margin;
        } else {
            return [margin as number, margin as number];
        }
    }

    /**
     * @private
     */
    interface IGridSpacing {
        x: number;
        y: number;
        xMargin: number;
    }

    /**
     * @private
     */
    function cloneToAlternate(itemToClone: IModel | IPath, xCount: number, yCount: number, spacingFn: (modelToMeasure: IModel) => IGridSpacing): IModel {
        var modelToMeasure: IModel;
        if (isModel(itemToClone)) {
            modelToMeasure = itemToClone;
        } else {
            modelToMeasure = { paths: { "0": itemToClone as IPath } };
        }

        var spacing = spacingFn(modelToMeasure);
        var result: IModel = { models: {} };

        for (var i = 0; i < yCount; i++) {
            var i2 = i % 2;
            result.models[i] = model.move(cloneToRow(itemToClone, xCount + i2, spacing.xMargin), [i2 * spacing.x, i * spacing.y]);
        }

        return result;
    }

    /**
     * Layout clones in a brick format. Alternating rows will have an additional item in each row.
     * 
     * @param itemToClone: Either a model or a path object.
     * @param xCount Number of columns in the brick grid.
     * @param yCount Number of rows in the brick grid.
     * @param margin Optional numeric distance between each clone. Can also be a 2 dimensional array of numbers, to specify distances in x and y dimensions.
     * @returns A new model with clones in a brick layout.
     */
    export function cloneToBrick(itemToClone: IModel | IPath, xCount: number, yCount: number, margin?: number | IPoint): IModel {

        var margins = getMargins(margin);

        function spacing(modelToMeasure: IModel): IGridSpacing {
            var m = measure.modelExtents(modelToMeasure);
            return { x: (m.width + margins[0]) / -2, y: m.height + margins[1], xMargin: margins[0] };
        }

        return cloneToAlternate(itemToClone, xCount, yCount, spacing);
    }

    /**
     * Layout clones in a honeycomb format. Alternating rows will have an additional item in each row.
     * 
     * @param itemToClone: Either a model or a path object.
     * @param xCount Number of columns in the honeycomb grid.
     * @param yCount Number of rows in the honeycomb grid.
     * @param margin Optional distance between each clone.
     * @returns A new model with clones in a honeycomb layout.
     */
    export function cloneToHoneycomb(itemToClone: IModel | IPath, xCount: number, yCount: number, margin = 0): IModel {
        
        function spacing(modelToMeasure: IModel): IGridSpacing {
            var hex = measure.boundingHexagon(modelToMeasure);
            var width = 2 * solvers.equilateralAltitude(hex.radius);
            var s = width + margin;
            return { x: s / -2, y: solvers.equilateralAltitude(s), xMargin: margin };
        }
    
        return cloneToAlternate(itemToClone, xCount, yCount, spacing);
    }

}
