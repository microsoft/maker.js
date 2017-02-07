namespace MakerJs.model {

    /**
     * @private
     */
    function checkForOverlaps(
        refPaths: IWalkPath[],
        isOverlapping: (pathA: IPath, pathB: IPath, excludeTangents: boolean) => boolean,
        overlapUnion: (pathA: IPath, pathB: IPath) => void) {

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
    interface IWalkPathFunctionMap {

        /**
         * Key is the type of a path, value is a function which accepts a path object as its parameter.
         */
        [type: string]: (walkedPath: IWalkPath) => void;
    }

    /**
     * Simplify a model's paths by reducing redundancy: combine multiple overlapping paths into a single path. The model must be originated.
     * 
     * @param modelContext The originated model to search for similar paths.
     * @param options Optional options object.
     * @returns The simplified model (for cascading).
     */
    export function simplify(modelToSimplify: IModel, options?: ISimplifyOptions) {

        function compareCircles(circleA: IPathCircle, circleB: IPathCircle): boolean {
            if (Math.abs(circleA.radius - circleB.radius) <= opts.scalarMatchingDistance) {
                var distance = measure.pointDistance(circleA.origin, circleB.origin);
                return distance <= opts.pointMatchingDistance;
            }
            return false;
        }

        var similarArcs = new Collector<IPathCircle, IWalkPath>(compareCircles);
        var similarCircles = new Collector<IPathCircle, IWalkPath>(compareCircles);
        var similarLines = new Collector<ISlope, IWalkPath>(measure.isSlopeEqual);

        var map: IWalkPathFunctionMap = {};

        map[pathType.Arc] = function (arcRef: IWalkPath) {
            similarArcs.addItemToCollection(<IPathCircle>arcRef.pathContext, arcRef);
        };

        map[pathType.Circle] = function (circleRef: IWalkPath) {
            similarCircles.addItemToCollection(<IPathCircle>circleRef.pathContext, circleRef);
        };

        map[pathType.Line] = function (lineRef: IWalkPath) {
            var slope = measure.lineSlope(<IPathLine>lineRef.pathContext);
            similarLines.addItemToCollection(slope, lineRef);
        };

        var opts: ISimplifyOptions = {
            scalarMatchingDistance: .001,
            pointMatchingDistance: .005
        };
        extendObject(opts, options);

        //walk the model and collect: arcs on same center / radius, circles on same center / radius, lines on same y-intercept / slope.
        var walkOptions: IWalkOptions = {
            onPath: function (walkedPath: IWalkPath) {
                var fn = map[walkedPath.pathContext.type];
                if (fn) {
                    fn(walkedPath);
                }
            }
        };
        walk(modelToSimplify, walkOptions);

        //for all arcs that are similar, see if they overlap.
        //combine overlapping arcs into the first one and delete the second.
        similarArcs.getCollectionsOfMultiple(function (key: IPathCircle, arcRefs: IWalkPath[]) {
            checkForOverlaps(arcRefs, measure.isArcOverlapping, function (arcA: IPathArc, arcB: IPathArc) {

                //find ends within the other
                var aEndsInB = measure.isBetweenArcAngles(arcA.endAngle, arcB, false);
                var bEndsInA = measure.isBetweenArcAngles(arcB.endAngle, arcA, false);

                //check for complete circle
                if (aEndsInB && bEndsInA) {
                    arcA.endAngle = arcA.startAngle + 360;
                    return;
                }

                //find the leader, in polar terms
                var ordered: IPathArc[] = aEndsInB ? [arcA, arcB] : [arcB, arcA];

                //save in arcA
                arcA.startAngle = angle.noRevolutions(ordered[0].startAngle);
                arcA.endAngle = ordered[1].endAngle;
            });
        });

        //for all circles that are similar, delete all but the first.
        similarCircles.getCollectionsOfMultiple(function (key: IPathCircle, circleRefs: IWalkPath[]) {
            for (var i = 1; i < circleRefs.length; i++) {
                var circleRef = circleRefs[i];
                delete circleRef.modelContext.paths[circleRef.pathId];
            }
        });

        //for all lines that are similar, see if they overlap.
        //combine overlapping lines into the first one and delete the second.
        similarLines.getCollectionsOfMultiple(function (slope: ISlope, arcRefs: IWalkPath[]) {
            checkForOverlaps(arcRefs, measure.isLineOverlapping, function (lineA: IPathLine, lineB: IPathLine) {

                var box: IModel = { paths: { lineA: lineA, lineB: lineB } };
                var m = measure.modelExtents(box);

                if (!slope.hasSlope) {
                    //vertical
                    lineA.origin[1] = m.low[1];
                    lineA.end[1] = m.high[1];

                } else {
                    //non-vertical

                    if (slope.slope < 0) {
                        //downward
                        lineA.origin = [m.low[0], m.high[1]];
                        lineA.end = [m.high[0], m.low[1]];

                    } else if (slope.slope > 0) {
                        //upward
                        lineA.origin = m.low;
                        lineA.end = m.high;

                    } else {
                        //horizontal
                        lineA.origin[0] = m.low[0];
                        lineA.end[0] = m.high[0];
                    }
                }

            });
        });

        return modelToSimplify;
    }

}
