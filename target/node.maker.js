/// <reference path="../../typings/tsd.d.ts" />
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
//https://github.com/Microsoft/Maker.js
var Maker;
(function (Maker) {
    //units
    /**
     * String-based enumeration of unit types: imperial, metric or otherwise.
     * A model may specify the unit system it is using, if any. When importing a model, it may have different units.
     * Unit conversion function is makerjs.units.conversionScale().
     * Important: If you add to this, you must also add a corresponding conversion ratio in the unit.ts file!
     */
    Maker.unitType = {
        Centimeter: 'cm',
        Foot: 'foot',
        Inch: 'inch',
        Meter: 'm',
        Millimeter: 'mm'
    };
    /**
     * Numeric rounding
     *
     * @param n The number to round off.
     * @param accuracy Optional exemplar of number of decimal places.
     */
    function round(n, accuracy) {
        if (accuracy === void 0) { accuracy = .0000001; }
        var places = 1 / accuracy;
        return Math.round(n * places) / places;
    }
    Maker.round = round;
    /**
     * Copy the properties from one object to another object.
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
    Maker.extendObject = extendObject;
    /**
     * Search within an array to find an item by its id property.
     *
     * @param arr Array to search.
     * @param id Id of the item to find.
     * @returns object with item and its position.
     */
    function findById(arr, id) {
        if (arr) {
            for (var i = 0; i < arr.length; i++) {
                var item = arr[i];
                if (item.id == id) {
                    return {
                        index: i,
                        item: item
                    };
                }
            }
        }
        return null;
    }
    Maker.findById = findById;
    /**
     * Test to see if an object implements the required properties of a point.
     *
     * @param item The item to test.
     */
    function isPoint(item) {
        return (Array.isArray(item) && item.length > 1);
    }
    Maker.isPoint = isPoint;
    /**
     * Test to see if an object implements the required properties of a path.
     *
     * @param item The item to test.
     */
    function isPath(item) {
        return item && item.type && item.origin;
    }
    Maker.isPath = isPath;
    /**
     * String-based enumeration of all paths types.
     */
    Maker.pathType = {
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
    Maker.isModel = isModel;
    //shortcuts
    /**
     * Shortcut to create a new arc path.
     *
     * @param id The id of the new path.
     * @param origin The origin of the new path, either as a point object, or as an array of numbers.
     * @param radius The radius of the arc.
     * @param startAngle The start angle of the arc.
     * @param endAngle The end angle of the arc.
     * @returns A new POJO representing an arc path.
     */
    function createArc(id, origin, radius, startAngle, endAngle) {
        var arc = {
            type: Maker.pathType.Arc,
            id: id,
            origin: origin,
            radius: radius,
            startAngle: startAngle,
            endAngle: endAngle
        };
        return arc;
    }
    Maker.createArc = createArc;
    /**
     * Shortcut to create a new circle path.
     *
     * @param id The id of the new path.
     * @param origin The origin of the new path, either as a point object, or as an array of numbers.
     * @param radius The radius of the circle.
     * @returns A new POJO representing an circle path.
     */
    function createCircle(id, origin, radius) {
        var circle = {
            type: Maker.pathType.Circle,
            id: id,
            origin: origin,
            radius: radius
        };
        return circle;
    }
    Maker.createCircle = createCircle;
    /**
     * Shortcut to create a new line path.
     *
     * @param id The id of the new path.
     * @param origin The origin of the new path, either as a point object, or as an array of numbers.
     * @param end The end point of the line.
     * @returns A new POJO representing an line path.
     */
    function createLine(id, origin, end) {
        var line = {
            type: Maker.pathType.Line,
            id: id,
            origin: origin,
            end: end
        };
        return line;
    }
    Maker.createLine = createLine;
})(Maker || (Maker = {}));
//CommonJs
module.exports = Maker;
/// <reference path="maker.ts" />
var Maker;
(function (Maker) {
    var angle;
    (function (angle) {
        /**
         * Convert an angle from degrees to radians.
         *
         * @param angleInDegrees Angle in degrees.
         * @returns Angle in radians.
         */
        function toRadians(angleInDegrees) {
            if (angleInDegrees == 360) {
                return 0;
            }
            return angleInDegrees * Math.PI / 180.0;
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
         * Gets an arc's end angle, ensured to be greater than its start angle.
         *
         * @param arc An arc path object.
         * @returns End angle of arc.
         */
        function arcEndAnglePastZero(arc) {
            //compensate for values past zero. This allows easy compute of total angle size.
            //for example 0 = 360
            if (arc.endAngle < arc.startAngle) {
                return 360 + arc.endAngle;
            }
            return arc.endAngle;
        }
        angle.arcEndAnglePastZero = arcEndAnglePastZero;
        /**
         * Angle of a line through a point.
         *
         * @param pointToFindAngle The point to find the angle.
         * @param origin (Optional 0,0 implied) point of origin of the angle.
         * @returns Angle of the line throught the point.
         */
        function fromPointToRadians(pointToFindAngle, origin) {
            var d = Maker.point.subtract(pointToFindAngle, origin);
            return Math.atan2(d[1], d[0]); //First param is Y, second is X
        }
        angle.fromPointToRadians = fromPointToRadians;
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
    })(angle = Maker.angle || (Maker.angle = {}));
})(Maker || (Maker = {}));
/// <reference path="maker.ts" />
var Maker;
(function (Maker) {
    var point;
    (function (point) {
        /**
         * Add two points together and return the result as a new point object.
         *
         * @param a First point, either as a point object, or as an array of numbers.
         * @param b Second point, either as a point object, or as an array of numbers.
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
         * Get the two end points of an arc path.
         *
         * @param arc The arc path object.
         * @returns Array with 2 elements: [0] is the point object corresponding to the start angle, [1] is the point object corresponding to the end angle.
         */
        function fromArc(arc) {
            function getPointFromAngle(a) {
                return add(arc.origin, fromPolar(Maker.angle.toRadians(a), arc.radius));
            }
            return [getPointFromAngle(arc.startAngle), getPointFromAngle(arc.endAngle)];
        }
        point.fromArc = fromArc;
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
         * Rotate a point.
         *
         * @param pointToRotate The point to rotate.
         * @param angleInDegrees The amount of rotation, in degrees.
         * @param rotationOrigin The center point of rotation.
         * @returns A new point.
         */
        function rotate(pointToRotate, angleInDegrees, rotationOrigin) {
            var pointAngleInRadians = Maker.angle.fromPointToRadians(pointToRotate, rotationOrigin);
            var d = Maker.measure.pointDistance(rotationOrigin, pointToRotate);
            var rotatedPoint = fromPolar(pointAngleInRadians + Maker.angle.toRadians(angleInDegrees), d);
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
        function subtract(a, b) {
            return add(a, b, true);
        }
        point.subtract = subtract;
        /**
         * A point at 0,0 coordinates.
         *
         * @returns A new point.
         */
        function zero() {
            return [0, 0];
        }
        point.zero = zero;
    })(point = Maker.point || (Maker.point = {}));
})(Maker || (Maker = {}));
/// <reference path="point.ts" />
var Maker;
(function (Maker) {
    var path;
    (function (path) {
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
            var origin = Maker.point.mirror(pathToMirror.origin, mirrorX, mirrorY);
            var map = {};
            map[Maker.pathType.Line] = function (line) {
                newPath = Maker.createLine(newId || line.id, origin, Maker.point.mirror(line.end, mirrorX, mirrorY));
            };
            map[Maker.pathType.Circle] = function (circle) {
                newPath = Maker.createCircle(newId || circle.id, origin, circle.radius);
            };
            map[Maker.pathType.Arc] = function (arc) {
                var startAngle = Maker.angle.mirror(arc.startAngle, mirrorX, mirrorY);
                var endAngle = Maker.angle.mirror(Maker.angle.arcEndAnglePastZero(arc), mirrorX, mirrorY);
                var xor = mirrorX != mirrorY;
                newPath = Maker.createArc(newId || arc.id, origin, arc.radius, xor ? endAngle : startAngle, xor ? startAngle : endAngle);
            };
            var fn = map[pathToMirror.type];
            if (fn) {
                fn(pathToMirror);
            }
            return newPath;
        }
        path.mirror = mirror;
        /**
         * Move a path's origin by a relative amount. Note: to move absolute, just set the origin property directly.
         *
         * @param pathToMove The path to move.
         * @param adjust The x & y adjustments, either as a point object, or as an array of numbers.
         * @returns The original path (for chaining).
         */
        function moveRelative(pathToMove, adjust) {
            var map = {};
            map[Maker.pathType.Line] = function (line) {
                line.end = Maker.point.add(line.end, adjust);
            };
            pathToMove.origin = Maker.point.add(pathToMove.origin, adjust);
            var fn = map[pathToMove.type];
            if (fn) {
                fn(pathToMove);
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
            if (angleInDegrees == 0)
                return pathToRotate;
            var map = {};
            map[Maker.pathType.Line] = function (line) {
                line.end = Maker.point.rotate(line.end, angleInDegrees, rotationOrigin);
            };
            map[Maker.pathType.Arc] = function (arc) {
                arc.startAngle += angleInDegrees;
                arc.endAngle += angleInDegrees;
            };
            pathToRotate.origin = Maker.point.rotate(pathToRotate.origin, angleInDegrees, rotationOrigin);
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
            if (scaleValue == 1)
                return pathToScale;
            var map = {};
            map[Maker.pathType.Line] = function (line) {
                line.end = Maker.point.scale(line.end, scaleValue);
            };
            map[Maker.pathType.Circle] = function (circle) {
                circle.radius *= scaleValue;
            };
            map[Maker.pathType.Arc] = map[Maker.pathType.Circle];
            pathToScale.origin = Maker.point.scale(pathToScale.origin, scaleValue);
            var fn = map[pathToScale.type];
            if (fn) {
                fn(pathToScale);
            }
            return pathToScale;
        }
        path.scale = scale;
    })(path = Maker.path || (Maker.path = {}));
})(Maker || (Maker = {}));
/// <reference path="path.ts" />
var Maker;
(function (Maker) {
    var model;
    (function (model) {
        /**
         * Moves all children (models and paths, recursively) within a model to their absolute position. Useful when referencing points between children.
         *
         * @param modelToFlatten The model to flatten.
         * @param origin Optional offset reference point.
         */
        function flatten(modelToFlatten, origin) {
            var newOrigin = Maker.point.add(modelToFlatten.origin, origin);
            if (modelToFlatten.paths) {
                for (var i = 0; i < modelToFlatten.paths.length; i++) {
                    Maker.path.moveRelative(modelToFlatten.paths[i], newOrigin);
                }
            }
            if (modelToFlatten.models) {
                for (var i = 0; i < modelToFlatten.models.length; i++) {
                    flatten(modelToFlatten.models[i], newOrigin);
                }
            }
            modelToFlatten.origin = Maker.point.zero();
            return modelToFlatten;
        }
        model.flatten = flatten;
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
            if (modelToMirror.id) {
                newModel.id = modelToMirror.id + '_mirror';
            }
            if (modelToMirror.origin) {
                newModel.origin = Maker.point.mirror(modelToMirror.origin, mirrorX, mirrorY);
            }
            if (modelToMirror.type) {
                newModel.type = modelToMirror.type;
            }
            if (modelToMirror.units) {
                newModel.units = modelToMirror.units;
            }
            if (modelToMirror.paths) {
                newModel.paths = [];
                for (var i = 0; i < modelToMirror.paths.length; i++) {
                    newModel.paths.push(Maker.path.mirror(modelToMirror.paths[i], mirrorX, mirrorY));
                }
            }
            if (modelToMirror.models) {
                newModel.models = [];
                for (var i = 0; i < modelToMirror.models.length; i++) {
                    newModel.models.push(model.mirror(modelToMirror.models[i], mirrorX, mirrorY));
                }
            }
            return newModel;
        }
        model.mirror = mirror;
        /**
         * Move a model to an absolute position. Note that this is also accomplished by directly setting the origin property. This function exists because the origin property is optional.
         *
         * @param modelToMove The model to move.
         * @param origin The new position of the model.
         * @returns The original model (for chaining).
         */
        function move(modelToMove, origin) {
            modelToMove.origin = Maker.point.clone(origin);
            return modelToMove;
        }
        model.move = move;
        /**
         * Rotate a model.
         *
         * @param modelToRotate The model to rotate.
         * @param angleInDegrees The amount of rotation, in degrees.
         * @param rotationOrigin The center point of rotation.
         * @returns The original model (for chaining).
         */
        function rotate(modelToRotate, angleInDegrees, rotationOrigin) {
            var offsetOrigin = Maker.point.subtract(rotationOrigin, modelToRotate.origin);
            if (modelToRotate.paths) {
                for (var i = 0; i < modelToRotate.paths.length; i++) {
                    Maker.path.rotate(modelToRotate.paths[i], angleInDegrees, offsetOrigin);
                }
            }
            if (modelToRotate.models) {
                for (var i = 0; i < modelToRotate.models.length; i++) {
                    rotate(modelToRotate.models[i], angleInDegrees, offsetOrigin);
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
                modelToScale.origin = Maker.point.scale(modelToScale.origin, scaleValue);
            }
            if (modelToScale.paths) {
                for (var i = 0; i < modelToScale.paths.length; i++) {
                    Maker.path.scale(modelToScale.paths[i], scaleValue);
                }
            }
            if (modelToScale.models) {
                for (var i = 0; i < modelToScale.models.length; i++) {
                    scale(modelToScale.models[i], scaleValue, true);
                }
            }
            return modelToScale;
        }
        model.scale = scale;
    })(model = Maker.model || (Maker.model = {}));
})(Maker || (Maker = {}));
/// <reference path="maker.ts" />
var Maker;
(function (Maker) {
    var units;
    (function (units) {
        /**
         * The base type is arbitrary. Other conversions are then based off of this.
         */
        var base = Maker.unitType.Millimeter;
        /**
         * Initialize all known conversions here.
         */
        function init() {
            addBaseConversion(Maker.unitType.Centimeter, 10);
            addBaseConversion(Maker.unitType.Meter, 1000);
            addBaseConversion(Maker.unitType.Inch, 25.4);
            addBaseConversion(Maker.unitType.Foot, 25.4 * 12);
        }
        /**
         * Table of conversions. Lazy load upon first conversion.
         */
        var table;
        /**
         * Add a conversion, and its inversion.
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
         */
        function addBaseConversion(destUnitType, value) {
            addConversion(destUnitType, base, value);
        }
        /**
         * Get a conversion ratio between a source unit and a destination unit. This will lazy load the table with initial conversions,
         * then new cross-conversions will be cached in the table.
         *
         * @param srcUnitType unitType converting from.
         * @param destUnitType unitType converting to.
         * @returns Numeric ratio of the conversion.
         */
        function conversionScale(srcUnitType, destUnitType) {
            if (srcUnitType == destUnitType) {
                return 1;
            }
            if (!table) {
                table = {};
                init();
            }
            if (!table[srcUnitType][destUnitType]) {
                addConversion(srcUnitType, destUnitType, table[srcUnitType][base] * table[base][destUnitType]);
            }
            return table[srcUnitType][destUnitType];
        }
        units.conversionScale = conversionScale;
    })(units = Maker.units || (Maker.units = {}));
})(Maker || (Maker = {}));
/// <reference path="model.ts" />
var Maker;
(function (Maker) {
    var measure;
    (function (_measure) {
        /**
         * Total angle of an arc between its start and end angles.
         *
         * @param arc The arc to measure.
         * @returns Angle of arc.
         */
        function arcAngle(arc) {
            var endAngle = Maker.angle.arcEndAnglePastZero(arc);
            return endAngle - arc.startAngle;
        }
        _measure.arcAngle = arcAngle;
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
        _measure.pointDistance = pointDistance;
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
            map[Maker.pathType.Line] = function (line) {
                measurement.low = getExtremePoint(line.origin, line.end, Math.min);
                measurement.high = getExtremePoint(line.origin, line.end, Math.max);
            };
            map[Maker.pathType.Circle] = function (circle) {
                var r = circle.radius;
                measurement.low = Maker.point.add(circle.origin, [-r, -r]);
                measurement.high = Maker.point.add(circle.origin, [r, r]);
            };
            map[Maker.pathType.Arc] = function (arc) {
                var r = arc.radius;
                var startPoint = Maker.point.fromPolar(Maker.angle.toRadians(arc.startAngle), r);
                var endPoint = Maker.point.fromPolar(Maker.angle.toRadians(arc.endAngle), r);
                var startAngle = arc.startAngle;
                var endAngle = Maker.angle.arcEndAnglePastZero(arc);
                if (startAngle < 0) {
                    startAngle += 360;
                    endAngle += 360;
                }
                function extremeAngle(xyAngle, value, fn) {
                    var extremePoint = getExtremePoint(startPoint, endPoint, fn);
                    for (var i = 2; i--;) {
                        if (startAngle < xyAngle[i] && xyAngle[i] < endAngle) {
                            extremePoint[i] = value;
                        }
                    }
                    return Maker.point.add(arc.origin, extremePoint);
                }
                measurement.low = extremeAngle([180, 270], -r, Math.min);
                measurement.high = extremeAngle([360, 90], r, Math.max);
            };
            var fn = map[pathToMeasure.type];
            if (fn) {
                fn(pathToMeasure);
            }
            return measurement;
        }
        _measure.pathExtents = pathExtents;
        /**
         * Measures the length of a path.
         *
         * @param pathToMeasure The path to measure.
         * @returns Length of the path.
         */
        function pathLength(pathToMeasure) {
            var map = {};
            var value = 0;
            map[Maker.pathType.Line] = function (line) {
                value = pointDistance(line.origin, line.end);
            };
            map[Maker.pathType.Circle] = function (circle) {
                value = 2 * Math.PI * circle.radius;
            };
            map[Maker.pathType.Arc] = function (arc) {
                map[Maker.pathType.Circle](arc); //this sets the value var
                var pct = arcAngle(arc) / 360;
                value *= pct;
            };
            var fn = map[pathToMeasure.type];
            if (fn) {
                fn(pathToMeasure);
            }
            return value;
        }
        _measure.pathLength = pathLength;
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
                    var c = Maker.point.add(b, offsetOrigin);
                    for (var i = 2; i--;) {
                        a[i] = (a[i] == null ? c[i] : fn(a[i], c[i]));
                    }
                }
                getExtreme(totalMeasurement.low, pathMeasurement.low, Math.min);
                getExtreme(totalMeasurement.high, pathMeasurement.high, Math.max);
            }
            function measure(model, offsetOrigin) {
                var newOrigin = Maker.point.add(model.origin, offsetOrigin);
                if (model.paths) {
                    for (var i = 0; i < model.paths.length; i++) {
                        lowerOrHigher(newOrigin, pathExtents(model.paths[i]));
                    }
                }
                if (model.models) {
                    for (var i = 0; i < model.models.length; i++) {
                        measure(model.models[i], newOrigin);
                    }
                }
            }
            measure(modelToMeasure);
            return totalMeasurement;
        }
        _measure.modelExtents = modelExtents;
    })(measure = Maker.measure || (Maker.measure = {}));
})(Maker || (Maker = {}));
/// <reference path="model.ts" />
/// <reference path="units.ts" />
/// <reference path="measure.ts" />
var Maker;
(function (Maker) {
    var exporter;
    (function (exporter) {
        /**
         * Try to get the unit system from a model
         */
        function tryGetModelUnits(itemToExport) {
            if (Maker.isModel(itemToExport)) {
                return itemToExport.units;
            }
        }
        exporter.tryGetModelUnits = tryGetModelUnits;
        /**
         * Class to traverse an item 's models or paths and ultimately render each path.
         */
        var Exporter = (function () {
            /**
             * @param map Object containing properties: property name is the type of path, e.g. "line", "circle"; property value
             * is a function to render a path. Function parameters are path and point.
             * @param fixPoint Optional function to modify a point prior to export. Function parameter is a point; function must return a point.
             * @param fixPath Optional function to modify a path prior to output. Function parameters are path and offset point; function must return a path.
             */
            function Exporter(map, fixPoint, fixPath) {
                this.map = map;
                this.fixPoint = fixPoint;
                this.fixPath = fixPath;
            }
            /**
             * Export a path.
             *
             * @param pathToExport The path to export.
             * @param offset The offset position of the path.
             */
            Exporter.prototype.exportPath = function (pathToExport, offset) {
                var fn = this.map[pathToExport.type];
                if (fn) {
                    fn(this.fixPath ? this.fixPath(pathToExport, offset) : pathToExport, offset);
                }
            };
            /**
             * Export a model.
             *
             * @param modelToExport The model to export.
             * @param offset The offset position of the model.
             */
            Exporter.prototype.exportModel = function (modelToExport, offset) {
                var newOffset = Maker.point.add((this.fixPoint ? this.fixPoint(modelToExport.origin) : modelToExport.origin), offset);
                if (modelToExport.paths) {
                    for (var i = 0; i < modelToExport.paths.length; i++) {
                        this.exportPath(modelToExport.paths[i], newOffset);
                    }
                }
                if (modelToExport.models) {
                    for (var i = 0; i < modelToExport.models.length; i++) {
                        this.exportModel(modelToExport.models[i], newOffset);
                    }
                }
            };
            /**
             * Export an object.
             *
             * @param item The object to export. May be a path, an array of paths, a model, or an array of models.
             * @param offset The offset position of the object.
             */
            Exporter.prototype.exportItem = function (itemToExport, origin) {
                if (Maker.isModel(itemToExport)) {
                    this.exportModel(itemToExport, origin);
                }
                else if (Array.isArray(itemToExport)) {
                    var items = itemToExport;
                    for (var i = 0; i < items.length; i++) {
                        this.exportItem(items[i], origin);
                    }
                }
                else if (Maker.isPath(itemToExport)) {
                    this.exportPath(itemToExport, origin);
                }
            };
            return Exporter;
        })();
        exporter.Exporter = Exporter;
    })(exporter = Maker.exporter || (Maker.exporter = {}));
})(Maker || (Maker = {}));
/// <reference path="exporter.ts" />
var Maker;
(function (Maker) {
    var exporter;
    (function (_exporter) {
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
            var opts = {};
            Maker.extendObject(opts, options);
            var dxf = [];
            function append(value) {
                dxf.push(value);
            }
            var map = {};
            map[Maker.pathType.Line] = function (line, origin) {
                append("0");
                append("LINE");
                append("8");
                append(line.id);
                append("10");
                append(line.origin[0] + origin[0]);
                append("20");
                append(line.origin[1] + origin[1]);
                append("11");
                append(line.end[0] + origin[0]);
                append("21");
                append(line.end[1] + origin[1]);
            };
            map[Maker.pathType.Circle] = function (circle, origin) {
                append("0");
                append("CIRCLE");
                append("8");
                append(circle.id);
                append("10");
                append(circle.origin[0] + origin[0]);
                append("20");
                append(circle.origin[1] + origin[1]);
                append("40");
                append(circle.radius);
            };
            map[Maker.pathType.Arc] = function (arc, origin) {
                append("0");
                append("ARC");
                append("8");
                append(arc.id);
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
                var exporter = new _exporter.Exporter(map);
                exporter.exportItem(itemToExport, Maker.point.zero());
            }
            //fixup options
            if (!opts.units) {
                var units = _exporter.tryGetModelUnits(itemToExport);
                if (units) {
                    opts.units = units;
                }
            }
            //also pass back to options parameter
            Maker.extendObject(options, opts);
            //begin dxf output
            if (opts.units) {
                section(header);
            }
            section(entities);
            append("0");
            append("EOF");
            return dxf.join('\n');
        }
        _exporter.toDXF = toDXF;
        //DXF format documentation:
        //http://images.autodesk.com/adsk/files/acad_dxf0.pdf
        //Default drawing units for AutoCAD DesignCenter blocks:
        //0 = Unitless; 1 = Inches; 2 = Feet; 3 = Miles; 4 = Millimeters; 5 = Centimeters; 6 = Meters; 7 = Kilometers; 8 = Microinches;
        var dxfUnit = {};
        dxfUnit[''] = 0;
        dxfUnit[Maker.unitType.Inch] = 1;
        dxfUnit[Maker.unitType.Foot] = 2;
        dxfUnit[Maker.unitType.Millimeter] = 4;
        dxfUnit[Maker.unitType.Centimeter] = 5;
        dxfUnit[Maker.unitType.Meter] = 6;
    })(exporter = Maker.exporter || (Maker.exporter = {}));
})(Maker || (Maker = {}));
var Maker;
(function (Maker) {
    var exporter;
    (function (exporter) {
        /**
         * Class for an XML tag.
         */
        var XmlTag = (function () {
            /**
             * @param name Name of the XML tag.
             * @param attrs Optional attributes for the tag.
             */
            function XmlTag(name, attrs) {
                this.name = name;
                this.attrs = attrs;
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
             * Output the tag as a string.
             */
            XmlTag.prototype.toString = function () {
                var attrs = '';
                for (var name in this.attrs) {
                    var value = this.attrs[name];
                    if (typeof value == 'string') {
                        value = XmlTag.escapeString(value);
                    }
                    attrs += ' ' + name + '="' + value + '"';
                }
                var closeTag = '/>';
                if (this.innerText) {
                    closeTag = '>';
                    if (this.innerTextEscaped) {
                        closeTag += this.innerText;
                    }
                    else {
                        closeTag += XmlTag.escapeString(this.innerText);
                    }
                    closeTag += '</' + this.name + '>';
                }
                return '<' + this.name + attrs + closeTag;
            };
            return XmlTag;
        })();
        exporter.XmlTag = XmlTag;
    })(exporter = Maker.exporter || (Maker.exporter = {}));
})(Maker || (Maker = {}));
/// <reference path="exporter.ts" />
/// <reference path="xml.ts" />
var Maker;
(function (Maker) {
    var exporter;
    (function (exporter) {
        /**
         * The default stroke width in millimeters.
         */
        exporter.defaultStrokeWidth = 0.2;
        /**
         * Renders an item in SVG markup.
         *
         * @param itemToExport Item to render: may be a path, an array of paths, or a model object.
         * @param options Rendering options object.
         * @param options.annotate Boolean to indicate that the id's of paths should be rendered as SVG text elements.
         * @param options.origin point object for the rendered reference origin.
         * @param options.scale Number to scale the SVG rendering.
         * @param options.stroke String color of the rendered paths.
         * @param options.strokeWidth Number width of the rendered paths, in the same units as the units parameter.
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
                useSvgPathOnly: true,
                viewBox: true
            };
            Maker.extendObject(opts, options);
            var elements = [];
            function fixPoint(pointToFix) {
                //in DXF Y increases upward. in SVG, Y increases downward
                var pointMirroredY = Maker.point.mirror(pointToFix, false, true);
                return Maker.point.scale(pointMirroredY, opts.scale);
            }
            function fixPath(pathToFix, origin) {
                //mirror creates a copy, so we don't modify the original
                var mirrorY = Maker.path.mirror(pathToFix, false, true);
                return Maker.path.moveRelative(Maker.path.scale(mirrorY, opts.scale), origin);
            }
            function createElement(tagname, attrs, innerText, useStroke) {
                if (innerText === void 0) { innerText = null; }
                if (useStroke === void 0) { useStroke = true; }
                var tag = new exporter.XmlTag(tagname, attrs);
                if (innerText) {
                    tag.innerText = innerText;
                }
                if (useStroke) {
                    tag.attrs["fill"] = "none";
                    tag.attrs["stroke"] = opts.stroke;
                    tag.attrs["stroke-width"] = opts.strokeWidth;
                }
                elements.push(tag.toString());
            }
            function drawText(id, x, y) {
                createElement("text", {
                    "id": id + "_text",
                    "x": x,
                    "y": y
                }, id, false);
            }
            function drawPath(id, x, y, d) {
                createElement("path", {
                    "id": id,
                    "d": ["M", Maker.round(x), Maker.round(y)].concat(d).join(" ")
                });
                if (opts.annotate) {
                    drawText(id, x, y);
                }
            }
            var map = {};
            map[Maker.pathType.Line] = function (line, origin) {
                var start = line.origin;
                var end = line.end;
                if (opts.useSvgPathOnly) {
                    drawPath(line.id, start[0], start[1], [Maker.round(end[0]), Maker.round(end[1])]);
                }
                else {
                    createElement("line", {
                        "id": line.id,
                        "x1": Maker.round(start[0]),
                        "y1": Maker.round(start[1]),
                        "x2": Maker.round(end[0]),
                        "y2": Maker.round(end[1])
                    });
                }
                if (opts.annotate) {
                    drawText(line.id, (start[0] + end[0]) / 2, (start[1] + end[1]) / 2);
                }
            };
            map[Maker.pathType.Circle] = function (circle, origin) {
                var center = circle.origin;
                if (opts.useSvgPathOnly) {
                    var r = circle.radius;
                    var d = ['m', -r, 0];
                    function halfCircle(sign) {
                        d.push('a');
                        svgArcData(d, r, [2 * r * sign, 0]);
                    }
                    halfCircle(1);
                    halfCircle(-1);
                    drawPath(circle.id, center[0], center[1], d);
                }
                else {
                    createElement("circle", {
                        "id": circle.id,
                        "r": circle.radius,
                        "cx": Maker.round(center[0]),
                        "cy": Maker.round(center[1])
                    });
                }
                if (opts.annotate) {
                    drawText(circle.id, center[0], center[1]);
                }
            };
            function svgArcData(d, radius, endPoint, largeArc, decreasing) {
                var end = endPoint;
                d.push(radius, radius);
                d.push(0); //0 = x-axis rotation
                d.push(largeArc ? 1 : 0); //large arc=1, small arc=0
                d.push(decreasing ? 0 : 1); //sweep-flag 0=decreasing, 1=increasing 
                d.push(Maker.round(end[0]), Maker.round(end[1]));
            }
            map[Maker.pathType.Arc] = function (arc, origin) {
                var arcPoints = Maker.point.fromArc(arc);
                var d = ['A'];
                svgArcData(d, arc.radius, arcPoints[1], Math.abs(arc.endAngle - arc.startAngle) > 180, arc.startAngle > arc.endAngle);
                drawPath(arc.id, arcPoints[0][0], arcPoints[0][1], d);
            };
            //fixup options
            //measure the item to move it into svg area
            var modelToMeasure;
            if (Maker.isModel(itemToExport)) {
                modelToMeasure = itemToExport;
            }
            else if (Array.isArray(itemToExport)) {
                //issue: this won't handle an array of models
                modelToMeasure = { paths: itemToExport };
            }
            else if (Maker.isPath(itemToExport)) {
                modelToMeasure = { paths: [itemToExport] };
            }
            var size = Maker.measure.modelExtents(modelToMeasure);
            if (!opts.origin) {
                opts.origin = [-size.low[0] * opts.scale, size.high[1] * opts.scale];
            }
            if (!opts.units) {
                var unitSystem = exporter.tryGetModelUnits(itemToExport);
                if (unitSystem) {
                    opts.units = unitSystem;
                }
            }
            if (!opts.strokeWidth) {
                if (!opts.units) {
                    opts.strokeWidth = exporter.defaultStrokeWidth;
                }
                else {
                    opts.strokeWidth = Maker.round(Maker.units.conversionScale(Maker.unitType.Millimeter, opts.units) * exporter.defaultStrokeWidth, .001);
                }
            }
            //also pass back to options parameter
            Maker.extendObject(options, opts);
            //begin svg output
            var exp = new exporter.Exporter(map, fixPoint, fixPath);
            exp.exportItem(itemToExport, opts.origin);
            var svgAttrs;
            if (opts.viewBox) {
                var width = Maker.round(size.high[0] - size.low[0]);
                var height = Maker.round(size.high[1] - size.low[1]);
                var viewBox = [0, 0, width, height];
                var unit = svgUnit[opts.units] || '';
                svgAttrs = { width: width + unit, height: height + unit, viewBox: viewBox.join(' ') };
            }
            var svgTag = new exporter.XmlTag('svg', svgAttrs);
            svgTag.innerText = elements.join('');
            svgTag.innerTextEscaped = true;
            return svgTag.toString();
        }
        exporter.toSVG = toSVG;
        //SVG Coordinate Systems, Transformations and Units documentation:
        //http://www.w3.org/TR/SVG/coords.html
        //The supported length unit identifiers are: em, ex, px, pt, pc, cm, mm, in, and percentages.
        var svgUnit = {};
        svgUnit[Maker.unitType.Inch] = "in";
        svgUnit[Maker.unitType.Millimeter] = "mm";
        svgUnit[Maker.unitType.Centimeter] = "cm";
    })(exporter = Maker.exporter || (Maker.exporter = {}));
})(Maker || (Maker = {}));
var Maker;
(function (Maker) {
    var models;
    (function (models) {
        var BoltCircle = (function () {
            function BoltCircle(boltRadius, holeRadius, boltCount, firstBoltAngle) {
                if (firstBoltAngle === void 0) { firstBoltAngle = 0; }
                this.paths = [];
                var a1 = Maker.angle.toRadians(firstBoltAngle);
                var a = 2 * Math.PI / boltCount;
                for (var i = 0; i < boltCount; i++) {
                    var o = Maker.point.fromPolar(a * i + a1, boltRadius);
                    this.paths.push(Maker.createCircle("bolt " + i, o, holeRadius));
                }
            }
            return BoltCircle;
        })();
        models.BoltCircle = BoltCircle;
    })(models = Maker.models || (Maker.models = {}));
})(Maker || (Maker = {}));
var Maker;
(function (Maker) {
    var models;
    (function (models) {
        var BoltRectangle = (function () {
            function BoltRectangle(width, height, holeRadius) {
                this.paths = [];
                var holes = {
                    "BottomLeft": [0, 0],
                    "BottomRight": [width, 0],
                    "TopRight": [width, height],
                    "TopLeft": [0, height]
                };
                for (var id in holes) {
                    this.paths.push(Maker.createCircle(id + "_bolt", holes[id], holeRadius));
                }
            }
            return BoltRectangle;
        })();
        models.BoltRectangle = BoltRectangle;
    })(models = Maker.models || (Maker.models = {}));
})(Maker || (Maker = {}));
var Maker;
(function (Maker) {
    var models;
    (function (models) {
        var ConnectTheDots = (function () {
            function ConnectTheDots(isClosed, points) {
                var _this = this;
                this.isClosed = isClosed;
                this.points = points;
                this.paths = [];
                var connect = function (a, b) {
                    _this.paths.push(Maker.createLine("ShapeLine" + i, points[a], points[b]));
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
    })(models = Maker.models || (Maker.models = {}));
})(Maker || (Maker = {}));
var Maker;
(function (Maker) {
    var models;
    (function (models) {
        var RoundRectangle = (function () {
            function RoundRectangle(width, height, radius) {
                this.width = width;
                this.height = height;
                this.radius = radius;
                this.paths = [];
                var maxRadius = Math.min(height, width) / 2;
                radius = Math.min(radius, maxRadius);
                var wr = width - radius;
                var hr = height - radius;
                if (radius > 0) {
                    this.paths.push(Maker.createArc("BottomLeft", [radius, radius], radius, 180, 270));
                    this.paths.push(Maker.createArc("BottomRight", [wr, radius], radius, 270, 0));
                    this.paths.push(Maker.createArc("TopRight", [wr, hr], radius, 0, 90));
                    this.paths.push(Maker.createArc("TopLeft", [radius, hr], radius, 90, 180));
                }
                if (wr - radius > 0) {
                    this.paths.push(Maker.createLine("Bottom", [radius, 0], [wr, 0]));
                    this.paths.push(Maker.createLine("Top", [wr, height], [radius, height]));
                }
                if (hr - radius > 0) {
                    this.paths.push(Maker.createLine("Right", [width, radius], [width, hr]));
                    this.paths.push(Maker.createLine("Left", [0, hr], [0, radius]));
                }
            }
            return RoundRectangle;
        })();
        models.RoundRectangle = RoundRectangle;
    })(models = Maker.models || (Maker.models = {}));
})(Maker || (Maker = {}));
/// <reference path="roundrectangle.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Maker;
(function (Maker) {
    var models;
    (function (models) {
        var Oval = (function (_super) {
            __extends(Oval, _super);
            function Oval(width, height) {
                _super.call(this, width, height, Math.min(height / 2, width / 2));
                this.width = width;
                this.height = height;
            }
            return Oval;
        })(models.RoundRectangle);
        models.Oval = Oval;
    })(models = Maker.models || (Maker.models = {}));
})(Maker || (Maker = {}));
var Maker;
(function (Maker) {
    var models;
    (function (models) {
        var OvalArc = (function () {
            function OvalArc(startAngle, endAngle, sweepRadius, slotRadius) {
                var _this = this;
                this.startAngle = startAngle;
                this.endAngle = endAngle;
                this.sweepRadius = sweepRadius;
                this.slotRadius = slotRadius;
                this.paths = [];
                var addCap = function (id, tiltAngle, offsetStartAngle, offsetEndAngle) {
                    var p = Maker.point.fromPolar(Maker.angle.toRadians(tiltAngle), sweepRadius);
                    _this.paths.push(Maker.createArc(id, p, slotRadius, tiltAngle + offsetStartAngle, tiltAngle + offsetEndAngle));
                };
                var addSweep = function (id, offsetRadius) {
                    _this.paths.push(Maker.createArc(id, Maker.point.zero(), sweepRadius + offsetRadius, startAngle, endAngle));
                };
                addSweep("Inner", -slotRadius);
                addSweep("Outer", slotRadius);
                addCap("StartCap", startAngle, 180, 0);
                addCap("EndCap", endAngle, 0, 180);
            }
            return OvalArc;
        })();
        models.OvalArc = OvalArc;
    })(models = Maker.models || (Maker.models = {}));
})(Maker || (Maker = {}));
/// <reference path="connectthedots.ts" />
var Maker;
(function (Maker) {
    var models;
    (function (models) {
        var Rectangle = (function (_super) {
            __extends(Rectangle, _super);
            function Rectangle(width, height) {
                _super.call(this, true, [[0, 0], [width, 0], [width, height], [0, height]]);
                this.width = width;
                this.height = height;
            }
            return Rectangle;
        })(models.ConnectTheDots);
        models.Rectangle = Rectangle;
    })(models = Maker.models || (Maker.models = {}));
})(Maker || (Maker = {}));
var Maker;
(function (Maker) {
    var models;
    (function (models) {
        var SCurve = (function () {
            function SCurve(width, height) {
                this.width = width;
                this.height = height;
                this.paths = [];
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
                    endAngle = 360 - Maker.angle.toDegrees(Math.acos(w2 / radius));
                    arcOrigin = [0, radius];
                }
                else {
                    radius = findRadius(w2, h2);
                    startAngle = 180 - Maker.angle.toDegrees(Math.asin(h2 / radius));
                    endAngle = 180;
                    arcOrigin = [radius, 0];
                }
                var curve = Maker.createArc('curve_start', arcOrigin, radius, startAngle, endAngle);
                this.paths.push(curve);
                this.paths.push(Maker.path.moveRelative(Maker.path.mirror(curve, true, true, 'curve_end'), [width, height]));
            }
            return SCurve;
        })();
        models.SCurve = SCurve;
    })(models = Maker.models || (Maker.models = {}));
})(Maker || (Maker = {}));
/// <reference path="rectangle.ts" />
var Maker;
(function (Maker) {
    var models;
    (function (models) {
        var Square = (function (_super) {
            __extends(Square, _super);
            function Square(side) {
                _super.call(this, side, side);
                this.side = side;
            }
            return Square;
        })(models.Rectangle);
        models.Square = Square;
    })(models = Maker.models || (Maker.models = {}));
})(Maker || (Maker = {}));
