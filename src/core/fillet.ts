/// <reference path="intersect.ts" />

module MakerJs.path {

    /**
     * @private
     */
    interface IPointProperty {
        point: IPoint;
        propertyName: string;
    }

    /**
     * @private
     */
    interface IMatchPointProperty extends IPointProperty {
        path: IPath;
        isStart: boolean;
        oppositePoint: IPoint;
        shardPoint?: IPoint;
    }

    /**
     * @private
     */
    interface IFilletResult {
        filletAngle: number;
        clipPath: () => void;
    }

    /**
     * @private
     */
    function getPointProperties(pathToInspect: IPath): IPointProperty[] {
        var points = point.fromPathEnds(pathToInspect);
        if (points) {

            function pointProperty(index: number): IPointProperty {
                return { point: points[index], propertyName: propertyNames[index] };
            }

            var propertyNames: string[] = null;
            var map: IPathFunctionMap = {};

            map[pathType.Arc] = function (arc: IPathArc) {
                propertyNames = ['startAngle', 'endAngle'];
            };

            map[pathType.Line] = function (line: IPathLine) {
                propertyNames = ['origin', 'end'];
            }

            var fn = map[pathToInspect.type];
            if (fn) {
                fn(pathToInspect);

                return [pointProperty(0), pointProperty(1)];
            }
        }
        return null;
    }

    /**
     * @private
     */
    function getMatchingPointProperties(path1: IPath, path2: IPath): IMatchPointProperty[] {
        var path1Properties = getPointProperties(path1);
        var path2Properties = getPointProperties(path2);

        var result: IMatchPointProperty[] = null;

        function makeMatch(pathContext: IPath, pointProperties: IPointProperty[], index: number): IMatchPointProperty {
            return {
                path: pathContext,
                isStart: index == 0,
                propertyName: pointProperties[index].propertyName,
                point: pointProperties[index].point,
                oppositePoint: pointProperties[1 - index].point
            };
        }

        function check(i1: number, i2: number) {
            if (point.areEqualRounded(path1Properties[i1].point, path2Properties[i2].point)) {
                result = [
                    makeMatch(path1, path1Properties, i1),
                    makeMatch(path2, path2Properties, i2)
                ];
                return true;
            }
            return false;
        }

        check(0, 0) || check(0, 1) || check(1, 0) || check(1, 1);

        return result;
    }

