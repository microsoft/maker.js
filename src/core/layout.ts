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

}
