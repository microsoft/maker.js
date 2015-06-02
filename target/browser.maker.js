require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"@danmarshall/privatetestmaker":[function(require,module,exports){
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
     * Unit conversion function is Maker.Units.ConversionScale().
     * Important: If you add to this, you must also add a corresponding conversion ratio in the unit.ts file!
     */
    Maker.UnitType = {
        Centimeter: 'cm',
        Foot: 'foot',
        Inch: 'inch',
        Meter: 'm',
        Millimeter: 'mm'
    };
    /**
     * Copy the properties from one object to another object.
     *
     * @param target The object to extend. It will receive the new properties.
     * @param other An object containing properties to merge in.
     * @returns The original object after merging.
     */
    function ExtendObject(target, other) {
        if (other) {
            for (var key in other) {
                if (typeof other[key] !== 'undefined') {
                    target[key] = other[key];
                }
            }
        }
        return target;
    }
    Maker.ExtendObject = ExtendObject;
    /**
     * Search within an array to find an item by its id property.
     *
     * @param arr Array to search.
     * @param id Id of the item to find.
     * @returns object with item and its position.
     */
    function FindById(arr, id) {
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
    Maker.FindById = FindById;
    /**
     * Test to see if an object implements the required properties of a point.
     *
     * @param item The item to test.
     */
    function IsPoint(item) {
        return item && ('x' in item) && ('y' in item); //values might be zero so use "in"
    }
    Maker.IsPoint = IsPoint;
    /**
     * Test to see if an object implements the required properties of a path.
     *
     * @param item The item to test.
     */
    function IsPath(item) {
        return item && item.type && item.origin;
    }
    Maker.IsPath = IsPath;
    /**
     * String-based enumeration of all paths types.
     */
    Maker.PathType = {
        Line: "line",
        Circle: "circle",
        Arc: "arc"
    };
    /**
     * Test to see if an object implements the required properties of a model.
     */
    function IsModel(item) {
        return item && (item.paths || item.models);
    }
    Maker.IsModel = IsModel;
})(Maker || (Maker = {}));
//CommonJs
var module = module || {};
module.exports = Maker;
/// <reference path="maker.ts" />
var Maker;
(function (Maker) {
    var Angle;
    (function (Angle) {
        /**
         * Convert an angle from degrees to radians.
         *
         * @param angleInDegrees Angle in degrees.
         * @returns Angle in radians.
         */
        function ToRadians(angleInDegrees) {
            if (angleInDegrees == 360) {
                return 0;
            }
            return angleInDegrees * Math.PI / 180.0;
        }
        Angle.ToRadians = ToRadians;
        /**
         * Convert an angle from radians to degrees.
         *
         * @param angleInRadians Angle in radians.
         * @returns Angle in degrees.
         */
        function FromRadians(angleInRadians) {
            return angleInRadians * 180.0 / Math.PI;
        }
        Angle.FromRadians = FromRadians;
        /**
         * Gets an arc's end angle, ensured to be greater than its start angle.
         *
         * @param arc An arc path object.
         * @returns End angle of arc.
         */
        function ArcEndAnglePastZero(arc) {
            //compensate for values past zero. This allows easy compute of total angle size.
            //for example 0 = 360
            if (arc.endAngle < arc.startAngle) {
                return 360 + arc.endAngle;
            }
            return arc.endAngle;
        }
        Angle.ArcEndAnglePastZero = ArcEndAnglePastZero;
        /**
         * Angle of a line through a point.
         *
         * @param point The point to find the angle.
         * @param origin (Optional 0,0 implied) point of origin of the angle.
         * @returns Angle of the line throught the point.
         */
        function FromPointToRadians(point, origin) {
            var d = Maker.Point.Subtract(point, origin);
            return Math.atan2(d.y, d.x);
        }
        Angle.FromPointToRadians = FromPointToRadians;
        /**
         * Mirror an angle on either or both x and y axes.
         *
         * @param angleInDegrees The angle to mirror.
         * @param mirrorX Boolean to mirror on the x axis.
         * @param mirrorY Boolean to mirror on the y axis.
         * @returns Mirrored angle.
         */
        function Mirror(angleInDegrees, mirrorX, mirrorY) {
            if (mirrorY) {
                angleInDegrees = 360 - angleInDegrees;
            }
            if (mirrorX) {
                angleInDegrees = (angleInDegrees < 180 ? 180 : 540) - angleInDegrees;
            }
            return angleInDegrees;
        }
        Angle.Mirror = Mirror;
    })(Angle = Maker.Angle || (Maker.Angle = {}));
})(Maker || (Maker = {}));
/// <reference path="maker.ts" />
var Maker;
(function (Maker) {
    var Point;
    (function (Point) {
        function Add(a, b, subtract) {
            if (subtract === void 0) { subtract = false; }
            var p1 = Clone(Ensure(a));
            var p2 = Ensure(b);
            if (subtract) {
                p1.x -= p2.x;
                p1.y -= p2.y;
            }
            else {
                p1.x += p2.x;
                p1.y += p2.y;
            }
            return p1;
        }
        Point.Add = Add;
        /**
         * Clone a point into a new point.
         *
         * @param point The point to clone.
         * @returns A new point with same values as the original.
         */
        function Clone(point) {
            return { x: point.x, y: point.y };
        }
        Point.Clone = Clone;
        function Ensure(item) {
            if (!item) {
                return Zero();
            }
            if (Maker.IsPoint(item)) {
                return item;
            }
            if (Array.isArray(item) && item.length > 1) {
                return { x: item[0], y: item[1] };
            }
            if (arguments.length > 1) {
                return { x: arguments[0], y: arguments[0] };
            }
            return Zero();
        }
        Point.Ensure = Ensure;
        /**
         * Get a point from its polar coordinates.
         *
         * @param angleInRadians The angle of the polar coordinate, in radians.
         * @param radius The radius of the polar coordinate.
         * @returns A new point object.
         */
        function FromPolar(angleInRadians, radius) {
            return {
                x: radius * Math.cos(angleInRadians),
                y: radius * Math.sin(angleInRadians)
            };
        }
        Point.FromPolar = FromPolar;
        /**
         * Get the two end points of an arc path.
         *
         * @param arc The arc path object.
         * @returns Array with 2 elements: [0] is the point object corresponding to the start angle, [1] is the point object corresponding to the end angle.
         */
        function FromArc(arc) {
            function getPointFromAngle(angle) {
                return Add(arc.origin, FromPolar(Maker.Angle.ToRadians(angle), arc.radius));
            }
            return [getPointFromAngle(arc.startAngle), getPointFromAngle(arc.endAngle)];
        }
        Point.FromArc = FromArc;
        /**
         * Create a clone of a point, mirrored on either or both x and y axes.
         *
         * @param point The point to mirror.
         * @param mirrorX Boolean to mirror on the x axis.
         * @param mirrorY Boolean to mirror on the y axis.
         * @returns Mirrored point.
         */
        function Mirror(point, mirrorX, mirrorY) {
            var p = Clone(Ensure(point));
            if (mirrorX) {
                p.x = -p.x;
            }
            if (mirrorY) {
                p.y = -p.y;
            }
            return p;
        }
        Point.Mirror = Mirror;
        /**
         * Rotate a point.
         *
         * @param point The point to rotate.
         * @param angleInDegrees The amount of rotation, in degrees.
         * @param rotationOrigin The center point of rotation.
         * @returns A new point.
         */
        function Rotate(point, angleInDegrees, rotationOrigin) {
            var pointAngleInRadians = Maker.Angle.FromPointToRadians(point, rotationOrigin);
            var d = Maker.Measure.PointDistance(rotationOrigin, point);
            var rotatedPoint = FromPolar(pointAngleInRadians + Maker.Angle.ToRadians(angleInDegrees), d);
            return Add(rotationOrigin, rotatedPoint);
        }
        Point.Rotate = Rotate;
        /**
         * Scale a point's coordinates.
         *
         * @param point The point to scale.
         * @param scale The amount of scaling.
         * @returns A new point.
         */
        function Scale(point, scale) {
            var p = Clone(Ensure(point));
            p.x *= scale;
            p.y *= scale;
            return p;
        }
        Point.Scale = Scale;
        function Subtract(a, b) {
            return Add(a, b, true);
        }
        Point.Subtract = Subtract;
        /**
         * A point at 0,0 coordinates.
         *
         * @returns A new point.
         */
        function Zero() {
            return { x: 0, y: 0 };
        }
        Point.Zero = Zero;
    })(Point = Maker.Point || (Maker.Point = {}));
})(Maker || (Maker = {}));
/// <reference path="point.ts" />
var Maker;
(function (Maker) {
    var Path;
    (function (Path) {
        function CreateArc(id, origin, radius, startAngle, endAngle) {
            var arc = {
                type: Maker.PathType.Arc,
                id: id,
                origin: Maker.Point.Ensure(origin),
                radius: radius,
                startAngle: startAngle,
                endAngle: endAngle
            };
            return arc;
        }
        Path.CreateArc = CreateArc;
        function CreateCircle(id, origin, radius) {
            var circle = {
                type: Maker.PathType.Circle,
                id: id,
                origin: Maker.Point.Ensure(origin),
                radius: radius
            };
            return circle;
        }
        Path.CreateCircle = CreateCircle;
        function CreateLine(id, origin, end) {
            var line = {
                type: Maker.PathType.Line,
                id: id,
                origin: Maker.Point.Ensure(origin),
                end: Maker.Point.Ensure(end)
            };
            return line;
        }
        Path.CreateLine = CreateLine;
        /**
         * Create a clone of a path, mirrored on either or both x and y axes.
         *
         * @param path The path to mirror.
         * @param mirrorX Boolean to mirror on the x axis.
         * @param mirrorY Boolean to mirror on the y axis.
         * @param newId Optional id to assign to the new path.
         * @returns Mirrored path.
         */
        function Mirror(path, mirrorX, mirrorY, newId) {
            var newPath = null;
            var origin = Maker.Point.Mirror(path.origin, mirrorX, mirrorY);
            var map = {};
            map[Maker.PathType.Line] = function (line) {
                newPath = Path.CreateLine(newId || line.id, origin, Maker.Point.Mirror(line.end, mirrorX, mirrorY));
            };
            map[Maker.PathType.Circle] = function (circle) {
                newPath = Path.CreateCircle(newId || circle.id, origin, circle.radius);
            };
            map[Maker.PathType.Arc] = function (arc) {
                var startAngle = Maker.Angle.Mirror(arc.startAngle, mirrorX, mirrorY);
                var endAngle = Maker.Angle.Mirror(Maker.Angle.ArcEndAnglePastZero(arc), mirrorX, mirrorY);
                var xor = mirrorX != mirrorY;
                newPath = Path.CreateArc(newId || arc.id, origin, arc.radius, xor ? endAngle : startAngle, xor ? startAngle : endAngle);
            };
            var fn = map[path.type];
            if (fn) {
                fn(path);
            }
            return newPath;
        }
        Path.Mirror = Mirror;
        function MoveRelative(path, adjust) {
            var map = {};
            map[Maker.PathType.Line] = function (line) {
                line.end = Maker.Point.Add(line.end, adjust);
            };
            path.origin = Maker.Point.Add(path.origin, adjust);
            var fn = map[path.type];
            if (fn) {
                fn(path);
            }
            return path;
        }
        Path.MoveRelative = MoveRelative;
        /**
         * Rotate a path.
         *
         * @param path The path to rotate.
         * @param angleInDegrees The amount of rotation, in degrees.
         * @param rotationOrigin The center point of rotation.
         * @returns The original path (for chaining).
         */
        function Rotate(path, angleInDegrees, rotationOrigin) {
            if (angleInDegrees == 0)
                return path;
            var map = {};
            map[Maker.PathType.Line] = function (line) {
                line.end = Maker.Point.Rotate(line.end, angleInDegrees, rotationOrigin);
            };
            map[Maker.PathType.Arc] = function (arc) {
                arc.startAngle += angleInDegrees;
                arc.endAngle += angleInDegrees;
            };
            path.origin = Maker.Point.Rotate(path.origin, angleInDegrees, rotationOrigin);
            var fn = map[path.type];
            if (fn) {
                fn(path);
            }
            return path;
        }
        Path.Rotate = Rotate;
        /**
         * Scale a path.
         *
         * @param path The path to scale.
         * @param scale The amount of scaling.
         * @returns The original path (for chaining).
         */
        function Scale(path, scale) {
            if (scale == 1)
                return path;
            var map = {};
            map[Maker.PathType.Line] = function (line) {
                line.end = Maker.Point.Scale(line.end, scale);
            };
            map[Maker.PathType.Circle] = function (circle) {
                circle.radius *= scale;
            };
            map[Maker.PathType.Arc] = map[Maker.PathType.Circle];
            path.origin = Maker.Point.Scale(path.origin, scale);
            var fn = map[path.type];
            if (fn) {
                fn(path);
            }
            return path;
        }
        Path.Scale = Scale;
    })(Path = Maker.Path || (Maker.Path = {}));
})(Maker || (Maker = {}));
/// <reference path="path.ts" />
var Maker;
(function (Maker) {
    var Model;
    (function (Model) {
        /**
         * Moves all children (models and paths, recursively) within a model to their absolute position. Useful when referencing points between children.
         *
         * @param model The model to flatten.
         * @param origin Optional offset reference point.
         */
        function Flatten(model, origin) {
            var newOrigin = Maker.Point.Add(model.origin, origin);
            if (model.paths) {
                for (var i = 0; i < model.paths.length; i++) {
                    Maker.Path.MoveRelative(model.paths[i], newOrigin);
                }
            }
            if (model.models) {
                for (var i = 0; i < model.models.length; i++) {
                    Flatten(model.models[i], newOrigin);
                }
            }
            model.origin = Maker.Point.Ensure();
            return model;
        }
        Model.Flatten = Flatten;
        /**
         * Create a clone of a model, mirrored on either or both x and y axes.
         *
         * @param model The model to mirror.
         * @param mirrorX Boolean to mirror on the x axis.
         * @param mirrorY Boolean to mirror on the y axis.
         * @returns Mirrored model.
         */
        function Mirror(model, mirrorX, mirrorY) {
            var newModel = {};
            if (model.id) {
                newModel.id = model.id + '_mirror';
            }
            if (model.origin) {
                newModel.origin = Maker.Point.Mirror(model.origin, mirrorX, mirrorY);
            }
            if (model.type) {
                newModel.type = model.type;
            }
            if (model.units) {
                newModel.units = model.units;
            }
            if (model.paths) {
                newModel.paths = [];
                for (var i = 0; i < model.paths.length; i++) {
                    newModel.paths.push(Maker.Path.Mirror(model.paths[i], mirrorX, mirrorY));
                }
            }
            if (model.models) {
                newModel.models = [];
                for (var i = 0; i < model.models.length; i++) {
                    newModel.models.push(Model.Mirror(model.models[i], mirrorX, mirrorY));
                }
            }
            return newModel;
        }
        Model.Mirror = Mirror;
        /**
         * Move a model to an absolute position. Note that this is also accomplished by directly setting the origin property. This function exists because the origin property is optional.
         *
         * @param model The model to move.
         * @param origin The new position of the model.
         * @returns The original model (for chaining).
         */
        function Move(model, origin) {
            model.origin = Maker.Point.Clone(Maker.Point.Ensure(origin));
            return model;
        }
        Model.Move = Move;
        /**
         * Rotate a model.
         *
         * @param model The model to rotate.
         * @param angleInDegrees The amount of rotation, in degrees.
         * @param rotationOrigin The center point of rotation.
         * @returns The original model (for chaining).
         */
        function Rotate(model, angleInDegrees, rotationOrigin) {
            var offsetOrigin = Maker.Point.Subtract(rotationOrigin, model.origin);
            if (model.paths) {
                for (var i = 0; i < model.paths.length; i++) {
                    Maker.Path.Rotate(model.paths[i], angleInDegrees, offsetOrigin);
                }
            }
            if (model.models) {
                for (var i = 0; i < model.models.length; i++) {
                    Rotate(model.models[i], angleInDegrees, offsetOrigin);
                }
            }
            return model;
        }
        Model.Rotate = Rotate;
        /**
         * Scale a model.
         *
         * @param model The model to scale.
         * @param scale The amount of scaling.
         * @param scaleOrigin Optional boolean to scale the origin point. Typically false for the root model.
         * @returns The original model (for chaining).
         */
        function Scale(model, scale, scaleOrigin) {
            if (scaleOrigin === void 0) { scaleOrigin = false; }
            if (scaleOrigin && model.origin) {
                model.origin = Maker.Point.Scale(model.origin, scale);
            }
            if (model.paths) {
                for (var i = 0; i < model.paths.length; i++) {
                    Maker.Path.Scale(model.paths[i], scale);
                }
            }
            if (model.models) {
                for (var i = 0; i < model.models.length; i++) {
                    Scale(model.models[i], scale, true);
                }
            }
            return model;
        }
        Model.Scale = Scale;
    })(Model = Maker.Model || (Maker.Model = {}));
})(Maker || (Maker = {}));
/// <reference path="maker.ts" />
var Maker;
(function (Maker) {
    var Units;
    (function (Units) {
        /**
         * The base type is arbitrary. Other conversions are then based off of this.
         */
        var base = Maker.UnitType.Centimeter;
        /**
         * Initialize all known conversions here.
         */
        function init() {
            addBaseConversion(Maker.UnitType.Millimeter, 0.1);
            addBaseConversion(Maker.UnitType.Meter, 100);
            addBaseConversion(Maker.UnitType.Inch, 2.54);
            addBaseConversion(Maker.UnitType.Foot, 2.54 * 12);
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
         * @param srcUnitType UnitType converting from.
         * @param destUnitType UnitType converting to.
         * @returns Numeric ratio of the conversion.
         */
        function ConversionScale(srcUnitType, destUnitType) {
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
        Units.ConversionScale = ConversionScale;
    })(Units = Maker.Units || (Maker.Units = {}));
})(Maker || (Maker = {}));
/// <reference path="model.ts" />
var Maker;
(function (Maker) {
    var Measure;
    (function (Measure) {
        /**
         * Total angle of an arc between its start and end angles.
         *
         * @param arc The arc to measure.
         * @returns Angle of arc.
         */
        function ArcAngle(arc) {
            var endAngle = Maker.Angle.ArcEndAnglePastZero(arc);
            return endAngle - arc.startAngle;
        }
        Measure.ArcAngle = ArcAngle;
        /**
         * Calculates the distance between two points.
         *
         * @param a First point.
         * @param b Second point.
         * @returns Distance between points.
         */
        function PointDistance(a, b) {
            var dx = b.x - a.x;
            var dy = b.y - a.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
        Measure.PointDistance = PointDistance;
        function extremePoint(a, b, fn) {
            return {
                x: fn(a.x, b.x),
                y: fn(a.y, b.y)
            };
        }
        /**
         * Calculates the smallest rectangle which contains a path.
         *
         * @param path The path to measure.
         * @returns object with low and high points.
         */
        function PathExtents(path) {
            var map = {};
            var measurement = { low: null, high: null };
            map[Maker.PathType.Line] = function (line) {
                measurement.low = extremePoint(line.origin, line.end, Math.min);
                measurement.high = extremePoint(line.origin, line.end, Math.max);
            };
            map[Maker.PathType.Circle] = function (circle) {
                var r = circle.radius;
                measurement.low = Maker.Point.Add(circle.origin, { x: -r, y: -r });
                measurement.high = Maker.Point.Add(circle.origin, { x: r, y: r });
            };
            map[Maker.PathType.Arc] = function (arc) {
                var r = arc.radius;
                var startPoint = Maker.Point.FromPolar(Maker.Angle.ToRadians(arc.startAngle), r);
                var endPoint = Maker.Point.FromPolar(Maker.Angle.ToRadians(arc.endAngle), r);
                var startAngle = arc.startAngle;
                var endAngle = Maker.Angle.ArcEndAnglePastZero(arc);
                if (startAngle < 0) {
                    startAngle += 360;
                    endAngle += 360;
                }
                function extremeAngle(xAngle, yAngle, value, fn) {
                    var point = extremePoint(startPoint, endPoint, fn);
                    if (startAngle < xAngle && xAngle < endAngle) {
                        point.x = value;
                    }
                    if (startAngle < yAngle && yAngle < endAngle) {
                        point.y = value;
                    }
                    return Maker.Point.Add(arc.origin, point);
                }
                measurement.low = extremeAngle(180, 270, -r, Math.min);
                measurement.high = extremeAngle(360, 90, r, Math.max);
            };
            var fn = map[path.type];
            if (fn) {
                fn(path);
            }
            return measurement;
        }
        Measure.PathExtents = PathExtents;
        /**
         * Measures the length of a path.
         *
         * @param path The path to measure.
         * @returns Length of the path.
         */
        function PathLength(path) {
            var map = {};
            var value = 0;
            map[Maker.PathType.Line] = function (line) {
                value = PointDistance(line.origin, line.end);
            };
            map[Maker.PathType.Circle] = function (circle) {
                value = 2 * Math.PI * circle.radius;
            };
            map[Maker.PathType.Arc] = function (arc) {
                map[Maker.PathType.Circle](arc); //this sets the value var
                var pct = ArcAngle(arc) / 360;
                value *= pct;
            };
            var fn = map[path.type];
            if (fn) {
                fn(path);
            }
            return value;
        }
        Measure.PathLength = PathLength;
        /**
         * Measures the smallest rectangle which contains a model.
         *
         * @param model The model to measure.
         * @returns object with low and high points.
         */
        function ModelExtents(model) {
            var totalMeasurement = { low: { x: null, y: null }, high: { x: null, y: null } };
            function lowerOrHigher(offsetOrigin, pathMeasurement) {
                function getExtreme(a, b, fn) {
                    var c = Maker.Point.Add(b, offsetOrigin);
                    a.x = (a.x == null ? c.x : fn(a.x, c.x));
                    a.y = (a.y == null ? c.y : fn(a.y, c.y));
                }
                getExtreme(totalMeasurement.low, pathMeasurement.low, Math.min);
                getExtreme(totalMeasurement.high, pathMeasurement.high, Math.max);
            }
            function measure(model, offsetOrigin) {
                var newOrigin = Maker.Point.Add(model.origin, offsetOrigin);
                if (model.paths) {
                    for (var i = 0; i < model.paths.length; i++) {
                        lowerOrHigher(newOrigin, PathExtents(model.paths[i]));
                    }
                }
                if (model.models) {
                    for (var i = 0; i < model.models.length; i++) {
                        measure(model.models[i], newOrigin);
                    }
                }
            }
            measure(model);
            return totalMeasurement;
        }
        Measure.ModelExtents = ModelExtents;
    })(Measure = Maker.Measure || (Maker.Measure = {}));
})(Maker || (Maker = {}));
/// <reference path="model.ts" />
/// <reference path="units.ts" />
/// <reference path="measure.ts" />
var Maker;
(function (Maker) {
    var Exports;
    (function (Exports) {
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
             * @param path The path to export.
             * @param offset The offset position of the path.
             */
            Exporter.prototype.exportPath = function (path, offset) {
                var fn = this.map[path.type];
                if (fn) {
                    fn(this.fixPath ? this.fixPath(path, offset) : path, offset);
                }
            };
            /**
             * Export a model.
             *
             * @param model The model to export.
             * @param offset The offset position of the model.
             */
            Exporter.prototype.exportModel = function (model, offset) {
                var newOffset = Maker.Point.Add((this.fixPoint ? this.fixPoint(model.origin) : model.origin), offset);
                if (model.paths) {
                    for (var i = 0; i < model.paths.length; i++) {
                        this.exportPath(model.paths[i], newOffset);
                    }
                }
                if (model.models) {
                    for (var i = 0; i < model.models.length; i++) {
                        this.exportModel(model.models[i], newOffset);
                    }
                }
            };
            /**
             * Export an object.
             *
             * @param item The object to export. May be a path, an array of paths, a model, or an array of models.
             * @param offset The offset position of the object.
             */
            Exporter.prototype.exportItem = function (item, origin) {
                if (Maker.IsModel(item)) {
                    this.exportModel(item, origin);
                }
                else if (Array.isArray(item)) {
                    var items = item;
                    for (var i = 0; i < items.length; i++) {
                        this.exportItem(items[i], origin);
                    }
                }
                else if (Maker.IsPath(item)) {
                    this.exportPath(item, origin);
                }
            };
            return Exporter;
        })();
        Exports.Exporter = Exporter;
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
            XmlTag.EscapeString = function (value) {
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
            XmlTag.prototype.ToString = function () {
                var attrs = '';
                for (var name in this.attrs) {
                    var value = this.attrs[name];
                    if (typeof value == 'string') {
                        value = XmlTag.EscapeString(value);
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
                        closeTag += XmlTag.EscapeString(this.innerText);
                    }
                    closeTag += '</' + this.name + '>';
                }
                return '<' + this.name + attrs + closeTag;
            };
            return XmlTag;
        })();
        Exports.XmlTag = XmlTag;
    })(Exports = Maker.Exports || (Maker.Exports = {}));
})(Maker || (Maker = {}));
/// <reference path="exports.ts" />
var Maker;
(function (Maker) {
    var Exports;
    (function (Exports) {
        /**
         * Renders an item in AutoDesk DFX file format.
         *
         * @param itemToExport Item to render: may be a path, an array of paths, or a model object.
         * @param options Rendering options object.
         * @param options.units String from Maker.UnitType enumeration.
         * @returns String of DXF content.
         */
        function DXF(itemToExport, options) {
            //DXF format documentation:
            //http://images.autodesk.com/adsk/files/acad_dxf0.pdf
            var opts = {
                units: Maker.UnitType.Millimeter
            };
            Maker.ExtendObject(opts, options);
            var dxf = [];
            function append(value) {
                dxf.push(value);
            }
            var map = {};
            map[Maker.PathType.Line] = function (line, origin) {
                append("0");
                append("LINE");
                append("8");
                append(line.id);
                append("10");
                append(line.origin.x + origin.x);
                append("20");
                append(line.origin.y + origin.y);
                append("11");
                append(line.end.x + origin.x);
                append("21");
                append(line.end.y + origin.y);
            };
            map[Maker.PathType.Circle] = function (circle, origin) {
                append("0");
                append("CIRCLE");
                append("8");
                append(circle.id);
                append("10");
                append(circle.origin.x + origin.x);
                append("20");
                append(circle.origin.y + origin.y);
                append("40");
                append(circle.radius);
            };
            map[Maker.PathType.Arc] = function (arc, origin) {
                append("0");
                append("ARC");
                append("8");
                append(arc.id);
                append("10");
                append(arc.origin.x + origin.x);
                append("20");
                append(arc.origin.y + origin.y);
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
                append("2");
                append("HEADER");
                append("9");
                append("$INSUNITS");
                append("70");
                append(dxfUnit[opts.units]);
            }
            function entities() {
                append("2");
                append("ENTITIES");
                var exporter = new Exports.Exporter(map);
                exporter.exportItem(itemToExport, Maker.Point.Zero());
            }
            //begin dxf output
            section(header);
            section(entities);
            append("0");
            append("EOF");
            return dxf.join('\n');
        }
        Exports.DXF = DXF;
        //DXF format documentation:
        //http://images.autodesk.com/adsk/files/acad_dxf0.pdf
        //Default drawing units for AutoCAD DesignCenter blocks:
        //0 = Unitless; 1 = Inches; 2 = Feet; 3 = Miles; 4 = Millimeters; 5 = Centimeters; 6 = Meters; 7 = Kilometers; 8 = Microinches;
        var dxfUnit = {};
        dxfUnit[''] = 0;
        dxfUnit[Maker.UnitType.Inch] = 1;
        dxfUnit[Maker.UnitType.Foot] = 2;
        dxfUnit[Maker.UnitType.Millimeter] = 4;
        dxfUnit[Maker.UnitType.Centimeter] = 5;
        dxfUnit[Maker.UnitType.Meter] = 6;
    })(Exports = Maker.Exports || (Maker.Exports = {}));
})(Maker || (Maker = {}));
/// <reference path="exports.ts" />
var Maker;
(function (Maker) {
    var Exports;
    (function (Exports) {
        /**
         * Renders an item in SVG markup.
         *
         * @param itemToExport Item to render: may be a path, an array of paths, or a model object.
         * @param options Rendering options object.
         * @param options.annotate Boolean to indicate that the id's of paths should be rendered as SVG text elements.
         * @param options.scale Number to scale the SVG rendering.
         * @param options.stroke String color of the rendered paths.
         * @param options.strokeWidth Number width of the rendered paths.
         * @param options.origin Point object for the rendered reference origin.
         * @param options.useSvgPathOnly Boolean to use SVG path elements instead of line, circle etc.
         * @returns String of XML / SVG content.
         */
        function SVG(itemToExport, options) {
            var opts = {
                annotate: false,
                scale: 1,
                stroke: "blue",
                strokeWidth: 2,
                origin: Maker.Point.Zero(),
                useSvgPathOnly: false
            };
            Maker.ExtendObject(opts, options);
            var elements = [];
            function fixPoint(point) {
                //in DXF Y increases upward. in SVG, Y increases downward
                var mirrorY = Maker.Point.Mirror(point, false, true);
                return Maker.Point.Scale(mirrorY, opts.scale);
            }
            function fixPath(path, origin) {
                //mirror creates a copy, so we don't modify the original
                var mirrorY = Maker.Path.Mirror(path, false, true);
                return Maker.Path.MoveRelative(Maker.Path.Scale(mirrorY, opts.scale), origin);
            }
            function createElement(tagname, attrs, innerText, useStroke) {
                if (innerText === void 0) { innerText = null; }
                if (useStroke === void 0) { useStroke = true; }
                var tag = new Exports.XmlTag(tagname, attrs);
                if (innerText) {
                    tag.innerText = innerText;
                }
                if (useStroke) {
                    tag.attrs["fill"] = "none";
                    tag.attrs["stroke"] = opts.stroke;
                    tag.attrs["stroke-width"] = opts.strokeWidth;
                }
                elements.push(tag.ToString());
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
                    "d": ["M", x, y].concat(d).join(" ")
                });
                if (opts.annotate) {
                    drawText(id, x, y);
                }
            }
            var map = {};
            map[Maker.PathType.Line] = function (line, origin) {
                var start = line.origin;
                var end = line.end;
                if (opts.useSvgPathOnly) {
                    drawPath(line.id, start.x, start.y, [end.x, end.y]);
                }
                else {
                    createElement("line", {
                        "id": line.id,
                        "x1": start.x,
                        "y1": start.y,
                        "x2": end.x,
                        "y2": end.y
                    });
                }
                if (opts.annotate) {
                    drawText(line.id, (start.x + end.x) / 2, (start.y + end.y) / 2);
                }
            };
            map[Maker.PathType.Circle] = function (circle, origin) {
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
                    drawPath(circle.id, center.x, center.y, d);
                }
                else {
                    createElement("circle", {
                        "id": circle.id,
                        "r": circle.radius,
                        "cx": center.x,
                        "cy": center.y
                    });
                }
                if (opts.annotate) {
                    drawText(circle.id, center.x, center.y);
                }
            };
            function svgArcData(d, radius, endPoint, largeArc, decreasing) {
                var end = Maker.Point.Ensure(endPoint);
                d.push(radius, radius);
                d.push(0); //0 = x-axis rotation
                d.push(largeArc ? 1 : 0); //large arc=1, small arc=0
                d.push(decreasing ? 0 : 1); //sweep-flag 0=decreasing, 1=increasing 
                d.push(end.x, end.y);
            }
            map[Maker.PathType.Arc] = function (arc, origin) {
                var arcPoints = Maker.Point.FromArc(arc);
                var d = ['A'];
                svgArcData(d, arc.radius, arcPoints[1], Math.abs(arc.endAngle - arc.startAngle) > 180, arc.startAngle > arc.endAngle);
                drawPath(arc.id, arcPoints[0].x, arcPoints[0].y, d);
            };
            var exporter = new Exports.Exporter(map, fixPoint, fixPath);
            exporter.exportItem(itemToExport, opts.origin);
            var svgTag = new Exports.XmlTag('svg');
            svgTag.innerText = elements.join('');
            svgTag.innerTextEscaped = true;
            return svgTag.ToString();
        }
        Exports.SVG = SVG;
    })(Exports = Maker.Exports || (Maker.Exports = {}));
})(Maker || (Maker = {}));

},{}]},{},[]);
