/// <reference path="model.ts" />

module MakerJs.kit {
    //construct a model

    export interface IMetaParameter {
        title: string;
        type: string;
        min?: number;
        max?: number;
        step?: number;
        value: any;
    }

    export interface IModelConstructor {
        new (...args: any[]): IModel;
        metaParameters?: IMetaParameter[];
    }

    export function construct(ctor: IModelConstructor, args) {
        function F(): void {
            return ctor.apply(this, args);
        }
        F.prototype = ctor.prototype;
        return new F();
    }

    export function getParameterValues(ctor: IModelConstructor): any[] {
        var parameters = [];
        var metaParams = ctor.metaParameters;
        if (metaParams) {
            for (var i = 0; i < metaParams.length; i++) {
                parameters.push(metaParams[i].value);
            }
        }
        return parameters;
    }

} 
