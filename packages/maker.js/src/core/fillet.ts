namespace MakerJs.path {

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
    var propertyNamesMap: { [pathType: string]: (pathToInspect: IPath) => string[] } = {};

    propertyNamesMap[pathType.Arc] = function (arc: IPathArc) {
        return ['startAngle', 'endAngle'];
    };

    propertyNamesMap[pathType.Line] = function (line: IPathLine) {
        return ['origin', 'end'];
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

            var fn = propertyNamesMap[pathToInspect.type];
            if (fn) {
                propertyNames = fn(pathToInspect);

                return [pointProperty(0), pointProperty(1)];
            }
        }
        return null;
    }

    /**
     * @private
     */
    function getMatchingPointProperties(pathA: IPath, pathB: IPath, options?: IPointMatchOptions): IMatchPointProperty[] {
        var pathAProperties = getPointProperties(pathA);
        var pathBProperties = getPointProperties(pathB);

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

        function check(iA: number, iB: number) {
            if (measure.isPointEqual(pathAProperties[iA].point, pathBProperties[iB].point, .0001)) {
                result = [
                    makeMatch(pathA, pathAProperties, iA),
                    makeMatch(pathB, pathBProperties, iB)
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

            if (measure.isPointEqual(properties[i].point, circleIntersection.intersectionPoints[0], .0001)) {
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
        var shardStart = path.clone(pathToShard);
        var shardEnd = breakAtPoint(shardStart, shardPoint);
        return [shardStart, shardEnd];
    }

    /**
     * @private
     */
    var guidePathMap: { [pathType: string]: (pathContext: IPath, filletRadius: number, nearPoint: IPoint, shardPoint: IPoint, isStart: boolean) => IPath } = {};

    guidePathMap[pathType.Arc] = function (arc: IPathArc, filletRadius: number, nearPoint: IPoint, shardPoint: IPoint, isStart: boolean) {
        var guideRadius = arc.radius;

        //see if the guideline should be external or internal to the context arc.
        var guideArcShard = <IPathArc>cloneAndBreakPath(arc, shardPoint)[isStart ? 0 : 1];
        if (guideArcShard) {
            if (measure.isArcConcaveTowardsPoint(guideArcShard, nearPoint)) {
                guideRadius -= filletRadius;
            } else {
                guideRadius += filletRadius;
            }

            if (round(guideRadius) <= 0) return null;

            return new paths.Arc(arc.origin, guideRadius, arc.startAngle, arc.endAngle);
        }

        return null;
    };

    guidePathMap[pathType.Line] = function (line: IPathLine, filletRadius: number, nearPoint: IPoint, shardPoint: IPoint, isStart: boolean) {
        return new paths.Parallel(line, filletRadius, nearPoint);
    }

    /**
     * @private
     */
    function getGuidePath(context: IMatchPointProperty, filletRadius: number, nearPoint: IPoint): IPath {
        var result: IPath = null;

        var fn = guidePathMap[context.path.type];
        if (fn) {
            result = fn(context.path, filletRadius, nearPoint, context.shardPoint, context.isStart);
        }

        return result;
    }

    /**
     * @private
     */
    var filletResultMap: { [pathType: string]: (pathContext: IPath, propertyName: string, filletRadius: number, filletCenter: IPoint) => IFilletResult } = {};

    filletResultMap[pathType.Arc] = function (arc: IPathArc, propertyName: string, filletRadius: number, filletCenter: IPoint) {
        var guideLine = new paths.Line(arc.origin, filletCenter);
        var guideLineAngle = angle.ofLineInDegrees(guideLine);
        var filletAngle = guideLineAngle;

        //the context is an arc and the fillet is an arc so they will be tangent. If the fillet is external to the arc then the tangent is opposite.
        if (!measure.isArcConcaveTowardsPoint(arc, filletCenter)) {
            filletAngle += 180;
        }

        return {
            filletAngle: angle.noRevolutions(filletAngle),
            clipPath: function () {
                arc[propertyName] = guideLineAngle;
            }
        };
    };

    filletResultMap[pathType.Line] = function (line: IPathLine, propertyName: string, filletRadius: number, filletCenter: IPoint) {
        //make a small vertical line
        var guideLine = new paths.Line([0, 0], [0, 1]);

        //rotate this vertical line the same angle as the line context. It will be perpendicular.
        var lineAngle = angle.ofLineInDegrees(line);
        path.rotate(guideLine, lineAngle, [0, 0]);
        path.moveRelative(guideLine, filletCenter);

        //get the intersection point of the slopes of the context line and the perpendicular line. This is where the fillet meets the line.
        var intersectionPoint = point.fromSlopeIntersection(line, guideLine);
        if (intersectionPoint) {
            return {
                filletAngle: angle.ofPointInDegrees(filletCenter, intersectionPoint),
                clipPath: function () {
                    line[propertyName] = intersectionPoint;
                }
            };
        }

        return null;
    }

    /**
     * @private
     */
    function getFilletResult(context: IMatchPointProperty, filletRadius: number, filletCenter: IPoint): IFilletResult {
        var result: IFilletResult = null;

        var fn = filletResultMap[context.path.type];
        if (fn) {
            result = fn(context.path, context.propertyName, filletRadius, filletCenter);
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
     * @param lineA First line to fillet, which will be modified to fit the fillet.
     * @param lineB Second line to fillet, which will be modified to fit the fillet.
     * @returns Arc path object of the new fillet.
     */
    export function dogbone(lineA: IPathLine, lineB: IPathLine, filletRadius: number, options?: IPointMatchOptions): IPathArc {
        //TODO: allow arcs in dogbone

        if (isPathLine(lineA) && isPathLine(lineB) && filletRadius && filletRadius > 0) {

            var opts: IPointMatchOptions = {
                pointMatchingDistance: .005
            };
            extendObject(opts, options);

            //first find the common point
            var commonProperty = getMatchingPointProperties(lineA, lineB, options);
            if (commonProperty) {

                //get the ratio comparison of the two lines
                var ratio = getLineRatio([lineA, lineB]);

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
     * @param pathA First path to fillet, which will be modified to fit the fillet.
     * @param pathB Second path to fillet, which will be modified to fit the fillet.
     * @param filletRadius Radius of the fillet.
     * @param options Optional IPointMatchOptions object to specify pointMatchingDistance.
     * @returns Arc path object of the new fillet.
     */
    export function fillet(pathA: IPath, pathB: IPath, filletRadius: number, options?: IPointMatchOptions): IPathArc {

        if (pathA && pathB && filletRadius && filletRadius > 0) {

            var opts: IPointMatchOptions = {
                pointMatchingDistance: .005
            };
            extendObject(opts, options);

            //first find the common point
            var commonProperty = getMatchingPointProperties(pathA, pathB, options);
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

                    //the two paths may actually be on the same line
                    if (round(results[0].filletAngle - results[1].filletAngle) == 0) return null;

                    var filletArc = new paths.Arc(center, filletRadius, results[0].filletAngle, results[1].filletAngle);
                    var filletSpan = angle.ofArcSpan(filletArc);

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

namespace MakerJs.chain {

    /**
     * Adds a dogbone fillet between each link in a chain. Each path will be cropped to fit a fillet, and all fillets will be returned as paths in a returned model object. 
     *
     * @param chainToFillet The chain to add fillets to.
     * @param filletRadius Radius of the fillet.
     * @returns Model object containing paths which fillet the joints in the chain.
     */
    export function dogbone(chainToFillet: IChain, filletRadius: number): IModel;

    /**
     * Adds a dogbone fillet between each link in a chain. Each path will be cropped to fit a fillet, and all fillets will be returned as paths in a returned model object. 
     *
     * @param chainToFillet The chain to add fillets to.
     * @param filletRadii Object specifying directional radii.
     * @param filletRadii.left Radius of left turning fillets.
     * @param filletRadii.right Radius of right turning fillets.
     * @returns Model object containing paths which fillet the joints in the chain.
     */
    export function dogbone(chainToFillet: IChain, filletRadii: { left?: number, right?: number }): IModel;

    export function dogbone(chainToFillet: IChain, filletSpec: any): IModel {
        return chainFillet(false, chainToFillet, filletSpec);
    }

    /**
     * Adds a fillet between each link in a chain. Each path will be cropped to fit a fillet, and all fillets will be returned as paths in a returned model object. 
     *
     * @param chainToFillet The chain to add fillets to.
     * @param filletRadius Radius of the fillet.
     * @returns Model object containing paths which fillet the joints in the chain.
     */
    export function fillet(chainToFillet: IChain, filletRadius: number): IModel;

    /**
     * Adds a fillet between each link in a chain. Each path will be cropped to fit a fillet, and all fillets will be returned as paths in a returned model object. 
     *
     * @param chainToFillet The chain to add fillets to.
     * @param filletRadii Object specifying directional radii.
     * @param filletRadii.left Radius of left turning fillets.
     * @param filletRadii.right Radius of right turning fillets.
     * @returns Model object containing paths which fillet the joints in the chain.
     */
    export function fillet(chainToFillet: IChain, filletRadii: { left?: number, right?: number }): IModel;

    export function fillet(chainToFillet: IChain, filletSpec: any): IModel {
        return chainFillet(true, chainToFillet, filletSpec);
    }

    function chainFillet(traditional: boolean, chainToFillet: IChain, filletSpec: any): IModel {
        var result: IModel = { paths: {} };
        var added = 0;
        var links = chainToFillet.links;

        function add(i1: number, i2: number) {
            var p1 = links[i1].walkedPath, p2 = links[i2].walkedPath;

            if (p1.modelContext === p2.modelContext && p1.modelContext.type == models.BezierCurve.typeName) return;

            path.moveTemporary([p1.pathContext, p2.pathContext], [p1.offset, p2.offset], function () {
                let filletRadius: number;
                if (isObject(filletSpec)) {
                    const a = angle.ofChainLinkJoint(links[i1], links[i2]);
                    if (round(a) === 0) return;
                    filletRadius = (a > 0) ? filletSpec.left : filletSpec.right;
                } else {
                    filletRadius = filletSpec;
                }
                if (!filletRadius || filletRadius < 0) return;

                let filletArc: IPathArc;
                if (traditional) {
                    filletArc = path.fillet(p1.pathContext, p2.pathContext, filletRadius);
                } else {
                    filletArc = path.dogbone(p1.pathContext as IPathLine, p2.pathContext as IPathLine, filletRadius);                    
                }
                if (filletArc) {
                    result.paths['fillet' + added] = filletArc;
                    added++;
                }
            });
        }

        for (var i = 1; i < links.length; i++) {
            add(i - 1, i);
        }

        if (chainToFillet.endless) {
            add(i - 1, 0);
        }

        if (!added) return null;

        return result;
    }
}
