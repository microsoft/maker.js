/// <reference path="path.ts" />

module Maker.model {

    /**
     * Moves all children (models and paths, recursively) within a model to their absolute position. Useful when referencing points between children.
     * 
     * @param modelToFlatten The model to flatten.
     * @param origin Optional offset reference point.
     */
    export function flatten(modelToFlatten: IModel, origin?: IPoint) {
        var newOrigin = point.add(modelToFlatten.origin, origin);

        if (modelToFlatten.paths) {
            for (var i = 0; i < modelToFlatten.paths.length; i++) {
                path.moveRelative(modelToFlatten.paths[i], newOrigin);
            }
        }

        if (modelToFlatten.models) {
            for (var i = 0; i < modelToFlatten.models.length; i++) {
                flatten(modelToFlatten.models[i], newOrigin);
            }
        }

        modelToFlatten.origin = point.zero();

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
    export function mirror(modelToMirror: IModel, mirrorX: boolean, mirrorY: boolean): IModel {
        var newModel: IModel = {};

        if (modelToMirror.id) {
            newModel.id = modelToMirror.id + '_mirror';
        }

        if (modelToMirror.origin) {
            newModel.origin = point.mirror(modelToMirror.origin, mirrorX, mirrorY);
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
                newModel.paths.push(path.mirror(modelToMirror.paths[i], mirrorX, mirrorY));
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

    export function move(modelToMove: IModel, origin: IPoint): IModel;
    export function move(modelToMove: IModel, origin: number[]): IModel;

    /**
     * Move a model to an absolute position. Note that this is also accomplished by directly setting the origin property. This function exists because the origin property is optional.
     * 
     * @param modelToMove The model to move.
     * @param origin The new position of the model.
     * @returns The original model (for chaining).
     */
    export function move(modelToMove: IModel, origin: any): IModel {
        modelToMove.origin = point.clone(point.ensure(origin));
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
    export function rotate(modelToRotate: IModel, angleInDegrees: number, rotationOrigin: IPoint): IModel {

        var offsetOrigin = point.subtract(rotationOrigin, modelToRotate.origin);

        if (modelToRotate.paths) {
            for (var i = 0; i < modelToRotate.paths.length; i++) {
                path.rotate(modelToRotate.paths[i], angleInDegrees, offsetOrigin);
            }
        }

        if (modelToRotate.models) {
            for (var i = 0; i < modelToRotate.models.length; i++) {
                rotate(modelToRotate.models[i], angleInDegrees, offsetOrigin);
            }
        }

        return modelToRotate;
    }

    /**
     * Scale a model.
     * 
     * @param modelToScale The model to scale.
     * @param scaleValue The amount of scaling.
     * @param scaleOrigin Optional boolean to scale the origin point. Typically false for the root model.
     * @returns The original model (for chaining).
     */
    export function scale(modelToScale: IModel, scaleValue: number, scaleOrigin = false): IModel {

        if (scaleOrigin && modelToScale.origin) {
            modelToScale.origin = point.scale(modelToScale.origin, scaleValue);
        }

        if (modelToScale.paths) {
            for (var i = 0; i < modelToScale.paths.length; i++) {
                path.scale(modelToScale.paths[i], scaleValue);
            }
        }

        if (modelToScale.models) {
            for (var i = 0; i < modelToScale.models.length; i++) {
                scale(modelToScale.models[i], scaleValue, true);
            }
        }

        return modelToScale;
    }

}