    /**
     * @private
     */
    function populateShardPointsFromReferenceCircle(filletRadius: number, center: IPoint, properties: IMatchPointProperty[], options: IPointMatchOptions): boolean {
        var referenceCircle = new paths.Circle(center, filletRadius);

        //get reference circle intersection points
        for (var i = 0; i < 2; i++) {
            var circleIntersection = intersection(referenceCircle, properties[i].path);
            if (!circleIntersection) {
                return false;
            }

            properties[i].shardPoint = circleIntersection.intersectionPoints[0];

            if (point.areEqualRounded(properties[i].point, circleIntersection.intersectionPoints[0], options.accuracy)) {
                if (circleIntersection.intersectionPoints.length > 1) {
                    properties[i].shardPoint = circleIntersection.intersectionPoints[1];
                } else {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * @private
     */
    function cloneAndBreakPath(pathToShard: IPath, shardPoint: IPoint): IPath[] {
        var shardStart = cloneObject<IPath>(pathToShard);
        var shardEnd = breakAtPoint(shardStart, shardPoint);
        return [shardStart, shardEnd];
    }

    /**
     * @private
     */
    function getGuidePath(context: IMatchPointProperty, filletRadius: number, nearPoint: IPoint): IPath {
        var result: IPath = null;

        var map: IPathFunctionMap = {};

        map[pathType.Arc] = function (arc: IPathArc) {
            var guideRadius = arc.radius;

            //see if the guideline should be external or internal to the context arc.
            var guideArcShard = <IPathArc>cloneAndBreakPath(arc, context.shardPoint)[context.isStart ? 0 : 1];
            if (guideArcShard) {
                if (measure.isArcConcaveTowardsPoint(guideArcShard, nearPoint)) {
                    guideRadius -= filletRadius;
                } else {
                    guideRadius += filletRadius;
                }

                result = new paths.Arc(arc.origin, guideRadius, arc.startAngle, arc.endAngle);
            }
        };

        map[pathType.Line] = function (line: IPathLine) {
            result = new paths.Parallel(line, filletRadius, nearPoint);
        }

        var fn = map[context.path.type];
        if (fn) {
            fn(context.path);
        }

        return result;
    }

    /**
     * @private
     */
    function getFilletResult(context: IMatchPointProperty, filletRadius: number, filletCenter: IPoint): IFilletResult {
        var result: IFilletResult = null;

        var map: IPathFunctionMap = {};

        map[pathType.Arc] = function (arc: IPathArc) {
            var guideLine = new paths.Line(arc.origin, filletCenter);
            var guideLineAngle = angle.ofLineInDegrees(guideLine);
            var filletAngle = guideLineAngle;

            //the context is an arc and the fillet is an arc so they will be tangent. If the fillet is external to the arc then the tangent is opposite.
            if (!measure.isArcConcaveTowardsPoint(arc, filletCenter)) {
                filletAngle += 180;
            }

            result = {
                filletAngle: angle.noRevolutions(filletAngle),
                clipPath: function () {
                    arc[context.propertyName] = guideLineAngle;
                }
            };
        };

        map[pathType.Line] = function (line: IPathLine) {
            //make a small vertical line
            var guideLine = new paths.Line([0, 0], [0, 1]);

            //rotate this vertical line the same angle as the line context. It will be perpendicular.
            var lineAngle = angle.ofLineInDegrees(line);
            path.rotate(guideLine, lineAngle, [0, 0]);
            path.moveRelative(guideLine, filletCenter);

            //get the intersection point of the slopes of the context line and the perpendicular line. This is where the fillet meets the line.
            var intersectionPoint = slopeIntersectionPoint(line, guideLine);
            if (intersectionPoint) {
                result = {
                    filletAngle: angle.ofPointInDegrees(filletCenter, intersectionPoint),
                    clipPath: function () {
                        line[context.propertyName] = intersectionPoint;
                    }
                };
            }
        }

        var fn = map[context.path.type];
        if (fn) {
            fn(context.path);
        }

        if (!testFilletResult(context, result)) {
            result = null;
        }

        return result;
    }

    /**
     * @private
     */
    function getDogboneResult(context: IMatchPointProperty, filletCenter: IPoint): IFilletResult {
        var result: IFilletResult = {
            filletAngle: angle.ofPointInDegrees(filletCenter, context.shardPoint),
            clipPath: function () {
                context.path[context.propertyName] = context.shardPoint;
            }
        };

        if (!testFilletResult(context, result)) {
            result = null;
        }

        return result;
    }

    /**
     * @private
     */
    function testFilletResult(context: IMatchPointProperty, result: IFilletResult): boolean {
        var test = false;

        if (result) {

            //temporarily clip the path.
            var originalValue = context.path[context.propertyName];
            result.clipPath();

            //don't allow a fillet which effectivly eliminates the path.
            if (measure.pathLength(context.path) > 0) {
                test = true;
            }

            //revert the clipping we just did.
            context.path[context.propertyName] = originalValue;
        }

        return test;
    }

    /**
     * @private
     */
    function getLineRatio(lines: IPathLine[]): number {
        var totalLength = 0;
        var lengths: number[] = [];

        for (var i = 0; i < lines.length; i++) {
            var length = measure.pathLength(lines[i]);
            lengths.push(length);
            totalLength += length;
        }

        return lengths[0] / totalLength;
    }

    /**
     * Adds a round corner to the outside angle between 2 lines. The lines must meet at one point.
     *
     * @param line1 First line to fillet, which will be modified to fit the fillet.
     * @param line2 Second line to fillet, which will be modified to fit the fillet.
     * @returns Arc path object of the new fillet.
     */
    export function dogbone(line1: IPathLine, line2: IPathLine, filletRadius: number, options?: IPointMatchOptions): IPathArc {

        if (isPathLine(line1) && isPathLine(line2) && filletRadius && filletRadius > 0) {

            var opts: IPointMatchOptions = {
                accuracy: .0001
            };
            extendObject(opts, options);

            //first find the common point
            var commonProperty = getMatchingPointProperties(line1, line2);
            if (commonProperty) {

                //get the ratio comparison of the two lines
                var ratio = getLineRatio([line1, line2]);

                //draw a line between the two endpoints, and get the bisection point at the ratio
                var span = new paths.Line(commonProperty[0].oppositePoint, commonProperty[1].oppositePoint);
                var midRatioPoint = point.middle(span, ratio);

                //use the bisection theorem to get the angle bisecting the lines
                var bisectionAngle = angle.ofPointInDegrees(commonProperty[0].point, midRatioPoint);

                var center = point.add(commonProperty[0].point, point.fromPolar(angle.toRadians(bisectionAngle), filletRadius));

                if (!populateShardPointsFromReferenceCircle(filletRadius, center, commonProperty, opts)) {
                    return null;
                }

                //get the angles of the fillet and a function which clips the path to the fillet.
                var results: IFilletResult[] = [];
                for (var i = 0; i < 2; i++) {
                    var result = getDogboneResult(commonProperty[i], center);
                    if (!result) {
                        return null;
                    }
                    results.push(result);
                }

                var filletArc = new paths.Arc(center, filletRadius, results[0].filletAngle, results[1].filletAngle);

                //make sure midpoint of fillet is outside of the angle
                if (round(angle.noRevolutions(angle.ofArcMiddle(filletArc))) == round(bisectionAngle)) {
                    filletArc.startAngle = results[1].filletAngle;
                    filletArc.endAngle = results[0].filletAngle;
                }

                //clip the paths and return the fillet arc.
                results[0].clipPath();
                results[1].clipPath();

                return filletArc;
            }
        }
        return null;
    }

    /**
     * Adds a round corner to the inside angle between 2 paths. The paths must meet at one point.
     *
     * @param path1 First path to fillet, which will be modified to fit the fillet.
     * @param path2 Second path to fillet, which will be modified to fit the fillet.
     * @returns Arc path object of the new fillet.
     */
    export function fillet(path1: IPath, path2: IPath, filletRadius: number, options?: IPointMatchOptions): IPathArc {

        if (path1 && path2 && filletRadius && filletRadius > 0) {

            var opts: IPointMatchOptions = {
                accuracy: .0001
            };
            extendObject(opts, options);

            //first find the common point
            var commonProperty = getMatchingPointProperties(path1, path2);
            if (commonProperty) {

                //since arcs can curl beyond, we need a local reference point. 
                //An intersection with a circle of the same radius as the desired fillet should suffice.
                if (!populateShardPointsFromReferenceCircle(filletRadius, commonProperty[0].point, commonProperty, opts)) {
                    return null;
                }

                //get "parallel" guidelines
                var guidePaths: IPath[] = [];
                for (var i = 0; i < 2; i++) {
                    var otherPathShardPoint = commonProperty[1 - i].shardPoint;
                    if (!otherPathShardPoint) {
                        return null;
                    }
                    var guidePath = getGuidePath(commonProperty[i], filletRadius, otherPathShardPoint);
                    guidePaths.push(guidePath);
                }

                //the center of the fillet is the point where the guidelines intersect.
                var intersectionPoint = intersection(guidePaths[0], guidePaths[1]);
                if (intersectionPoint) {

                    var center: IPoint;

                    //if guidelines intersect in more than one place, choose the closest one.
                    if (intersectionPoint.intersectionPoints.length == 1) {
                        center = intersectionPoint.intersectionPoints[0];
                    } else {
                        center = point.closest(commonProperty[0].point, intersectionPoint.intersectionPoints);
                    }

                    //get the angles of the fillet and a function which clips the path to the fillet.
                    var results: IFilletResult[] = [];
                    for (var i = 0; i < 2; i++) {
                        var result = getFilletResult(commonProperty[i], filletRadius, center);
                        if (!result) {
                            return null;
                        }
                        results.push(result);
                    }

                    var filletArc = new paths.Arc(center, filletRadius, results[0].filletAngle, results[1].filletAngle);
                    var filletSpan = measure.arcAngle(filletArc);

                    //the algorithm is only valid for fillet less than 180 degrees
                    if (filletSpan == 180) {
                        return null;
                    }

                    if (filletSpan > 180) {
                        //swap to make smallest angle
                        filletArc.startAngle = results[1].filletAngle;
                        filletArc.endAngle = results[0].filletAngle;
                    }

                    //clip the paths and return the fillet arc.
                    results[0].clipPath();
                    results[1].clipPath();

                    return filletArc;
                }
            }
        }
        return null;
    }
}
