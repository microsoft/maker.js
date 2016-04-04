namespace MakerJs.model {

    /**
     * Simplify a model's paths by reducing redundancy: combine multiple overlapping paths into a single path.
     * 
     * @param modelContext The model to search for similar paths.
     * @param options Optional options object.
     * @returns The simplified model (for chaining).
     */
    export function simplify(modelToSimplify: IModel, options?: ISimplifyOptions) {

        function compareCircles(circle1: IPathCircle, circle2: IPathCircle): boolean {
            if (Math.abs(circle1.radius - circle2.radius) <= opts.scalarMatchingDistance) {
                var distance = measure.pointDistance(circle1.origin, circle2.origin);
                return distance <= opts.pointMatchingDistance;
            }
            return false;
        }

        function compareSlopes(slope1: ISlope, slope2: ISlope): boolean {

            //see if slopes are vertical
            if (!slope1.hasSlope && !slope2.hasSlope) {

                //true if they both have the same x
                return slope1.line.origin[0] == slope2.line.origin[0];
            }

            //see if both have slope
            if (slope1.hasSlope && slope2.hasSlope) {

                //true if they have the same y-intercept and slope
                return (Math.abs(slope1.yIntercept - slope2.yIntercept) <= opts.scalarMatchingDistance)
                    && (Math.abs(slope1.slope - slope2.slope) <= opts.slopeMatchingDistance);
            }

            return false;
        }

        var similarArcs = new Collector<IPathCircle, IRefPathInModel>(compareCircles);
        var similarCircles = new Collector<IPathCircle, IRefPathInModel>(compareCircles);
        var similarLines = new Collector<ISlope, IRefPathInModel>(compareSlopes);

        var map: IRefPathInModelFunctionMap = {};

        map[pathType.Arc] = function (arcRef: IRefPathInModel) {
            similarArcs.addItemToCollection(<IPathCircle>arcRef.pathContext, arcRef);
        };

        map[pathType.Circle] = function (circleRef: IRefPathInModel) {
            similarCircles.addItemToCollection(<IPathCircle>circleRef.pathContext, circleRef);
        };

        map[pathType.Line] = function (lineRef: IRefPathInModel) {
            var slope = path.getSlope(<IPathLine>lineRef.pathContext);
            similarLines.addItemToCollection(slope, lineRef);
        };

        var opts: ISimplifyOptions = {
            scalarMatchingDistance: .001,
            slopeMatchingDistance: .001,
            pointMatchingDistance: .005
        };
        extendObject(opts, options);

        //walk the model and collect: arcs on same center / radius, circles on same center / radius, lines on same y-intercept / slope.
        walkPaths(modelToSimplify, function (modelContext: IModel, pathId: string, pathContext: IPath) {

            var ref: IRefPathInModel = {
                modelContext: modelContext,
                pathContext: pathContext,
                pathId: pathId
            };

            var fn = map[pathContext.type];
            if (fn) {
                fn(ref);
            }

        });

        //for all circles that are similar, delete all but the first.
        //TODO

        //for all arcs that are similar, see if they overlap.
        //combine overlapping arcs into the first one and delete the second.
        //TODO

        //for all lines that are similar, see if they overlap.
        //combine overlapping lines into the first one and delete the second.
        //TODO

        return modelToSimplify;
    }

}
