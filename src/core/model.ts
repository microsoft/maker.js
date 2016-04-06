namespace MakerJs.model {

    /**
     * Count the number of child models within a given model.
     * 
     * @param modelContext The model containing other models.
     * @returns Number of child models.
     */
    export function countChildModels(modelContext: IModel): number {
        var count = 0;

        if (modelContext.models) {
            for (var id in modelContext.models) {
                count++;
            }
        }

        return count;
    }

    /**
     * Get an unused id in the models map with the same prefix.
     * 
     * @param modelContext The model containing the models map.
     * @param modelId The id to use directly (if unused), or as a prefix.
     */
    export function getSimilarModelId(modelContext: IModel, modelId: string): string {
        if (!modelContext.models) return modelId;

        var i = 0;
        var newModelId = modelId;
        while (newModelId in modelContext.models) {
            i++;
            newModelId = modelId + '_' + i;
        }
        return newModelId;
    }

    /**
     * Get an unused id in the paths map with the same prefix.
     * 
     * @param modelContext The model containing the paths map.
     * @param pathId The id to use directly (if unused), or as a prefix.
     */
    export function getSimilarPathId(modelContext: IModel, pathId: string): string {
        if (!modelContext.paths) return pathId;

        var i = 0;
        var newPathId = pathId;
        while (newPathId in modelContext.paths) {
            i++;
            newPathId = pathId + '_' + i;
        }
        return newPathId;
    }

    /**
     * Moves all of a model's children (models and paths, recursively) in reference to a single common origin. Useful when points between children need to connect to each other.
     * 
     * @param modelToOriginate The model to originate.
     * @param origin Optional offset reference point.
     */
    export function originate(modelToOriginate: IModel, origin?: IPoint) {
        if (!modelToOriginate) return;

        var newOrigin = point.add(modelToOriginate.origin, origin);

        if (modelToOriginate.paths) {
            for (var id in modelToOriginate.paths) {
                path.moveRelative(modelToOriginate.paths[id], newOrigin);
            }
        }

        if (modelToOriginate.models) {
            for (var id in modelToOriginate.models) {
                originate(modelToOriginate.models[id], newOrigin);
            }
        }

        modelToOriginate.origin = point.zero();

        return modelToOriginate;
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
            newModel.paths = {};
            for (var id in modelToMirror.paths) {
                var pathToMirror = modelToMirror.paths[id];
                if (!pathToMirror) continue;
                var pathMirrored = path.mirror(pathToMirror, mirrorX, mirrorY);
                if (!pathMirrored) continue;
                newModel.paths[id] = pathMirrored;
            }
        }

        if (modelToMirror.models) {
            newModel.models = {};
            for (var id in modelToMirror.models) {
                var childModelToMirror = modelToMirror.models[id];
                if (!childModelToMirror) continue;
                var childModelMirrored = model.mirror(childModelToMirror, mirrorX, mirrorY);
                if (!childModelMirrored) continue;
                newModel.models[id] = childModelMirrored;
            }
        }

        return newModel;
    }

    /**
     * Move a model to an absolute point. Note that this is also accomplished by directly setting the origin property. This function exists for chaining.
     * 
     * @param modelToMove The model to move.
     * @param origin The new position of the model.
     * @returns The original model (for chaining).
     */
    export function move(modelToMove: IModel, origin: IPoint): IModel {
        modelToMove.origin = point.clone(origin);
        return modelToMove;
    }

    /**
     * Move a model's origin by a relative amount.
     * 
     * @param modelToMove The model to move.
     * @param delta The x & y adjustments as a point object.
     * @returns The original model (for chaining).
     */
    export function moveRelative(modelToMove: IModel, delta: IPoint): IModel {

        if (modelToMove) {
            modelToMove.origin = point.add(modelToMove.origin || point.zero(), delta);
        }

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
        if (modelToRotate) {

            var offsetOrigin = point.subtract(rotationOrigin, modelToRotate.origin);

            if (modelToRotate.paths) {
                for (var id in modelToRotate.paths) {
                    path.rotate(modelToRotate.paths[id], angleInDegrees, offsetOrigin);
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
            for (var id in modelToScale.paths) {
                path.scale(modelToScale.paths[id], scaleValue);
            }
        }

        if (modelToScale.models) {
            for (var id in modelToScale.models) {
                scale(modelToScale.models[id], scaleValue, true);
            }
        }

        return modelToScale;
    }

    /**
     * Convert a model to match a different unit system.
     * 
     * @param modeltoConvert The model to convert.
     * @param destUnitType The unit system.
     * @returns The scaled model (for chaining).
     */
    export function convertUnits(modeltoConvert: IModel, destUnitType: string): IModel {

        var validUnitType = false;

        for (var id in unitType) {
            if (unitType[id] == destUnitType) {
                validUnitType = true;
                break;
            }
        }

        if (modeltoConvert.units && validUnitType) {
            var ratio = units.conversionScale(modeltoConvert.units, destUnitType);

            if (ratio != 1) {
                scale(modeltoConvert, ratio);

                //update the model with its new unit type
                modeltoConvert.units = destUnitType;
            }
        }

        return modeltoConvert;
    }

    /**
     * Recursively walk through all paths for a given model.
     * 
     * @param modelContext The model to walk.
     * @param callback Callback for each path.
     */
    export function walkPaths(modelContext: IModel, callback: IModelPathCallback) {

        if (modelContext.paths) {
            for (var pathId in modelContext.paths) {
                if (!modelContext.paths[pathId]) continue;
                callback(modelContext, pathId, modelContext.paths[pathId]);
            }
        }

        if (modelContext.models) {
            for (var id in modelContext.models) {
                if (!modelContext.models[id]) continue;
                walkPaths(modelContext.models[id], callback);
            }
        }
    }

}
