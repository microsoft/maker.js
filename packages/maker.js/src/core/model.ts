namespace MakerJs.model {

    /**
     * Add a Caption object to a model.
     * @param modelContext The model to add to.
     * @param text Text to add.
     * @param leftAnchorPoint Optional Point on left side middle of text.
     * @param rightAnchorPoint Optional Point on right side middle of text.
     * @returns The original model (for cascading).
     */
    export function addCaption(modelContext: IModel, text: string, leftAnchorPoint?: IPoint, rightAnchorPoint?: IPoint) {
        if (!leftAnchorPoint) {
            leftAnchorPoint = point.zero();
        }
        if (!rightAnchorPoint) {
            rightAnchorPoint = point.clone(leftAnchorPoint);
        }
        modelContext.caption = { text, anchor: new paths.Line(leftAnchorPoint, rightAnchorPoint) };
        return modelContext;
    }

    /**
     * Add a path as a child. This is basically equivalent to:
     * ```
     * parentModel.paths[childPathId] = childPath;
     * ```
     * with additional checks to make it safe for cascading.
     *
     * @param modelContext The model to add to.
     * @param pathContext The path to add.
     * @param pathId The id of the path.
     * @param overWrite Optional flag to overwrite any path referenced by pathId. Default is false, which will create an id similar to pathId.
     * @returns The original model (for cascading).
     */
    export function addPath(modelContext: IModel, pathContext: IPath, pathId: string, overWrite = false): IModel {
        var id = overWrite ? pathId : getSimilarPathId(modelContext, pathId);
        modelContext.paths = modelContext.paths || {};
        modelContext.paths[id] = pathContext;
        return modelContext;
    }

    /**
     * Add a model as a child. This is basically equivalent to:
     * ```
     * parentModel.models[childModelId] = childModel;
     * ```
     * with additional checks to make it safe for cascading.
     *
     * @param parentModel The model to add to.
     * @param childModel The model to add.
     * @param childModelId The id of the child model.
     * @param overWrite Optional flag to overwrite any model referenced by childModelId. Default is false, which will create an id similar to childModelId.
     * @returns The original model (for cascading).
     */
    export function addModel(parentModel: IModel, childModel: IModel, childModelId: string, overWrite = false): IModel {
        var id = overWrite ? childModelId : getSimilarModelId(parentModel, childModelId);
        parentModel.models = parentModel.models || {};
        parentModel.models[id] = childModel;
        return parentModel;
    }

    /**
     * Add a model as a child of another model. This is basically equivalent to:
     * ```
     * parentModel.models[childModelId] = childModel;
     * ```
     * with additional checks to make it safe for cascading.
     *
     * @param childModel The model to add.
     * @param parentModel The model to add to.
     * @param childModelId The id of the child model.
     * @param overWrite Optional flag to overwrite any model referenced by childModelId. Default is false, which will create an id similar to childModelId.
     * @returns The original model (for cascading).
     */
    export function addTo(childModel: IModel, parentModel: IModel, childModelId: string, overWrite = false): IModel {
        addModel(parentModel, childModel, childModelId, overWrite);
        return childModel;
    }

    /**
     * Clone a model. Alias of makerjs.cloneObject(modelToClone)
     *
     * @param modelToClone The model to clone.
     * @returns A clone of the model you passed.
     */
    export function clone(modelToClone: IModel): IModel {
        return cloneObject(modelToClone);
    }

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
     * Gets all Caption objects, in absolute position, in this model and its children.
     * @param modelContext The model to search for Caption objects.
     * @returns Array of Caption objects.
     */
    export function getAllCaptionsOffset(modelContext: IModel) {
        const captions: (ICaption & { layer?: string })[] = [];

        function tryAddCaption(m: IModel, offset: IPoint, layer: string) {
            if (m.caption) {
                captions.push({ text: m.caption.text, anchor: path.clone(m.caption.anchor, offset) as IPathLine, layer: (m.caption.anchor.layer || layer) });
            }
        }

        tryAddCaption(modelContext, modelContext.origin, modelContext.layer);
        model.walk(modelContext, {
            afterChildWalk: wm => tryAddCaption(wm.childModel, wm.offset, wm.layer)
        });

        return captions;
    }

    /**
     * @private
     */
    function getSimilarId(map: { [id: string]: any }, id: string): string {
        if (!map) return id;
        var i = 0;
        var newId = id;
        while (newId in map) {
            i++;
            newId = [id, i].join('_');
        }
        return newId;
    }

    /**
     * Get an unused id in the models map with the same prefix.
     *
     * @param modelContext The model containing the models map.
     * @param modelId The id to use directly (if unused), or as a prefix.
     */
    export function getSimilarModelId(modelContext: IModel, modelId: string): string {
        return getSimilarId(modelContext.models, modelId);
    }

    /**
     * Get an unused id in the paths map with the same prefix.
     *
     * @param modelContext The model containing the paths map.
     * @param pathId The id to use directly (if unused), or as a prefix.
     */
    export function getSimilarPathId(modelContext: IModel, pathId: string): string {
        return getSimilarId(modelContext.paths, pathId);
    }

    /**
     * Set the layer of a model. This is equivalent to:
     * ```
     * modelContext.layer = layer;
     * ```
     *
     * @param modelContext The model to set the layer.
     * @param layer The layer name.
     * @returns The original model (for cascading).
     */
    export function layer(modelContext: IModel, layer: string): IModel {
        modelContext.layer = layer;
        return modelContext;
    }

    /**
     * Moves all of a model's children (models and paths, recursively) in reference to a single common origin. Useful when points between children need to connect to each other.
     *
     * @param modelToOriginate The model to originate.
     * @param origin Optional offset reference point.
     * @returns The original model (for cascading).
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

            if (m.caption) {
                path.moveRelative(m.caption.anchor, newOrigin);
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
     * @param centerX Boolean to center on the x axis. Default is true.
     * @param centerY Boolean to center on the y axis. Default is true.
     * @returns The original model (for cascading).
     */
    export function center(modelToCenter: IModel, centerX = true, centerY = true) {
        var m = measure.modelExtents(modelToCenter);
        var o = modelToCenter.origin || [0, 0];
        if (centerX) o[0] -= m.center[0];
        if (centerY) o[1] -= m.center[1];
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

        if ('layer' in modelToMirror) {
            newModel.layer = modelToMirror.layer;
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

        if (modelToMirror.caption) {
            newModel.caption = cloneObject(modelToMirror.caption);
            newModel.caption.anchor = path.mirror(modelToMirror.caption.anchor, mirrorX, mirrorY) as IPathLine;
        }

        return newModel;
    }

    /**
     * Move a model to an absolute point. Note that this is also accomplished by directly setting the origin property. This function exists for cascading.
     *
     * @param modelToMove The model to move.
     * @param origin The new position of the model.
     * @returns The original model (for cascading).
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
     * @returns The original model (for cascading).
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
     * @returns The original model (for cascading).
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
     * @returns The original model (for cascading).
     */
    export function rotate(modelToRotate: IModel, angleInDegrees: number, rotationOrigin: IPoint = [0, 0]): IModel {
        if (!modelToRotate || !angleInDegrees) return modelToRotate;

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

        if (modelToRotate.caption) {
            path.rotate(modelToRotate.caption.anchor, angleInDegrees, offsetOrigin);
        }

        return modelToRotate;
    }

    /**
     * Scale a model.
     *
     * @param modelToScale The model to scale.
     * @param scaleValue The amount of scaling.
     * @param scaleOrigin Optional boolean to scale the origin point. Typically false for the root model.
     * @returns The original model (for cascading).
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

        if (modelToScale.caption) {
            path.scale(modelToScale.caption.anchor, scaleValue);
        }

        return modelToScale;
    }

    /**
     * @private
     */
    function addDistortedPath(parentModel: IModel, pathToDistort: IPath, pathId: string, layer: string, scaleX: number, scaleY: number, bezierAccuracy?: number) {
        const distortedPath = path.distort(pathToDistort, scaleX, scaleY);
        layer = layer || pathToDistort.layer;
        if (layer) {
            distortedPath.layer = layer;
        }
        if (isPath(distortedPath)) {
            if (distortedPath.type === pathType.BezierSeed) {
                const curve = new models.BezierCurve(distortedPath as IPathBezierSeed, bezierAccuracy);
                addModel(parentModel, curve, pathId);
            } else {
                addPath(parentModel, distortedPath as IPath, pathId);
            }
        } else {
            addModel(parentModel, distortedPath as IModel, pathId);
        }
    }

    /**
     * Create a distorted copy of a model - scale x and y individually.
     *
     * @param modelToDistort The model to distort.
     * @param scaleX The amount of x scaling.
     * @param scaleY The amount of y scaling.
     * @param scaleOrigin Optional boolean to scale the origin point. Typically false for the root model.
     * @param bezierAccuracy Optional accuracy of Bezier curves.
     * @returns New model (for cascading).
     */
    export function distort(modelToDistort: IModel, scaleX: number, scaleY: number, scaleOrigin = false, bezierAccuracy?: number) {
        const distorted: IModel = {};
        if (modelToDistort.layer) {
            distorted.layer = modelToDistort.layer;
        }

        if (scaleOrigin && modelToDistort.origin) {
            distorted.origin = point.distort(modelToDistort.origin, scaleX, scaleY);
        }

        if (modelToDistort.type === models.BezierCurve.typeName) {
            const b = modelToDistort as models.BezierCurve;
            const bezierPartsByLayer = models.BezierCurve.getBezierSeeds(b, { byLayers: true });
            for (let layer in bezierPartsByLayer) {
                let pathArray = bezierPartsByLayer[layer]
                pathArray.forEach((p, i) => {
                    addDistortedPath(distorted, p, i.toString(), layer, scaleX, scaleY, bezierAccuracy);
                })
            }
        } else if (modelToDistort.paths) {
            for (let pathId in modelToDistort.paths) {
                let pathToDistort = modelToDistort.paths[pathId];
                addDistortedPath(distorted, pathToDistort, pathId, null, scaleX, scaleY, bezierAccuracy);
            }
        }

        if (modelToDistort.models) {
            for (let childId in modelToDistort.models) {
                let childModel = modelToDistort.models[childId];
                let distortedChild = distort(childModel, scaleX, scaleY, true, bezierAccuracy);
                addModel(distorted, distortedChild, childId);
            }
        }

        if (modelToDistort.caption) {
            distorted.caption = cloneObject(modelToDistort.caption);
            distorted.caption.anchor = path.distort(modelToDistort.caption.anchor, scaleX, scaleY) as IPathLine;
        }

        return distorted;
    }

    /**
     * Convert a model to match a different unit system.
     *
     * @param modeltoConvert The model to convert.
     * @param destUnitType The unit system.
     * @returns The scaled model (for cascading).
     */
    export function convertUnits(modeltoConvert: IModel, destUnitType: string): IModel {

        if (modeltoConvert.units && units.isValidUnit(modeltoConvert.units) && units.isValidUnit(destUnitType)) {
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
     * DEPRECATED - use model.walk instead.
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
     * Recursively walk through all child models and paths for a given model.
     *
     * @param modelContext The model to walk.
     * @param options Object containing callbacks.
     * @returns The original model (for cascading).
     */
    export function walk(modelContext: IModel, options: IWalkOptions) {

        if (!modelContext) return;

        function walkRecursive(modelContext: IModel, layer: string, offset: IPoint, route: string[], routeKey: string) {

            var newOffset = point.add(modelContext.origin, offset);
            layer = (layer != undefined) ? layer : '';

            if (modelContext.paths) {
                for (var pathId in modelContext.paths) {

                    var pathContext = modelContext.paths[pathId];
                    if (!pathContext) continue;

                    var walkedPath: IWalkPath = {
                        modelContext: modelContext,
                        layer: (pathContext.layer != undefined) ? pathContext.layer : layer,
                        offset: newOffset,
                        pathContext: pathContext,
                        pathId: pathId,
                        route: route.concat(['paths', pathId]),
                        routeKey: routeKey + (routeKey ? '.' : '') + 'paths' + JSON.stringify([pathId])
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
                        layer: (childModel.layer != undefined) ? childModel.layer : layer,
                        offset: newOffset,
                        route: route.concat(['models', modelId]),
                        routeKey: routeKey + (routeKey ? '.' : '') + 'models' + JSON.stringify([modelId]),
                        childId: modelId,
                        childModel: childModel
                    };

                    if (options.beforeChildWalk) {
                        if (!options.beforeChildWalk(walkedModel)) continue;
                    }

                    walkRecursive(walkedModel.childModel, walkedModel.layer, newOffset, walkedModel.route, walkedModel.routeKey);

                    if (options.afterChildWalk) {
                        options.afterChildWalk(walkedModel);
                    }
                }
            }
        }

        walkRecursive(modelContext, modelContext.layer, [0, 0], [], '');

        return modelContext;
    }

    /**
     * Move a model so its bounding box begins at [0, 0].
     *
     * @param modelToZero The model to zero.
     * @param zeroX Boolean to zero on the x axis. Default is true.
     * @param zeroY Boolean to zero on the y axis. Default is true.
     * @returns The original model (for cascading).
     */
    export function zero(modelToZero: IModel, zeroX = true, zeroY = true) {
        var m = measure.modelExtents(modelToZero);
        var z = modelToZero.origin || [0, 0];
        if (zeroX) z[0] -= m.low[0];
        if (zeroY) z[1] -= m.low[1];
        modelToZero.origin = z;
        return modelToZero;
    }

}
