namespace MakerJs.model {

    /**
     * @private
     */
    function checkForOverlaps(
        refPaths: IRefPathInModel[],
        isOverlapping: (path1: IPath, path2: IPath, excludeTangents: boolean) => boolean,
        overlapUnion: (path1: IPath, path2: IPath) => void) {

        var currIndex = 0;

        do {
            var root = refPaths[currIndex];

            do {
                var overlaps = false;

                for (var i = currIndex + 1; i < refPaths.length; i++) {
                    var arcRef = refPaths[i];

                    overlaps = isOverlapping(root.pathContext, arcRef.pathContext, false);
                    if (overlaps) {

                        overlapUnion(root.pathContext, arcRef.pathContext);
                        delete arcRef.modelContext.paths[arcRef.pathId];
                        refPaths.splice(i, 1);
                        break;
                    }
                }

            } while (overlaps)

            currIndex++;
        } while (currIndex < refPaths.length)
    }

    /**
     * @private
     */
    function normalizedArcLimits(arc: IPathArc) {
        var startAngle = angle.noRevolutions(arc.startAngle);
        return {
            startAngle: startAngle,
            endAngle: angle.ofArcSpan(arc) + startAngle
        };
    }

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

        var similarArcs = new Collector<IPathCircle, IRefPathInModel>(compareCircles);
        var similarCircles = new Collector<IPathCircle, IRefPathInModel>(compareCircles);
        var similarLines = new Collector<ISlope, IRefPathInModel>(measure.isSlopeEqual);

        var map: IRefPathInModelFunctionMap = {};

        map[pathType.Arc] = function (arcRef: IRefPathInModel) {
            similarArcs.addItemToCollection(<IPathCircle>arcRef.pathContext, arcRef);
        };

        map[pathType.Circle] = function (circleRef: IRefPathInModel) {
            similarCircles.addItemToCollection(<IPathCircle>circleRef.pathContext, circleRef);
        };

        map[pathType.Line] = function (lineRef: IRefPathInModel) {
            var slope = measure.lineSlope(<IPathLine>lineRef.pathContext);
            similarLines.addItemToCollection(slope, lineRef);
        };

        var opts: ISimplifyOptions = {
            scalarMatchingDistance: .001,
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

        //for all arcs that are similar, see if they overlap.
        //combine overlapping arcs into the first one and delete the second.
        similarArcs.getCollectionsOfMultiple(function (key: IPathCircle, arcRefs: IRefPathInModel[]) {
            checkForOverlaps(arcRefs, measure.isArcOverlapping, function (arc1: IPathArc, arc2: IPathArc) {

                var limit1 = normalizedArcLimits(arc1);
                var limit2 = normalizedArcLimits(arc2);

                arc1.startAngle = Math.min(limit1.startAngle, limit2.startAngle);
                arc1.endAngle = Math.max(limit1.endAngle, limit2.endAngle);
            });
        });

        //for all circles that are similar, delete all but the first.
        similarCircles.getCollectionsOfMultiple(function (key: IPathCircle, circleRefs: IRefPathInModel[]) {
            for (var i = 1; i < circleRefs.length; i++) {
                var circleRef = circleRefs[i];
                delete circleRef.modelContext.paths[circleRef.pathId];
            }
        });

        //for all lines that are similar, see if they overlap.
        //combine overlapping lines into the first one and delete the second.
        similarLines.getCollectionsOfMultiple(function (slope: ISlope, arcRefs: IRefPathInModel[]) {
            checkForOverlaps(arcRefs, measure.isLineOverlapping, function (line1: IPathLine, line2: IPathLine) {

                var box: IModel = { paths: { line1: line1, line2: line2 } };
                var m = measure.modelExtents(box);

                if (!slope.hasSlope) {
                    //vertical
                    line1.origin[1] = m.low[1];
                    line1.end[1] = m.high[1];

                } else {
                    //non-vertical

                    if (slope.slope < 0) {
                        //downward
                        line1.origin = [m.low[0], m.high[1]];
                        line1.end = [m.high[0], m.low[1]];

                    } else if (slope.slope > 0) {
                        //upward
                        line1.origin = m.low;
                        line1.end = m.high;

                    } else {
                        //horizontal
                        line1.origin[0] = m.low[0];
                        line1.end[0] = m.high[0];
                    }
                }

            });
        });

        return modelToSimplify;
    }

}
