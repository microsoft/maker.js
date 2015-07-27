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
        oppositePoint: IPoint;
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
    function getPointProperties(pathToInspect: IPath): IPointProperty[]{

        var result: IPointProperty[] = null;

        var map: IPathFunctionMap = {};

        map[pathType.Arc] = function (arc: IPathArc) {
            var arcPoints = point.fromArc(arc);
            result = [
                { point: arcPoints[0], propertyName: 'startAngle' },
                { point: arcPoints[1], propertyName: 'endAngle' }
            ];
        };

        map[pathType.Line] = function (line: IPathLine) {
            result = [
                { point: line.origin, propertyName: 'origin' },
                { point: line.end, propertyName: 'end' }
            ];
        }

        var fn = map[pathToInspect.type];
        if (fn) {
            fn(pathToInspect);
        }

        return result;
    }

    /**
     * @private
     */
    function getMatchingPointProperties(path1: IPath, path2: IPath): IMatchPointProperty[] {
        var path1Properties = getPointProperties(path1);
        var path2Properties = getPointProperties(path2);

        var result: IMatchPointProperty[] = null;

        function makeMatch(pointProperties: IPointProperty[], index: number): IMatchPointProperty {
            return {
                propertyName: pointProperties[index].propertyName,
                point: pointProperties[index].point,
                oppositePoint: pointProperties[1 - index].point
            };
        }

        function check(i1: number, i2: number) {
            if (point.areEqualRounded(path1Properties[i1].point, path2Properties[i2].point)) {
                result = [
                    makeMatch(path1Properties, i1),
                    makeMatch(path2Properties, i2)
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
    function getGuidePath(originalPath: IPath, delta: number, nearPoint: IPoint): IPath {
        var result: IPath = null;

        var map: IPathFunctionMap = {};

        map[pathType.Arc] = function (arc: IPathArc) {
            var radius = arc.radius + delta * (measure.isArcConcaveTowardsPoint(arc, nearPoint) ? -1 : 1);
            result = new paths.Arc(arc.origin, radius, arc.startAngle, arc.endAngle);
        };

        map[pathType.Line] = function (line: IPathLine) {
            result = new paths.Parallel(line, delta, nearPoint);
        }

        var fn = map[originalPath.type];
        if (fn) {
            fn(originalPath);
        }

        return result;
    }

    /**
     * @private
     */
    function getFilletResult(pathToFillet: IPath, propertyName: string, filletRadius: number, filletCenter: IPoint): IFilletResult {

        var result: IFilletResult = null;

        var map: IPathFunctionMap = {};

        map[pathType.Arc] = function (arc: IPathArc) {
            var guideLine = new paths.Line(arc.origin, filletCenter);
            var guideLineAngle = angle.ofLineInDegrees(guideLine);

            result = {
                filletAngle: guideLineAngle + (measure.isArcConcaveTowardsPoint(arc, filletCenter) ? 0: 180),
                clipPath: function () {
                    arc[propertyName] = guideLineAngle;
                }
            };
        };

        map[pathType.Line] = function (line: IPathLine) {
            var lineAngle = angle.ofLineInDegrees(line);
            var guideLine = new paths.Line([-filletRadius - 1, 0], [filletRadius + 1, 0]);
            path.moveRelative(guideLine, filletCenter);
            path.rotate(guideLine, lineAngle + 90, filletCenter);
            var intersectionPoint = intersection(line, guideLine);
            if (intersectionPoint) {
                result = {
                    filletAngle: angle.toDegrees(angle.ofPointInRadians(filletCenter, intersectionPoint.intersectionPoints[0])),
                    clipPath: function () {
                        line[propertyName] = intersectionPoint.intersectionPoints[0];
                    }
                };
            }
        }

        var fn = map[pathToFillet.type];
        if (fn) {
            fn(pathToFillet);
        }

        if (result) {

            var originalValue = pathToFillet[propertyName];
            result.clipPath();

            if (measure.pathLength(pathToFillet) == 0) {
                result = null;
            }

            pathToFillet[propertyName] = originalValue;
        }

        return result;
    }


    /**
     * Adds a round corner to the inside angle between 2 paths. The paths must meet at one point.
     *
     * @param path1 First path to fillet, which will be modified to fit the fillet.
     * @param path2 Second path to fillet, which will be modified to fit the fillet.
     * @returns Arc path object of the new fillet.
     */
    export function fillet(path1: IPath, path2: IPath, filletRadius: number): IPath {

        if (path1 && path2 && filletRadius) {

            //first find the common point
            var commonProperty = getMatchingPointProperties(path1, path2);
            if (commonProperty) {

                var pathsToFillet = [path1, path2];

                //special case when both ends touch each other, as in the case of 2 arcs or an arc chord
                if (point.areEqualRounded(commonProperty[0].oppositePoint, commonProperty[1].oppositePoint)) {
                    for (var i = 2; i--;) {
                        //use halfway point instead of endpoint for the opposite
                        commonProperty[i].oppositePoint = point.middle(pathsToFillet[i]);
                    }
                }

                //get "parallel" guidelines
                var guidePaths: IPath[] = [];
                for (var i = 0; i < 2; i++) {
                    guidePaths.push(getGuidePath(pathsToFillet[i], filletRadius, commonProperty[1 - i].oppositePoint));
                }

                var intersectionPoint = intersection(guidePaths[0], guidePaths[1]);
                if (intersectionPoint) {

                    var center: IPoint;

                    if (intersectionPoint.intersectionPoints.length == 1) {
                        center = intersectionPoint.intersectionPoints[0];
                    } else {
                        center = point.closest(commonProperty[0].point, intersectionPoint.intersectionPoints);
                    }

                    var results: IFilletResult[] = [];
                    for (var i = 0; i < 2; i++) {
                        var result = getFilletResult(pathsToFillet[i], commonProperty[i].propertyName, filletRadius, center)
                        if (!result) {
                            return null;
                        }
                        results.push(result);
                    }

                    var arc = new paths.Arc(center, filletRadius, results[0].filletAngle, results[1].filletAngle);

                    //the algorithm is only valid for fillet less than 180 degrees
                    if (measure.arcAngle(arc) == 180) {
                        return null;
                    }

                    if (measure.arcAngle(arc) > 180) {
                        //swap to make smallest angle
                        arc.startAngle = results[1].filletAngle;
                        arc.endAngle = results[0].filletAngle;
                    }

                    results[0].clipPath();
                    results[1].clipPath();

                    return arc;
                }
            }
        }
        return null;
    }
}
