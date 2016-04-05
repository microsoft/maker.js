namespace MakerJs.path {

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

        var result: IModel;

        var map: IPathFunctionMap = {};

        map[pathType.Arc] = function (arc: IPathArc) {
            result = new models.OvalArc(arc.startAngle, arc.endAngle, arc.radius, expansion, false, isolateCaps);
        };

        map[pathType.Circle] = function (circle: IPathCircle) {
            result = new models.Ring(circle.radius + expansion, circle.radius - expansion);
        }

        map[pathType.Line] = function (line: IPathLine) {
            result = new models.Slot(line.origin, line.end, expansion, isolateCaps);
        }

        var fn = map[pathToExpand.type];
        if (fn) {
            fn(pathToExpand);
            result.origin = pathToExpand.origin;
        }

        return result;
    }

    /**
     * Represent an arc using straight lines.
     *
     * @param arc Arc to straighten.
     * @param bevel Optional flag to bevel the angle to prevent it from being too sharp.
     * @returns Model of straight lines with same endpoints as the arc.
     */
    export function straighten(arc: IPathArc, bevel?: boolean): IModel {

        var arcSpan = measure.arcAngle(arc);
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

        var result = new models.ConnectTheDots(false, points);
        (<IModel>result).origin = arc.origin;

        return result;
    }

}

namespace MakerJs.model {

    /**
     * Expand all paths in a model, then combine the resulting expansions.
     *
     * @param modelToExpand Model to expand.
     * @param expansion Distance to expand.
     * @param joints Number of points at a joint between paths. Use 0 for round joints, 1 for pointed joints, 2 for beveled joints.
     * @returns Model which surrounds the paths of the original model.
     */
    export function expandPaths(modelToExpand: IModel, expansion: number, joints = 0): IModel {

        if (expansion <= 0) return null;

        var result: IModel = {
            models: {
                expansions: { models: {} },
                caps: { models: {} }
            }
        };

        var first = true;

        walkPaths(modelToExpand, function (modelContext: IModel, pathId: string, pathContext: IPath) {
            var expandedPathModel = path.expand(pathContext, expansion, true);

            if (expandedPathModel) {
                var newId = getSimilarModelId(result, pathId);

                model.originate(expandedPathModel);

                if (!first) {
                    model.combine(result, expandedPathModel);
                }

                result.models['expansions'].models[newId] = expandedPathModel;

                if (expandedPathModel.models) {
                    var caps = expandedPathModel.models['Caps'];

                    if (caps) {
                        delete expandedPathModel.models['Caps'];

                        result.models['caps'].models[newId] = caps;
                    }
                }

                first = false;
            }
        });

        if (joints) {

            var roundCaps = result.models['caps'];

            simplify(roundCaps);

            var straightCaps: IModel = { models: {} };

            //straighten each cap, optionally beveling
            for (var id in roundCaps.models) {

                var straightened: IModel = { models: {} };

                walkPaths(roundCaps.models[id], function (modelContext: IModel, pathId: string, pathContext: IPath) {
                    straightened.models[pathId] = path.straighten(<IPathArc>pathContext, joints == 2);
                });

                straightCaps.models[id] = straightened;
            }

            //replace the rounded with the straightened
            result.models['caps'] = straightCaps;
        }

        return result;
    }

}
