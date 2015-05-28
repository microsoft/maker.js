/// <reference path="path.ts" />

module Maker.Model {

    /**
     * Moves all children (models and paths, recursively) within a model to their absolute position. Useful when referencing points between children.
     * 
     * @param model The model to flatten.
     * @param origin Optional offset reference point.
     */
    export function Flatten(model: IMakerModel, origin?: IMakerPoint) {
        var newOrigin = Point.Add(model.origin, origin);

        if (model.paths) {
            for (var i = 0; i < model.paths.length; i++) {
                Path.MoveRelative(model.paths[i], newOrigin);
            }
        }

        if (model.models) {
            for (var i = 0; i < model.models.length; i++) {
                Flatten(model.models[i], newOrigin);
            }
        }

        model.origin = Point.Ensure();

        return model;
    }

    /**
     * Create a clone of a model, mirrored on either or both x and y axes.
     * 
     * @param model The model to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @returns Mirrored model.
     */
    export function Mirror(model: IMakerModel, mirrorX: boolean, mirrorY: boolean): IMakerModel {
        var newModel: IMakerModel = {};

        if (model.id) {
            newModel.id = model.id + '_mirror';
        }

        if (model.origin) {
            newModel.origin = Point.Mirror(model.origin, mirrorX, mirrorY);
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
                newModel.paths.push(Path.Mirror(model.paths[i], mirrorX, mirrorY));
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

    /**
     * Move a model to an absolute position. Note that this is also accomplished by directly setting the origin property. This function exists because the origin property is optional.
     * 
     * @param model The model to move.
     * @param origin The new position of the model.
     * @returns The original model (for chaining).
     */
    export function Move(model: IMakerModel, origin: IMakerPoint): IMakerModel {
        model.origin = Point.Clone(Point.Ensure(origin));
        return model;
    }

    /**
     * Rotate a model.
     * 
     * @param model The model to rotate.
     * @param angleInDegrees The amount of rotation, in degrees.
     * @param rotationOrigin The center point of rotation.
     * @returns The original model (for chaining).
     */
    export function Rotate(model: IMakerModel, angleInDegrees: number, rotationOrigin: IMakerPoint): IMakerModel {

        var offsetOrigin = Point.Subtract(rotationOrigin, model.origin);

        if (model.paths) {
            for (var i = 0; i < model.paths.length; i++) {
                Path.Rotate(model.paths[i], angleInDegrees, offsetOrigin);
            }
        }

        if (model.models) {
            for (var i = 0; i < model.models.length; i++) {
                Rotate(model.models[i], angleInDegrees, offsetOrigin);
            }
        }

        return model;
    }

    /**
     * Scale a model.
     * 
     * @param model The model to scale.
     * @param scale The amount of scaling.
     * @param scaleOrigin Optional boolean to scale the origin point. Typically false for the root model.
     * @returns The original model (for chaining).
     */
    export function Scale(model: IMakerModel, scale: number, scaleOrigin = false): IMakerModel {

        if (scaleOrigin && model.origin) {
            model.origin = Point.Scale(model.origin, scale);
        }

        if (model.paths) {
            for (var i = 0; i < model.paths.length; i++) {
                Path.Scale(model.paths[i], scale);
            }
        }

        if (model.models) {
            for (var i = 0; i < model.models.length; i++) {
                Scale(model.models[i], scale, true);
            }
        }

        return model;
    }

}
