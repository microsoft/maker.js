/// <reference path="path.ts" />

module Maker.Model {

    export interface IMakerFound<T> {
        index: number;
        item: T;
    }

    function FindById<T extends IMakerId>(arr: T[], id: string): IMakerFound<T> {
        for (var i = 0; i < arr.length; i++) {
            var item = arr[i];
            if (item.id == id) {
                return {
                    index: i,
                    item: item
                };
            }
        }
        return null;
    }

    export function FindModelById(model: IMakerModel, id: string): IMakerFound<IMakerModel> {
        if (model.models) {
            return FindById(model.models, id);
        }
        return null;
    }

    export function FindPathById(model: IMakerModel, id: string): IMakerFound<IMakerPath> {
        if (model.paths) {
            return FindById(model.paths, id);
        }
        return null;
    }

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

    export function Move(model: IMakerModel, origin: IMakerPoint): IMakerModel {
        model.origin = Point.Clone(Point.Ensure(origin));
        return model;
    }

    export function Rotate(model: IMakerModel, angle: number, rotationOrigin: IMakerPoint) {

        var offsetOrigin = Point.Subtract(rotationOrigin, model.origin);

        if (model.paths) {
            for (var i = 0; i < model.paths.length; i++) {
                Path.Rotate(model.paths[i], angle, offsetOrigin);
            }
        }

        if (model.models) {
            for (var i = 0; i < model.models.length; i++) {
                Rotate(model.models[i], angle, offsetOrigin);
            }
        }

        return model;
    }

    export function Scale(model: IMakerModel, scale: number, scaleOrigin = false) {

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
