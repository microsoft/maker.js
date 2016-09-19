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

        function innerOriginate(m: IModel, o: IPoint) {
            if (!m) return;

            var newOrigin = point.add(m.origin, o);

            if (m.type === models.BezierCurve.typeName) {
                path.moveRelative((m as models.BezierCurve).seed, newOrigin);
            }

            if (m.paths) {
                for (var id in m.paths) {
                    path.moveRelative(m.paths[id], newOrigin);
                }
            }

            if (m.models) {
                for (var id in m.models) {
                    innerOriginate(m.models[id], newOrigin);
                }
            }

            m.origin = point.zero();
        }

        innerOriginate(modelToOriginate, origin ? point.subtract([0, 0], origin) : [0, 0]);

        if (origin) {
            modelToOriginate.origin = origin;
        }

        return modelToOriginate;
    }

    /**
     * Center a model at [0, 0].
     * 
     * @param modelToCenter The model to center.
     */
    export function center(modelToCenter: IModel) {
        var m = measure.modelExtents(modelToCenter);
        var c = point.average(m.high, m.low);
        var o = point.subtract(modelToCenter.origin || [0, 0], c);
        modelToCenter.origin = o;
        return modelToCenter;
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

        if (!modelToMirror) return null;

        if (modelToMirror.origin) {
            newModel.origin = point.mirror(modelToMirror.origin, mirrorX, mirrorY);
        }

        if (modelToMirror.type) {
            newModel.type = modelToMirror.type;
        }

        if (modelToMirror.units) {
            newModel.units = modelToMirror.units;
        }

        if (modelToMirror.type === models.BezierCurve.typeName) {
            newModel.type = models.BezierCurve.typeName;
            (newModel as models.BezierCurve).seed = path.mirror((modelToMirror as models.BezierCurve).seed, mirrorX, mirrorY) as IPathBezierSeed;
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
                var childModelMirrored = mirror(childModelToMirror, mirrorX, mirrorY);
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
     * Prefix the ids of paths in a model.
     * 
     * @param modelToPrefix The model to prefix.
     * @param prefix The prefix to prepend on paths ids.
     * @returns The original model (for chaining).
     */
    export function prefixPathIds(modelToPrefix: IModel, prefix: string) {

        var walkedPaths: IWalkPath[] = [];

        //first collect the paths because we don't want to modify keys during an iteration on keys
        walk(modelToPrefix, {
            onPath: function (walkedPath: IWalkPath) {
                walkedPaths.push(walkedPath);
            }
        });

        //now modify the ids in our own iteration
        for (var i = 0; i < walkedPaths.length; i++) {
            var walkedPath = walkedPaths[i];
            delete walkedPath.modelContext.paths[walkedPath.pathId];
            walkedPath.modelContext.paths[prefix + walkedPath.pathId] = walkedPath.pathContext;
        }

        return modelToPrefix;
    }

    /**
     * Rotate a model.
     * 
     * @param modelToRotate The model to rotate.
     * @param angleInDegrees The amount of rotation, in degrees.
     * @param rotationOrigin The center point of rotation.
     * @returns The original model (for chaining).
     */
    export function rotate(modelToRotate: IModel, angleInDegrees: number, rotationOrigin: IPoint = [0, 0]): IModel {
        if (modelToRotate) {

            var offsetOrigin = point.subtract(rotationOrigin, modelToRotate.origin);

            if (modelToRotate.type === models.BezierCurve.typeName) {
                path.rotate((modelToRotate as models.BezierCurve).seed, angleInDegrees, offsetOrigin);
            }

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

        if (modelToScale.type === models.BezierCurve.typeName) {
            path.scale((modelToScale as models.BezierCurve).seed, scaleValue);
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

    /**
     * Recursively walk through all paths for a given model.
     * 
     * @param modelContext The model to walk.
     * @param pathCallback Callback for each path.
     * @param modelCallbackBeforeWalk Callback for each model prior to recursion, which can cancel the recursion if it returns false.
     * @param modelCallbackAfterWalk Callback for each model after recursion.
     */
    export function walk(modelContext: IModel, options: IWalkOptions) {

        if (!modelContext) return;

        function walkRecursive(modelContext: IModel, layer: string, offset: IPoint, route: string[], routeKey: string) {

            var newOffset = point.add(modelContext.origin, offset);
            layer = modelContext.layer || '';

            if (modelContext.paths) {
                for (var pathId in modelContext.paths) {

                    var pathContext = modelContext.paths[pathId];
                    if (!pathContext) continue;

                    var walkedPath: IWalkPath = {
                        modelContext: modelContext,
                        layer: pathContext.layer || layer,
                        offset: newOffset,
                        pathContext: pathContext,
                        pathId: pathId,
                        route: route.concat(['paths', pathId]),
                        routeKey: routeKey + '.paths' + JSON.stringify([pathId])
                    };

                    if (options.onPath) options.onPath(walkedPath);
                }
            }

            if (modelContext.models) {
                for (var modelId in modelContext.models) {

                    var childModel = modelContext.models[modelId];
                    if (!childModel) continue;

                    var walkedModel: IWalkModel = {
                        parentModel: modelContext,
                        layer: childModel.layer || layer,
                        offset: newOffset,
                        route: route.concat(['models', modelId]),
                        routeKey: routeKey + '.models' + JSON.stringify([modelId]),
                        childId: modelId,
                        childModel: childModel
                    };

                    if (options.beforeChildWalk) {
                        if (!options.beforeChildWalk(walkedModel)) continue;
                    }

                    walkRecursive(walkedModel.childModel, layer, newOffset, walkedModel.route, walkedModel.routeKey);

                    if (options.afterChildWalk) {
                        options.afterChildWalk(walkedModel);
                    }
                }
            }
        }

        walkRecursive(modelContext, '', [0, 0], [], '');

    }

    /**
     * Move a model so its bounding box begins at [0, 0].
     * 
     * @param modelToZero The model to zero.
     */
    export function zero(modelToZero: IModel) {
        var m = measure.modelExtents(modelToZero);
        var z = point.subtract(modelToZero.origin || [0, 0], m.low);
        modelToZero.origin = z;
        return modelToZero;
    }

}
