namespace MakerJs.path {

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

}

namespace MakerJs.model {

    export function expandPaths(modelToExpand: IModel, expansion: number, options: IExpandOptions = {}): IModel {

        if (expansion <= 0) return null;

        //TODO: separate the result into 2 models, between paths and caps
        var result: IModel = {
            models: {}
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

                result.models[newId] = expandedPathModel;
                first = false;
            }
        });

        if (options.straight) {

            //TODO simplify only the caps
            //simplify(result);

            //TODO: straighten each cap, optionally beveling
        }

        return result;
    }

}
