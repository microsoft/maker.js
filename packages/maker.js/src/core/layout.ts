namespace MakerJs.layout {

    /**
     * @private
     */
    interface IChildPlacement {
        childId: string;
        xRatio: number;
        origin?: IPoint;
        angle?: number;
    }

    /**
     * @private
     */
    function getChildPlacement(parentModel: IModel, baseline: number) {

        //measure everything and cache the results
        var atlas = new measure.Atlas(parentModel);
        var measureParent = measure.modelExtents(parentModel, atlas);

        //measure height of the model from the baseline 0
        var parentTop = measureParent.high[1];

        var cpa: IChildPlacement[] = [];
        var xMap: { [childId: string]: number } = {};

        var walkOptions: IWalkOptions = {
            beforeChildWalk: function (context: IWalkModel) {
                var child = context.childModel;

                //get cached measurement of the child
                var m = atlas.modelMap[context.routeKey];

                if (!m) return;

                var childMeasure = measure.augment(m);

                //set a new origin at the x-center and y-baseline of the child
                model.originate(child, [childMeasure.center[0], parentTop * baseline]);

                //get the x-center of the child
                var x = child.origin[0] - measureParent.low[0];
                xMap[context.childId] = x;

                //get the x-center of the child as a percentage
                var xRatio = x / measureParent.width;

                cpa.push({ childId: context.childId, xRatio });

                //do not walk the grandchildren. This is only for immediate children of the parentModel.
                return false;
            }
        };

        model.walk(parentModel, walkOptions);

        cpa.sort((a, b) => a.xRatio - b.xRatio);

        var first = cpa[0];
        var last = cpa[cpa.length - 1];
        var min = first.xRatio;
        var max = last.xRatio;
        var span = max - min;

        cpa.forEach(cp => cp.xRatio = (cp.xRatio - min) / span);

        return {
            cpa,
            firstX: xMap[first.childId],
            lastX: measureParent.width - xMap[last.childId]
        };
    }

    /**
     * @private
     */
    function moveAndRotate(parentModel: IModel, cpa: IChildPlacement[], rotate: boolean) {

        cpa.forEach(cp => {
            var child = parentModel.models[cp.childId];

            //move the child to the new location
            child.origin = cp.origin;

            //rotate the child
            if (rotate) model.rotate(child, cp.angle, cp.origin);
        });
    }

    /**
     * @private
     */
    var onPathMap: { [pathType: string]: (onPath: IPath, reversed: boolean, cpa: IChildPlacement[]) => void } = {};

    onPathMap[pathType.Arc] = function (arc: IPathArc, reversed: boolean, cpa: IChildPlacement[]) {
        var arcSpan = angle.ofArcSpan(arc);
        cpa.forEach(p => p.angle = reversed ? arc.endAngle - p.xRatio * arcSpan - 90 : arc.startAngle + p.xRatio * arcSpan + 90);
    };

    onPathMap[pathType.Line] = function (line: IPathLine, reversed: boolean, cpa: IChildPlacement[]) {
        var lineAngle = angle.ofLineInDegrees(line as IPathLine);
        cpa.forEach(p => p.angle = lineAngle);
    };

    /**
     * Layout the children of a model along a path. 
     * The x-position of each child will be projected onto the path so that the proportion between children is maintained.
     * Each child will be rotated such that it will be perpendicular to the path at the child's x-center.
     * 
     * @param parentModel The model containing children to lay out.
     * @param onPath The path on which to lay out.
     * @param baseline Numeric percentage value of vertical displacement from the path. Default is zero.
     * @param reversed Flag to travel along the path in reverse. Default is false.
     * @param contain Flag to contain the children layout within the length of the path. Default is false.
     * @param rotate Flag to rotate the child to perpendicular. Default is true.
     * @returns The parentModel, for cascading.
     */
    export function childrenOnPath(parentModel: IModel, onPath: IPath, baseline = 0, reversed = false, contain = false, rotate = true) {

        var result = getChildPlacement(parentModel, baseline);
        var cpa = result.cpa;
        var chosenPath = onPath;

        if (contain) {
            //see if we need to clip
            var onPathLength = measure.pathLength(onPath);

            if (result.firstX + result.lastX < onPathLength) {
                chosenPath = path.clone(onPath);
                path.alterLength(chosenPath, -result.firstX, true);
                path.alterLength(chosenPath, -result.lastX);
            }
        }

        cpa.forEach(p => p.origin = point.middle(chosenPath, reversed ? 1 - p.xRatio : p.xRatio));

        var fn = onPathMap[chosenPath.type];
        if (fn) {
            fn(chosenPath, reversed, cpa);
        }

        moveAndRotate(parentModel, cpa, rotate);

        return parentModel;
    }

    /**
     * @private
     */
    function miterAngles(points: IPoint[], offsetAngle: number): number[] {
        var arc = new paths.Arc([0, 0], 0, 0, 0);
        return points.map((p, i) => {
            var a: number;
            if (i === 0) {
                a = angle.ofPointInDegrees(p, points[i + 1]) + 90;
            } else if (i === points.length - 1) {
                a = angle.ofPointInDegrees(points[i - 1], p) + 90;
            } else {
                arc.origin = p;
                arc.startAngle = angle.ofPointInDegrees(p, points[i + 1]);
                arc.endAngle = angle.ofPointInDegrees(p, points[i - 1]);
                a = angle.ofArcMiddle(arc);
            }
            return a + offsetAngle;
        });
    }

    /**
     * Layout the children of a model along a chain. 
     * The x-position of each child will be projected onto the chain so that the proportion between children is maintained.
     * The projected positions of the children will become an array of points that approximate the chain.
     * Each child will be rotated such that it will be mitered according to the vertex angles formed by this series of points.
     * 
     * @param parentModel The model containing children to lay out.
     * @param onChain The chain on which to lay out.
     * @param baseline Numeric percentage value of vertical displacement from the chain. Default is zero.
     * @param reversed Flag to travel along the chain in reverse. Default is false.
     * @param contain Flag to contain the children layout within the length of the chain. Default is false.
     * @param rotate Flag to rotate the child to mitered angle. Default is true.
     * @returns The parentModel, for cascading.
     */
    export function childrenOnChain(parentModel: IModel, onChain: IChain, baseline = 0, reversed = false, contain = false, rotated = true) {
        var result = getChildPlacement(parentModel, baseline);
        var cpa = result.cpa;

        var chainLength = onChain.pathLength;
        if (contain) chainLength -= result.firstX + result.lastX;

        var absolutes = cpa.map(cp => (reversed ? 1 - cp.xRatio : cp.xRatio) * chainLength);
        var relatives: number[];

        if (reversed) absolutes.reverse();

        relatives = absolutes.map((ab, i) => Math.abs(ab - (i == 0 ? 0 : absolutes[i - 1])));

        if (contain) {
            relatives[0] += reversed ? result.lastX : result.firstX;
        } else {
            relatives.shift();
        }

        //chain.toPoints always follows the chain in its order, from beginning to end. This is why we needed to contort the points input
        var points = chain.toPoints(onChain, relatives);

        if (points.length < cpa.length) {
            //add last point of chain, since our distances exceeded the chain
            var endLink = onChain.links[onChain.links.length - 1];
            points.push(endLink.endPoints[endLink.reversed ? 0 : 1]);
        }

        if (contain) points.shift(); //delete the first point which is the beginning of the chain

        if (reversed) points.reverse();

        var angles = miterAngles(points, -90);

        cpa.forEach((cp, i) => {
            cp.angle = angles[i];
            cp.origin = points[i];
        });

        moveAndRotate(parentModel, cpa, rotated);

        return parentModel;
    }

    /**
     * Layout clones in a radial format.
     * 
     * Example:
     * ```
     * //daisy petals
     * var makerjs = require('makerjs');
     *
     * var belt = new makerjs.models.Belt(5, 50, 20);
     *
     * makerjs.model.move(belt, [25, 0]);
     * 
     * var petals = makerjs.layout.cloneToRadial(belt, 8, 45);
     * 
     * document.write(makerjs.exporter.toSVG(petals));
     * ```
     * 
     * @param itemToClone: Either a model or a path object.
     * @param count Number of clones in the radial result.
     * @param angleInDegrees angle of rotation between clones..
     * @returns A new model with clones in a radial format.
     */
    export function cloneToRadial(itemToClone: IModel | IPath, count: number, angleInDegrees: number, rotationOrigin?: IPoint) {
        var result: IModel = {};
        var add: IPathMap | IModelMap;
        var rotateFn: (x: IModel | IPath, angleInDegrees: number, rotationOrigin?: IPoint) => IModel | IPath;

        if (isModel(itemToClone)) {
            add = result.models = {};
            rotateFn = model.rotate;
        } else {
            add = result.paths = {};
            rotateFn = path.rotate;
        }

        for (var i = 0; i < count; i++) {
            add[i] = rotateFn(cloneObject(itemToClone), i * angleInDegrees, rotationOrigin);
        }

        return result;
    }

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
