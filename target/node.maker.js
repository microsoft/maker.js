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
    MakerJs.extendObject = extendObject;
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
    MakerJs.findById = findById;
    /**
     * Search within an array to find an item by its id property, then remove it from the array.
     *
     * @param arr Array to search.
     * @param id Id of the item to find and remove.
     */
    function removeById(arr, id) {
        var found = findById(arr, id);
        if (found) {
            arr.splice(found.index, 1);
        }
    }
    MakerJs.removeById = removeById;
    /**
     * Test to see if an object implements the required properties of a point.
     *
     * @param item The item to test.
     */
    function isPoint(item) {
        return (Array.isArray(item) && item.length > 1);
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
     * String-based enumeration of all paths types.
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
/// <reference path="maker.ts" />
var MakerJs;
(function (MakerJs) {
    var angle;
    (function (angle) {
        /**
         * Ensures an angle is not greater than 360
         *
         * @param angleInDegrees Angle in degrees.
         * @retiurns Same polar angle but not greater than 360 degrees.
         */
        function noRevolutions(angleInDegrees) {
            var revolutions = Math.floor(angleInDegrees / 360);
            return angleInDegrees - (360 * revolutions);
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
        function fromPointToRadians(origin, pointToFindAngle) {
            var d = MakerJs.point.subtract(pointToFindAngle, origin);
            var x = d[0];
            var y = d[1];
            return Math.atan2(-y, -x) + Math.PI;
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
    })(angle = MakerJs.angle || (MakerJs.angle = {}));
})(MakerJs || (MakerJs = {}));
/// <reference path="maker.ts" />
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
        function areEqual(a, b) {
            return a[0] == b[0] && a[1] == b[1];
        }
        point.areEqual = areEqual;
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
                return add(arc.origin, fromPolar(MakerJs.angle.toRadians(a), arc.radius));
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
            var pointAngleInRadians = MakerJs.angle.fromPointToRadians(rotationOrigin, pointToRotate);
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
         *
         * @returns A new point.
         */
        function zero() {
            return [0, 0];
        }
        point.zero = zero;
    })(point = MakerJs.point || (MakerJs.point = {}));
})(MakerJs || (MakerJs = {}));
/// <reference path="point.ts" />
var MakerJs;
(function (MakerJs) {
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
            var origin = MakerJs.point.mirror(pathToMirror.origin, mirrorX, mirrorY);
            var map = {};
            map[MakerJs.pathType.Line] = function (line) {
                newPath = new MakerJs.paths.Line(newId || line.id, origin, MakerJs.point.mirror(line.end, mirrorX, mirrorY));
            };
            map[MakerJs.pathType.Circle] = function (circle) {
                newPath = new MakerJs.paths.Circle(newId || circle.id, origin, circle.radius);
            };
            map[MakerJs.pathType.Arc] = function (arc) {
                var startAngle = MakerJs.angle.mirror(arc.startAngle, mirrorX, mirrorY);
                var endAngle = MakerJs.angle.mirror(MakerJs.angle.arcEndAnglePastZero(arc), mirrorX, mirrorY);
                var xor = mirrorX != mirrorY;
                newPath = new MakerJs.paths.Arc(newId || arc.id, origin, arc.radius, xor ? endAngle : startAngle, xor ? startAngle : endAngle);
            };
            var fn = map[pathToMirror.type];
            if (fn) {
                fn(pathToMirror);
            }
            if (pathToMirror.cssStyle) {
                newPath.cssStyle = pathToMirror.cssStyle;
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
            map[MakerJs.pathType.Line] = function (line) {
                line.end = MakerJs.point.add(line.end, adjust);
            };
            pathToMove.origin = MakerJs.point.add(pathToMove.origin, adjust);
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
            map[MakerJs.pathType.Line] = function (line) {
                line.end = MakerJs.point.rotate(line.end, angleInDegrees, rotationOrigin);
            };
            map[MakerJs.pathType.Arc] = function (arc) {
                arc.startAngle += angleInDegrees;
                arc.endAngle += angleInDegrees;
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
            if (scaleValue == 1)
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
/// <reference path="path.ts" />
var MakerJs;
(function (MakerJs) {
    var paths;
    (function (paths) {
        //shortcuts
        /**
         * Class for arc path.
         *
         * @param id The id of the new path.
         * @param origin The origin of the new path, either as a point object, or as an array of numbers.
         * @param radius The radius of the arc.
         * @param startAngle The start angle of the arc.
         * @param endAngle The end angle of the arc.
         * @returns A new POJO representing an arc path.
         */
        var Arc = (function () {
            function Arc(id, origin, radius, startAngle, endAngle) {
                this.id = id;
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
         * @param id The id of the new path.
         * @param origin The origin of the new path, either as a point object, or as an array of numbers.
         * @param radius The radius of the circle.
         * @returns A new POJO representing an circle path.
         */
        var Circle = (function () {
            function Circle(id, origin, radius) {
                this.id = id;
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
         * @param id The id of the new path.
         * @param origin The origin of the new path, either as a point object, or as an array of numbers.
         * @param end The end point of the line.
         * @returns A new POJO representing an line path.
         */
        var Line = (function () {
            function Line(id, origin, end) {
                this.id = id;
                this.origin = origin;
                this.end = end;
                this.type = MakerJs.pathType.Line;
            }
            return Line;
        })();
        paths.Line = Line;
    })(paths = MakerJs.paths || (MakerJs.paths = {}));
})(MakerJs || (MakerJs = {}));
/// <reference path="paths.ts" />
var MakerJs;
(function (MakerJs) {
    var model;
    (function (model) {
        /**
         * Moves all children (models and paths, recursively) within a model to their absolute position. Useful when referencing points between children.
         *
         * @param modelToFlatten The model to flatten.
         * @param origin Optional offset reference point.
         */
        function flatten(modelToFlatten, origin) {
            var newOrigin = MakerJs.point.add(modelToFlatten.origin, origin);
            if (modelToFlatten.paths) {
                for (var i = 0; i < modelToFlatten.paths.length; i++) {
                    MakerJs.path.moveRelative(modelToFlatten.paths[i], newOrigin);
                }
            }
            if (modelToFlatten.models) {
                for (var i = 0; i < modelToFlatten.models.length; i++) {
                    flatten(modelToFlatten.models[i], newOrigin);
                }
            }
            modelToFlatten.origin = MakerJs.point.zero();
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
                newModel.origin = MakerJs.point.mirror(modelToMirror.origin, mirrorX, mirrorY);
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
                    newModel.paths.push(MakerJs.path.mirror(modelToMirror.paths[i], mirrorX, mirrorY));
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
            modelToMove.origin = MakerJs.point.clone(origin);
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
            var offsetOrigin = MakerJs.point.subtract(rotationOrigin, modelToRotate.origin);
            if (modelToRotate.paths) {
                for (var i = 0; i < modelToRotate.paths.length; i++) {
                    MakerJs.path.rotate(modelToRotate.paths[i], angleInDegrees, offsetOrigin);
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
                modelToScale.origin = MakerJs.point.scale(modelToScale.origin, scaleValue);
            }
            if (modelToScale.paths) {
                for (var i = 0; i < modelToScale.paths.length; i++) {
                    MakerJs.path.scale(modelToScale.paths[i], scaleValue);
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
    })(model = MakerJs.model || (MakerJs.model = {}));
})(MakerJs || (MakerJs = {}));
/// <reference path="maker.ts" />
var MakerJs;
(function (MakerJs) {
    var units;
    (function (units) {
        /**
         * The base type is arbitrary. Other conversions are then based off of this.
         */
        var base = MakerJs.unitType.Millimeter;
        /**
         * Initialize all known conversions here.
         */
        function init() {
            addBaseConversion(MakerJs.unitType.Centimeter, 10);
            addBaseConversion(MakerJs.unitType.Meter, 1000);
            addBaseConversion(MakerJs.unitType.Inch, 25.4);
            addBaseConversion(MakerJs.unitType.Foot, 25.4 * 12);
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
    })(units = MakerJs.units || (MakerJs.units = {}));
})(MakerJs || (MakerJs = {}));
/// <reference path="model.ts" />
var MakerJs;
(function (MakerJs) {
    var measure;
    (function (_measure) {
        /**
         * Total angle of an arc between its start and end angles.
         *
         * @param arc The arc to measure.
         * @returns Angle of arc.
         */
        function arcAngle(arc) {
            var endAngle = MakerJs.angle.arcEndAnglePastZero(arc);
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
                var startPoint = MakerJs.point.fromPolar(MakerJs.angle.toRadians(arc.startAngle), r);
                var endPoint = MakerJs.point.fromPolar(MakerJs.angle.toRadians(arc.endAngle), r);
                var startAngle = arc.startAngle;
                var endAngle = MakerJs.angle.arcEndAnglePastZero(arc);
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
                    return MakerJs.point.add(arc.origin, extremePoint);
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
                    var c = MakerJs.point.add(b, offsetOrigin);
                    for (var i = 2; i--;) {
                        a[i] = (a[i] == null ? c[i] : fn(a[i], c[i]));
                    }
                }
                getExtreme(totalMeasurement.low, pathMeasurement.low, Math.min);
                getExtreme(totalMeasurement.high, pathMeasurement.high, Math.max);
            }
            function measure(model, offsetOrigin) {
                var newOrigin = MakerJs.point.add(model.origin, offsetOrigin);
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
    })(measure = MakerJs.measure || (MakerJs.measure = {}));
})(MakerJs || (MakerJs = {}));
/// <reference path="model.ts" />
/// <reference path="units.ts" />
/// <reference path="measure.ts" />
var MakerJs;
(function (MakerJs) {
    var exporter;
    (function (exporter) {
        /**
         * Try to get the unit system from a model
         */
        function tryGetModelUnits(itemToExport) {
            if (MakerJs.isModel(itemToExport)) {
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
                if (this.beginModel) {
                    this.beginModel(modelToExport);
                }
                var newOffset = MakerJs.point.add((this.fixPoint ? this.fixPoint(modelToExport.origin) : modelToExport.origin), offset);
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
            Exporter.prototype.exportItem = function (itemToExport, origin) {
                if (MakerJs.isModel(itemToExport)) {
                    this.exportModel(itemToExport, origin);
                }
                else if (Array.isArray(itemToExport)) {
                    var items = itemToExport;
                    for (var i = 0; i < items.length; i++) {
                        this.exportItem(items[i], origin);
                    }
                }
                else if (MakerJs.isPath(itemToExport)) {
                    this.exportPath(itemToExport, origin);
                }
            };
            return Exporter;
        })();
        exporter.Exporter = Exporter;
    })(exporter = MakerJs.exporter || (MakerJs.exporter = {}));
})(MakerJs || (MakerJs = {}));
/// <reference path="exporter.ts" />
var MakerJs;
(function (MakerJs) {
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
            MakerJs.extendObject(opts, options);
            var dxf = [];
            function append(value) {
                dxf.push(value);
            }
            var map = {};
            map[MakerJs.pathType.Line] = function (line, origin) {
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
            map[MakerJs.pathType.Circle] = function (circle, origin) {
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
            map[MakerJs.pathType.Arc] = function (arc, origin) {
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
                exporter.exportItem(itemToExport, MakerJs.point.zero());
            }
            //fixup options
            if (!opts.units) {
                var units = _exporter.tryGetModelUnits(itemToExport);
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
        _exporter.toDXF = toDXF;
        //DXF format documentation:
        //http://images.autodesk.com/adsk/files/acad_dxf0.pdf
        //Default drawing units for AutoCAD DesignCenter blocks:
        //0 = Unitless; 1 = Inches; 2 = Feet; 3 = Miles; 4 = Millimeters; 5 = Centimeters; 6 = Meters; 7 = Kilometers; 8 = Microinches;
        var dxfUnit = {};
        dxfUnit[''] = 0;
        dxfUnit[MakerJs.unitType.Inch] = 1;
        dxfUnit[MakerJs.unitType.Foot] = 2;
        dxfUnit[MakerJs.unitType.Millimeter] = 4;
        dxfUnit[MakerJs.unitType.Centimeter] = 5;
        dxfUnit[MakerJs.unitType.Meter] = 6;
    })(exporter = MakerJs.exporter || (MakerJs.exporter = {}));
})(MakerJs || (MakerJs = {}));
/// <reference path="model.ts" />
var MakerJs;
(function (MakerJs) {
    var kit;
    (function (kit) {
        function construct(ctor, args) {
            function F() {
                return ctor.apply(this, args);
            }
            F.prototype = ctor.prototype;
            return new F();
        }
        kit.construct = construct;
        function getParameterValues(ctor) {
            var parameters = [];
            var metaParams = ctor.metaParameters;
            if (metaParams) {
                for (var i = 0; i < metaParams.length; i++) {
                    parameters.push(metaParams[i].value);
                }
            }
            return parameters;
        }
        kit.getParameterValues = getParameterValues;
    })(kit = MakerJs.kit || (MakerJs.kit = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
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
/// <reference path="exporter.ts" />
/// <reference path="xml.ts" />
var MakerJs;
(function (MakerJs) {
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
            MakerJs.extendObject(opts, options);
            var elements = [];
            function append(value) {
                elements.push(value);
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
            function createElement(tagname, attrs, innerText) {
                if (innerText === void 0) { innerText = null; }
                var tag = new exporter.XmlTag(tagname, attrs);
                if (innerText) {
                    tag.innerText = innerText;
                }
                append(tag.toString());
            }
            function drawText(id, x, y) {
                createElement("text", {
                    "id": id + "_text",
                    "x": x,
                    "y": y
                }, id);
            }
            function drawPath(id, x, y, d, cssStyle) {
                createElement("path", {
                    "id": id,
                    "d": ["M", MakerJs.round(x), MakerJs.round(y)].concat(d).join(" "),
                    "style": cssStyle
                });
                if (opts.annotate) {
                    drawText(id, x, y);
                }
            }
            var map = {};
            map[MakerJs.pathType.Line] = function (line, origin) {
                var start = line.origin;
                var end = line.end;
                if (opts.useSvgPathOnly) {
                    drawPath(line.id, start[0], start[1], [MakerJs.round(end[0]), MakerJs.round(end[1])], line.cssStyle);
                }
                else {
                    createElement("line", {
                        "id": line.id,
                        "x1": MakerJs.round(start[0]),
                        "y1": MakerJs.round(start[1]),
                        "x2": MakerJs.round(end[0]),
                        "y2": MakerJs.round(end[1]),
                        "style": line.cssStyle
                    });
                }
                if (opts.annotate) {
                    drawText(line.id, (start[0] + end[0]) / 2, (start[1] + end[1]) / 2);
                }
            };
            map[MakerJs.pathType.Circle] = function (circle, origin) {
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
                    drawPath(circle.id, center[0], center[1], d, circle.cssStyle);
                }
                else {
                    createElement("circle", {
                        "id": circle.id,
                        "r": circle.radius,
                        "cx": MakerJs.round(center[0]),
                        "cy": MakerJs.round(center[1]),
                        "style": circle.cssStyle
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
                d.push(MakerJs.round(end[0]), MakerJs.round(end[1]));
            }
            map[MakerJs.pathType.Arc] = function (arc, origin) {
                var arcPoints = MakerJs.point.fromArc(arc);
                var d = ['A'];
                svgArcData(d, arc.radius, arcPoints[1], Math.abs(arc.endAngle - arc.startAngle) > 180, arc.startAngle > arc.endAngle);
                drawPath(arc.id, arcPoints[0][0], arcPoints[0][1], d, arc.cssStyle);
            };
            //fixup options
            //measure the item to move it into svg area
            var modelToMeasure;
            if (MakerJs.isModel(itemToExport)) {
                modelToMeasure = itemToExport;
            }
            else if (Array.isArray(itemToExport)) {
                //issue: this won't handle an array of models
                modelToMeasure = { paths: itemToExport };
            }
            else if (MakerJs.isPath(itemToExport)) {
                modelToMeasure = { paths: [itemToExport] };
            }
            var size = MakerJs.measure.modelExtents(modelToMeasure);
            if (!opts.origin) {
                var left = 0;
                if (size.low[0] < 0) {
                    left = -size.low[0] * opts.scale;
                }
                opts.origin = [left, size.high[1] * opts.scale];
            }
            if (!opts.units) {
                var unitSystem = exporter.tryGetModelUnits(itemToExport);
                if (unitSystem) {
                    opts.units = unitSystem;
                }
            }
            if (typeof opts.strokeWidth === 'undefined') {
                if (!opts.units) {
                    opts.strokeWidth = exporter.defaultStrokeWidth;
                }
                else {
                    opts.strokeWidth = MakerJs.round(MakerJs.units.conversionScale(MakerJs.unitType.Millimeter, opts.units) * exporter.defaultStrokeWidth, .001);
                }
            }
            //also pass back to options parameter
            MakerJs.extendObject(options, opts);
            //begin svg output
            var modelGroup = new exporter.XmlTag('g');
            function beginModel(modelContext) {
                modelGroup.attrs = {
                    id: modelContext.id
                };
                append(modelGroup.getOpeningTag(false));
            }
            function endModel(modelContext) {
                append(modelGroup.getClosingTag());
            }
            var svgAttrs;
            if (opts.viewBox) {
                var width = MakerJs.round(size.high[0] - size.low[0]);
                var height = MakerJs.round(size.high[1] - size.low[1]);
                var viewBox = [0, 0, width, height];
                var unit = svgUnit[opts.units] || '';
                svgAttrs = {
                    width: width + unit,
                    height: height + unit,
                    viewBox: viewBox.join(' ')
                };
            }
            var svgTag = new exporter.XmlTag('svg', svgAttrs);
            append(svgTag.getOpeningTag(false));
            var svgGroup = new exporter.XmlTag('g', {
                id: 'svgGroup',
                stroke: opts.stroke,
                "stroke-width": opts.strokeWidth,
                "fill": "none"
            });
            append(svgGroup.getOpeningTag(false));
            var exp = new exporter.Exporter(map, fixPoint, fixPath, beginModel, endModel);
            exp.exportItem(itemToExport, opts.origin);
            append(svgGroup.getClosingTag());
            append(svgTag.getClosingTag());
            return elements.join('');
        }
        exporter.toSVG = toSVG;
        //SVG Coordinate Systems, Transformations and Units documentation:
        //http://www.w3.org/TR/SVG/coords.html
        //The supported length unit identifiers are: em, ex, px, pt, pc, cm, mm, in, and percentages.
        var svgUnit = {};
        svgUnit[MakerJs.unitType.Inch] = "in";
        svgUnit[MakerJs.unitType.Millimeter] = "mm";
        svgUnit[MakerJs.unitType.Centimeter] = "cm";
    })(exporter = MakerJs.exporter || (MakerJs.exporter = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var BoltCircle = (function () {
            function BoltCircle(id, boltRadius, holeRadius, boltCount, firstBoltAngleInDegrees) {
                if (firstBoltAngleInDegrees === void 0) { firstBoltAngleInDegrees = 0; }
                this.id = id;
                this.paths = [];
                var points = models.Polygon.getPoints(boltCount, boltRadius, firstBoltAngleInDegrees);
                for (var i = 0; i < boltCount; i++) {
                    this.paths.push(new MakerJs.paths.Circle("bolt " + i, points[i], holeRadius));
                }
            }
            return BoltCircle;
        })();
        models.BoltCircle = BoltCircle;
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var BoltRectangle = (function () {
            function BoltRectangle(id, width, height, holeRadius) {
                this.id = id;
                this.paths = [];
                var holes = {
                    "BottomLeft": [0, 0],
                    "BottomRight": [width, 0],
                    "TopRight": [width, height],
                    "TopLeft": [0, height]
                };
                for (var id2 in holes) {
                    this.paths.push(new MakerJs.paths.Circle(id2 + "_bolt", holes[id2], holeRadius));
                }
            }
            return BoltRectangle;
        })();
        models.BoltRectangle = BoltRectangle;
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var ConnectTheDots = (function () {
            function ConnectTheDots(id, isClosed, points) {
                var _this = this;
                this.id = id;
                this.paths = [];
                var connect = function (a, b) {
                    _this.paths.push(new MakerJs.paths.Line("ShapeLine" + i, points[a], points[b]));
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
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var RoundRectangle = (function () {
            function RoundRectangle(id, width, height, radius) {
                this.id = id;
                this.paths = [];
                var maxRadius = Math.min(height, width) / 2;
                radius = Math.min(radius, maxRadius);
                var wr = width - radius;
                var hr = height - radius;
                if (radius > 0) {
                    this.paths.push(new MakerJs.paths.Arc("BottomLeft", [radius, radius], radius, 180, 270));
                    this.paths.push(new MakerJs.paths.Arc("BottomRight", [wr, radius], radius, 270, 0));
                    this.paths.push(new MakerJs.paths.Arc("TopRight", [wr, hr], radius, 0, 90));
                    this.paths.push(new MakerJs.paths.Arc("TopLeft", [radius, hr], radius, 90, 180));
                }
                if (wr - radius > 0) {
                    this.paths.push(new MakerJs.paths.Line("Bottom", [radius, 0], [wr, 0]));
                    this.paths.push(new MakerJs.paths.Line("Top", [wr, height], [radius, height]));
                }
                if (hr - radius > 0) {
                    this.paths.push(new MakerJs.paths.Line("Right", [width, radius], [width, hr]));
                    this.paths.push(new MakerJs.paths.Line("Left", [0, hr], [0, radius]));
                }
            }
            return RoundRectangle;
        })();
        models.RoundRectangle = RoundRectangle;
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
/// <reference path="roundrectangle.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Oval = (function (_super) {
            __extends(Oval, _super);
            function Oval(id, width, height) {
                _super.call(this, id, width, height, Math.min(height / 2, width / 2));
                this.id = id;
            }
            return Oval;
        })(models.RoundRectangle);
        models.Oval = Oval;
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var OvalArc = (function () {
            function OvalArc(id, startAngle, endAngle, sweepRadius, slotRadius) {
                var _this = this;
                this.id = id;
                this.paths = [];
                var addCap = function (id, tiltAngle, offsetStartAngle, offsetEndAngle) {
                    var p = MakerJs.point.fromPolar(MakerJs.angle.toRadians(tiltAngle), sweepRadius);
                    _this.paths.push(new MakerJs.paths.Arc(id, p, slotRadius, tiltAngle + offsetStartAngle, tiltAngle + offsetEndAngle));
                };
                var addSweep = function (id, offsetRadius) {
                    _this.paths.push(new MakerJs.paths.Arc(id, MakerJs.point.zero(), sweepRadius + offsetRadius, startAngle, endAngle));
                };
                addSweep("Inner", -slotRadius);
                addSweep("Outer", slotRadius);
                addCap("StartCap", startAngle, 180, 0);
                addCap("EndCap", endAngle, 0, 180);
            }
            return OvalArc;
        })();
        models.OvalArc = OvalArc;
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
/// <reference path="connectthedots.ts" />
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Polygon = (function (_super) {
            __extends(Polygon, _super);
            function Polygon(id, numberOfSides, radius, firstCornerAngleInDegrees) {
                if (firstCornerAngleInDegrees === void 0) { firstCornerAngleInDegrees = 0; }
                _super.call(this, id, true, Polygon.getPoints(numberOfSides, radius, firstCornerAngleInDegrees));
                this.id = id;
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
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
/// <reference path="connectthedots.ts" />
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Rectangle = (function (_super) {
            __extends(Rectangle, _super);
            function Rectangle(id, width, height) {
                _super.call(this, id, true, [[0, 0], [width, 0], [width, height], [0, height]]);
                this.id = id;
            }
            return Rectangle;
        })(models.ConnectTheDots);
        models.Rectangle = Rectangle;
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Ring = (function () {
            function Ring(id, outerRadius, innerRadius) {
                this.id = id;
                this.paths = [];
                var radii = {
                    "Ring_outer": outerRadius,
                    "Ring_inner": innerRadius
                };
                for (var key in radii) {
                    this.paths.push(new MakerJs.paths.Circle(key, MakerJs.point.zero(), radii[key]));
                }
            }
            return Ring;
        })();
        models.Ring = Ring;
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var SCurve = (function () {
            function SCurve(id, width, height) {
                this.id = id;
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
                    endAngle = 360 - MakerJs.angle.toDegrees(Math.acos(w2 / radius));
                    arcOrigin = [0, radius];
                }
                else {
                    radius = findRadius(w2, h2);
                    startAngle = 180 - MakerJs.angle.toDegrees(Math.asin(h2 / radius));
                    endAngle = 180;
                    arcOrigin = [radius, 0];
                }
                var curve = new MakerJs.paths.Arc('curve_start', arcOrigin, radius, startAngle, endAngle);
                this.paths.push(curve);
                this.paths.push(MakerJs.path.moveRelative(MakerJs.path.mirror(curve, true, true, 'curve_end'), [width, height]));
            }
            return SCurve;
        })();
        models.SCurve = SCurve;
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
/// <reference path="rectangle.ts" />
var MakerJs;
(function (MakerJs) {
    var models;
    (function (models) {
        var Square = (function (_super) {
            __extends(Square, _super);
            function Square(id, side) {
                _super.call(this, id, side, side);
                this.id = id;
            }
            return Square;
        })(models.Rectangle);
        models.Square = Square;
    })(models = MakerJs.models || (MakerJs.models = {}));
})(MakerJs || (MakerJs = {}));
/// <reference path="../core/maker.ts" />
var MakerJs;
(function (MakerJs) {
    var tools;
    (function (tools) {
        function midPoint(a, b, breakAt) {
            if (breakAt === void 0) { breakAt = .5; }
            var mp = [];
            for (var i = 0; i < 2; i++) {
                mp.push(a[i] + (b[i] - a[i]) * breakAt);
            }
            return mp;
        }
        var breakPathFunctionMap = {};
        breakPathFunctionMap[MakerJs.pathType.Line] = function (line, breakAt) {
            var breakPoint = midPoint(line.origin, line.end, breakAt);
            var ret = [];
            function addLine(suffix, origin, end) {
                ret.push({
                    newPath: new MakerJs.paths.Line(line.id + suffix, MakerJs.point.clone(origin), MakerJs.point.clone(end)),
                    newPoint: MakerJs.point.clone(breakPoint)
                });
            }
            addLine("_1", line.origin, breakPoint);
            addLine("_2", breakPoint, line.end);
            return ret;
        };
        breakPathFunctionMap[MakerJs.pathType.Arc] = function (arc, breakAt) {
            var breakAngle = MakerJs.measure.arcAngle(arc) * breakAt + arc.startAngle;
            if (breakAngle >= 360) {
                breakAngle -= 360;
            }
            var breakPoint = MakerJs.point.add(arc.origin, MakerJs.point.fromPolar(MakerJs.angle.toRadians(breakAngle), arc.radius));
            var ret = [];
            function addArc(suffix, startAngle, endAngle) {
                ret.push({
                    newPath: new MakerJs.paths.Arc(arc.id + suffix, MakerJs.point.clone(arc.origin), arc.radius, startAngle, endAngle),
                    newPoint: MakerJs.point.clone(breakPoint)
                });
            }
            addArc("_1", arc.startAngle, breakAngle);
            addArc("_2", breakAngle, arc.endAngle);
            return ret;
        };
        function breakPath(path, breakAt) {
            if (breakAt === void 0) { breakAt = .5; }
            var fn = breakPathFunctionMap[path.type];
            if (fn) {
                return fn(path, breakAt);
            }
            return null;
        }
        tools.breakPath = breakPath;
        /**
         * Break a path and create a gap within it. Useful when connecting models together.
         *
         * @param modelToGap Model which will have a gap in one of its paths.
         * @param pathId String id of the path in which to create a gap.
         * @param gapLength Number length of the gap.
         * @breakAt Number between 0 and 1 (default .5) where the gap will be centered along the path.
         */
        function gapPath(modelToGap, pathId, gapLength, breakAt) {
            if (breakAt === void 0) { breakAt = .5; }
            var found = MakerJs.findById(modelToGap.paths, pathId);
            if (!found)
                return null;
            modelToGap.paths.splice(found.index, 1); //remove the path from the array
            var foundPath = found.item;
            var halfGap = gapLength / 2;
            var ret = [];
            function append(brokenPath, extraPoint) {
                modelToGap.paths.push(brokenPath.newPath);
                ret.push(brokenPath.newPoint);
                if (extraPoint) {
                    ret.push(extraPoint);
                }
            }
            var map = {};
            map[MakerJs.pathType.Line] = function (line) {
                var firstBreak = breakPath(line, breakAt);
                function chop(line, start) {
                    var len = MakerJs.measure.pathLength(line);
                    if (halfGap < len) {
                        var chopDistance = start ? len - halfGap : halfGap;
                        var secondBreak = breakPath(line, chopDistance / len);
                        if (start) {
                            append(secondBreak[0]);
                        }
                        else {
                            append(secondBreak[1]);
                        }
                    } //todo add point else
                }
                chop(firstBreak[0].newPath, true);
                chop(firstBreak[1].newPath, false);
            };
            map[MakerJs.pathType.Circle] = function (circle) {
                var breakAangle = 360 * breakAt;
                var halfGapAngle = MakerJs.angle.toDegrees(Math.asin(halfGap / circle.radius));
                var startAngle = breakAangle + halfGapAngle;
                var endAngle = breakAangle - halfGapAngle;
                var brokenPath = {
                    newPath: new MakerJs.paths.Arc(circle.id + "_1", MakerJs.point.clone(circle.origin), circle.radius, startAngle, endAngle),
                    newPoint: MakerJs.point.add(circle.origin, MakerJs.point.fromPolar(MakerJs.angle.toRadians(startAngle), circle.radius))
                };
                append(brokenPath, MakerJs.point.add(circle.origin, MakerJs.point.fromPolar(MakerJs.angle.toRadians(endAngle), circle.radius)));
            };
            map[MakerJs.pathType.Arc] = function (arc) {
                var firstBreak = breakPath(arc, breakAt);
                var halfGapAngle = MakerJs.angle.toDegrees(Math.asin(halfGap / arc.radius));
                function chop(arc, start) {
                    var totalAngle = MakerJs.measure.arcAngle(arc);
                    if (halfGapAngle < totalAngle) {
                        var chopDistance = start ? totalAngle - halfGapAngle : halfGapAngle;
                        var secondBreak = breakPath(arc, chopDistance / totalAngle);
                        if (start) {
                            append(secondBreak[0]);
                        }
                        else {
                            append(secondBreak[1]);
                        }
                    } //todo add point else
                }
                chop(firstBreak[0].newPath, true);
                chop(firstBreak[1].newPath, false);
            };
            var fn = map[foundPath.type];
            if (fn) {
                fn(foundPath);
            }
            return ret;
        }
        tools.gapPath = gapPath;
    })(tools = MakerJs.tools || (MakerJs.tools = {}));
})(MakerJs || (MakerJs = {}));
/// <reference path="../core/maker.ts" />
var MakerJs;
(function (MakerJs) {
    var tools;
    (function (tools) {
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
        tools.solveTriangleSSS = solveTriangleSSS;
        /**
         * Solves for the length of a side of a triangle when you know length of one side and 2 angles.
         *
         * @param oppositeAngleInDegrees Angle which is opposite of the side you are trying to find.
         * @param otherAngleInDegrees An other angle of the triangle.
         * @param lengthOfSideBetweenAngles Length of one side of the triangle which is between the provided angles.
         */
        function solveTriangleASA(oppositeAngleInDegrees, otherAngleInDegrees, lengthOfSideBetweenAngles) {
            var angleOppositeSide = 180 - oppositeAngleInDegrees - otherAngleInDegrees;
            return (lengthOfSideBetweenAngles * Math.sin(MakerJs.angle.toRadians(oppositeAngleInDegrees))) / Math.sin(MakerJs.angle.toRadians(angleOppositeSide));
        }
        tools.solveTriangleASA = solveTriangleASA;
    })(tools = MakerJs.tools || (MakerJs.tools = {}));
})(MakerJs || (MakerJs = {}));
/// <reference path="solvers.ts" />
var MakerJs;
(function (MakerJs) {
    var tools;
    (function (tools) {
        var map = {};
        map[MakerJs.pathType.Arc] = {};
        map[MakerJs.pathType.Circle] = {};
        map[MakerJs.pathType.Line] = {};
        map[MakerJs.pathType.Arc][MakerJs.pathType.Arc] = function (arc1, arc2) {
            var angles = circleToCircle(arc1, arc2);
            if (angles) {
                var arc1Angles = getAnglesWithinArc(angles[0], arc1);
                var arc2Angles = getAnglesWithinArc(angles[1], arc2);
                if (arc1Angles && arc2Angles) {
                    return {
                        intersectionPoints: pointsFromAnglesOnCircle(arc1Angles, arc1),
                        path1Angles: arc1Angles,
                        path2Angles: arc2Angles
                    };
                }
            }
            return null;
        };
        map[MakerJs.pathType.Arc][MakerJs.pathType.Circle] = function (arc, circle) {
            var angles = circleToCircle(arc, circle);
            if (angles) {
                var arcAngles = getAnglesWithinArc(angles[0], arc);
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
        map[MakerJs.pathType.Arc][MakerJs.pathType.Line] = function (arc, line) {
            var angles = lineToCircle(line, arc);
            if (angles) {
                var arcAngles = getAnglesWithinArc(angles, arc);
                if (arcAngles) {
                    return {
                        intersectionPoints: pointsFromAnglesOnCircle(arcAngles, arc),
                        path1Angles: arcAngles
                    };
                }
            }
            return null;
        };
        map[MakerJs.pathType.Circle][MakerJs.pathType.Arc] = function (circle, arc) {
            var result = map[MakerJs.pathType.Arc][MakerJs.pathType.Circle](arc, circle);
            if (result) {
                return swap(result);
            }
            return null;
        };
        map[MakerJs.pathType.Circle][MakerJs.pathType.Circle] = function (circle1, circle2) {
            var angles = circleToCircle(circle1, circle2);
            if (angles) {
                return {
                    intersectionPoints: pointsFromAnglesOnCircle(angles[0], circle1),
                    path1Angles: angles[0],
                    path2Angles: angles[1]
                };
            }
            return null;
        };
        map[MakerJs.pathType.Circle][MakerJs.pathType.Line] = function (circle, line) {
            var angles = lineToCircle(line, circle);
            if (angles) {
                return {
                    intersectionPoints: pointsFromAnglesOnCircle(angles, circle),
                    path1Angles: angles
                };
            }
            return null;
        };
        map[MakerJs.pathType.Line][MakerJs.pathType.Arc] = function (line, arc) {
            var result = map[MakerJs.pathType.Arc][MakerJs.pathType.Line](arc, line);
            if (result) {
                return swap(result);
            }
            return null;
        };
        map[MakerJs.pathType.Line][MakerJs.pathType.Circle] = function (line, circle) {
            var result = map[MakerJs.pathType.Circle][MakerJs.pathType.Line](circle, line);
            if (result) {
                return swap(result);
            }
            return null;
        };
        map[MakerJs.pathType.Line][MakerJs.pathType.Line] = function (line1, line2) {
            var intersectionPoint = lineToLine(line1, line2);
            if (intersectionPoint) {
                return {
                    intersectionPoints: [intersectionPoint]
                };
            }
            return null;
        };
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
         * @result IPathIntersection object, with points(s) of intersection and angles (when a path is and arc or circle).
         */
        function pathIntersection(path1, path2) {
            var fn = map[path1.type][path2.type];
            if (fn) {
                return fn(path1, path2);
            }
            return null;
        }
        tools.pathIntersection = pathIntersection;
        function findCorrespondingAngleIndex(circleAngles, arcAngle) {
            for (var i = 0; i < circleAngles.length; i++) {
                if (circleAngles[i] === arcAngle)
                    return i;
            }
        }
        function pointFromAngleOnCircle(angleInDegrees, circle) {
            return MakerJs.point.add(circle.origin, MakerJs.point.fromPolar(MakerJs.angle.toRadians(angleInDegrees), circle.radius));
        }
        function pointsFromAnglesOnCircle(anglesInDegrees, circle) {
            var result = [];
            for (var i = 0; i < anglesInDegrees.length; i++) {
                result.push(pointFromAngleOnCircle(anglesInDegrees[i], circle));
            }
            return result;
        }
        function getAnglesWithinArc(angles, arc) {
            if (!angles)
                return null;
            var anglesWithinArc = [];
            //computed angles will not be negative, but the arc may have specified a negative angle
            var startAngle = arc.startAngle;
            var endAngle = arc.endAngle;
            for (var i = 0; i < angles.length; i++) {
                if (isBetween(angles[i], startAngle, endAngle) || isBetween(angles[i], startAngle + 360, endAngle + 360)) {
                    anglesWithinArc.push(angles[i]);
                }
            }
            if (anglesWithinArc.length == 0)
                return null;
            return anglesWithinArc;
        }
        function getSlope(line) {
            var dx = MakerJs.round(line.end[0] - line.origin[0]);
            if (dx == 0) {
                return {
                    hasSlope: false
                };
            }
            var dy = MakerJs.round(line.end[1] - line.origin[1]);
            var slope = dy / dx;
            var yIntercept = line.origin[1] - slope * line.origin[0];
            return {
                line: line,
                hasSlope: true,
                slope: slope,
                yIntercept: yIntercept
            };
        }
        function verticalIntersectionPoint(verticalLine, nonVerticalSlope) {
            var x = verticalLine.origin[0];
            var y = nonVerticalSlope.slope * x + nonVerticalSlope.yIntercept;
            return [x, y];
        }
        function isBetween(valueInQuestion, limit1, limit2) {
            return Math.min(limit1, limit2) <= valueInQuestion && valueInQuestion <= Math.max(limit1, limit2);
        }
        function isBetweenPoints(pointInQuestion, line) {
            for (var i = 2; i--;) {
                if (!isBetween(MakerJs.round(pointInQuestion[i]), MakerJs.round(line.origin[i]), MakerJs.round(line.end[i])))
                    return false;
            }
            return true;
        }
        function lineToLine(line1, line2) {
            var slope1 = getSlope(line1);
            var slope2 = getSlope(line2);
            if (!slope1.hasSlope && !slope2.hasSlope) {
                //lines are both vertical
                return null;
            }
            if (slope1.hasSlope && slope2.hasSlope && (slope1.slope == slope2.slope)) {
                //lines are parallel
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
            //we have the point of intersection of endless lines, now check to see if the point is between both segemnts
            if (isBetweenPoints(pointOfIntersection, line1) && isBetweenPoints(pointOfIntersection, line2)) {
                return pointOfIntersection;
            }
            return null;
        }
        function lineToCircle(line, circle) {
            function getLineAngle(p1, p2) {
                return MakerJs.angle.noRevolutions(MakerJs.angle.toDegrees(MakerJs.angle.fromPointToRadians(p1, p2)));
            }
            var radius = MakerJs.round(circle.radius);
            //clone the line
            var clonedLine = new MakerJs.paths.Line('clone', MakerJs.point.subtract(line.origin, circle.origin), MakerJs.point.subtract(line.end, circle.origin));
            //get angle of line
            var lineAngleNormal = getLineAngle(line.origin, line.end);
            //use the positive horizontal angle
            var lineAngle = (lineAngleNormal >= 180) ? lineAngleNormal - 360 : lineAngleNormal;
            //rotate the line to horizontal
            MakerJs.path.rotate(clonedLine, -lineAngle, MakerJs.point.zero());
            //remember how to undo the rotation we just did
            function unRotate(resultAngle) {
                var unrotated = resultAngle + lineAngle;
                return MakerJs.round(MakerJs.angle.noRevolutions(unrotated), .0001);
            }
            //line is horizontal, get the y value from any point
            var lineY = MakerJs.round(clonedLine.origin[1]);
            //if y is greater than radius, there is no intersection
            if (lineY > radius) {
                return null;
            }
            var anglesOfIntersection = [];
            //if horizontal Y is the same as the radius, we know it's 90 degrees
            if (lineY == radius) {
                anglesOfIntersection.push(unRotate(90));
            }
            else {
                function intersectionBetweenEndpoints(x, angleOfX) {
                    if (isBetween(x, clonedLine.origin[0], clonedLine.end[0])) {
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
            return anglesOfIntersection;
        }
        function circleToCircle(circle1, circle2) {
            //see if circles are the same
            if (circle1.radius == circle2.radius && MakerJs.point.areEqual(circle1.origin, circle2.origin)) {
                return null;
            }
            //get offset from origin
            var offset = MakerJs.point.subtract(MakerJs.point.zero(), circle1.origin);
            //clone circle1 and move to origin
            var c1 = new MakerJs.paths.Circle('c1', MakerJs.point.zero(), circle1.radius);
            //clone circle2 and move relative to circle1
            var c2 = new MakerJs.paths.Circle('c2', MakerJs.point.subtract(circle2.origin, circle1.origin), circle2.radius);
            //rotate circle2 to horizontal, c2 will be to the right of the origin.
            var c2Angle = MakerJs.angle.toDegrees(MakerJs.angle.fromPointToRadians(MakerJs.point.zero(), c2.origin));
            MakerJs.path.rotate(c2, -c2Angle, MakerJs.point.zero());
            function unRotate(resultAngle) {
                var unrotated = resultAngle + c2Angle;
                return MakerJs.round(MakerJs.angle.noRevolutions(unrotated), .0001);
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
            if (c2.radius - x == c1.radius) {
                return [[unRotate(180)], [unRotate(180)]];
            }
            //see if circles are tangent exterior
            if (x - c2.radius == c1.radius) {
                return [[unRotate(0)], [unRotate(180)]];
            }
            function bothAngles(oneAngle) {
                return [unRotate(oneAngle), unRotate(MakerJs.angle.mirror(oneAngle, false, true))];
            }
            var c1IntersectionAngle = tools.solveTriangleSSS(c2.radius, c1.radius, x);
            var c2IntersectionAngle = tools.solveTriangleSSS(c1.radius, x, c2.radius);
            return [bothAngles(c1IntersectionAngle), bothAngles(180 - c2IntersectionAngle)];
        }
    })(tools = MakerJs.tools || (MakerJs.tools = {}));
})(MakerJs || (MakerJs = {}));
