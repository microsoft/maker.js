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
     * Example:
     * ```
     * //Grooves for a finger joint
     * var m = require('makerjs');
     * 
     * var dogbone = new m.models.Dogbone(50, 20, 2, -1, false);
     * 
     * var grooves = m.layout.cloneToColumn(dogbone, 5, 20);
     * 
     * document.write(m.exporter.toSVG(grooves));
     * ```
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
     * Example:
     * ```
     * //Tongue and grooves for a box joint
     * var m = require('makerjs');
     * var tongueWidth = 60;
     * var grooveWidth = 50;
     * var grooveDepth = 30;
     * var groove = new m.models.Dogbone(grooveWidth, grooveDepth, 5, 0, true);
     * 
     * groove.paths['leftTongue'] = new m.paths.Line([-tongueWidth / 2, 0], [0, 0]);
     * groove.paths['rightTongue'] = new m.paths.Line([grooveWidth, 0], [grooveWidth + tongueWidth / 2, 0]);
     * 
     * var tongueAndGrooves = m.layout.cloneToRow(groove, 3);
     * 
     * document.write(m.exporter.toSVG(tongueAndGrooves));
     * ```
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
     * Example:
     * ```
     * //Grid of squares
     * var m = require('makerjs');
     * var square = new m.models.Square(43);
     * var grid = m.layout.cloneToGrid(square, 5, 5, 7);
     * document.write(m.exporter.toSVG(grid));
     * ```
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
    function getMargins(margin?: number | IPoint): IPoint {
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
    function cloneToAlternatingRows(itemToClone: IModel | IPath, xCount: number, yCount: number, spacingFn: (modelToMeasure: IModel) => IGridSpacing): IModel {
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
     * Examples:
     * ```
     * //Brick wall
     * var m = require('makerjs');
     * var brick = new m.models.RoundRectangle(50, 30, 4);
     * var wall = m.layout.cloneToBrick(brick, 8, 6, 3);
     * document.write(m.exporter.toSVG(wall));
     * ```
     * 
     * ```
     * //Fish scales
     * var m = require('makerjs');
     * var arc = new m.paths.Arc([0, 0], 50, 20, 160);
     * var scales = m.layout.cloneToBrick(arc, 8, 20);
     * document.write(m.exporter.toSVG(scales));
     * ```
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
            var xMargin = margins[0] || 0;
            var yMargin = margins[1] || 0;
            return { x: (m.width + xMargin) / -2, y: m.height + yMargin, xMargin: xMargin };
        }

        return cloneToAlternatingRows(itemToClone, xCount, yCount, spacing);
    }

    /**
     * Layout clones in a honeycomb format. Alternating rows will have an additional item in each row.
     * 
     * Examples:
     * ```
     * //Honeycomb
     * var m = require('makerjs');
     * var hex = new m.models.Polygon(6, 50, 30);
     * var pattern = m.layout.cloneToHoneycomb(hex, 8, 9, 10);
     * document.write(m.exporter.toSVG(pattern));
     * ```
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

        return cloneToAlternatingRows(itemToClone, xCount, yCount, spacing);
    }

}
