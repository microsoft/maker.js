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
        tangent?: IPoint;
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
        var points = pathToInspect.type === pathType.Arc
            ? [(<IPathArc>pathToInspect).startAngle, (<IPathArc>pathToInspect).endAngle].map(a => {
                var arc = <IPathArc>pathToInspect;
                var radians = angle.toRadians(a);
                return point.add(arc.origin, [arc.radius * Math.cos(radians), arc.radius * Math.sin(radians)]);
            })
            : point.fromPathEnds(pathToInspect);
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

        if (!pathAProperties || !pathBProperties) return null;

        var result: IMatchPointProperty[] = null;
        var matchingDistance = options && options.pointMatchingDistance != null ? options.pointMatchingDistance : .0001;
        var closestDistance = Infinity;

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
            var distance = measure.pointDistance(pathAProperties[iA].point, pathBProperties[iB].point);
            if (distance <= matchingDistance && distance < closestDistance) {
                closestDistance = distance;
                result = [
                    makeMatch(pathA, pathAProperties, iA),
                    makeMatch(pathB, pathBProperties, iB)
                ];
                return true;
            }
            return false;
        }

        check(0, 0);
        check(0, 1);
        check(1, 0);
        check(1, 1);

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
    function getFilletTangent(context: IMatchPointProperty): IPoint {
        if (context.path.type === pathType.Line) {
            var delta = point.subtract(context.oppositePoint, context.point);
            var length = measure.pointDistance(context.point, context.oppositePoint);
            return [delta[0] / length, delta[1] / length];
        }
        return arcTangent(context.path[context.propertyName], context.isStart);
    }

    /**
     * @private
     */
    function arcTangent(degrees: number, isStart: boolean): IPoint {
        var radians = angle.toRadians(degrees);
        var sign = isStart ? 1 : -1;
        return [-sign * Math.sin(radians), sign * Math.cos(radians)];
    }

    /**
     * @private
     */
    function getGuidePath(context: IMatchPointProperty, filletRadius: number, side: number): IPath {
        if (context.path.type === pathType.Arc) {
            var arc = <IPathArc>context.path;
            var guideRadius = arc.radius - side * (context.isStart ? 1 : -1) * filletRadius;
            return guideRadius > 0 ? new paths.Circle(arc.origin, guideRadius) : null;
        }
        var tangent = getFilletTangent(context);
        var offset: IPoint = [-tangent[1] * side * filletRadius, tangent[0] * side * filletRadius];
        var line = <IPathLine>context.path;
        return new paths.Line(point.add(line.origin, offset), point.add(line.end, offset));
    }

    /**
     * Intersect the supporting guides without rounding coordinates to a fixed drawing unit.
     * The resulting tangent points are checked against the original finite paths below.
     * @private
     */
    function intersectFilletGuides(a: IPath, b: IPath): IPoint[] {
        function cross(u: IPoint, v: IPoint): number {
            return u[0] * v[1] - u[1] * v[0];
        }
        function along(origin: IPoint, direction: IPoint, distance: number): IPoint {
            return [origin[0] + direction[0] * distance, origin[1] + direction[1] * distance];
        }
        function direction(line: IPathLine): IPoint {
            var delta = point.subtract(line.end, line.origin);
            var length = measure.pointDistance(line.origin, line.end);
            return [delta[0] / length, delta[1] / length];
        }
        if (a.type === pathType.Line && b.type === pathType.Line) {
            var u = direction(<IPathLine>a), v = direction(<IPathLine>b);
            var determinant = cross(u, v);
            if (Math.abs(determinant) < 1e-12) return [];
            return [along(a.origin, u, cross(point.subtract(b.origin, a.origin), v) / determinant)];
        }
        if (a.type === pathType.Line || b.type === pathType.Line) {
            var line = <IPathLine>(a.type === pathType.Line ? a : b);
            var circle = <IPathCircle>(a.type === pathType.Line ? b : a);
            var unit = direction(line);
            var delta = point.subtract(circle.origin, line.origin);
            var perpendicular = cross(delta, unit);
            if (Math.abs(perpendicular) > circle.radius) return [];
            var projection = delta[0] * unit[0] + delta[1] * unit[1];
            var halfChord = Math.sqrt(Math.max(0, (circle.radius - Math.abs(perpendicular)) * (circle.radius + Math.abs(perpendicular))));
            return [along(line.origin, unit, projection - halfChord), along(line.origin, unit, projection + halfChord)];
        }
        var c1 = <IPathCircle>a, c2 = <IPathCircle>b;
        var distance = measure.pointDistance(c1.origin, c2.origin);
        if (!distance || distance > c1.radius + c2.radius || distance < Math.abs(c1.radius - c2.radius)) return [];
        var unit: IPoint = [(c2.origin[0] - c1.origin[0]) / distance, (c2.origin[1] - c1.origin[1]) / distance];
        var chordDistance = ((c1.radius - c2.radius) * (c1.radius + c2.radius) / distance + distance) / 2;
        var halfChord = Math.sqrt(Math.max(0, (c1.radius - chordDistance) * (c1.radius + chordDistance)));
        var middle = along(c1.origin, unit, chordDistance);
        var normal: IPoint = [-unit[1], unit[0]];
        return [along(middle, normal, halfChord), along(middle, normal, -halfChord)];
    }

    /**
     * @private
     */
    var filletResultMap: { [pathType: string]: (pathContext: IPath, propertyName: string, filletRadius: number, filletCenter: IPoint) => IFilletResult } = {};

    filletResultMap[pathType.Arc] = function (arc: IPathArc, propertyName: string, filletRadius: number, filletCenter: IPoint) {
        var guideLine = new paths.Line(arc.origin, filletCenter);
        var guideLineAngle = angle.ofLineInDegrees(guideLine);
        var filletAngle = guideLineAngle;
        var isStart = propertyName === 'startAngle';
        var travel = angle.noRevolutions(isStart ? guideLineAngle - arc.startAngle : arc.endAngle - guideLineAngle);
        if (!(travel > 0 && travel < angle.ofArcSpan(arc))) return null;
        var clipAngle = isStart ? arc.startAngle + travel : arc.endAngle - travel;

        //the context is an arc and the fillet is an arc so they will be tangent. If the fillet is external to the arc then the tangent is opposite.
        if (measure.pointDistance(arc.origin, filletCenter) > arc.radius) {
            filletAngle += 180;
        }

        return {
            filletAngle: angle.noRevolutions(filletAngle),
            tangent: arcTangent(clipAngle, isStart),
            clipPath: function () {
                arc[propertyName] = clipAngle;
            }
        };
    };

    filletResultMap[pathType.Line] = function (line: IPathLine, propertyName: string, filletRadius: number, filletCenter: IPoint) {
        var delta = point.subtract(line.end, line.origin);
        var centerDelta = point.subtract(filletCenter, line.origin);
        var lengthSquared = delta[0] * delta[0] + delta[1] * delta[1];
        var ratio = (centerDelta[0] * delta[0] + centerDelta[1] * delta[1]) / lengthSquared;
        if (ratio > 0 && ratio < 1) {
            var intersectionPoint: IPoint = [line.origin[0] + ratio * delta[0], line.origin[1] + ratio * delta[1]];
            var sign = propertyName === 'origin' ? 1 : -1;
            var length = Math.sqrt(lengthSquared);
            return {
                filletAngle: angle.ofPointInDegrees(filletCenter, intersectionPoint),
                tangent: [sign * delta[0] / length, sign * delta[1] / length],
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

        if (!testFilletResult(context, result, filletCenter, filletRadius)) {
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
    function testFilletResult(context: IMatchPointProperty, result: IFilletResult, filletCenter?: IPoint, filletRadius?: number): boolean {
        var test = false;

        if (result) {

            //temporarily clip the path.
            var originalValue = context.path[context.propertyName];
            result.clipPath();

            //don't allow a fillet which effectivly eliminates the path.
            if (measure.pathLength(context.path) > 0) {
                test = true;
            }

            if (test && filletCenter) {
                //Large coordinate / radius ratios can lose the small offset which
                //makes the circles tangent. Never return a disconnected fillet.
                var endpoint = getPointProperties(context.path)[context.isStart ? 0 : 1].point;
                var radians = angle.toRadians(result.filletAngle);
                var filletPoint = point.add(filletCenter, [filletRadius * Math.cos(radians), filletRadius * Math.sin(radians)]);
                test = measure.pointDistance(endpoint, filletPoint) <= filletRadius * 1e-7;
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
            var commonProperty = getMatchingPointProperties(lineA, lineB, opts);
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
     * Adds a round corner to the inside angle between 2 lines or arcs. The paths must meet at one endpoint.
     *
     * @param pathA First path to fillet, which will be modified to fit the fillet.
     * @param pathB Second path to fillet, which will be modified to fit the fillet.
     * @param filletRadius Radius of the fillet.
     * @param options Optional IPointMatchOptions object to specify pointMatchingDistance (default .005 drawing units).
     * @returns Arc path object with a span below 180 degrees, or null if it cannot fit or numerical precision is insufficient. On failure the paths are unchanged.
     */
    export function fillet(pathA: IPath, pathB: IPath, filletRadius: number, options?: IPointMatchOptions): IPathArc {

        function validPath(p: IPath): boolean {
            function finitePoint(value: IPoint): boolean {
                return isPoint(value) && isFinite(value[0]) && isFinite(value[1]);
            }
            if (!p || !finitePoint(p.origin)) return false;
            if (isPathLine(p)) {
                return finitePoint((<IPathLine>p).end) && measure.pathLength(p) > 0;
            }
            if (isPathArc(p)) {
                var arc = <IPathArc>p;
                return isFinite(arc.radius) && arc.radius > 0 && isFinite(arc.startAngle) && isFinite(arc.endAngle)
                    && angle.ofArcSpan(arc) > 0 && angle.ofArcSpan(arc) < 360;
            }
            return false;
        }

        if (pathA !== pathB && validPath(pathA) && validPath(pathB) && isNumber(filletRadius) && isFinite(filletRadius) && filletRadius > 0) {

            var opts: IPointMatchOptions = {
                pointMatchingDistance: .005
            };
            extendObject(opts, options);

            //first find the common point
            if (!(opts.pointMatchingDistance >= 0) || !isFinite(opts.pointMatchingDistance)) return null;
            var commonProperty = getMatchingPointProperties(pathA, pathB, opts);
            if (commonProperty) {
                var tangentA = getFilletTangent(commonProperty[0]);
                var tangentB = getFilletTangent(commonProperty[1]);
                var cross = tangentA[0] * tangentB[1] - tangentA[1] * tangentB[0];
                var side: number;
                if (Math.abs(cross) < 1e-12) {
                    //Opposed tangents already form a smooth join. Equal outward
                    //tangents can form a cusp; curvature determines its inside.
                    if (tangentA[0] * tangentB[0] + tangentA[1] * tangentB[1] < 0) return null;
                    var curvatures = commonProperty.map(context => context.path.type === pathType.Arc
                        ? (context.isStart ? 1 : -1) / (<IPathArc>context.path).radius : 0);
                    var curvatureDifference = curvatures[1] - curvatures[0];
                    if (!curvatureDifference) return null;
                    side = curvatureDifference > 0 ? 1 : -1;
                } else {
                    side = cross > 0 ? 1 : -1;
                }

                //get "parallel" guidelines
                var guidePaths: IPath[] = [];
                for (var i = 0; i < 2; i++) {
                    var guidePath = getGuidePath(commonProperty[i], filletRadius, i === 0 ? side : -side);
                    if (!guidePath) return null;
                    guidePaths.push(guidePath);
                }

                //Try the nearest center first, but a second intersection may be the one which fits.
                var centers = intersectFilletGuides(guidePaths[0], guidePaths[1]);
                centers.sort((a, b) => measure.pointDistance(commonProperty[0].point, a) - measure.pointDistance(commonProperty[0].point, b));
                for (var c = 0; c < centers.length; c++) {
                    var center = centers[c];
                    if (!isFinite(center[0]) || !isFinite(center[1])) continue;

                    //get the angles of the fillet and a function which clips the path to the fillet.
                    var results: IFilletResult[] = [];
                    for (var i = 0; i < 2; i++) {
                        var result = getFilletResult(commonProperty[i], filletRadius, center);
                        if (!result) break;
                        results.push(result);
                    }
                    if (results.length !== 2) continue;

                    //the two paths may actually be on the same line
                    if (measure.isAngleEqual(results[0].filletAngle, results[1].filletAngle, .0000001)) continue;

                    var filletArc = new paths.Arc(center, filletRadius, results[0].filletAngle, results[1].filletAngle);
                    var filletSpan = angle.ofArcSpan(filletArc);

                    //the algorithm is only valid for fillet less than 180 degrees
                    if (round(filletSpan) == 180) {
                        continue;
                    }

                    if (filletSpan > 180) {
                        //swap to make smallest angle
                        filletArc.startAngle = results[1].filletAngle;
                        filletArc.endAngle = results[0].filletAngle;
                    }

                    //Both paths must lead away from the fillet, rather than folding back into it.
                    var smooth = true;
                    for (var i = 0; i < 2; i++) {
                        var intoFillet = arcTangent(results[i].filletAngle, filletArc.startAngle === results[i].filletAngle);
                        var tangent = results[i].tangent;
                        if (intoFillet[0] * tangent[0] + intoFillet[1] * tangent[1] >= 0) smooth = false;
                    }
                    if (!smooth) continue;

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
