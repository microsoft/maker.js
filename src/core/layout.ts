namespace MakerJs.layout {

    function cloneTo(dimension: number, itemToClone: IModel | IPath, count: number, margin = 0): IModel {
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

    export function cloneToColumn(itemToClone: IModel | IPath, count: number, margin?: number): IModel {
        return cloneTo(1, itemToClone, count, margin);
    }

    export function cloneToRow(itemToClone: IModel | IPath, count: number, margin?: number): IModel {
        return cloneTo(0, itemToClone, count, margin);
    }

    export function cloneToGrid(itemToClone: IModel | IPath, xCount: number, yCount: number, margin?: number): IModel {
        return cloneToColumn(cloneToRow(itemToClone, xCount, margin), yCount, margin);
    }

    function cloneToAlternate(itemToClone: IModel | IPath, xCount: number, yCount: number, margin: number, spacingFn: (modelToMeasure: IModel) => IPoint): IModel {
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
            result.models[i] = model.move(cloneToRow(itemToClone, xCount + i2, margin), [i2 * spacing[0], i * spacing[1]]);
        }

        return result;
    }

    export function cloneToBrick(itemToClone: IModel | IPath, xCount: number, yCount: number, margin = 0): IModel {

        function spacing(modelToMeasure: IModel) {
            var m = measure.modelExtents(modelToMeasure);
            return [(m.width + margin) / -2, m.height + margin];
        }

        return cloneToAlternate(itemToClone, xCount, yCount, margin, spacing);
    }

    export function cloneToHoneycomb(itemToClone: IModel | IPath, xCount: number, yCount: number, margin = 0): IModel {
        
        function spacing(modelToMeasure: IModel) {
            var hex = measure.boundingHexagon(modelToMeasure);
            var width = 2 * solvers.equilateralAltitude(hex.radius);
            var s = width + margin;
            return [s / -2, solvers.equilateralAltitude(s)];
        }
    
        return cloneToAlternate(itemToClone, xCount, yCount, margin, spacing);
    }

}
