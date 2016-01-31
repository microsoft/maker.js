/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0
 
THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.
 
See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
//https://github.com/Microsoft/maker.js
/**
 * Root module for Maker.js.
 *
 * Example: get a reference to Maker.js
 * ```
 * var makerjs = require('makerjs');
 * ```
 *
 */
var MakerJs;
(function (MakerJs) {
    //units
    /**
     * String-based enumeration of unit types: imperial, metric or otherwise.
     * A model may specify the unit system it is using, if any. When importing a model, it may have different units.
     * Unit conversion function is makerjs.units.conversionScale().
     * Important: If you add to this, you must also add a corresponding conversion ratio in the unit.ts file!
     */
    MakerJs.unitType = {
        Centimeter: 'cm',
        Foot: 'foot',
        Inch: 'inch',
        Meter: 'm',
        Millimeter: 'mm'
    };
    /**
     * Numeric rounding
     *
     * Example: round to 3 decimal places
     * ```
     * makerjs.round(3.14159, .001); //returns 3.142
     * ```
     *
     * @param n The number to round off.
     * @param accuracy Optional exemplar of number of decimal places.
     */
    function round(n, accuracy) {
        if (accuracy === void 0) { accuracy = .0000001; }
        var places = 1 / accuracy;
        return Math.round(n * places) / places;
    }
    MakerJs.round = round;
    /**
     * Clone an object.
     *
     * @param objectToClone The object to clone.
     * @returns A new clone of the original object.
     */
    function cloneObject(objectToClone) {
        var serialized = JSON.stringify(objectToClone);
        return JSON.parse(serialized);
    }
    MakerJs.cloneObject = cloneObject;
    /**
     * Copy the properties from one object to another object.
     *
     * Example:
     * ```
     * makerjs.extendObject({ abc: 123 }, { xyz: 789 }); //returns { abc: 123, xyz: 789 }
     * ```
     *
     * @param target The object to extend. It will receive the new properties.
     * @param other An object containing properties to merge in.
     * @returns The original object after merging.
     */
    function extendObject(target, other) {
        if (target && other) {
            for (var key in other) {
                if (typeof other[key] !== 'undefined') {
                    target[key] = other[key];
                }
            }
        }
        return target;
    }
    MakerJs.extendObject = extendObject;
    /**
     * Test to see if an object implements the required properties of a point.
     *
     * @param item The item to test.
     */
    function isPoint(item) {
        return (Array.isArray(item) && item.length == 2 && !isNaN(item[0]) && !isNaN(item[1]));
    }
    MakerJs.isPoint = isPoint;
    /**
     * Test to see if an object implements the required properties of a path.
     *
     * @param item The item to test.
     */
    function isPath(item) {
        return item && item.type && item.origin;
    }
    MakerJs.isPath = isPath;
    /**
     * Test to see if an object implements the required properties of a line.
     *
     * @param item The item to test.
     */
    function isPathLine(item) {
        return isPath(item) && item.type == MakerJs.pathType.Line && item.end;
    }
    MakerJs.isPathLine = isPathLine;
    /**
     * Test to see if an object implements the required properties of a circle.
     *
     * @param item The item to test.
     */
    function isPathCircle(item) {
        return isPath(item) && item.type == MakerJs.pathType.Circle && item.radius;
    }
    MakerJs.isPathCircle = isPathCircle;
    /**
     * Test to see if an object implements the required properties of an arc.
     *
     * @param item The item to test.
     */
    function isPathArc(item) {
        return isPath(item) && item.type == MakerJs.pathType.Arc && item.radius && item.startAngle && item.endAngle;
    }
    MakerJs.isPathArc = isPathArc;
    /**
     * String-based enumeration of all paths types.
     *
     * Examples: use pathType instead of string literal when creating a circle.
     * ```
     * var circle: IPathCircle = { type: pathType.Circle, origin: [0, 0], radius: 7 };   //typescript
     * var circle = { type: pathType.Circle, origin: [0, 0], radius: 7 };   //javascript
     * ```
     */
    MakerJs.pathType = {
        Line: "line",
        Circle: "circle",
        Arc: "arc"
    };
    /**
     * Test to see if an object implements the required properties of a model.
     */
    function isModel(item) {
        return item && (item.paths || item.models);
    }
    MakerJs.isModel = isModel;
})(MakerJs || (MakerJs = {}));
//CommonJs
module.exports = MakerJs;
var MakerJs;
(function (MakerJs) {
    var angle;
    (function (angle) {
        /**
         * Find out if two angles are equal.
         *
         * @param a First angle.
         * @param b Second angle.
         * @returns true if angles are the same, false if they are not
         */
        function areEqual(angle1, angle2, accuracy) {
            if (accuracy === void 0) { accuracy = .0001; }
            var a1 = noRevolutions(angle1);
            var a2 = noRevolutions(angle2);
            var d = noRevolutions(MakerJs.round(a2 - a1, accuracy));
            return d == 0;
        }
        angle.areEqual = areEqual;
        /**
         * Ensures an angle is not greater than 360
         *
         * @param angleInDegrees Angle in degrees.
         * @retiurns Same polar angle but not greater than 360 degrees.
         */
        function noRevolutions(angleInDegrees) {
            var revolutions = Math.floor(angleInDegrees / 360);
            var a = angleInDegrees - (360 * revolutions);
            return a < 0 ? a + 360 : a;
        }
        angle.noRevolutions = noRevolutions;
        /**
         * Convert an angle from degrees to radians.
         *
         * @param angleInDegrees Angle in degrees.
         * @returns Angle in radians.
         */
        function toRadians(angleInDegrees) {
            return noRevolutions(angleInDegrees) * Math.PI / 180.0;
        }
        angle.toRadians = toRadians;
        /**
         * Convert an angle from radians to degrees.
         *
         * @param angleInRadians Angle in radians.
         * @returns Angle in degrees.
         */
        function toDegrees(angleInRadians) {
            return angleInRadians * 180.0 / Math.PI;
        }
        angle.toDegrees = toDegrees;
        /**
         * Get an arc's end angle, ensured to be greater than its start angle.
         *
         * @param arc An arc path object.
         * @returns End angle of arc.
         */
        function ofArcEnd(arc) {
            //compensate for values past zero. This allows easy compute of total angle size.
            //for example 0 = 360
            if (arc.endAngle < arc.startAngle) {
                return 360 + arc.endAngle;
            }
            return arc.endAngle;
        }
        angle.ofArcEnd = ofArcEnd;
        /**
         * Get the angle in the middle of an arc's start and end angles.
         *
         * @param arc An arc path object.
         * @param ratio Optional number between 0 and 1 specifying percentage between start and end angles. Default is .5
         * @returns Middle angle of arc.
         */
        function ofArcMiddle(arc, ratio) {
            if (ratio === void 0) { ratio = .5; }
            return arc.startAngle + MakerJs.measure.arcAngle(arc) * ratio;
        }
        angle.ofArcMiddle = ofArcMiddle;
        /**
         * Angle of a line path.
         *
         * @param line The line path to find the angle of.
         * @returns Angle of the line path, in degrees.
         */
        function ofLineInDegrees(line) {
            return noRevolutions(toDegrees(ofPointInRadians(line.origin, line.end)));
        }
        angle.ofLineInDegrees = ofLineInDegrees;
        /**
         * Angle of a line through a point, in degrees.
         *
         * @param pointToFindAngle The point to find the angle.
         * @param origin Point of origin of the angle.
         * @returns Angle of the line throught the point, in degrees.
         */
        function ofPointInDegrees(origin, pointToFindAngle) {
            return toDegrees(ofPointInRadians(origin, pointToFindAngle));
        }
        angle.ofPointInDegrees = ofPointInDegrees;
        /**
         * Angle of a line through a point, in radians.
         *
         * @param pointToFindAngle The point to find the angle.
         * @param origin Point of origin of the angle.
         * @returns Angle of the line throught the point, in radians.
         */
        function ofPointInRadians(origin, pointToFindAngle) {
            var d = MakerJs.point.subtract(pointToFindAngle, origin);
            var x = d[0];
            var y = d[1];
            return Math.atan2(-y, -x) + Math.PI;
        }
        angle.ofPointInRadians = ofPointInRadians;
        /**
         * Mirror an angle on either or both x and y axes.
         *
         * @param angleInDegrees The angle to mirror.
         * @param mirrorX Boolean to mirror on the x axis.
         * @param mirrorY Boolean to mirror on the y axis.
         * @returns Mirrored angle.
         */
        function mirror(angleInDegrees, mirrorX, mirrorY) {
            if (mirrorY) {
                angleInDegrees = 360 - angleInDegrees;
            }
            if (mirrorX) {
                angleInDegrees = (angleInDegrees < 180 ? 180 : 540) - angleInDegrees;
            }
            return angleInDegrees;
        }
        angle.mirror = mirror;
    })(angle = MakerJs.angle || (MakerJs.angle = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var point;
    (function (point) {
        /**
         * Add two points together and return the result as a new point object.
         *
         * @param a First point.
         * @param b Second point.
         * @param subtract Optional boolean to subtract instead of add.
         * @returns A new point object.
         */
        function add(a, b, subtract) {
            var newPoint = clone(a);
            if (!b)
                return newPoint;
            for (var i = 2; i--;) {
                if (subtract) {
                    newPoint[i] -= b[i];
                }
                else {
                    newPoint[i] += b[i];
                }
            }
            return newPoint;
        }
        point.add = add;
        /**
         * Find out if two points are equal.
         *
         * @param a First point.
         * @param b Second point.
         * @returns true if points are the same, false if they are not
         */
        function areEqual(a, b, withinDistance) {
            if (!withinDistance) {
                return a[0] == b[0] && a[1] == b[1];
            }
            else {
                var distance = MakerJs.measure.pointDistance(a, b);
                return distance <= withinDistance;
            }
        }
        point.areEqual = areEqual;
        /**
         * Find out if two points are equal after rounding.
         *
         * @param a First point.
         * @param b Second point.
         * @param accuracy Optional exemplar of number of decimal places.
         * @returns true if points are the same, false if they are not
         */
        function areEqualRounded(a, b, accuracy) {
            if (accuracy === void 0) { accuracy = .0000001; }
            return MakerJs.round(a[0], accuracy) == MakerJs.round(b[0], accuracy) && MakerJs.round(a[1], accuracy) == MakerJs.round(b[1], accuracy);
        }
        point.areEqualRounded = areEqualRounded;
        /**
         * Get the average of two points.
         *
         * @param a First point.
         * @param b Second point.
         * @returns New point object which is the average of a and b.
         */
        function average(a, b) {
            function avg(i) {
                return (a[i] + b[i]) / 2;
            }
            return [avg(0), avg(1)];
        }
        point.average = average;
        /**
         * Clone a point into a new point.
         *
         * @param pointToClone The point to clone.
         * @returns A new point with same values as the original.
         */
        function clone(pointToClone) {
            if (!pointToClone)
                return point.zero();
            return [pointToClone[0], pointToClone[1]];
        }
        point.clone = clone;
        /**
         * From an array of points, find the closest point to a given reference point.
         *
         * @param referencePoint The reference point.
         * @param pointOptions Array of points to choose from.
         * @returns The first closest point from the pointOptions.
         */
        function closest(referencePoint, pointOptions) {
            var smallest = {
                index: 0,
                distance: -1
            };
            for (var i = 0; i < pointOptions.length; i++) {
                var distance = MakerJs.measure.pointDistance(referencePoint, pointOptions[i]);
                if (smallest.distance == -1 || distance < smallest.distance) {
                    smallest.distance = distance;
                    smallest.index = i;
                }
            }
            return pointOptions[smallest.index];
        }
        point.closest = closest;
        /**
         * Get a point from its polar coordinates.
         *
         * @param angleInRadians The angle of the polar coordinate, in radians.
         * @param radius The radius of the polar coordinate.
         * @returns A new point object.
         */
        function fromPolar(angleInRadians, radius) {
            return [
                radius * Math.cos(angleInRadians),
                radius * Math.sin(angleInRadians)
            ];
        }
        point.fromPolar = fromPolar;
        /**
         * Get a point on a circle or arc path, at a given angle.
         * @param angleInDegrees The angle at which you want to find the point, in degrees.
         * @param circle A circle or arc.
         * @returns A new point object.
         */
        function fromAngleOnCircle(angleInDegrees, circle) {
            return add(circle.origin, fromPolar(MakerJs.angle.toRadians(angleInDegrees), circle.radius));
        }
        point.fromAngleOnCircle = fromAngleOnCircle;
        /**
         * Get the two end points of an arc path.
         *
         * @param arc The arc path object.
         * @returns Array with 2 elements: [0] is the point object corresponding to the start angle, [1] is the point object corresponding to the end angle.
         */
        function fromArc(arc) {
            return [fromAngleOnCircle(arc.startAngle, arc), fromAngleOnCircle(arc.endAngle, arc)];
        }
        point.fromArc = fromArc;
        /**
         * Get the two end points of a path.
         *
         * @param pathContext The path object.
         * @returns Array with 2 elements: [0] is the point object corresponding to the origin, [1] is the point object corresponding to the end.
         */
        function fromPathEnds(pathContext) {
            var result = null;
            var map = {};
            map[MakerJs.pathType.Arc] = function (arc) {
                result = point.fromArc(arc);
            };
            map[MakerJs.pathType.Line] = function (line) {
                result = [line.origin, line.end];
            };
            var fn = map[pathContext.type];
            if (fn) {
                fn(pathContext);
            }
            return result;
        }
        point.fromPathEnds = fromPathEnds;
        /**
         * Get the middle point of a path.
         *
         * @param pathContext The path object.
         * @param ratio Optional ratio (between 0 and 1) of point along the path. Default is .5 for middle.
         * @returns Point on the path, in the middle of the path.
         */
        function middle(pathContext, ratio) {
            if (ratio === void 0) { ratio = .5; }
            var midPoint = null;
            var map = {};
            map[MakerJs.pathType.Arc] = function (arc) {
                var midAngle = MakerJs.angle.ofArcMiddle(arc, ratio);
                midPoint = point.add(arc.origin, point.fromPolar(MakerJs.angle.toRadians(midAngle), arc.radius));
            };
            map[MakerJs.pathType.Circle] = function (circle) {
                midPoint = point.add(circle.origin, [-circle.radius, 0]);
            };
            map[MakerJs.pathType.Line] = function (line) {
                function ration(a, b) {
                    return a + (b - a) * ratio;
                }
                ;
                midPoint = [
                    ration(line.origin[0], line.end[0]),
                    ration(line.origin[1], line.end[1])
                ];
            };
            var fn = map[pathContext.type];
            if (fn) {
                fn(pathContext);
            }
            return midPoint;
        }
        point.middle = middle;
        /**
         * Create a clone of a point, mirrored on either or both x and y axes.
         *
         * @param pointToMirror The point to mirror.
         * @param mirrorX Boolean to mirror on the x axis.
         * @param mirrorY Boolean to mirror on the y axis.
         * @returns Mirrored point.
         */
        function mirror(pointToMirror, mirrorX, mirrorY) {
            var p = clone(pointToMirror);
            if (mirrorX) {
                p[0] = -p[0];
            }
            if (mirrorY) {
                p[1] = -p[1];
            }
            return p;
        }
        point.mirror = mirror;
        /**
         * Round the values of a point.
         *
         * @param pointContext The point to serialize.
         * @param accuracy Optional exemplar number of decimal places.
         * @returns A new point with the values rounded.
         */
        function rounded(pointContext, accuracy) {
            return [MakerJs.round(pointContext[0], accuracy), MakerJs.round(pointContext[1], accuracy)];
        }
        point.rounded = rounded;
        /**
         * Rotate a point.
         *
         * @param pointToRotate The point to rotate.
         * @param angleInDegrees The amount of rotation, in degrees.
         * @param rotationOrigin The center point of rotation.
         * @returns A new point.
         */
        function rotate(pointToRotate, angleInDegrees, rotationOrigin) {
            var pointAngleInRadians = MakerJs.angle.ofPointInRadians(rotationOrigin, pointToRotate);
            var d = MakerJs.measure.pointDistance(rotationOrigin, pointToRotate);
            var rotatedPoint = fromPolar(pointAngleInRadians + MakerJs.angle.toRadians(angleInDegrees), d);
            return add(rotationOrigin, rotatedPoint);
        }
        point.rotate = rotate;
        /**
         * Scale a point's coordinates.
         *
         * @param pointToScale The point to scale.
         * @param scaleValue The amount of scaling.
         * @returns A new point.
         */
        function scale(pointToScale, scaleValue) {
            var p = clone(pointToScale);
            for (var i = 2; i--;) {
                p[i] *= scaleValue;
            }
            return p;
        }
        point.scale = scale;
        /**
         * Get a string representation of a point.
         *
         * @param pointContext The point to serialize.
         * @param accuracy Optional exemplar of number of decimal places.
         * @returns String representing the point.
         */
        function serialize(pointContext, accuracy) {
            var roundedPoint = rounded(pointContext, accuracy);
            return JSON.stringify(roundedPoint);
        }
        point.serialize = serialize;
        /**
         * Subtract a point from another point, and return the result as a new point. Shortcut to Add(a, b, subtract = true).
         *
         * @param a First point.
         * @param b Second point.
         * @returns A new point object.
         */
        function subtract(a, b) {
            return add(a, b, true);
        }
        point.subtract = subtract;
        /**
         * A point at 0,0 coordinates.
         * NOTE: It is important to call this as a method, with the empty parentheses.
         *
         * @returns A new point.
         */
        function zero() {
            return [0, 0];
        }
        point.zero = zero;
    })(point = MakerJs.point || (MakerJs.point = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var path;
    (function (path) {
        /**
         * @private
         */
        var pathAreEqualMap = {};
        pathAreEqualMap[MakerJs.pathType.Line] = function (line1, line2, withinPointDistance) {
            return (MakerJs.point.areEqual(line1.origin, line2.origin, withinPointDistance) && MakerJs.point.areEqual(line1.end, line2.end, withinPointDistance))
                || (MakerJs.point.areEqual(line1.origin, line2.end, withinPointDistance) && MakerJs.point.areEqual(line1.end, line2.origin, withinPointDistance));
        };
        pathAreEqualMap[MakerJs.pathType.Circle] = function (circle1, circle2, withinPointDistance) {
            return MakerJs.point.areEqual(circle1.origin, circle2.origin, withinPointDistance) && circle1.radius == circle2.radius;
        };
        pathAreEqualMap[MakerJs.pathType.Arc] = function (arc1, arc2, withinPointDistance) {
            return pathAreEqualMap[MakerJs.pathType.Circle](arc1, arc2, withinPointDistance) && MakerJs.angle.areEqual(arc1.startAngle, arc2.startAngle) && MakerJs.angle.areEqual(arc1.endAngle, arc2.endAngle);
        };
        /**
         * Find out if two paths are equal.
         *
         * @param a First path.
         * @param b Second path.
         * @returns true if paths are the same, false if they are not
         */
        function areEqual(path1, path2, withinPointDistance) {
            var result = false;
            if (path1.type == path2.type) {
                var fn = pathAreEqualMap[path1.type];
                if (fn) {
                    result = fn(path1, path2, withinPointDistance);
                }
            }
            return result;
        }
        path.areEqual = areEqual;
        /**
         * Create a clone of a path, mirrored on either or both x and y axes.
         *
         * @param pathToMirror The path to mirror.
         * @param mirrorX Boolean to mirror on the x axis.
         * @param mirrorY Boolean to mirror on the y axis.
         * @param newId Optional id to assign to the new path.
         * @returns Mirrored path.
         */
        function mirror(pathToMirror, mirrorX, mirrorY, newId) {
            var newPath = null;
            if (pathToMirror) {
                var origin = MakerJs.point.mirror(pathToMirror.origin, mirrorX, mirrorY);
                var map = {};
                map[MakerJs.pathType.Line] = function (line) {
                    newPath = new MakerJs.paths.Line(origin, MakerJs.point.mirror(line.end, mirrorX, mirrorY));
                };
                map[MakerJs.pathType.Circle] = function (circle) {
                    newPath = new MakerJs.paths.Circle(origin, circle.radius);
                };
                map[MakerJs.pathType.Arc] = function (arc) {
                    var startAngle = MakerJs.angle.mirror(arc.startAngle, mirrorX, mirrorY);
                    var endAngle = MakerJs.angle.mirror(MakerJs.angle.ofArcEnd(arc), mirrorX, mirrorY);
                    var xor = mirrorX != mirrorY;
                    newPath = new MakerJs.paths.Arc(origin, arc.radius, xor ? endAngle : startAngle, xor ? startAngle : endAngle);
                };
                var fn = map[pathToMirror.type];
                if (fn) {
                    fn(pathToMirror);
                }
            }
            return newPath;
        }
        path.mirror = mirror;
        /**
         * Move a path to an absolute point.
         *
         * @param pathToMove The path to move.
         * @param origin The new origin for the path.
         * @returns The original path (for chaining).
         */
        function move(pathToMove, origin) {
            if (pathToMove) {
                var map = {};
                map[MakerJs.pathType.Line] = function (line) {
                    var delta = MakerJs.point.subtract(line.end, line.origin);
                    line.end = MakerJs.point.add(origin, delta);
                };
                var fn = map[pathToMove.type];
                if (fn) {
                    fn(pathToMove);
                }
                pathToMove.origin = origin;
            }
            return pathToMove;
        }
        path.move = move;
        /**
         * Move a path's origin by a relative amount.
         *
         * @param pathToMove The path to move.
         * @param delta The x & y adjustments as a point object.
         * @returns The original path (for chaining).
         */
        function moveRelative(pathToMove, delta) {
            if (pathToMove) {
                var map = {};
                map[MakerJs.pathType.Line] = function (line) {
                    line.end = MakerJs.point.add(line.end, delta);
                };
                pathToMove.origin = MakerJs.point.add(pathToMove.origin, delta);
                var fn = map[pathToMove.type];
                if (fn) {
                    fn(pathToMove);
                }
            }
            return pathToMove;
        }
        path.moveRelative = moveRelative;
        /**
         * Rotate a path.
         *
         * @param pathToRotate The path to rotate.
         * @param angleInDegrees The amount of rotation, in degrees.
         * @param rotationOrigin The center point of rotation.
         * @returns The original path (for chaining).
         */
        function rotate(pathToRotate, angleInDegrees, rotationOrigin) {
            if (!pathToRotate || angleInDegrees == 0)
                return pathToRotate;
            var map = {};
            map[MakerJs.pathType.Line] = function (line) {
                line.end = MakerJs.point.rotate(line.end, angleInDegrees, rotationOrigin);
            };
            map[MakerJs.pathType.Arc] = function (arc) {
                arc.startAngle = MakerJs.angle.noRevolutions(arc.startAngle + angleInDegrees);
                arc.endAngle = MakerJs.angle.noRevolutions(arc.endAngle + angleInDegrees);
            };
            pathToRotate.origin = MakerJs.point.rotate(pathToRotate.origin, angleInDegrees, rotationOrigin);
            var fn = map[pathToRotate.type];
            if (fn) {
                fn(pathToRotate);
            }
            return pathToRotate;
        }
        path.rotate = rotate;
        /**
         * Scale a path.
         *
         * @param pathToScale The path to scale.
         * @param scaleValue The amount of scaling.
         * @returns The original path (for chaining).
         */
        function scale(pathToScale, scaleValue) {
            if (!pathToScale || scaleValue == 1)
                return pathToScale;
            var map = {};
            map[MakerJs.pathType.Line] = function (line) {
                line.end = MakerJs.point.scale(line.end, scaleValue);
            };
            map[MakerJs.pathType.Circle] = function (circle) {
                circle.radius *= scaleValue;
            };
            map[MakerJs.pathType.Arc] = map[MakerJs.pathType.Circle];
            pathToScale.origin = MakerJs.point.scale(pathToScale.origin, scaleValue);
            var fn = map[pathToScale.type];
            if (fn) {
                fn(pathToScale);
            }
            return pathToScale;
        }
        path.scale = scale;
    })(path = MakerJs.path || (MakerJs.path = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var path;
    (function (path_1) {
        /**
         * @private
         */
        var breakPathFunctionMap = {};
        breakPathFunctionMap[MakerJs.pathType.Arc] = function (arc, pointOfBreak) {
            var angleAtBreakPoint = MakerJs.angle.ofPointInDegrees(arc.origin, pointOfBreak);
            if (MakerJs.angle.areEqual(angleAtBreakPoint, arc.startAngle) || MakerJs.angle.areEqual(angleAtBreakPoint, arc.endAngle)) {
                return null;
            }
            function getAngleStrictlyBetweenArcAngles() {
                var startAngle = MakerJs.angle.noRevolutions(arc.startAngle);
                var endAngle = startAngle + MakerJs.angle.ofArcEnd(arc) - arc.startAngle;
                var tries = [0, 1, -1];
                for (var i = 0; i < tries.length; i++) {
                    var add = +360 * tries[i];
                    if (MakerJs.measure.isBetween(angleAtBreakPoint + add, startAngle, endAngle, true)) {
                        return arc.startAngle + angleAtBreakPoint + add - startAngle;
                    }
                }
                return null;
            }
            var angleAtBreakPointBetween = getAngleStrictlyBetweenArcAngles();
            if (angleAtBreakPointBetween == null) {
                return null;
            }
            var savedEndAngle = arc.endAngle;
            arc.endAngle = angleAtBreakPointBetween;
            return new MakerJs.paths.Arc(arc.origin, arc.radius, angleAtBreakPointBetween, savedEndAngle);
        };
        breakPathFunctionMap[MakerJs.pathType.Circle] = function (circle, pointOfBreak) {
            circle.type = MakerJs.pathType.Arc;
            var arc = circle;
            var angleAtBreakPoint = MakerJs.angle.ofPointInDegrees(circle.origin, pointOfBreak);
            arc.startAngle = angleAtBreakPoint;
            arc.endAngle = angleAtBreakPoint + 360;
            return null;
        };
        breakPathFunctionMap[MakerJs.pathType.Line] = function (line, pointOfBreak) {
            if (MakerJs.point.areEqual(line.origin, pointOfBreak) || MakerJs.point.areEqual(line.end, pointOfBreak)) {
                return null;
            }
            if (!MakerJs.measure.isBetweenPoints(pointOfBreak, line, true)) {
                return null;
            }
            var savedEndPoint = line.end;
            line.end = pointOfBreak;
            return new MakerJs.paths.Line(pointOfBreak, savedEndPoint);
        };
        /**
         * Breaks a path in two. The supplied path will end at the supplied pointOfBreak,
         * a new path is returned which begins at the pointOfBreak and ends at the supplied path's initial end point.
         * For Circle, the original path will be converted in place to an Arc, and null is returned.
         *
         * @param pathToBreak The path to break.
         * @param pointOfBreak The point at which to break the path.
         * @returns A new path of the same type, when path type is line or arc. Returns null for circle.
         */
        function breakAtPoint(pathToBreak, pointOfBreak) {
            if (pathToBreak && pointOfBreak) {
                var fn = breakPathFunctionMap[pathToBreak.type];
                if (fn) {
                    return fn(pathToBreak, pointOfBreak);
                }
            }
            return null;
        }
        path_1.breakAtPoint = breakAtPoint;
    })(path = MakerJs.path || (MakerJs.path = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var paths;
    (function (paths) {
        //shortcuts
        /**
         * Class for arc path.
         *
         * @param origin The center point of the arc.
         * @param radius The radius of the arc.
         * @param startAngle The start angle of the arc.
         * @param endAngle The end angle of the arc.
         */
        var Arc = (function () {
            function Arc(origin, radius, startAngle, endAngle) {
                this.origin = origin;
                this.radius = radius;
                this.startAngle = startAngle;
                this.endAngle = endAngle;
                this.type = MakerJs.pathType.Arc;
            }
            return Arc;
        })();
        paths.Arc = Arc;
        /**
         * Class for circle path.
         *
         * @param origin The center point of the circle.
         * @param radius The radius of the circle.
         */
        var Circle = (function () {
            function Circle(origin, radius) {
                this.origin = origin;
                this.radius = radius;
                this.type = MakerJs.pathType.Circle;
            }
            return Circle;
        })();
        paths.Circle = Circle;
        /**
         * Class for line path.
         *
         * @param origin The origin point of the line.
         * @param end The end point of the line.
         */
        var Line = (function () {
            function Line(origin, end) {
                this.origin = origin;
                this.end = end;
                this.type = MakerJs.pathType.Line;
            }
            return Line;
        })();
        paths.Line = Line;
        /**
         * Class for chord, which is simply a line path that connects the endpoints of an arc.
         *
         * @param arc Arc to use as the basic for the chord.
         */
        var Chord = (function () {
            function Chord(arc) {
                var arcPoints = MakerJs.point.fromArc(arc);
                this.type = MakerJs.pathType.Line;
                this.origin = arcPoints[0];
                this.end = arcPoints[1];
            }
            return Chord;
        })();
        paths.Chord = Chord;
        /**
         * Class for a parallel line path.
         *
         * @param toLine A line to be parallel to.
         * @param distance Distance between parallel and original line.
         * @param nearPoint Any point to determine which side of the line to place the parallel.
         */
        var Parallel = (function () {
            function Parallel(toLine, distance, nearPoint) {
                this.type = MakerJs.pathType.Line;
                this.origin = MakerJs.point.clone(toLine.origin);
                this.end = MakerJs.point.clone(toLine.end);
                var angleOfLine = MakerJs.angle.ofLineInDegrees(this);
                function getNewOrigin(offsetAngle) {
                    var origin = MakerJs.point.add(toLine.origin, MakerJs.point.fromPolar(MakerJs.angle.toRadians(angleOfLine + offsetAngle), distance));
                    return {
                        origin: origin,
                        nearness: MakerJs.measure.pointDistance(origin, nearPoint)
                    };
                }
                var newOrigins = [getNewOrigin(-90), getNewOrigin(90)];
                var newOrigin = (newOrigins[0].nearness < newOrigins[1].nearness) ? newOrigins[0].origin : newOrigins[1].origin;
                MakerJs.path.move(this, newOrigin);
            }
            return Parallel;
        })();
        paths.Parallel = Parallel;
    })(paths = MakerJs.paths || (MakerJs.paths = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var model;
    (function (model) {
        /**
         * Count the number of child models within a given model.
         *
         * @param modelContext The model containing other models.
         * @returns Number of child models.
         */
        function countChildModels(modelContext) {
            var count = 0;
            if (modelContext.models) {
                for (var id in modelContext.models) {
                    count++;
                }
            }
            return count;
        }
        model.countChildModels = countChildModels;
        /**
         * Get an unused id in the models map with the same prefix.
         *
         * @param modelContext The model containing the models map.
         * @param modelId The id to use directly (if unused), or as a prefix.
         */
        function getSimilarModelId(modelContext, modelId) {
            if (!modelContext.models)
                return modelId;
            var i = 0;
            var newModelId = modelId;
            while (newModelId in modelContext.models) {
                i++;
                newModelId = modelId + '_' + i;
            }
            return newModelId;
        }
        model.getSimilarModelId = getSimilarModelId;
        /**
         * Get an unused id in the paths map with the same prefix.
         *
         * @param modelContext The model containing the paths map.
         * @param pathId The id to use directly (if unused), or as a prefix.
         */
        function getSimilarPathId(modelContext, pathId) {
            if (!modelContext.paths)
                return pathId;
            var i = 0;
            var newPathId = pathId;
            while (newPathId in modelContext.paths) {
                i++;
                newPathId = pathId + '_' + i;
            }
            return newPathId;
        }
        model.getSimilarPathId = getSimilarPathId;
        /**
         * Moves all of a model's children (models and paths, recursively) in reference to a single common origin. Useful when points between children need to connect to each other.
         *
         * @param modelToOriginate The model to originate.
         * @param origin Optional offset reference point.
         */
        function originate(modelToOriginate, origin) {
            if (!modelToOriginate)
                return;
            var newOrigin = MakerJs.point.add(modelToOriginate.origin, origin);
            if (modelToOriginate.paths) {
                for (var id in modelToOriginate.paths) {
                    MakerJs.path.moveRelative(modelToOriginate.paths[id], newOrigin);
                }
            }
            if (modelToOriginate.models) {
                for (var id in modelToOriginate.models) {
                    originate(modelToOriginate.models[id], newOrigin);
                }
            }
            modelToOriginate.origin = MakerJs.point.zero();
            return modelToOriginate;
        }
        model.originate = originate;
        /**
         * Create a clone of a model, mirrored on either or both x and y axes.
         *
         * @param modelToMirror The model to mirror.
         * @param mirrorX Boolean to mirror on the x axis.
         * @param mirrorY Boolean to mirror on the y axis.
         * @returns Mirrored model.
         */
        function mirror(modelToMirror, mirrorX, mirrorY) {
            var newModel = {};
            if (modelToMirror.origin) {
                newModel.origin = MakerJs.point.mirror(modelToMirror.origin, mirrorX, mirrorY);
            }
            if (modelToMirror.type) {
                newModel.type = modelToMirror.type;
            }
            if (modelToMirror.units) {
                newModel.units = modelToMirror.units;
            }
            if (modelToMirror.paths) {
                newModel.paths = {};
                for (var id in modelToMirror.paths) {
                    var pathToMirror = modelToMirror.paths[id];
                    if (!pathToMirror)
                        continue;
                    var pathMirrored = MakerJs.path.mirror(pathToMirror, mirrorX, mirrorY);
                    if (!pathMirrored)
                        continue;
                    newModel.paths[id] = pathMirrored;
                }
            }
            if (modelToMirror.models) {
                newModel.models = {};
                for (var id in modelToMirror.models) {
                    var childModelToMirror = modelToMirror.models[id];
                    if (!childModelToMirror)
                        continue;
                    var childModelMirrored = model.mirror(childModelToMirror, mirrorX, mirrorY);
                    if (!childModelMirrored)
                        continue;
                    newModel.models[id] = childModelMirrored;
                }
            }
            return newModel;
        }
        model.mirror = mirror;
        /**
         * Move a model to an absolute point. Note that this is also accomplished by directly setting the origin property. This function exists for chaining.
         *
         * @param modelToMove The model to move.
         * @param origin The new position of the model.
         * @returns The original model (for chaining).
         */
        function move(modelToMove, origin) {
            modelToMove.origin = MakerJs.point.clone(origin);
            return modelToMove;
        }
        model.move = move;
        /**
         * Move a model's origin by a relative amount.
         *
         * @param modelToMove The model to move.
         * @param delta The x & y adjustments as a point object.
         * @returns The original model (for chaining).
         */
        function moveRelative(modelToMove, delta) {
            if (modelToMove) {
                modelToMove.origin = MakerJs.point.add(modelToMove.origin || MakerJs.point.zero(), delta);
            }
            return modelToMove;
        }
        model.moveRelative = moveRelative;
        /**
         * Rotate a model.
         *
         * @param modelToRotate The model to rotate.
         * @param angleInDegrees The amount of rotation, in degrees.
         * @param rotationOrigin The center point of rotation.
         * @returns The original model (for chaining).
         */
        function rotate(modelToRotate, angleInDegrees, rotationOrigin) {
            if (modelToRotate) {
                var offsetOrigin = MakerJs.point.subtract(rotationOrigin, modelToRotate.origin);
                if (modelToRotate.paths) {
                    for (var id in modelToRotate.paths) {
                        MakerJs.path.rotate(modelToRotate.paths[id], angleInDegrees, offsetOrigin);
                    }
                }
                if (modelToRotate.models) {
                    for (var id in modelToRotate.models) {
                        rotate(modelToRotate.models[id], angleInDegrees, offsetOrigin);
                    }
                }
            }
            return modelToRotate;
        }
        model.rotate = rotate;
        /**
         * Scale a model.
         *
         * @param modelToScale The model to scale.
         * @param scaleValue The amount of scaling.
         * @param scaleOrigin Optional boolean to scale the origin point. Typically false for the root model.
         * @returns The original model (for chaining).
         */
        function scale(modelToScale, scaleValue, scaleOrigin) {
            if (scaleOrigin === void 0) { scaleOrigin = false; }
            if (scaleOrigin && modelToScale.origin) {
                modelToScale.origin = MakerJs.point.scale(modelToScale.origin, scaleValue);
            }
            if (modelToScale.paths) {
                for (var id in modelToScale.paths) {
                    MakerJs.path.scale(modelToScale.paths[id], scaleValue);
                }
            }
            if (modelToScale.models) {
                for (var id in modelToScale.models) {
                    scale(modelToScale.models[id], scaleValue, true);
                }
            }
            return modelToScale;
        }
        model.scale = scale;
        /**
         * Convert a model to match a different unit system.
         *
         * @param modeltoConvert The model to convert.
         * @param destUnitType The unit system.
         * @returns The scaled model (for chaining).
         */
        function convertUnits(modeltoConvert, destUnitType) {
            var validUnitType = false;
            for (var id in MakerJs.unitType) {
                if (MakerJs.unitType[id] == destUnitType) {
                    validUnitType = true;
                    break;
                }
            }
            if (modeltoConvert.units && validUnitType) {
                var ratio = MakerJs.units.conversionScale(modeltoConvert.units, destUnitType);
                if (ratio != 1) {
                    scale(modeltoConvert, ratio);
                    //update the model with its new unit type
                    modeltoConvert.units = destUnitType;
                }
            }
            return modeltoConvert;
        }
        model.convertUnits = convertUnits;
        /**
         * Recursively walk through all paths for a given model.
         *
         * @param modelContext The model to walk.
         * @param callback Callback for each path.
         */
        function walkPaths(modelContext, callback) {
            if (modelContext.paths) {
                for (var pathId in modelContext.paths) {
                    if (!modelContext.paths[pathId])
                        continue;
                    callback(modelContext, pathId, modelContext.paths[pathId]);
                }
            }
            if (modelContext.models) {
                for (var id in modelContext.models) {
                    if (!modelContext.models[id])
                        continue;
                    walkPaths(modelContext.models[id], callback);
                }
            }
        }
        model.walkPaths = walkPaths;
    })(model = MakerJs.model || (MakerJs.model = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var model;
    (function (model) {
        /**
         * @private
         */
        function getNonZeroSegments(pathToSegment, breakPoint) {
            var segmentType = pathToSegment.type;
            var segment1 = MakerJs.cloneObject(pathToSegment);
            var segment2 = MakerJs.path.breakAtPoint(segment1, breakPoint);
            if (segment2) {
                var segments = [segment1, segment2];
                for (var i = 2; i--;) {
                    if (MakerJs.round(MakerJs.measure.pathLength(segments[i]), .0001) == 0) {
                        return null;
                    }
                }
                return segments;
            }
            else if (segmentType == MakerJs.pathType.Circle) {
                return [segment1];
            }
            return null;
        }
        /**
         * @private
         */
        function breakAlongForeignPath(segments, overlappedSegments, foreignPath) {
            if (MakerJs.path.areEqual(segments[0].path, foreignPath, .0001)) {
                segments[0].overlapped = true;
                segments[0].duplicate = true;
                overlappedSegments.push(segments[0]);
                return;
            }
            var foreignPathEndPoints;
            for (var i = 0; i < segments.length; i++) {
                var pointsToCheck;
                var options = {};
                var foreignIntersection = MakerJs.path.intersection(segments[i].path, foreignPath, options);
                if (foreignIntersection) {
                    pointsToCheck = foreignIntersection.intersectionPoints;
                }
                else if (options.out_AreOverlapped) {
                    segments[i].overlapped = true;
                    overlappedSegments.push(segments[i]);
                    if (!foreignPathEndPoints) {
                        foreignPathEndPoints = MakerJs.point.fromPathEnds(foreignPath);
                    }
                    pointsToCheck = foreignPathEndPoints;
                }
                if (pointsToCheck) {
                    //break the path which intersected, and add the shard to the end of the array so it can also be checked in this loop for further sharding.
                    var subSegments = null;
                    var p = 0;
                    while (!subSegments && p < pointsToCheck.length) {
                        subSegments = getNonZeroSegments(segments[i].path, pointsToCheck[p]);
                        p++;
                    }
                    if (subSegments) {
                        segments[i].path = subSegments[0];
                        if (subSegments[1]) {
                            var newSegment = {
                                path: subSegments[1],
                                pathId: segments[0].pathId,
                                overlapped: segments[i].overlapped,
                                uniqueForeignIntersectionPoints: []
                            };
                            if (segments[i].overlapped) {
                                overlappedSegments.push(newSegment);
                            }
                            segments.push(newSegment);
                        }
                        //re-check this segment for another deep intersection
                        i--;
                    }
                }
            }
        }
        /**
         * @private
         */
        function addUniquePoints(pointArray, pointsToAdd) {
            var added = 0;
            function addUniquePoint(pointToAdd) {
                for (var i = 0; i < pointArray.length; i++) {
                    if (MakerJs.point.areEqual(pointArray[i], pointToAdd, .000000001)) {
                        return;
                    }
                }
                pointArray.push(pointToAdd);
                added++;
            }
            for (var i = 0; i < pointsToAdd.length; i++) {
                addUniquePoint(pointsToAdd[i]);
            }
            return added;
        }
        /**
         * @private
         */
        function checkIntersectsForeignPath(segment, foreignPath, foreignPathId, farPoint) {
            if (farPoint === void 0) { farPoint = [7654321, 1234567]; }
            var origin = MakerJs.point.middle(segment.path);
            var lineToFarPoint = new MakerJs.paths.Line(origin, farPoint);
            var farInt = MakerJs.path.intersection(lineToFarPoint, foreignPath);
            if (farInt) {
                var added = addUniquePoints(segment.uniqueForeignIntersectionPoints, farInt.intersectionPoints);
                //if number of intersections is an odd number, flip the flag.
                if (added % 2 == 1) {
                    segment.isInside = !!!segment.isInside;
                }
            }
        }
        /**
         * @private
         */
        function checkInsideForeignModel(segment, modelToIntersect, farPoint) {
            model.walkPaths(modelToIntersect, function (mx, pathId2, path2) {
                if (path2) {
                    checkIntersectsForeignPath(segment, path2, pathId2, farPoint);
                }
            });
        }
        /**
         * Check to see if a path is inside of a model.
         *
         * @param pathContext The path to check.
         * @param modelContext The model to check against.
         * @param farPoint Optional point of reference which is outside the bounds of the modelContext.
         * @returns Boolean true if the path is inside of the modelContext.
         */
        function isPathInsideModel(pathContext, modelContext, farPoint) {
            var segment = {
                path: pathContext,
                isInside: false,
                uniqueForeignIntersectionPoints: []
            };
            checkInsideForeignModel(segment, modelContext, farPoint);
            return !!segment.isInside;
        }
        model.isPathInsideModel = isPathInsideModel;
        /**
         * Break a model's paths everywhere they intersect with another path.
         *
         * @param modelToBreak The model containing paths to be broken.
         * @param modelToIntersect Optional model containing paths to look for intersection, or else the modelToBreak will be used.
         */
        function breakPathsAtIntersections(modelToBreak, modelToIntersect) {
            breakAllPathsAtIntersections(modelToBreak, modelToIntersect || modelToBreak, false);
        }
        model.breakPathsAtIntersections = breakPathsAtIntersections;
        /**
         * @private
         */
        function breakAllPathsAtIntersections(modelToBreak, modelToIntersect, checkIsInside, farPoint) {
            var crossedPaths = [];
            var overlappedSegments = [];
            model.walkPaths(modelToBreak, function (modelContext, pathId1, path1) {
                if (!path1)
                    return;
                //clone this path and make it the first segment
                var segment = {
                    path: MakerJs.cloneObject(path1),
                    pathId: pathId1,
                    overlapped: false,
                    uniqueForeignIntersectionPoints: []
                };
                var thisPath = {
                    modelContext: modelContext,
                    pathId: pathId1,
                    segments: [segment]
                };
                //keep breaking the segments anywhere they intersect with paths of the other model
                model.walkPaths(modelToIntersect, function (mx, pathId2, path2) {
                    if (path2 && path1 !== path2) {
                        breakAlongForeignPath(thisPath.segments, overlappedSegments, path2);
                    }
                });
                if (checkIsInside) {
                    //check each segment whether it is inside or outside
                    for (var i = 0; i < thisPath.segments.length; i++) {
                        checkInsideForeignModel(thisPath.segments[i], modelToIntersect, farPoint);
                    }
                }
                crossedPaths.push(thisPath);
            });
            return { crossedPaths: crossedPaths, overlappedSegments: overlappedSegments };
        }
        /**
         * @private
         */
        function checkForEqualOverlaps(crossedPathsA, crossedPathsB, pointMatchingDistance) {
            function compareSegments(segment1, segment2) {
                if (MakerJs.path.areEqual(segment1.path, segment2.path, pointMatchingDistance)) {
                    segment1.duplicate = segment2.duplicate = true;
                }
            }
            function compareAll(segment) {
                for (var i = 0; i < crossedPathsB.length; i++) {
                    compareSegments(crossedPathsB[i], segment);
                }
            }
            for (var i = 0; i < crossedPathsA.length; i++) {
                compareAll(crossedPathsA[i]);
            }
        }
        /**
         * @private
         */
        function addOrDeleteSegments(crossedPath, includeInside, includeOutside, keepDuplicates) {
            function addSegment(modelContext, pathIdBase, segment) {
                var id = model.getSimilarPathId(modelContext, pathIdBase);
                modelContext.paths[id] = segment.path;
            }
            function checkAddSegment(modelContext, pathIdBase, segment) {
                if (segment.isInside && includeInside || !segment.isInside && includeOutside) {
                    addSegment(modelContext, pathIdBase, segment);
                }
            }
            //delete the original, its segments will be added
            delete crossedPath.modelContext.paths[crossedPath.pathId];
            for (var i = 0; i < crossedPath.segments.length; i++) {
                if (crossedPath.segments[i].duplicate) {
                    if (keepDuplicates) {
                        addSegment(crossedPath.modelContext, crossedPath.pathId, crossedPath.segments[i]);
                    }
                }
                else {
                    checkAddSegment(crossedPath.modelContext, crossedPath.pathId, crossedPath.segments[i]);
                }
            }
        }
        /**
         * Combine 2 models. The models should be originated, and every path within each model should be part of a loop.
         *
         * @param modelA First model to combine.
         * @param modelB Second model to combine.
         * @param includeAInsideB Flag to include paths from modelA which are inside of modelB.
         * @param includeAOutsideB Flag to include paths from modelA which are outside of modelB.
         * @param includeBInsideA Flag to include paths from modelB which are inside of modelA.
         * @param includeBOutsideA Flag to include paths from modelB which are outside of modelA.
         * @param keepDuplicates Flag to include paths which are duplicate in both models.
         * @param farPoint Optional point of reference which is outside the bounds of both models.
         */
        function combine(modelA, modelB, includeAInsideB, includeAOutsideB, includeBInsideA, includeBOutsideA, options) {
            if (includeAInsideB === void 0) { includeAInsideB = false; }
            if (includeAOutsideB === void 0) { includeAOutsideB = true; }
            if (includeBInsideA === void 0) { includeBInsideA = false; }
            if (includeBOutsideA === void 0) { includeBOutsideA = true; }
            var opts = {
                trimDeadEnds: true,
                pointMatchingDistance: .005
            };
            MakerJs.extendObject(opts, options);
            var pathsA = breakAllPathsAtIntersections(modelA, modelB, true, opts.farPoint);
            var pathsB = breakAllPathsAtIntersections(modelB, modelA, true, opts.farPoint);
            checkForEqualOverlaps(pathsA.overlappedSegments, pathsB.overlappedSegments, opts.pointMatchingDistance);
            for (var i = 0; i < pathsA.crossedPaths.length; i++) {
                addOrDeleteSegments(pathsA.crossedPaths[i], includeAInsideB, includeAOutsideB, true);
            }
            for (var i = 0; i < pathsB.crossedPaths.length; i++) {
                addOrDeleteSegments(pathsB.crossedPaths[i], includeBInsideA, includeBOutsideA, false);
            }
            if (opts.trimDeadEnds) {
                model.removeDeadEnds({ models: { modelA: modelA, modelB: modelB } });
            }
        }
        model.combine = combine;
    })(model = MakerJs.model || (MakerJs.model = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var units;
    (function (units) {
        /**
         * The base type is arbitrary. Other conversions are then based off of this.
         * @private
         */
        var base = MakerJs.unitType.Millimeter;
        /**
         * Initialize all known conversions here.
         * @private
         */
        function init() {
            addBaseConversion(MakerJs.unitType.Centimeter, 10);
            addBaseConversion(MakerJs.unitType.Meter, 1000);
            addBaseConversion(MakerJs.unitType.Inch, 25.4);
            addBaseConversion(MakerJs.unitType.Foot, 25.4 * 12);
        }
        /**
         * Table of conversions. Lazy load upon first conversion.
         * @private
         */
        var table;
        /**
         * Add a conversion, and its inversion.
         * @private
         */
        function addConversion(srcUnitType, destUnitType, value) {
            function row(unitType) {
                if (!table[unitType]) {
                    table[unitType] = {};
                }
                return table[unitType];
            }
            row(srcUnitType)[destUnitType] = value;
            row(destUnitType)[srcUnitType] = 1 / value;
        }
        /**
         * Add a conversion of the base unit.
         * @private
         */
        function addBaseConversion(destUnitType, value) {
            addConversion(destUnitType, base, value);
        }
        /**
         * Get a conversion ratio between a source unit and a destination unit.
         *
         * @param srcUnitType unitType converting from.
         * @param destUnitType unitType converting to.
         * @returns Numeric ratio of the conversion.
         */
        function conversionScale(srcUnitType, destUnitType) {
            if (srcUnitType == destUnitType) {
                return 1;
            }
            //This will lazy load the table with initial conversions.
            if (!table) {
                table = {};
                init();
            }
            //look for a cached conversion in the table.
            if (!table[srcUnitType][destUnitType]) {
                //create a new conversionsand cache it in the table.
                addConversion(srcUnitType, destUnitType, table[srcUnitType][base] * table[base][destUnitType]);
            }
            return table[srcUnitType][destUnitType];
        }
        units.conversionScale = conversionScale;
    })(units = MakerJs.units || (MakerJs.units = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var measure;
    (function (measure_1) {
        /**
         * Total angle of an arc between its start and end angles.
         *
         * @param arc The arc to measure.
         * @returns Angle of arc.
         */
        function arcAngle(arc) {
            var endAngle = MakerJs.angle.ofArcEnd(arc);
            return endAngle - arc.startAngle;
        }
        measure_1.arcAngle = arcAngle;
        /**
         * Check for arc being concave or convex towards a given point.
         *
         * @param arc The arc to test.
         * @param towardsPoint The point to test.
         * @returns Boolean true if arc is concave towards point.
         */
        function isArcConcaveTowardsPoint(arc, towardsPoint) {
            if (pointDistance(arc.origin, towardsPoint) <= arc.radius) {
                return true;
            }
            var midPointToNearPoint = new MakerJs.paths.Line(MakerJs.point.middle(arc), towardsPoint);
            var options = {};
            var intersectionPoint = MakerJs.path.intersection(midPointToNearPoint, new MakerJs.paths.Chord(arc), options);
            if (intersectionPoint || options.out_AreOverlapped) {
                return true;
            }
            return false;
        }
        measure_1.isArcConcaveTowardsPoint = isArcConcaveTowardsPoint;
        /**
         * Check if a given number is between two given limits.
         *
         * @param valueInQuestion The number to test.
         * @param limit1 First limit.
         * @param limit2 Second limit.
         * @param exclusive Flag to exclude equaling the limits.
         * @returns Boolean true if value is between (or equal to) the limits.
         */
        function isBetween(valueInQuestion, limit1, limit2, exclusive) {
            if (exclusive) {
                return Math.min(limit1, limit2) < valueInQuestion && valueInQuestion < Math.max(limit1, limit2);
            }
            else {
                return Math.min(limit1, limit2) <= valueInQuestion && valueInQuestion <= Math.max(limit1, limit2);
            }
        }
        measure_1.isBetween = isBetween;
        /**
         * Check if a given angle is between an arc's start and end angles.
         *
         * @param angleInQuestion The angle to test.
         * @param arc Arc to test against.
         * @param exclusive Flag to exclude equaling the start or end angles.
         * @returns Boolean true if angle is between (or equal to) the arc's start and end angles.
         */
        function isBetweenArcAngles(angleInQuestion, arc, exclusive) {
            var startAngle = arc.startAngle;
            var endAngle = MakerJs.angle.ofArcEnd(arc);
            var span = endAngle - startAngle;
            startAngle = MakerJs.angle.noRevolutions(startAngle);
            endAngle = startAngle + span;
            angleInQuestion = MakerJs.angle.noRevolutions(angleInQuestion);
            //computed angles will not be negative, but the arc may have specified a negative angle, so check against one revolution forward and backward
            return (isBetween(angleInQuestion, startAngle, endAngle, exclusive) || isBetween(angleInQuestion, startAngle + 360, endAngle + 360, exclusive) || isBetween(angleInQuestion, startAngle - 360, endAngle - 360, exclusive));
        }
        measure_1.isBetweenArcAngles = isBetweenArcAngles;
        /**
         * Check if a given point is between a line's end points.
         *
         * @param pointInQuestion The point to test.
         * @param line Line to test against.
         * @param exclusive Flag to exclude equaling the origin or end points.
         * @returns Boolean true if point is between (or equal to) the line's origin and end points.
         */
        function isBetweenPoints(pointInQuestion, line, exclusive) {
            for (var i = 2; i--;) {
                if (MakerJs.round(line.origin[i] - line.end[i], .000001) == 0) {
                    continue;
                }
                var origin_value = MakerJs.round(line.origin[i]);
                var end_value = MakerJs.round(line.end[i]);
                if (!isBetween(MakerJs.round(pointInQuestion[i]), origin_value, end_value, exclusive))
                    return false;
            }
            return true;
        }
        measure_1.isBetweenPoints = isBetweenPoints;
        /**
         * Calculates the distance between two points.
         *
         * @param a First point.
         * @param b Second point.
         * @returns Distance between points.
         */
        function pointDistance(a, b) {
            var dx = b[0] - a[0];
            var dy = b[1] - a[1];
            return Math.sqrt(dx * dx + dy * dy);
        }
        measure_1.pointDistance = pointDistance;
        /**
         * @private
         */
        function getExtremePoint(a, b, fn) {
            return [
                fn(a[0], b[0]),
                fn(a[1], b[1])
            ];
        }
        /**
         * Calculates the smallest rectangle which contains a path.
         *
         * @param pathToMeasure The path to measure.
         * @returns object with low and high points.
         */
        function pathExtents(pathToMeasure) {
            var map = {};
            var measurement = { low: null, high: null };
            map[MakerJs.pathType.Line] = function (line) {
                measurement.low = getExtremePoint(line.origin, line.end, Math.min);
                measurement.high = getExtremePoint(line.origin, line.end, Math.max);
            };
            map[MakerJs.pathType.Circle] = function (circle) {
                var r = circle.radius;
                measurement.low = MakerJs.point.add(circle.origin, [-r, -r]);
                measurement.high = MakerJs.point.add(circle.origin, [r, r]);
            };
            map[MakerJs.pathType.Arc] = function (arc) {
                var r = arc.radius;
                var arcPoints = MakerJs.point.fromArc(arc);
                function extremeAngle(xyAngle, value, fn) {
                    var extremePoint = getExtremePoint(arcPoints[0], arcPoints[1], fn);
                    for (var i = 2; i--;) {
                        if (isBetweenArcAngles(xyAngle[i], arc, false)) {
                            extremePoint[i] = value + arc.origin[i];
                        }
                    }
                    return extremePoint;
                }
                measurement.low = extremeAngle([180, 270], -r, Math.min);
                measurement.high = extremeAngle([360, 90], r, Math.max);
            };
            if (pathToMeasure) {
                var fn = map[pathToMeasure.type];
                if (fn) {
                    fn(pathToMeasure);
                }
            }
            return measurement;
        }
        measure_1.pathExtents = pathExtents;
        /**
         * Measures the length of a path.
         *
         * @param pathToMeasure The path to measure.
         * @returns Length of the path.
         */
        function pathLength(pathToMeasure) {
            var map = {};
            var value = 0;
            map[MakerJs.pathType.Line] = function (line) {
                value = pointDistance(line.origin, line.end);
            };
            map[MakerJs.pathType.Circle] = function (circle) {
                value = 2 * Math.PI * circle.radius;
            };
            map[MakerJs.pathType.Arc] = function (arc) {
                map[MakerJs.pathType.Circle](arc); //this sets the value var
                var pct = arcAngle(arc) / 360;
                value *= pct;
            };
            var fn = map[pathToMeasure.type];
            if (fn) {
                fn(pathToMeasure);
            }
            return value;
        }
        measure_1.pathLength = pathLength;
        /**
         * Measures the smallest rectangle which contains a model.
         *
         * @param modelToMeasure The model to measure.
         * @returns object with low and high points.
         */
        function modelExtents(modelToMeasure) {
            var totalMeasurement = { low: [null, null], high: [null, null] };
            function lowerOrHigher(offsetOrigin, pathMeasurement) {
                function getExtreme(a, b, fn) {
                    var c = MakerJs.point.add(b, offsetOrigin);
                    for (var i = 2; i--;) {
                        a[i] = (a[i] == null ? c[i] : fn(a[i], c[i]));
                    }
                }
                getExtreme(totalMeasurement.low, pathMeasurement.low, Math.min);
                getExtreme(totalMeasurement.high, pathMeasurement.high, Math.max);
            }
            function measure(modelToMeasure, offsetOrigin) {
                if (!modelToMeasure)
                    return;
                var newOrigin = MakerJs.point.add(modelToMeasure.origin, offsetOrigin);
                if (modelToMeasure.paths) {
                    for (var id in modelToMeasure.paths) {
                        lowerOrHigher(newOrigin, pathExtents(modelToMeasure.paths[id]));
                    }
                }
                if (modelToMeasure.models) {
                    for (var id in modelToMeasure.models) {
                        measure(modelToMeasure.models[id], newOrigin);
                    }
                }
            }
            measure(modelToMeasure);
            return totalMeasurement;
        }
        measure_1.modelExtents = modelExtents;
    })(measure = MakerJs.measure || (MakerJs.measure = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var exporter;
    (function (exporter) {
        /**
         * Try to get the unit system from a model
         * @private
         */
        function tryGetModelUnits(itemToExport) {
            if (MakerJs.isModel(itemToExport)) {
                return itemToExport.units;
            }
        }
        exporter.tryGetModelUnits = tryGetModelUnits;
        /**
         * Class to traverse an item 's models or paths and ultimately render each path.
         * @private
         */
        var Exporter = (function () {
            /**
             * @param map Object containing properties: property name is the type of path, e.g. "line", "circle"; property value
             * is a function to render a path. Function parameters are path and point.
             * @param fixPoint Optional function to modify a point prior to export. Function parameter is a point; function must return a point.
             * @param fixPath Optional function to modify a path prior to output. Function parameters are path and offset point; function must return a path.
             */
            function Exporter(map, fixPoint, fixPath, beginModel, endModel) {
                this.map = map;
                this.fixPoint = fixPoint;
                this.fixPath = fixPath;
                this.beginModel = beginModel;
                this.endModel = endModel;
            }
            /**
             * Export a path.
             *
             * @param pathToExport The path to export.
             * @param offset The offset position of the path.
             */
            Exporter.prototype.exportPath = function (id, pathToExport, offset, layer) {
                if (pathToExport) {
                    var fn = this.map[pathToExport.type];
                    if (fn) {
                        fn(id, this.fixPath ? this.fixPath(pathToExport, offset) : pathToExport, offset, layer);
                    }
                }
            };
            /**
             * Export a model.
             *
             * @param modelToExport The model to export.
             * @param offset The offset position of the model.
             */
            Exporter.prototype.exportModel = function (modelId, modelToExport, offset) {
                if (this.beginModel) {
                    this.beginModel(modelId, modelToExport);
                }
                var newOffset = MakerJs.point.add((this.fixPoint ? this.fixPoint(modelToExport.origin) : modelToExport.origin), offset);
                if (modelToExport.paths) {
                    for (var id in modelToExport.paths) {
                        var currPath = modelToExport.paths[id];
                        if (!currPath)
                            continue;
                        this.exportPath(id, currPath, newOffset, currPath.layer || modelToExport.layer);
                    }
                }
                if (modelToExport.models) {
                    for (var id in modelToExport.models) {
                        var currModel = modelToExport.models[id];
                        if (!currModel)
                            continue;
                        this.exportModel(id, currModel, newOffset);
                    }
                }
                if (this.endModel) {
                    this.endModel(modelToExport);
                }
            };
            /**
             * Export an object.
             *
             * @param item The object to export. May be a path, an array of paths, a model, or an array of models.
             * @param offset The offset position of the object.
             */
            Exporter.prototype.exportItem = function (itemId, itemToExport, origin) {
                if (MakerJs.isModel(itemToExport)) {
                    this.exportModel(itemId, itemToExport, origin);
                }
                else if (MakerJs.isPath(itemToExport)) {
                    this.exportPath(itemId, itemToExport, origin, null);
                }
                else {
                    for (var id in itemToExport) {
                        this.exportItem(id, itemToExport[id], origin);
                    }
                }
            };
            return Exporter;
        })();
        exporter.Exporter = Exporter;
    })(exporter = MakerJs.exporter || (MakerJs.exporter = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var exporter;
    (function (exporter_1) {
        /**
         * Renders an item in AutoDesk DFX file format.
         *
         * @param itemToExport Item to render: may be a path, an array of paths, or a model object.
         * @param options Rendering options object.
         * @param options.units String of the unit system. May be omitted. See makerjs.unitType for possible values.
         * @returns String of DXF content.
         */
        function toDXF(itemToExport, options) {
            //DXF format documentation:
            //http://images.autodesk.com/adsk/files/acad_dxf0.pdf
            if (options === void 0) { options = {}; }
            var opts = {};
            MakerJs.extendObject(opts, options);
            if (MakerJs.isModel(itemToExport)) {
                var modelToExport = itemToExport;
                if (modelToExport.exporterOptions) {
                    MakerJs.extendObject(opts, modelToExport.exporterOptions['toDXF']);
                }
            }
            var dxf = [];
            function append(value) {
                dxf.push(value);
            }
            function defaultLayer(pathContext, layer) {
                return pathContext.layer || layer || 0;
            }
            var map = {};
            map[MakerJs.pathType.Line] = function (id, line, origin, layer) {
                append("0");
                append("LINE");
                append("8");
                append(defaultLayer(line, layer));
                append("10");
                append(line.origin[0] + origin[0]);
                append("20");
                append(line.origin[1] + origin[1]);
                append("11");
                append(line.end[0] + origin[0]);
                append("21");
                append(line.end[1] + origin[1]);
            };
            map[MakerJs.pathType.Circle] = function (id, circle, origin, layer) {
                append("0");
                append("CIRCLE");
                append("8");
                append(defaultLayer(circle, layer));
                append("10");
                append(circle.origin[0] + origin[0]);
                append("20");
                append(circle.origin[1] + origin[1]);
                append("40");
                append(circle.radius);
            };
            map[MakerJs.pathType.Arc] = function (id, arc, origin, layer) {
                append("0");
                append("ARC");
                append("8");
                append(defaultLayer(arc, layer));
                append("10");
                append(arc.origin[0] + origin[0]);
                append("20");
                append(arc.origin[1] + origin[1]);
                append("40");
                append(arc.radius);
                append("50");
                append(arc.startAngle);
                append("51");
                append(arc.endAngle);
            };
            function section(sectionFn) {
                append("0");
                append("SECTION");
                sectionFn();
                append("0");
                append("ENDSEC");
            }
            function header() {
                var units = dxfUnit[opts.units];
                append("2");
                append("HEADER");
                append("9");
                append("$INSUNITS");
                append("70");
                append(units);
            }
            function entities() {
                append("2");
                append("ENTITIES");
                var exporter = new exporter_1.Exporter(map);
                exporter.exportItem('entities', itemToExport, MakerJs.point.zero());
            }
            //fixup options
            if (!opts.units) {
                var units = exporter_1.tryGetModelUnits(itemToExport);
                if (units) {
                    opts.units = units;
                }
            }
            //also pass back to options parameter
            MakerJs.extendObject(options, opts);
            //begin dxf output
            if (opts.units) {
                section(header);
            }
            section(entities);
            append("0");
            append("EOF");
            return dxf.join('\n');
        }
        exporter_1.toDXF = toDXF;
        /**
         * @private
         */
        var dxfUnit = {};
        //DXF format documentation:
        //http://images.autodesk.com/adsk/files/acad_dxf0.pdf
        //Default drawing units for AutoCAD DesignCenter blocks:
        //0 = Unitless; 1 = Inches; 2 = Feet; 3 = Miles; 4 = Millimeters; 5 = Centimeters; 6 = Meters; 7 = Kilometers; 8 = Microinches;
        dxfUnit[''] = 0;
        dxfUnit[MakerJs.unitType.Inch] = 1;
        dxfUnit[MakerJs.unitType.Foot] = 2;
        dxfUnit[MakerJs.unitType.Millimeter] = 4;
        dxfUnit[MakerJs.unitType.Centimeter] = 5;
        dxfUnit[MakerJs.unitType.Meter] = 6;
    })(exporter = MakerJs.exporter || (MakerJs.exporter = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var solvers;
    (function (solvers) {
        /**
         * Solves for the angle of a triangle when you know lengths of 3 sides.
         *
         * @param length1 Length of side of triangle, opposite of the angle you are trying to find.
         * @param length2 Length of any other side of the triangle.
         * @param length3 Length of the remaining side of the triangle.
         * @returns Angle opposite of the side represented by the first parameter.
         */
        function solveTriangleSSS(length1, length2, length3) {
            return MakerJs.angle.toDegrees(Math.acos((length2 * length2 + length3 * length3 - length1 * length1) / (2 * length2 * length3)));
        }
        solvers.solveTriangleSSS = solveTriangleSSS;
        /**
         * Solves for the length of a side of a triangle when you know length of one side and 2 angles.
         *
         * @param oppositeAngleInDegrees Angle which is opposite of the side you are trying to find.
         * @param lengthOfSideBetweenAngles Length of one side of the triangle which is between the provided angles.
         * @param otherAngleInDegrees An other angle of the triangle.
         * @returns Length of the side of the triangle which is opposite of the first angle parameter.
         */
        function solveTriangleASA(oppositeAngleInDegrees, lengthOfSideBetweenAngles, otherAngleInDegrees) {
            var angleOppositeSide = 180 - oppositeAngleInDegrees - otherAngleInDegrees;
            return (lengthOfSideBetweenAngles * Math.sin(MakerJs.angle.toRadians(oppositeAngleInDegrees))) / Math.sin(MakerJs.angle.toRadians(angleOppositeSide));
        }
        solvers.solveTriangleASA = solveTriangleASA;
    })(solvers = MakerJs.solvers || (MakerJs.solvers = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var path;
    (function (path) {
        /**
         * @private
         */
        var map = {};
        map[MakerJs.pathType.Arc] = {};
        map[MakerJs.pathType.Circle] = {};
        map[MakerJs.pathType.Line] = {};
        map[MakerJs.pathType.Arc][MakerJs.pathType.Arc] = function (arc1, arc2, options) {
            var angles = circleToCircle(arc1, arc2, options);
            if (angles) {
                var arc1Angles = getAnglesWithinArc(angles[0], arc1, options);
                var arc2Angles = getAnglesWithinArc(angles[1], arc2, options);
                if (arc1Angles && arc2Angles) {
                    return {
                        intersectionPoints: pointsFromAnglesOnCircle(arc1Angles, arc1),
                        path1Angles: arc1Angles,
                        path2Angles: arc2Angles
                    };
                }
            }
            else {
                if (options.out_AreOverlapped) {
                    //overlapped for circle, reset and see if arcs actually overlap.
                    options.out_AreOverlapped = false;
                    checkAngleOverlap(arc1, arc2, options);
                }
            }
            return null;
        };
        map[MakerJs.pathType.Arc][MakerJs.pathType.Circle] = function (arc, circle, options) {
            var angles = circleToCircle(arc, circle, options);
            if (angles) {
                var arcAngles = getAnglesWithinArc(angles[0], arc, options);
                if (arcAngles) {
                    var circleAngles;
                    //if both point are on arc, use both on circle
                    if (arcAngles.length == 2) {
                        circleAngles = angles[1];
                    }
                    else {
                        //use the corresponding point on circle 
                        var index = findCorrespondingAngleIndex(angles, arcAngles);
                        circleAngles = [angles[1][index]];
                    }
                    return {
                        intersectionPoints: pointsFromAnglesOnCircle(arcAngles, arc),
                        path1Angles: arcAngles,
                        path2Angles: circleAngles
                    };
                }
            }
            return null;
        };
        map[MakerJs.pathType.Arc][MakerJs.pathType.Line] = function (arc, line, options) {
            var angles = lineToCircle(line, arc, options);
            if (angles) {
                var arcAngles = getAnglesWithinArc(angles, arc, options);
                if (arcAngles) {
                    return {
                        intersectionPoints: pointsFromAnglesOnCircle(arcAngles, arc),
                        path1Angles: arcAngles
                    };
                }
            }
            return null;
        };
        map[MakerJs.pathType.Circle][MakerJs.pathType.Arc] = function (circle, arc, options) {
            var result = map[MakerJs.pathType.Arc][MakerJs.pathType.Circle](arc, circle, options);
            if (result) {
                return swap(result);
            }
            return null;
        };
        map[MakerJs.pathType.Circle][MakerJs.pathType.Circle] = function (circle1, circle2, options) {
            var angles = circleToCircle(circle1, circle2, options);
            if (angles) {
                return {
                    intersectionPoints: pointsFromAnglesOnCircle(angles[0], circle1),
                    path1Angles: angles[0],
                    path2Angles: angles[1]
                };
            }
            return null;
        };
        map[MakerJs.pathType.Circle][MakerJs.pathType.Line] = function (circle, line, options) {
            var angles = lineToCircle(line, circle, options);
            if (angles) {
                return {
                    intersectionPoints: pointsFromAnglesOnCircle(angles, circle),
                    path1Angles: angles
                };
            }
            return null;
        };
        map[MakerJs.pathType.Line][MakerJs.pathType.Arc] = function (line, arc, options) {
            var result = map[MakerJs.pathType.Arc][MakerJs.pathType.Line](arc, line, options);
            if (result) {
                return swap(result);
            }
            return null;
        };
        map[MakerJs.pathType.Line][MakerJs.pathType.Circle] = function (line, circle, options) {
            var result = map[MakerJs.pathType.Circle][MakerJs.pathType.Line](circle, line, options);
            if (result) {
                return swap(result);
            }
            return null;
        };
        map[MakerJs.pathType.Line][MakerJs.pathType.Line] = function (line1, line2, options) {
            var intersectionPoint = slopeIntersectionPoint(line1, line2, options);
            if (intersectionPoint) {
                //we have the point of intersection of endless lines, now check to see if the point is between both segemnts
                if (MakerJs.measure.isBetweenPoints(intersectionPoint, line1, options.excludeTangents) && MakerJs.measure.isBetweenPoints(intersectionPoint, line2, options.excludeTangents)) {
                    return {
                        intersectionPoints: [intersectionPoint]
                    };
                }
            }
            return null;
        };
        /**
         * @private
         */
        function swap(result) {
            var temp = result.path1Angles;
            if (result.path2Angles) {
                result.path1Angles = result.path2Angles;
            }
            else {
                delete result.path1Angles;
            }
            result.path2Angles = temp;
            return result;
        }
        /**
         * Find the point(s) where 2 paths intersect.
         *
         * @param path1 First path to find intersection.
         * @param path2 Second path to find intersection.
         * @param options Optional IPathIntersectionOptions.
         * @returns IPathIntersection object, with points(s) of intersection (and angles, when a path is an arc or circle); or null if the paths did not intersect.
         */
        function intersection(path1, path2, options) {
            if (options === void 0) { options = {}; }
            if (path1 && path2) {
                var fn = map[path1.type][path2.type];
                if (fn) {
                    return fn(path1, path2, options);
                }
            }
            return null;
        }
        path.intersection = intersection;
        /**
         * @private
         */
        function findCorrespondingAngleIndex(circleAngles, arcAngle) {
            for (var i = 0; i < circleAngles.length; i++) {
                if (circleAngles[i][0] == arcAngle[0])
                    return i;
            }
        }
        /**
         * @private
         */
        function pointsFromAnglesOnCircle(anglesInDegrees, circle) {
            var result = [];
            for (var i = 0; i < anglesInDegrees.length; i++) {
                result.push(MakerJs.point.fromAngleOnCircle(anglesInDegrees[i], circle));
            }
            return result;
        }
        /**
         * @private
         */
        function getAnglesWithinArc(angles, arc, options) {
            if (!angles)
                return null;
            var anglesWithinArc = [];
            for (var i = 0; i < angles.length; i++) {
                if (MakerJs.measure.isBetweenArcAngles(angles[i], arc, options.excludeTangents)) {
                    anglesWithinArc.push(angles[i]);
                }
            }
            if (anglesWithinArc.length == 0)
                return null;
            return anglesWithinArc;
        }
        /**
         * @private
         */
        function getSlope(line) {
            var dx = line.end[0] - line.origin[0];
            if (MakerJs.round(dx) == 0) {
                return {
                    line: line,
                    hasSlope: false
                };
            }
            var dy = line.end[1] - line.origin[1];
            var slope = dy / dx;
            var yIntercept = line.origin[1] - slope * line.origin[0];
            return {
                line: line,
                hasSlope: true,
                slope: slope,
                yIntercept: yIntercept
            };
        }
        /**
         * @private
         */
        function verticalIntersectionPoint(verticalLine, nonVerticalSlope) {
            var x = verticalLine.origin[0];
            var y = nonVerticalSlope.slope * x + nonVerticalSlope.yIntercept;
            return [x, y];
        }
        /**
         * @private
         */
        function checkAngleOverlap(arc1, arc2, options) {
            var pointsOfIntersection = [];
            function checkAngles(a, b) {
                function checkAngle(n) {
                    return MakerJs.measure.isBetweenArcAngles(n, a, options.excludeTangents);
                }
                return checkAngle(b.startAngle) || checkAngle(b.endAngle);
            }
            if (checkAngles(arc1, arc2) || checkAngles(arc2, arc1) || (arc1.startAngle == arc2.startAngle && arc1.endAngle == arc2.endAngle)) {
                options.out_AreOverlapped = true;
            }
        }
        /**
         * @private
         */
        function checkLineOverlap(line1, line2, options) {
            var pointsOfIntersection = [];
            function checkPoints(index, a, b) {
                function checkPoint(p) {
                    return MakerJs.measure.isBetweenPoints(p, a, options.excludeTangents);
                }
                return checkPoint(b.origin) || checkPoint(b.end);
            }
            if (checkPoints(0, line1, line2) || checkPoints(1, line2, line1)) {
                options.out_AreOverlapped = true;
            }
        }
        /**
         * Calculates the intersection of slopes of two lines.
         *
         * @param line1 First line to use for slope.
         * @param line2 Second line to use for slope.
         * @param options Optional IPathIntersectionOptions.
         * @returns point of intersection of the two slopes, or null if the slopes did not intersect.
         */
        function slopeIntersectionPoint(line1, line2, options) {
            if (options === void 0) { options = {}; }
            var slope1 = getSlope(line1);
            var slope2 = getSlope(line2);
            if (!slope1.hasSlope && !slope2.hasSlope) {
                //lines are both vertical, see if x are the same
                if (MakerJs.round(slope1.line.origin[0] - slope2.line.origin[0]) == 0) {
                    //check for overlap
                    checkLineOverlap(line1, line2, options);
                }
                return null;
            }
            if (slope1.hasSlope && slope2.hasSlope && (MakerJs.round(slope1.slope - slope2.slope, .00001) == 0)) {
                //lines are parallel, but not vertical, see if y-intercept is the same
                if (MakerJs.round(slope1.yIntercept - slope2.yIntercept, .00001) == 0) {
                    //check for overlap
                    checkLineOverlap(line1, line2, options);
                }
                return null;
            }
            var pointOfIntersection;
            if (!slope1.hasSlope) {
                pointOfIntersection = verticalIntersectionPoint(line1, slope2);
            }
            else if (!slope2.hasSlope) {
                pointOfIntersection = verticalIntersectionPoint(line2, slope1);
            }
            else {
                // find intersection by line equation
                var x = (slope2.yIntercept - slope1.yIntercept) / (slope1.slope - slope2.slope);
                var y = slope1.slope * x + slope1.yIntercept;
                pointOfIntersection = [x, y];
            }
            return pointOfIntersection;
        }
        path.slopeIntersectionPoint = slopeIntersectionPoint;
        /**
         * @private
         */
        function lineToCircle(line, circle, options) {
            var radius = MakerJs.round(circle.radius);
            //clone the line
            var clonedLine = new MakerJs.paths.Line(MakerJs.point.subtract(line.origin, circle.origin), MakerJs.point.subtract(line.end, circle.origin));
            //get angle of line
            var lineAngleNormal = MakerJs.angle.ofLineInDegrees(line);
            //use the positive horizontal angle
            var lineAngle = (lineAngleNormal >= 180) ? lineAngleNormal - 360 : lineAngleNormal;
            //rotate the line to horizontal
            path.rotate(clonedLine, -lineAngle, MakerJs.point.zero());
            //remember how to undo the rotation we just did
            function unRotate(resultAngle) {
                var unrotated = resultAngle + lineAngle;
                return MakerJs.angle.noRevolutions(unrotated);
            }
            //line is horizontal, get the y value from any point
            var lineY = MakerJs.round(clonedLine.origin[1]);
            var lineYabs = Math.abs(lineY);
            //if y is greater than radius, there is no intersection
            if (lineYabs > radius) {
                return null;
            }
            var anglesOfIntersection = [];
            //if horizontal Y is the same as the radius, we know it's 90 degrees
            if (lineYabs == radius) {
                if (options.excludeTangents) {
                    return null;
                }
                anglesOfIntersection.push(unRotate(lineY > 0 ? 90 : 270));
            }
            else {
                function intersectionBetweenEndpoints(x, angleOfX) {
                    if (MakerJs.measure.isBetween(MakerJs.round(x), MakerJs.round(clonedLine.origin[0]), MakerJs.round(clonedLine.end[0]), options.excludeTangents)) {
                        anglesOfIntersection.push(unRotate(angleOfX));
                    }
                }
                //find angle where line intersects
                var intersectRadians = Math.asin(lineY / radius);
                var intersectDegrees = MakerJs.angle.toDegrees(intersectRadians);
                //line may intersect in 2 places
                var intersectX = Math.cos(intersectRadians) * radius;
                intersectionBetweenEndpoints(-intersectX, 180 - intersectDegrees);
                intersectionBetweenEndpoints(intersectX, intersectDegrees);
            }
            if (anglesOfIntersection.length > 0) {
                return anglesOfIntersection;
            }
            return null;
        }
        /**
         * @private
         */
        function circleToCircle(circle1, circle2, options) {
            //see if circles are the same
            if (circle1.radius == circle2.radius && MakerJs.point.areEqual(circle1.origin, circle2.origin, .0001)) {
                options.out_AreOverlapped = true;
                return null;
            }
            //get offset from origin
            var offset = MakerJs.point.subtract(MakerJs.point.zero(), circle1.origin);
            //clone circle1 and move to origin
            var c1 = new MakerJs.paths.Circle(MakerJs.point.zero(), circle1.radius);
            //clone circle2 and move relative to circle1
            var c2 = new MakerJs.paths.Circle(MakerJs.point.subtract(circle2.origin, circle1.origin), circle2.radius);
            //rotate circle2 to horizontal, c2 will be to the right of the origin.
            var c2Angle = MakerJs.angle.ofPointInDegrees(MakerJs.point.zero(), c2.origin);
            path.rotate(c2, -c2Angle, MakerJs.point.zero());
            function unRotate(resultAngle) {
                var unrotated = resultAngle + c2Angle;
                return MakerJs.angle.noRevolutions(unrotated);
            }
            //get X of c2 origin
            var x = c2.origin[0];
            //see if c2 is outside of c1
            if (x - c2.radius > c1.radius) {
                return null;
            }
            //see if c2 is within c1
            if (x + c2.radius < c1.radius) {
                return null;
            }
            //see if c1 is within c2
            if (x - c2.radius < -c1.radius) {
                return null;
            }
            //see if circles are tangent interior
            if (MakerJs.round(c2.radius - x - c1.radius) == 0) {
                if (options.excludeTangents) {
                    return null;
                }
                return [[unRotate(180)], [unRotate(180)]];
            }
            //see if circles are tangent exterior
            if (MakerJs.round(x - c2.radius - c1.radius) == 0) {
                if (options.excludeTangents) {
                    return null;
                }
                return [[unRotate(0)], [unRotate(180)]];
            }
            function bothAngles(oneAngle) {
                return [unRotate(oneAngle), unRotate(MakerJs.angle.mirror(oneAngle, false, true))];
            }
            var c1IntersectionAngle = MakerJs.solvers.solveTriangleSSS(c2.radius, c1.radius, x);
            var c2IntersectionAngle = MakerJs.solvers.solveTriangleSSS(c1.radius, x, c2.radius);
            return [bothAngles(c1IntersectionAngle), bothAngles(180 - c2IntersectionAngle)];
        }
    })(path = MakerJs.path || (MakerJs.path = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var path;
    (function (path) {
        /**
         * @private
         */
        function getPointProperties(pathToInspect) {
            var points = MakerJs.point.fromPathEnds(pathToInspect);
            if (points) {
                function pointProperty(index) {
                    return { point: points[index], propertyName: propertyNames[index] };
                }
                var propertyNames = null;
                var map = {};
                map[MakerJs.pathType.Arc] = function (arc) {
                    propertyNames = ['startAngle', 'endAngle'];
                };
                map[MakerJs.pathType.Line] = function (line) {
                    propertyNames = ['origin', 'end'];
                };
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
        function getMatchingPointProperties(path1, path2, options) {
            var path1Properties = getPointProperties(path1);
            var path2Properties = getPointProperties(path2);
            var result = null;
            function makeMatch(pathContext, pointProperties, index) {
                return {
                    path: pathContext,
                    isStart: index == 0,
                    propertyName: pointProperties[index].propertyName,
                    point: pointProperties[index].point,
                    oppositePoint: pointProperties[1 - index].point
                };
            }
            function check(i1, i2) {
                if (MakerJs.point.areEqual(path1Properties[i1].point, path2Properties[i2].point, .0001)) {
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
        function populateShardPointsFromReferenceCircle(filletRadius, center, properties, options) {
            var referenceCircle = new MakerJs.paths.Circle(center, filletRadius);
            //get reference circle intersection points
            for (var i = 0; i < 2; i++) {
                var circleIntersection = path.intersection(referenceCircle, properties[i].path);
                if (!circleIntersection) {
                    return false;
                }
                properties[i].shardPoint = circleIntersection.intersectionPoints[0];
                if (MakerJs.point.areEqual(properties[i].point, circleIntersection.intersectionPoints[0], .0001)) {
                    if (circleIntersection.intersectionPoints.length > 1) {
                        properties[i].shardPoint = circleIntersection.intersectionPoints[1];
                    }
                    else {
                        return false;
                    }
                }
            }
            return true;
        }
        /**
         * @private
         */
        function cloneAndBreakPath(pathToShard, shardPoint) {
            var shardStart = MakerJs.cloneObject(pathToShard);
            var shardEnd = path.breakAtPoint(shardStart, shardPoint);
            return [shardStart, shardEnd];
        }
        /**
         * @private
         */
        function getGuidePath(context, filletRadius, nearPoint) {
            var result = null;
            var map = {};
            map[MakerJs.pathType.Arc] = function (arc) {
                var guideRadius = arc.radius;
                //see if the guideline should be external or internal to the context arc.
                var guideArcShard = cloneAndBreakPath(arc, context.shardPoint)[context.isStart ? 0 : 1];
                if (guideArcShard) {
                    if (MakerJs.measure.isArcConcaveTowardsPoint(guideArcShard, nearPoint)) {
                        guideRadius -= filletRadius;
                    }
                    else {
                        guideRadius += filletRadius;
                    }
                    result = new MakerJs.paths.Arc(arc.origin, guideRadius, arc.startAngle, arc.endAngle);
                }
            };
            map[MakerJs.pathType.Line] = function (line) {
                result = new MakerJs.paths.Parallel(line, filletRadius, nearPoint);
            };
            var fn = map[context.path.type];
            if (fn) {
                fn(context.path);
            }
            return result;
        }
        /**
         * @private
         */
        function getFilletResult(context, filletRadius, filletCenter) {
            var result = null;
            var map = {};
            map[MakerJs.pathType.Arc] = function (arc) {
                var guideLine = new MakerJs.paths.Line(arc.origin, filletCenter);
                var guideLineAngle = MakerJs.angle.ofLineInDegrees(guideLine);
                var filletAngle = guideLineAngle;
                //the context is an arc and the fillet is an arc so they will be tangent. If the fillet is external to the arc then the tangent is opposite.
                if (!MakerJs.measure.isArcConcaveTowardsPoint(arc, filletCenter)) {
                    filletAngle += 180;
                }
                result = {
                    filletAngle: MakerJs.angle.noRevolutions(filletAngle),
                    clipPath: function () {
                        arc[context.propertyName] = guideLineAngle;
                    }
                };
            };
            map[MakerJs.pathType.Line] = function (line) {
                //make a small vertical line
                var guideLine = new MakerJs.paths.Line([0, 0], [0, 1]);
                //rotate this vertical line the same angle as the line context. It will be perpendicular.
                var lineAngle = MakerJs.angle.ofLineInDegrees(line);
                path.rotate(guideLine, lineAngle, [0, 0]);
                path.moveRelative(guideLine, filletCenter);
                //get the intersection point of the slopes of the context line and the perpendicular line. This is where the fillet meets the line.
                var intersectionPoint = path.slopeIntersectionPoint(line, guideLine);
                if (intersectionPoint) {
                    result = {
                        filletAngle: MakerJs.angle.ofPointInDegrees(filletCenter, intersectionPoint),
                        clipPath: function () {
                            line[context.propertyName] = intersectionPoint;
                        }
                    };
                }
            };
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
        function getDogboneResult(context, filletCenter) {
            var result = {
                filletAngle: MakerJs.angle.ofPointInDegrees(filletCenter, context.shardPoint),
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
        function testFilletResult(context, result) {
            var test = false;
            if (result) {
                //temporarily clip the path.
                var originalValue = context.path[context.propertyName];
                result.clipPath();
                //don't allow a fillet which effectivly eliminates the path.
                if (MakerJs.measure.pathLength(context.path) > 0) {
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
        function getLineRatio(lines) {
            var totalLength = 0;
            var lengths = [];
            for (var i = 0; i < lines.length; i++) {
                var length = MakerJs.measure.pathLength(lines[i]);
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
        function dogbone(line1, line2, filletRadius, options) {
            if (MakerJs.isPathLine(line1) && MakerJs.isPathLine(line2) && filletRadius && filletRadius > 0) {
                var opts = {
                    pointMatchingDistance: .005
                };
                MakerJs.extendObject(opts, options);
                //first find the common point
                var commonProperty = getMatchingPointProperties(line1, line2, options);
                if (commonProperty) {
                    //get the ratio comparison of the two lines
                    var ratio = getLineRatio([line1, line2]);
                    //draw a line between the two endpoints, and get the bisection point at the ratio
                    var span = new MakerJs.paths.Line(commonProperty[0].oppositePoint, commonProperty[1].oppositePoint);
                    var midRatioPoint = MakerJs.point.middle(span, ratio);
                    //use the bisection theorem to get the angle bisecting the lines
                    var bisectionAngle = MakerJs.angle.ofPointInDegrees(commonProperty[0].point, midRatioPoint);
                    var center = MakerJs.point.add(commonProperty[0].point, MakerJs.point.fromPolar(MakerJs.angle.toRadians(bisectionAngle), filletRadius));
                    if (!populateShardPointsFromReferenceCircle(filletRadius, center, commonProperty, opts)) {
                        return null;
                    }
                    //get the angles of the fillet and a function which clips the path to the fillet.
                    var results = [];
                    for (var i = 0; i < 2; i++) {
                        var result = getDogboneResult(commonProperty[i], center);
                        if (!result) {
                            return null;
                        }
                        results.push(result);
                    }
                    var filletArc = new MakerJs.paths.Arc(center, filletRadius, results[0].filletAngle, results[1].filletAngle);
                    //make sure midpoint of fillet is outside of the angle
                    if (MakerJs.round(MakerJs.angle.noRevolutions(MakerJs.angle.ofArcMiddle(filletArc))) == MakerJs.round(bisectionAngle)) {
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
        path.dogbone = dogbone;
        /**
         * Adds a round corner to the inside angle between 2 paths. The paths must meet at one point.
         *
         * @param path1 First path to fillet, which will be modified to fit the fillet.
         * @param path2 Second path to fillet, which will be modified to fit the fillet.
         * @returns Arc path object of the new fillet.
         */
        function fillet(path1, path2, filletRadius, options) {
            if (path1 && path2 && filletRadius && filletRadius > 0) {
                var opts = {
                    pointMatchingDistance: .005
                };
                MakerJs.extendObject(opts, options);
                //first find the common point
                var commonProperty = getMatchingPointProperties(path1, path2, options);
                if (commonProperty) {
                    //since arcs can curl beyond, we need a local reference point. 
                    //An intersection with a circle of the same radius as the desired fillet should suffice.
                    if (!populateShardPointsFromReferenceCircle(filletRadius, commonProperty[0].point, commonProperty, opts)) {
                        return null;
                    }
                    //get "parallel" guidelines
                    var guidePaths = [];
                    for (var i = 0; i < 2; i++) {
                        var otherPathShardPoint = commonProperty[1 - i].shardPoint;
                        if (!otherPathShardPoint) {
                            return null;
                        }
                        var guidePath = getGuidePath(commonProperty[i], filletRadius, otherPathShardPoint);
                        guidePaths.push(guidePath);
                    }
                    //the center of the fillet is the point where the guidelines intersect.
                    var intersectionPoint = path.intersection(guidePaths[0], guidePaths[1]);
                    if (intersectionPoint) {
                        var center;
                        //if guidelines intersect in more than one place, choose the closest one.
                        if (intersectionPoint.intersectionPoints.length == 1) {
                            center = intersectionPoint.intersectionPoints[0];
                        }
                        else {
                            center = MakerJs.point.closest(commonProperty[0].point, intersectionPoint.intersectionPoints);
                        }
                        //get the angles of the fillet and a function which clips the path to the fillet.
                        var results = [];
                        for (var i = 0; i < 2; i++) {
                            var result = getFilletResult(commonProperty[i], filletRadius, center);
                            if (!result) {
                                return null;
                            }
                            results.push(result);
                        }
                        //the two paths may actually be on the same line
                        if (MakerJs.round(results[0].filletAngle - results[1].filletAngle) == 0)
                            return null;
                        var filletArc = new MakerJs.paths.Arc(center, filletRadius, results[0].filletAngle, results[1].filletAngle);
                        var filletSpan = MakerJs.measure.arcAngle(filletArc);
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
        path.fillet = fillet;
    })(path = MakerJs.path || (MakerJs.path = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var kit;
    (function (kit) {
        //construct a model
        /**
         * Helper function to use the JavaScript "apply" function in conjunction with the "new" keyword.
         *
         * @param ctor The constructor for the class which is an IKit.
         * @param args The array of parameters passed to the constructor.
         * @returns A new instance of the class, which implements the IModel interface.
         */
        function construct(ctor, args) {
            function F() {
                return ctor.apply(this, args);
            }
            F.prototype = ctor.prototype;
            return new F();
        }
        kit.construct = construct;
        /**
         * Extract just the initial sample values from a kit.
         *
         * @param ctor The constructor for the class which is an IKit.
         * @returns Array of the inital sample values provided in the metaParameters array.
         */
        function getParameterValues(ctor) {
            var parameters = [];
            var metaParams = ctor.metaParameters;
            if (metaParams) {
                for (var i = 0; i < metaParams.length; i++) {
                    var value = metaParams[i].value;
                    if (Array.isArray(value)) {
                        value = value[0];
                    }
                    parameters.push(value);
                }
            }
            return parameters;
        }
        kit.getParameterValues = getParameterValues;
    })(kit = MakerJs.kit || (MakerJs.kit = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var model;
    (function (model) {
        /**
         * @private
         */
        var PointMap = (function () {
            function PointMap(matchingDistance) {
                if (matchingDistance === void 0) { matchingDistance = .001; }
                this.matchingDistance = matchingDistance;
                this.list = [];
            }
            PointMap.prototype.add = function (pointToAdd, item) {
                this.list.push({ averagePoint: pointToAdd, item: item });
            };
            PointMap.prototype.find = function (pointToFind, saveAverage) {
                for (var i = 0; i < this.list.length; i++) {
                    var item = this.list[i];
                    var distance = MakerJs.measure.pointDistance(pointToFind, item.averagePoint);
                    if (distance <= this.matchingDistance) {
                        if (saveAverage) {
                            item.averagePoint = MakerJs.point.average(item.averagePoint, pointToFind);
                        }
                        return item.item;
                    }
                }
                return null;
            };
            return PointMap;
        })();
        model.PointMap = PointMap;
        /**
         * @private
         */
        function getOpposedLink(linkedPaths, pathContext) {
            if (linkedPaths[0].path === pathContext) {
                return linkedPaths[1];
            }
            return linkedPaths[0];
        }
        /**
         * @private
         */
        function getFirstPathFromModel(modelContext) {
            if (!modelContext.paths)
                return null;
            for (var pathId in modelContext.paths) {
                return modelContext.paths[pathId];
            }
            return null;
        }
        /**
         * @private
         */
        function collectLoop(loop, loops, detach) {
            loops.push(loop);
            if (detach) {
                detachLoop(loop);
            }
        }
        /**
         * @private
         */
        function follow(connections, loops, detach) {
            //for a given point, follow the paths that connect to each other to form loops
            for (var p in connections) {
                var linkedPaths = connections[p];
                if (linkedPaths) {
                    var loopModel = {
                        paths: {},
                        insideCount: 0
                    };
                    var firstLink = linkedPaths[0];
                    var currLink = firstLink;
                    while (true) {
                        var currPath = currLink.path;
                        currPath.reversed = currLink.reversed;
                        var id = model.getSimilarPathId(loopModel, currPath.pathId);
                        loopModel.paths[id] = currPath;
                        if (!connections[currLink.nextConnection])
                            break;
                        var nextLink = getOpposedLink(connections[currLink.nextConnection], currLink.path);
                        connections[currLink.nextConnection] = null;
                        if (!nextLink)
                            break;
                        currLink = nextLink;
                        if (currLink.path === firstLink.path) {
                            //loop is closed
                            collectLoop(loopModel, loops, detach);
                            break;
                        }
                    }
                }
            }
        }
        /**
         * Find paths that have common endpoints and form loops.
         *
         * @param modelContext The model to search for loops.
         * @param options Optional options object.
         * @returns A new model with child models ranked according to their containment within other found loops. The paths of models will be IPathDirectionalWithPrimeContext.
         */
        function findLoops(modelContext, options) {
            var loops = [];
            var connections = {};
            var result = { models: {} };
            var opts = {
                pointMatchingDistance: .005
            };
            MakerJs.extendObject(opts, options);
            function getLinkedPathsOnConnectionPoint(p) {
                var serializedPoint = MakerJs.point.serialize(p, .0001); //TODO convert to pointmap
                if (!(serializedPoint in connections)) {
                    connections[serializedPoint] = [];
                }
                return connections[serializedPoint];
            }
            function spin(callback) {
                for (var i = 0; i < loops.length; i++) {
                    callback(loops[i]);
                }
            }
            function getModelByDepth(depth) {
                var id = depth.toString();
                if (!(id in result.models)) {
                    var newModel = { models: {} };
                    result.models[id] = newModel;
                }
                return result.models[id];
            }
            //todo: remove dead ends first
            model.originate(modelContext);
            //find loops by looking at all paths in this model
            model.walkPaths(modelContext, function (modelContext, pathId, pathContext) {
                if (!pathContext)
                    return;
                var safePath = MakerJs.cloneObject(pathContext);
                safePath.pathId = pathId;
                safePath.modelContext = modelContext;
                //circles are loops by nature
                if (safePath.type == MakerJs.pathType.Circle) {
                    var loopModel = {
                        paths: {},
                        insideCount: 0
                    };
                    loopModel.paths[pathId] = safePath;
                    collectLoop(loopModel, loops, opts.removeFromOriginal);
                }
                else {
                    //gather both endpoints from all non-circle segments
                    safePath.endPoints = MakerJs.point.fromPathEnds(safePath);
                    for (var i = 2; i--;) {
                        var linkedPath = {
                            path: safePath,
                            nextConnection: MakerJs.point.serialize(safePath.endPoints[1 - i], .0001),
                            reversed: i != 0
                        };
                        getLinkedPathsOnConnectionPoint(safePath.endPoints[i]).push(linkedPath);
                    }
                }
            });
            //follow paths to find loops
            follow(connections, loops, opts.removeFromOriginal);
            //now we have all loops, we need to see which are inside of each other
            spin(function (firstLoop) {
                var firstPath = getFirstPathFromModel(firstLoop);
                if (!firstPath)
                    return;
                spin(function (secondLoop) {
                    if (firstLoop === secondLoop)
                        return;
                    if (model.isPathInsideModel(firstPath, secondLoop)) {
                        firstLoop.insideCount++;
                    }
                });
            });
            //now we can group similar loops by their nested level
            spin(function (loop) {
                var depthModel = getModelByDepth(loop.insideCount);
                var id = model.countChildModels(depthModel).toString();
                delete loop.insideCount;
                depthModel.models[id] = loop;
            });
            return result;
        }
        model.findLoops = findLoops;
        /**
         * Remove all paths in a loop model from the model(s) which contained them.
         *
         * @param loopToDetach The model to search for loops.
         */
        function detachLoop(loopToDetach) {
            for (var id in loopToDetach.paths) {
                var pathDirectionalWithOriginalContext = loopToDetach.paths[id];
                var primeModel = pathDirectionalWithOriginalContext.modelContext;
                if (primeModel && primeModel.paths && pathDirectionalWithOriginalContext.pathId) {
                    delete primeModel.paths[pathDirectionalWithOriginalContext.pathId];
                }
            }
        }
        model.detachLoop = detachLoop;
        /**
         * @private
         */
        var DeadEndFinder = (function () {
            function DeadEndFinder(pointMatchingDistance) {
                this.pointMatchingDistance = pointMatchingDistance;
                this.pointMap = new PointMap(pointMatchingDistance);
            }
            DeadEndFinder.prototype.addPathRef = function (p, pathRef) {
                var found = this.pointMap.find(p, true);
                if (found) {
                    found.push(pathRef);
                }
                else {
                    this.pointMap.add(p, [pathRef]);
                }
            };
            DeadEndFinder.prototype.removeMatchingPathRefs = function (a, b) {
                //see if any are the same in each array
                for (var ai = 0; ai < a.length; ai++) {
                    for (var bi = 0; bi < b.length; bi++) {
                        if (a[ai] === b[bi]) {
                            var pathRef = a[ai];
                            a.splice(ai, 1);
                            b.splice(bi, 1);
                            return pathRef;
                        }
                    }
                }
                return null;
            };
            DeadEndFinder.prototype.removePathRef = function (pathRef) {
                var _this = this;
                var removePath = function (p) {
                    var pathRefs = _this.pointMap.find(p, false);
                    for (var i = 0; i < pathRefs.length; i++) {
                        if (pathRefs[i] === pathRef) {
                            pathRefs.splice(i, 1);
                            return;
                        }
                    }
                };
                for (var i = 2; i--;) {
                    removePath(pathRef.endPoints[i]);
                }
            };
            DeadEndFinder.prototype.removeDeadEnd = function () {
                var found = false;
                var oddPathRefs = null;
                for (var i = 0; i < this.pointMap.list.length; i++) {
                    var pathRefs = this.pointMap.list[i].item;
                    if (pathRefs.length % 2 == 0)
                        continue;
                    if (pathRefs.length == 1) {
                        var pathRef = pathRefs[0];
                        this.removePathRef(pathRef);
                        delete pathRef.modelContext.paths[pathRef.pathId];
                        found = true;
                    }
                    else {
                        if (!oddPathRefs) {
                            //save this for another iteration
                            oddPathRefs = pathRefs;
                        }
                        else {
                            //compare with the saved
                            var pathRef = this.removeMatchingPathRefs(oddPathRefs, pathRefs);
                            if (pathRef) {
                                delete pathRef.modelContext.paths[pathRef.pathId];
                                found = true;
                                //clear the saved
                                oddPathRefs = null;
                            }
                        }
                    }
                }
                return found;
            };
            return DeadEndFinder;
        })();
        function removeDeadEnds(modelContext, pointMatchingDistance) {
            if (pointMatchingDistance === void 0) { pointMatchingDistance = .005; }
            var serializedPointAccuracy = .0001;
            var deadEndFinder = new DeadEndFinder(pointMatchingDistance);
            model.walkPaths(modelContext, function (modelContext, pathId, pathContext) {
                var endPoints = MakerJs.point.fromPathEnds(pathContext);
                if (!endPoints)
                    return;
                var pathRef = { modelContext: modelContext, pathId: pathId, endPoints: endPoints };
                for (var i = 2; i--;) {
                    deadEndFinder.addPathRef(endPoints[i], pathRef);
                }
            });
            while (deadEndFinder.removeDeadEnd())
                ;
        }
        model.removeDeadEnds = removeDeadEnds;
    })(model = MakerJs.model || (MakerJs.model = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var exporter;
    (function (exporter) {
        /**
         * Class for an XML tag.
         * @private
         */
        var XmlTag = (function () {
            /**
             * @param name Name of the XML tag.
             * @param attrs Optional attributes for the tag.
             */
            function XmlTag(name, attrs) {
                this.name = name;
                this.attrs = attrs;
                /**
                 * Text between the opening and closing tags.
                 */
                this.innerText = '';
            }
            /**
             * Escapes certain characters within a string so that it can appear in a tag or its attribute.
             *
             * @returns Escaped string.
             */
            XmlTag.escapeString = function (value) {
                var escape = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;'
                };
                for (var code in escape) {
                    //.split then .join is a 'replace'
                    value = value.split(code).join(escape[code]);
                }
                return value;
            };
            /**
             * Get the opening tag.
             *
             * @param selfClose Flag to determine if opening tag should be self closing.
             */
            XmlTag.prototype.getOpeningTag = function (selfClose) {
                var attrs = '';
                function outputAttr(attrName, attrValue) {
                    if (attrValue == null || typeof attrValue === 'undefined')
                        return;
                    if (typeof attrValue === 'string') {
                        attrValue = XmlTag.escapeString(attrValue);
                    }
                    attrs += ' ' + attrName + '="' + attrValue + '"';
                }
                for (var name in this.attrs) {
                    outputAttr(name, this.attrs[name]);
                }
                return '<' + this.name + attrs + (selfClose ? '/' : '') + '>';
            };
            /**
             * Get the inner text.
             */
            XmlTag.prototype.getInnerText = function () {
                if (this.innerTextEscaped) {
                    return this.innerText;
                }
                else {
                    return XmlTag.escapeString(this.innerText);
                }
            };
            /**
             * Get the closing tag.
             */
            XmlTag.prototype.getClosingTag = function () {
                return '</' + this.name + '>';
            };
            /**
             * Output the entire tag as a string.
             */
            XmlTag.prototype.toString = function () {
                var selfClose = !this.innerText;
                if (selfClose) {
                    return this.getOpeningTag(true);
                }
                else {
                    return this.getOpeningTag(false) + this.getInnerText() + this.getClosingTag();
                }
            };
            return XmlTag;
        })();
        exporter.XmlTag = XmlTag;
    })(exporter = MakerJs.exporter || (MakerJs.exporter = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var exporter;
    (function (exporter) {
        /**
         * @private
         */
        function wrap(prefix, content, condition) {
            if (condition) {
                return prefix + '(' + content + ')';
            }
            else {
                return content;
            }
        }
        /**
         * @private
         */
        function facetSizeToResolution(arcOrCircle, facetSize) {
            if (!facetSize)
                return;
            var circle = new MakerJs.paths.Circle([0, 0], arcOrCircle.radius);
            var length = MakerJs.measure.pathLength(circle);
            if (!length)
                return;
            return length / facetSize;
        }
        /**
         * @private
         */
        function pathsToOpenJsCad(modelContext, facetSize) {
            var head = '';
            var tail = '';
            var first = true;
            var exit = false;
            var reverseTail = false;
            var beginMap = {};
            beginMap[MakerJs.pathType.Circle] = function (circle, dirPath) {
                var circleOptions = {
                    center: MakerJs.point.rounded(circle.origin),
                    radius: circle.radius,
                    resolution: facetSizeToResolution(circle, facetSize)
                };
                head = wrap('CAG.circle', JSON.stringify(circleOptions), true);
                exit = true;
            };
            beginMap[MakerJs.pathType.Line] = function (line, dirPath) {
                head = wrap('new CSG.Path2D', JSON.stringify(dirPath.reversed ? [dirPath.endPoints[1], dirPath.endPoints[0]] : dirPath.endPoints), true);
            };
            beginMap[MakerJs.pathType.Arc] = function (arc, dirPath) {
                var endAngle = MakerJs.angle.ofArcEnd(arc);
                if (dirPath.reversed) {
                    reverseTail = true;
                }
                var arcOptions = {
                    center: MakerJs.point.rounded(arc.origin),
                    radius: arc.radius,
                    startangle: arc.startAngle,
                    endangle: endAngle,
                    resolution: facetSizeToResolution(arc, facetSize)
                };
                head = wrap('new CSG.Path2D.arc', JSON.stringify(arcOptions), true);
            };
            var appendMap = {};
            appendMap[MakerJs.pathType.Line] = function (line, dirPath) {
                var reverse = (reverseTail != dirPath.reversed);
                var endPoint = MakerJs.point.rounded(dirPath.endPoints[reverse ? 0 : 1]);
                append(wrap('.appendPoint', JSON.stringify(endPoint), true));
            };
            appendMap[MakerJs.pathType.Arc] = function (arc, dirPath) {
                var reverse = (reverseTail != dirPath.reversed);
                var endAngle = MakerJs.angle.ofArcEnd(arc);
                var arcOptions = {
                    radius: arc.radius,
                    clockwise: reverse,
                    large: Math.abs(endAngle - arc.startAngle) > 180,
                    resolution: facetSizeToResolution(arc, facetSize)
                };
                var endPoint = MakerJs.point.rounded(dirPath.endPoints[reverse ? 0 : 1]);
                append(wrap('.appendArc', JSON.stringify(endPoint) + ',' + JSON.stringify(arcOptions), true));
            };
            function append(s) {
                if (reverseTail) {
                    tail = s + tail;
                }
                else {
                    tail += s;
                }
            }
            for (var pathId in modelContext.paths) {
                var pathContext = modelContext.paths[pathId];
                var fn = first ? beginMap[pathContext.type] : appendMap[pathContext.type];
                if (fn) {
                    fn(pathContext, pathContext);
                }
                if (exit) {
                    return head;
                }
                first = false;
            }
            return head + tail + '.close().innerToCAG()';
        }
        /**
         * Creates a string of JavaScript code for execution with the OpenJsCad engine.
         *
         * @param modelToExport Model object to export.
         * @param options Export options object.
         * @param options.extrusion Height of 3D extrusion.
         * @param options.resolution Size of facets.
         * @returns String of JavaScript containing a main() function for OpenJsCad.
         */
        function toOpenJsCad(modelToExport, options) {
            if (!modelToExport)
                return '';
            var all = '';
            var depth = 0;
            var depthModel;
            var opts = {
                extrusion: 1,
                pointMatchingDistance: .005,
                functionName: 'main'
            };
            MakerJs.extendObject(opts, options);
            if (modelToExport.exporterOptions) {
                MakerJs.extendObject(opts, modelToExport.exporterOptions['toOpenJsCad']);
            }
            //pass options back into calling object
            MakerJs.extendObject(options, opts);
            if (opts && opts.modelMap) {
                all = exportFromOptionsMap(modelToExport, opts.modelMap);
            }
            if (!all) {
                var result = [];
                var loops = MakerJs.model.findLoops(modelToExport, opts);
                while (depthModel = loops.models[depth]) {
                    var union = '';
                    for (var modelId in depthModel.models) {
                        var subModel = depthModel.models[modelId];
                        union += wrap('.union', pathsToOpenJsCad(subModel, opts.facetSize), union);
                    }
                    var operator = (depth % 2 == 0) ? '.union' : '.subtract';
                    result.push(wrap(operator, union, result.length));
                    depth++;
                }
                var extrudeOptions = { offset: [0, 0, opts.extrusion] };
                result.push(wrap('.extrude', JSON.stringify(extrudeOptions), true));
                all = 'return ' + result.join('');
            }
            return 'function ' + opts.functionName + '(){' + all + ';}';
        }
        exporter.toOpenJsCad = toOpenJsCad;
        function exportFromOptionsMap(modelToExport, optionsMap) {
            if (!modelToExport.models)
                return;
            var result = [];
            var union = [];
            var i = 0;
            for (var key in optionsMap) {
                var fName = 'f' + i;
                var options = optionsMap[key];
                options.functionName = fName;
                var childModel = modelToExport.models[key];
                if (childModel) {
                    result.push(toOpenJsCad(childModel, options));
                    union.push('(' + fName + '())');
                }
                i++;
            }
            if (!result.length)
                return;
            result.push('return ' + union.join('.union'));
            return result.join(' ');
        }
        /**
         * Executes a JavaScript string with the OpenJsCad engine - converts 2D to 3D.
         *
         * @param modelToExport Model object to export.
         * @param options Export options object.
         * @param options.extrusion Height of 3D extrusion.
         * @param options.resolution Size of facets.
         * @returns String of STL format of 3D object.
         */
        function toSTL(modelToExport, options) {
            if (options === void 0) { options = {}; }
            if (!modelToExport)
                return '';
            var script = toOpenJsCad(modelToExport, options);
            script += 'return ' + options.functionName + '();';
            var f = new Function(script);
            var csg = f();
            return csg.toStlString();
        }
        exporter.toSTL = toSTL;
    })(exporter = MakerJs.exporter || (MakerJs.exporter = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var exporter;
    (function (exporter) {
        /**
         * Renders an item in SVG markup.
         *
         * @param itemToExport Item to render: may be a path, an array of paths, or a model object.
         * @param options Rendering options object.
         * @param options.annotate Boolean to indicate that the id's of paths should be rendered as SVG text elements.
         * @param options.origin point object for the rendered reference origin.
         * @param options.scale Number to scale the SVG rendering.
         * @param options.stroke String color of the rendered paths.
         * @param options.strokeWidth String numeric width and optional units of the rendered paths.
         * @param options.units String of the unit system. May be omitted. See makerjs.unitType for possible values.
         * @param options.useSvgPathOnly Boolean to use SVG path elements instead of line, circle etc.
         * @returns String of XML / SVG content.
         */
        function toSVG(itemToExport, options) {
            var opts = {
                annotate: false,
                origin: null,
                scale: 1,
                stroke: "#000",
                strokeWidth: '0.25mm',
                fontSize: '9pt',
                useSvgPathOnly: true,
                viewBox: true
            };
            MakerJs.extendObject(opts, options);
            var modelToExport;
            var itemToExportIsModel = MakerJs.isModel(itemToExport);
            if (itemToExportIsModel) {
                modelToExport = itemToExport;
                if (modelToExport.exporterOptions) {
                    MakerJs.extendObject(opts, modelToExport.exporterOptions['toSVG']);
                }
            }
            var elements = [];
            var layers = {};
            function append(value, layer) {
                if (layer) {
                    if (!(layer in layers)) {
                        layers[layer] = [];
                    }
                    layers[layer].push(value);
                }
                else {
                    elements.push(value);
                }
            }
            function fixPoint(pointToFix) {
                //in DXF Y increases upward. in SVG, Y increases downward
                var pointMirroredY = MakerJs.point.mirror(pointToFix, false, true);
                return MakerJs.point.scale(pointMirroredY, opts.scale);
            }
            function fixPath(pathToFix, origin) {
                //mirror creates a copy, so we don't modify the original
                var mirrorY = MakerJs.path.mirror(pathToFix, false, true);
                return MakerJs.path.moveRelative(MakerJs.path.scale(mirrorY, opts.scale), origin);
            }
            function createElement(tagname, attrs, layer, innerText) {
                if (innerText === void 0) { innerText = null; }
                attrs['vector-effect'] = 'non-scaling-stroke';
                var tag = new exporter.XmlTag(tagname, attrs);
                if (innerText) {
                    tag.innerText = innerText;
                }
                append(tag.toString(), layer);
            }
            function drawText(id, textPoint) {
                createElement("text", {
                    "id": id + "_text",
                    "x": textPoint[0],
                    "y": textPoint[1]
                }, null, id);
            }
            function drawPath(id, x, y, d, layer, textPoint) {
                createElement("path", {
                    "id": id,
                    "d": ["M", MakerJs.round(x), MakerJs.round(y)].concat(d).join(" ")
                }, layer);
                if (opts.annotate) {
                    drawText(id, textPoint);
                }
            }
            var map = {};
            map[MakerJs.pathType.Line] = function (id, line, origin, layer) {
                var start = line.origin;
                var end = line.end;
                if (opts.useSvgPathOnly) {
                    drawPath(id, start[0], start[1], [MakerJs.round(end[0]), MakerJs.round(end[1])], layer, MakerJs.point.middle(line));
                }
                else {
                    createElement("line", {
                        "id": id,
                        "x1": MakerJs.round(start[0]),
                        "y1": MakerJs.round(start[1]),
                        "x2": MakerJs.round(end[0]),
                        "y2": MakerJs.round(end[1])
                    }, layer);
                    if (opts.annotate) {
                        drawText(id, MakerJs.point.middle(line));
                    }
                }
            };
            map[MakerJs.pathType.Circle] = function (id, circle, origin, layer) {
                var center = circle.origin;
                if (opts.useSvgPathOnly) {
                    circleInPaths(id, center, circle.radius, layer);
                }
                else {
                    createElement("circle", {
                        "id": id,
                        "r": circle.radius,
                        "cx": MakerJs.round(center[0]),
                        "cy": MakerJs.round(center[1])
                    }, layer);
                }
                if (opts.annotate) {
                    drawText(id, center);
                }
            };
            function circleInPaths(id, center, radius, layer) {
                var d = ['m', -radius, 0];
                function halfCircle(sign) {
                    d.push('a');
                    svgArcData(d, radius, [2 * radius * sign, 0]);
                }
                halfCircle(1);
                halfCircle(-1);
                drawPath(id, center[0], center[1], d, layer, center);
            }
            function svgArcData(d, radius, endPoint, largeArc, decreasing) {
                var end = endPoint;
                d.push(radius, radius);
                d.push(0); //0 = x-axis rotation
                d.push(largeArc ? 1 : 0); //large arc=1, small arc=0
                d.push(decreasing ? 0 : 1); //sweep-flag 0=decreasing, 1=increasing 
                d.push(MakerJs.round(end[0]), MakerJs.round(end[1]));
            }
            map[MakerJs.pathType.Arc] = function (id, arc, origin, layer) {
                var arcPoints = MakerJs.point.fromArc(arc);
                if (MakerJs.point.areEqual(arcPoints[0], arcPoints[1])) {
                    circleInPaths(id, arc.origin, arc.radius, layer);
                }
                else {
                    var d = ['A'];
                    svgArcData(d, arc.radius, arcPoints[1], Math.abs(arc.endAngle - arc.startAngle) > 180, arc.startAngle > arc.endAngle);
                    drawPath(id, arcPoints[0][0], arcPoints[0][1], d, layer, MakerJs.point.middle(arc));
                }
            };
            //fixup options
            //measure the item to move it into svg area
            if (itemToExportIsModel) {
                modelToExport = itemToExport;
            }
            else if (Array.isArray(itemToExport)) {
                //issue: this won't handle an array of models
                modelToExport = { paths: itemToExport };
            }
            else if (MakerJs.isPath(itemToExport)) {
                modelToExport = { paths: { modelToMeasure: itemToExport } };
            }
            var size = MakerJs.measure.modelExtents(modelToExport);
            //try to get the unit system from the itemToExport
            if (!opts.units) {
                var unitSystem = exporter.tryGetModelUnits(itemToExport);
                if (unitSystem) {
                    opts.units = unitSystem;
                }
            }
            //convert unit system (if it exists) into SVG's units. scale if necessary.
            var useSvgUnit = exporter.svgUnit[opts.units];
            if (useSvgUnit && opts.viewBox) {
                opts.scale *= useSvgUnit.scaleConversion;
            }
            if (!opts.origin) {
                var left = 0;
                if (size.low[0] < 0) {
                    left = -size.low[0] * opts.scale;
                }
                opts.origin = [left, size.high[1] * opts.scale];
            }
            //also pass back to options parameter
            MakerJs.extendObject(options, opts);
            //begin svg output
            var modelGroup = new exporter.XmlTag('g');
            function beginModel(id, modelContext) {
                modelGroup.attrs = { id: id };
                append(modelGroup.getOpeningTag(false), modelContext.layer);
            }
            function endModel(modelContext) {
                append(modelGroup.getClosingTag(), modelContext.layer);
            }
            var svgAttrs;
            if (opts.viewBox) {
                var width = MakerJs.round(size.high[0] - size.low[0]) * opts.scale;
                var height = MakerJs.round(size.high[1] - size.low[1]) * opts.scale;
                var viewBox = [0, 0, width, height];
                var unit = useSvgUnit ? useSvgUnit.svgUnitType : '';
                svgAttrs = {
                    width: width + unit,
                    height: height + unit,
                    viewBox: viewBox.join(' ')
                };
            }
            var svgTag = new exporter.XmlTag('svg', MakerJs.extendObject(svgAttrs || {}, opts.svgAttrs));
            append(svgTag.getOpeningTag(false));
            var svgGroup = new exporter.XmlTag('g', {
                id: 'svgGroup',
                stroke: opts.stroke,
                "stroke-width": opts.strokeWidth,
                "stroke-linecap": "round",
                "fill": "none",
                "font-size": opts.fontSize
            });
            append(svgGroup.getOpeningTag(false));
            var exp = new exporter.Exporter(map, fixPoint, fixPath, beginModel, endModel);
            exp.exportItem('0', itemToExport, opts.origin);
            //export layers as groups
            for (var layer in layers) {
                var layerGroup = new exporter.XmlTag('g', { id: layer });
                for (var i = 0; i < layers[layer].length; i++) {
                    layerGroup.innerText += layers[layer][i];
                }
                layerGroup.innerTextEscaped = true;
                append(layerGroup.toString());
            }
            append(svgGroup.getClosingTag());
            append(svgTag.getClosingTag());
            return elements.join('');
        }
        exporter.toSVG = toSVG;
        /**
         * Map of MakerJs unit system to SVG unit system
         */
        exporter.svgUnit = {};
        //SVG Coordinate Systems, Transformations and Units documentation:
        //http://www.w3.org/TR/SVG/coords.html
        //The supported length unit identifiers are: em, ex, px, pt, pc, cm, mm, in, and percentages.
        exporter.svgUnit[MakerJs.unitType.Inch] = { svgUnitType: "in", scaleConversion: 1 };
        exporter.svgUnit[MakerJs.unitType.Millimeter] = { svgUnitType: "mm", scaleConversion: 1 };
        exporter.svgUnit[MakerJs.unitType.Centimeter] = { svgUnitType: "cm", scaleConversion: 1 };
        //Add conversions for all unitTypes
        exporter.svgUnit[MakerJs.unitType.Foot] = { svgUnitType: "in", scaleConversion: 12 };
        exporter.svgUnit[MakerJs.unitType.Meter] = { svgUnitType: "cm", scaleConversion: 100 };
    })(exporter = MakerJs.exporter || (MakerJs.exporter = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var ConnectTheDots = (function () {
            function ConnectTheDots(isClosed, points) {
                var _this = this;
                this.paths = {};
                var connect = function (a, b) {
                    _this.paths["ShapeLine" + i] = new MakerJs.paths.Line(points[a], points[b]);
                };
                for (var i = 1; i < points.length; i++) {
                    connect(i - 1, i);
                }
                if (isClosed && points.length > 2) {
                    connect(points.length - 1, 0);
                }
            }
            return ConnectTheDots;
        })();
        models.ConnectTheDots = ConnectTheDots;
        ConnectTheDots.metaParameters = [
            { title: "closed", type: "bool", value: true },
            {
                title: "points", type: "select", value: [
                    [[0, 0], [40, 40], [60, 20], [100, 100], [60, 60], [40, 80]],
                    [[0, 0], [100, 0], [50, 87]]
                ]
            }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Polygon = (function (_super) {
            __extends(Polygon, _super);
            function Polygon(numberOfSides, radius, firstCornerAngleInDegrees) {
                if (firstCornerAngleInDegrees === void 0) { firstCornerAngleInDegrees = 0; }
                _super.call(this, true, Polygon.getPoints(numberOfSides, radius, firstCornerAngleInDegrees));
            }
            Polygon.getPoints = function (numberOfSides, radius, firstCornerAngleInDegrees) {
                if (firstCornerAngleInDegrees === void 0) { firstCornerAngleInDegrees = 0; }
                var points = [];
                var a1 = MakerJs.angle.toRadians(firstCornerAngleInDegrees);
                var a = 2 * Math.PI / numberOfSides;
                for (var i = 0; i < numberOfSides; i++) {
                    points.push(MakerJs.point.fromPolar(a * i + a1, radius));
                }
                return points;
            };
            return Polygon;
        })(models.ConnectTheDots);
        models.Polygon = Polygon;
        Polygon.metaParameters = [
            { title: "number of sides", type: "range", min: 3, max: 24, value: 6 },
            { title: "radius", type: "range", min: 1, max: 100, value: 50 },
            { title: "offset angle", type: "range", min: 0, max: 180, value: 0 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var BoltCircle = (function () {
            function BoltCircle(boltRadius, holeRadius, boltCount, firstBoltAngleInDegrees) {
                if (firstBoltAngleInDegrees === void 0) { firstBoltAngleInDegrees = 0; }
                this.paths = {};
                var points = models.Polygon.getPoints(boltCount, boltRadius, firstBoltAngleInDegrees);
                for (var i = 0; i < boltCount; i++) {
                    this.paths["bolt " + i] = new MakerJs.paths.Circle(points[i], holeRadius);
                }
            }
            return BoltCircle;
        })();
        models.BoltCircle = BoltCircle;
        BoltCircle.metaParameters = [
            { title: "bolt circle radius", type: "range", min: 1, max: 100, value: 50 },
            { title: "hole radius", type: "range", min: 1, max: 50, value: 5 },
            { title: "bolt count", type: "range", min: 3, max: 24, value: 12 },
            { title: "offset angle", type: "range", min: 0, max: 180, value: 0 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var BoltRectangle = (function () {
            function BoltRectangle(width, height, holeRadius) {
                this.paths = {};
                var holes = {
                    "BottomLeft": [0, 0],
                    "BottomRight": [width, 0],
                    "TopRight": [width, height],
                    "TopLeft": [0, height]
                };
                for (var id2 in holes) {
                    this.paths[id2 + "_bolt"] = new MakerJs.paths.Circle(holes[id2], holeRadius);
                }
            }
            return BoltRectangle;
        })();
        models.BoltRectangle = BoltRectangle;
        BoltRectangle.metaParameters = [
            { title: "width", type: "range", min: 1, max: 100, value: 100 },
            { title: "height", type: "range", min: 1, max: 100, value: 50 },
            { title: "hole radius", type: "range", min: 1, max: 50, value: 5 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Dome = (function () {
            function Dome(width, height, radius) {
                this.paths = {};
                var w2 = width / 2;
                if (radius < 0)
                    radius = 0;
                if (radius === void 0)
                    radius = w2;
                radius = Math.min(radius, w2);
                radius = Math.min(radius, height);
                var wt = Math.max(w2 - radius, 0);
                var hr = Math.max(height - radius, 0);
                this.paths["Bottom"] = new MakerJs.paths.Line([-w2, 0], [w2, 0]);
                if (hr) {
                    this.paths["Left"] = new MakerJs.paths.Line([-w2, 0], [-w2, hr]);
                    this.paths["Right"] = new MakerJs.paths.Line([w2, 0], [w2, hr]);
                }
                if (radius > 0) {
                    this.paths["TopLeft"] = new MakerJs.paths.Arc([-wt, hr], radius, 90, 180);
                    this.paths["TopRight"] = new MakerJs.paths.Arc([wt, hr], radius, 0, 90);
                }
                if (wt) {
                    this.paths["Top"] = new MakerJs.paths.Line([-wt, height], [wt, height]);
                }
            }
            return Dome;
        })();
        models.Dome = Dome;
        Dome.metaParameters = [
            { title: "width", type: "range", min: 1, max: 100, value: 50 },
            { title: "height", type: "range", min: 1, max: 100, value: 100 },
            { title: "radius", type: "range", min: 0, max: 50, value: 25 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var RoundRectangle = (function () {
            function RoundRectangle(width, height, radius) {
                this.paths = {};
                var maxRadius = Math.min(height, width) / 2;
                radius = Math.min(radius, maxRadius);
                var wr = width - radius;
                var hr = height - radius;
                if (radius > 0) {
                    this.paths["BottomLeft"] = new MakerJs.paths.Arc([radius, radius], radius, 180, 270);
                    this.paths["BottomRight"] = new MakerJs.paths.Arc([wr, radius], radius, 270, 0);
                    this.paths["TopRight"] = new MakerJs.paths.Arc([wr, hr], radius, 0, 90);
                    this.paths["TopLeft"] = new MakerJs.paths.Arc([radius, hr], radius, 90, 180);
                }
                if (wr - radius > 0) {
                    this.paths["Bottom"] = new MakerJs.paths.Line([radius, 0], [wr, 0]);
                    this.paths["Top"] = new MakerJs.paths.Line([wr, height], [radius, height]);
                }
                if (hr - radius > 0) {
                    this.paths["Right"] = new MakerJs.paths.Line([width, radius], [width, hr]);
                    this.paths["Left"] = new MakerJs.paths.Line([0, hr], [0, radius]);
                }
            }
            return RoundRectangle;
        })();
        models.RoundRectangle = RoundRectangle;
        RoundRectangle.metaParameters = [
            { title: "width", type: "range", min: 1, max: 100, value: 50 },
            { title: "height", type: "range", min: 1, max: 100, value: 100 },
            { title: "radius", type: "range", min: 0, max: 50, value: 11 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Oval = (function (_super) {
            __extends(Oval, _super);
            function Oval(width, height) {
                _super.call(this, width, height, Math.min(height / 2, width / 2));
            }
            return Oval;
        })(models.RoundRectangle);
        models.Oval = Oval;
        Oval.metaParameters = [
            { title: "width", type: "range", min: 1, max: 100, value: 50 },
            { title: "height", type: "range", min: 1, max: 100, value: 100 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var OvalArc = (function () {
            function OvalArc(startAngle, endAngle, sweepRadius, slotRadius, selfIntersect) {
                var _this = this;
                if (selfIntersect === void 0) { selfIntersect = false; }
                this.paths = {};
                if (slotRadius <= 0 || sweepRadius <= 0)
                    return;
                startAngle = MakerJs.angle.noRevolutions(startAngle);
                endAngle = MakerJs.angle.noRevolutions(endAngle);
                if (MakerJs.round(startAngle - endAngle) == 0)
                    return;
                if (endAngle < startAngle)
                    endAngle += 360;
                var addCap = function (id, tiltAngle, offsetStartAngle, offsetEndAngle) {
                    return _this.paths[id] = new MakerJs.paths.Arc(MakerJs.point.fromPolar(MakerJs.angle.toRadians(tiltAngle), sweepRadius), slotRadius, tiltAngle + offsetStartAngle, tiltAngle + offsetEndAngle);
                };
                var addSweep = function (id, offsetRadius) {
                    return _this.paths[id] = new MakerJs.paths.Arc([0, 0], sweepRadius + offsetRadius, startAngle, endAngle);
                };
                addSweep("Outer", slotRadius);
                var hasInner = (sweepRadius - slotRadius) > 0;
                if (hasInner) {
                    addSweep("Inner", -slotRadius);
                }
                var caps = [];
                caps.push(addCap("StartCap", startAngle, 180, 0));
                caps.push(addCap("EndCap", endAngle, 0, 180));
                //the distance between the cap origins
                var d = MakerJs.measure.pointDistance(caps[0].origin, caps[1].origin);
                if ((d / 2) < slotRadius) {
                    //the caps intersect
                    var int = MakerJs.path.intersection(caps[0], caps[1]);
                    if (int) {
                        if (!hasInner || !selfIntersect) {
                            caps[0].startAngle = int.path1Angles[0];
                            caps[1].endAngle = int.path2Angles[0];
                        }
                        if (!selfIntersect && hasInner && int.intersectionPoints.length == 2) {
                            addCap("StartCap2", startAngle, 180, 0).endAngle = int.path1Angles[1];
                            addCap("EndCap2", endAngle, 0, 180).startAngle = int.path2Angles[1] + 360;
                        }
                    }
                }
            }
            return OvalArc;
        })();
        models.OvalArc = OvalArc;
        OvalArc.metaParameters = [
            { title: "start angle", type: "range", min: -360, max: 360, step: 1, value: 180 },
            { title: "end angle", type: "range", min: -360, max: 360, step: 1, value: 0 },
            { title: "sweep", type: "range", min: 0, max: 100, step: 1, value: 50 },
            { title: "radius", type: "range", min: 0, max: 100, step: 1, value: 15 },
            { title: "self intersect", type: "bool", value: false }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Rectangle = (function (_super) {
            __extends(Rectangle, _super);
            function Rectangle(width, height) {
                _super.call(this, true, [[0, 0], [width, 0], [width, height], [0, height]]);
            }
            return Rectangle;
        })(models.ConnectTheDots);
        models.Rectangle = Rectangle;
        Rectangle.metaParameters = [
            { title: "width", type: "range", min: 1, max: 100, value: 50 },
            { title: "height", type: "range", min: 1, max: 100, value: 100 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Ring = (function () {
            function Ring(outerRadius, innerRadius) {
                this.paths = {};
                var radii = {
                    "Ring_outer": outerRadius,
                    "Ring_inner": innerRadius
                };
                for (var id in radii) {
                    this.paths[id] = new MakerJs.paths.Circle(MakerJs.point.zero(), radii[id]);
                }
            }
            return Ring;
        })();
        models.Ring = Ring;
        Ring.metaParameters = [
            { title: "outer radius", type: "range", min: 0, max: 100, step: 1, value: 50 },
            { title: "inner radius", type: "range", min: 0, max: 100, step: 1, value: 20 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var SCurve = (function () {
            function SCurve(width, height) {
                this.paths = {};
                function findRadius(x, y) {
                    return x + (y * y - x * x) / (2 * x);
                }
                var h2 = height / 2;
                var w2 = width / 2;
                var radius;
                var startAngle;
                var endAngle;
                var arcOrigin;
                if (width > height) {
                    radius = findRadius(h2, w2);
                    startAngle = 270;
                    endAngle = 360 - MakerJs.angle.toDegrees(Math.acos(w2 / radius));
                    arcOrigin = [0, radius];
                }
                else {
                    radius = findRadius(w2, h2);
                    startAngle = 180 - MakerJs.angle.toDegrees(Math.asin(h2 / radius));
                    endAngle = 180;
                    arcOrigin = [radius, 0];
                }
                var curve = new MakerJs.paths.Arc(arcOrigin, radius, startAngle, endAngle);
                this.paths['curve_start'] = curve;
                this.paths['curve_end'] = MakerJs.path.moveRelative(MakerJs.path.mirror(curve, true, true), [width, height]);
            }
            return SCurve;
        })();
        models.SCurve = SCurve;
        SCurve.metaParameters = [
            { title: "width", type: "range", min: 1, max: 100, value: 50 },
            { title: "height", type: "range", min: 1, max: 100, value: 100 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Slot = (function () {
            function Slot(origin, endPoint, radius) {
                this.paths = {};
                var a = MakerJs.angle.ofPointInDegrees(origin, endPoint);
                var len = MakerJs.measure.pointDistance(origin, endPoint);
                this.paths['Top'] = new MakerJs.paths.Line([0, radius], [len, radius]);
                this.paths['Bottom'] = new MakerJs.paths.Line([0, -radius], [len, -radius]);
                this.paths['StartCap'] = new MakerJs.paths.Arc([0, 0], radius, 90, 270);
                this.paths['EndCap'] = new MakerJs.paths.Arc([len, 0], radius, 270, 90);
                MakerJs.model.rotate(this, a, [0, 0]);
                this.origin = origin;
            }
            return Slot;
        })();
        models.Slot = Slot;
        Slot.metaParameters = [
            {
                title: "origin", type: "select", value: [
                    [0, 0],
                    [10, 0],
                    [10, 10]
                ]
            },
            {
                title: "end", type: "select", value: [
                    [80, 0],
                    [0, 30],
                    [10, 30]
                ]
            },
            { title: "radius", type: "range", min: 1, max: 50, value: 10 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Square = (function (_super) {
            __extends(Square, _super);
            function Square(side) {
                _super.call(this, side, side);
            }
            return Square;
        })(models.Rectangle);
        models.Square = Square;
        Square.metaParameters = [
            { title: "side", type: "range", min: 1, max: 100, value: 100 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Star = (function () {
            function Star(numberOfPoints, outerRadius, innerRadius, skipPoints) {
                if (skipPoints === void 0) { skipPoints = 2; }
                this.paths = {};
                if (!innerRadius) {
                    innerRadius = outerRadius * Star.InnerRadiusRatio(numberOfPoints, skipPoints);
                }
                var outerPoints = models.Polygon.getPoints(numberOfPoints, outerRadius);
                var innerPoints = models.Polygon.getPoints(numberOfPoints, innerRadius, 180 / numberOfPoints);
                var allPoints = [];
                for (var i = 0; i < numberOfPoints; i++) {
                    allPoints.push(outerPoints[i]);
                    allPoints.push(innerPoints[i]);
                }
                var model = new models.ConnectTheDots(true, allPoints);
                this.paths = model.paths;
                delete model.paths;
            }
            Star.InnerRadiusRatio = function (numberOfPoints, skipPoints) {
                //formula from http://www.jdawiseman.com/papers/easymath/surds_star_inner_radius.html
                //Cos(Pi()*m/n) / Cos(Pi()*(m-1)/n)
                if (numberOfPoints > 0 && skipPoints > 1 && skipPoints < numberOfPoints / 2) {
                    return Math.cos(Math.PI * skipPoints / numberOfPoints) / Math.cos(Math.PI * (skipPoints - 1) / numberOfPoints);
                }
                return 0;
            };
            return Star;
        })();
        models.Star = Star;
        Star.metaParameters = [
            { title: "number of sides", type: "range", min: 3, max: 24, value: 8 },
            { title: "outer radius", type: "range", min: 1, max: 100, value: 50 },
            { title: "inner radius", type: "range", min: 0, max: 100, value: 15 },
            { title: "skip points (when inner radius is zero)", type: "range", min: 0, max: 12, value: 2 }
        ];
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
