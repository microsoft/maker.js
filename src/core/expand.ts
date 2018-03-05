namespace MakerJs.path {

    /**
     * @private
     */
    var map: { [type: string]: (pathValue: IPath, expansion: number, isolateCaps: boolean) => IModel } = {};

    map[pathType.Arc] = function (arc: IPathArc, expansion: number, isolateCaps: boolean) {
        return new models.OvalArc(arc.startAngle, arc.endAngle, arc.radius, expansion, false, isolateCaps);
    };

    map[pathType.Circle] = function (circle: IPathCircle, expansion: number, isolateCaps: boolean) {
        return new models.Ring(circle.radius + expansion, circle.radius - expansion);
    }

    map[pathType.Line] = function (line: IPathLine, expansion: number, isolateCaps: boolean) {
        return new models.Slot(line.origin, line.end, expansion, isolateCaps);
    }

    /**
     * Expand path by creating a model which surrounds it.
     *
     * @param pathToExpand Path to expand.
     * @param expansion Distance to expand.
     * @param isolateCaps Optional flag to put the end caps into a separate model named "caps".
     * @returns Model which surrounds the path.
     */
    export function expand(pathToExpand: IPath, expansion: number, isolateCaps?: boolean): IModel {

        if (!pathToExpand) return null;

        var result: IModel = null;

        var fn = map[pathToExpand.type];
        if (fn) {
            result = fn(pathToExpand, expansion, isolateCaps);
            result.origin = pathToExpand.origin;
        }

        return result;
    }

    /**
     * Represent an arc using straight lines.
     *
     * @param arc Arc to straighten.
     * @param bevel Optional flag to bevel the angle to prevent it from being too sharp.
     * @param prefix Optional string prefix to apply to path ids.
     * @param close Optional flag to make a closed geometry by connecting the endpoints.
     * @returns Model of straight lines with same endpoints as the arc.
     */
    export function straighten(arc: IPathArc, bevel?: boolean, prefix?: string, close?: boolean): IModel {

        var arcSpan = angle.ofArcSpan(arc);
        var joints = 1;

        if (arcSpan >= 270) {
            joints = 4;
        } else if (arcSpan > 180) {
            joints = 3;
        } else if (arcSpan > 150 || bevel) {   //30 degrees is the sharpest
            joints = 2;
        }

        var jointAngleInRadians = angle.toRadians(arcSpan / joints);
        var circumscribedRadius = models.Polygon.circumscribedRadius(arc.radius, jointAngleInRadians);
        var ends = point.fromArc(arc);
        var points: IPoint[] = [point.subtract(ends[0], arc.origin)];
        var a = angle.toRadians(arc.startAngle) + jointAngleInRadians / 2;

        for (var i = 0; i < joints; i++) {
            points.push(point.fromPolar(a, circumscribedRadius));
            a += jointAngleInRadians;
        }

        points.push(point.subtract(ends[1], arc.origin));

        var result = new models.ConnectTheDots(close, points);
        (<IModel>result).origin = arc.origin;

        if (typeof prefix === 'string' && prefix.length) {
            model.prefixPathIds(result, prefix);
        }

        return result;
    }

}

namespace MakerJs.model {

    /**
     * Expand all paths in a model, then combine the resulting expansions.
     *
     * @param modelToExpand Model to expand.
     * @param distance Distance to expand.
     * @param joints Number of points at a joint between paths. Use 0 for round joints, 1 for pointed joints, 2 for beveled joints.
     * @param combineOptions Optional object containing combine options.
     * @returns Model which surrounds the paths of the original model.
     */
    export function expandPaths(modelToExpand: IModel, distance: number, joints = 0, combineOptions: ICombineOptions): IModel {

        if (distance <= 0) return null;

        if (!combineOptions) {
            combineOptions = {};
        }

        if (!combineOptions.pointMatchingDistance) {
            combineOptions.pointMatchingDistance = .002;
        }

        const expandedPathModels: IModel[] = [];

        var walkOptions: IWalkOptions = {
            onPath: function (walkedPath: IWalkPath) {

                //don't expand paths shorter than the tolerance for combine operations
                //                if (combineOptions.pointMatchingDistance && measure.pathLength(walkedPath.pathContext) < combineOptions.pointMatchingDistance) return;

                var expandedPathModel = path.expand(walkedPath.pathContext, distance, true);

                if (expandedPathModel) {
                    moveRelative(expandedPathModel, walkedPath.offset);

                    prefixPathIds(expandedPathModel, walkedPath.pathId + '_');
                    originate(expandedPathModel);

                    expandedPathModels.push(expandedPathModel);
                }
            }
        };

        walk(modelToExpand, walkOptions);

        let union = combineUnion(expandedPathModels, combineOptions);

        if (joints) {

            var roundCaps: IModel = { models: {} };

            expandedPathModels.forEach((expandedPathModel, i) => {
                roundCaps.models[i] = expandedPathModel.models['Caps'];
            });

            simplify(roundCaps);

            const straighteneds: IModel[] = [union];

            //straighten each cap, optionally beveling
            for (var id in roundCaps.models) {

                walk(roundCaps.models[id], {

                    onPath: function (walkedPath: IWalkPath) {

                        var arc = <IPathArc>walkedPath.pathContext;

                        //make a small closed shape using the straightened arc
                        var straightened = path.straighten(arc, joints == 2, walkedPath.pathId + '_', true);
                        straighteneds.push(straightened);
                    }
                });
            }

            union = combineUnion(straighteneds, combineOptions)
        }

        return union;
    }

    /**
     * @private
     */
    function getEndlessChains(modelContext: IModel) {
        var endlessChains: IChain[] = [];
        model.findChains(modelContext, function (chains, loose, layer) {
            endlessChains = chains.filter(chain => chain.endless);
        });
        return endlessChains;
    }

    /**
     * @private
     */
    function getClosedGeometries(modelContext: IModel) {

        //get endless chains from the model
        var endlessChains = getEndlessChains(modelContext);
        if (endlessChains.length == 0) return null;

        //make a new model with only closed geometries
        var closed: IModel = { models: {} };
        endlessChains.forEach((c, i) => {
            closed.models[i] = chain.toNewModel(c);
        });

        return closed;
    }

    /**
     * Outline a model by a specified distance. Useful for accommodating for kerf.
     *
     * @param modelToOutline Model to outline.
     * @param distance Distance to outline.
     * @param joints Number of points at a joint between paths. Use 0 for round joints, 1 for pointed joints, 2 for beveled joints.
     * @param inside Optional boolean to draw lines inside the model instead of outside.
     * @param options Options to send to combine() function.
     * @returns Model which surrounds the paths outside of the original model.
     */
    export function outline(modelToOutline: IModel, distance: number, joints = 0, inside = false, options: ICombineOptions = {}): IModel {
        var expanded = expandPaths(modelToOutline, distance, joints, options);

        if (!expanded) return null;

        //get closed geometries from the model
        var closed = getClosedGeometries(modelToOutline);
        if (closed) {

            var childCount = 0;
            var result: IModel = { models: {} };

            //get closed geometries from the expansion
            var chains = getEndlessChains(expanded);

            chains.forEach(c => {
                //sample one link from the chain
                var wp = c.links[0].walkedPath;

                //see if it is inside the original model
                var isInside = measure.isPointInsideModel(point.middle(wp.pathContext), closed, wp.offset);

                //save the ones we want
                if (inside && isInside || !inside && !isInside) {
                    result.models[childCount++] = chain.toNewModel(c);
                };
            });

            return result;
        } else {
            return expanded;
        }
    }

}
