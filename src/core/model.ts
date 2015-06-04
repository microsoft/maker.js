/// <reference path="path.ts" />

module makerjs.Model {

    /**
     * Moves all children (models and paths, recursively) within a model to their absolute position. Useful when referencing points between children.
     * 
     * @param modelToFlatten The model to flatten.
     * @param origin Optional offset reference point.
     */
    export function Flatten(modelToFlatten: IMakerModel, origin?: IMakerPoint) {
        var newOrigin = Point.Add(modelToFlatten.origin, origin);

        if (modelToFlatten.paths) {
            for (var i = 0; i < modelToFlatten.paths.length; i++) {
                Path.MoveRelative(modelToFlatten.paths[i], newOrigin);
            }
        }

        if (modelToFlatten.models) {
            for (var i = 0; i < modelToFlatten.models.length; i++) {
                Flatten(modelToFlatten.models[i], newOrigin);
            }
        }

        modelToFlatten.origin = Point.Ensure();

        return modelToFlatten;
    }

    /**
     * Create a clone of a model, mirrored on either or both x and y axes.
     * 
     * @param modelToMirror The model to mirror.
     * @param mirrorX Boolean to mirror on the x axis.
     * @param mirrorY Boolean to mirror on the y axis.
     * @returns Mirrored model.
     */
    export function Mirror(modelToMirror: IMakerModel, mirrorX: boolean, mirrorY: boolean): IMakerModel {
        var newModel: IMakerModel = {};

        if (modelToMirror.id) {
            newModel.id = modelToMirror.id + '_mirror';
        }

        if (modelToMirror.origin) {
            newModel.origin = Point.Mirror(modelToMirror.origin, mirrorX, mirrorY);
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
                newModel.paths.push(Path.Mirror(modelToMirror.paths[i], mirrorX, mirrorY));
            }
        }

        if (modelToMirror.models) {
            newModel.models = [];
            for (var i = 0; i < modelToMirror.models.length; i++) {
                newModel.models.push(Model.Mirror(modelToMirror.models[i], mirrorX, mirrorY));
            }
        }

        return newModel;
    }

    /**
     * Move a model to an absolute position. Note that this is also accomplished by directly setting the origin property. This function exists because the origin property is optional.
     * 
     * @param modelToMove The model to move.
     * @param origin The new position of the model.
     * @returns The original model (for chaining).
     */
    export function Move(modelToMove: IMakerModel, origin: IMakerPoint): IMakerModel {
        modelToMove.origin = Point.Clone(Point.Ensure(origin));
        return modelToMove;
    }

    /**
     * Rotate a model.
     * 
     * @param modelToRotate The model to rotate.
     * @param angleInDegrees The amount of rotation, in degrees.
     * @param rotationOrigin The center point of rotation.
     * @returns The original model (for chaining).
     */
    export function Rotate(modelToRotate: IMakerModel, angleInDegrees: number, rotationOrigin: IMakerPoint): IMakerModel {

        var offsetOrigin = Point.Subtract(rotationOrigin, modelToRotate.origin);

        if (modelToRotate.paths) {
            for (var i = 0; i < modelToRotate.paths.length; i++) {
                Path.Rotate(modelToRotate.paths[i], angleInDegrees, offsetOrigin);
            }
        }

        if (modelToRotate.models) {
            for (var i = 0; i < modelToRotate.models.length; i++) {
                Rotate(modelToRotate.models[i], angleInDegrees, offsetOrigin);
            }
        }

        return modelToRotate;
    }

    /**
     * Scale a model.
     * 
     * @param modelToScale The model to scale.
     * @param scale The amount of scaling.
     * @param scaleOrigin Optional boolean to scale the origin point. Typically false for the root model.
     * @returns The original model (for chaining).
     */
    export function Scale(modelToScale: IMakerModel, scale: number, scaleOrigin = false): IMakerModel {

        if (scaleOrigin && modelToScale.origin) {
            modelToScale.origin = Point.Scale(modelToScale.origin, scale);
        }

        if (modelToScale.paths) {
            for (var i = 0; i < modelToScale.paths.length; i++) {
                Path.Scale(modelToScale.paths[i], scale);
            }
        }

        if (modelToScale.models) {
            for (var i = 0; i < modelToScale.models.length; i++) {
                Scale(modelToScale.models[i], scale, true);
            }
        }

        return modelToScale;
    }

}
