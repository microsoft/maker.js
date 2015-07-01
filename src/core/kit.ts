/// <reference path="model.ts" />

module MakerJs.kit {
    //construct a model

    /**
     * Describes a parameter and its limits.
     */
    export interface IMetaParameter {
        
        /**
         * Display text of the parameter.
         */
        title: string;

        /**
         * Type of the parameter. Currently supports "range".
         */
        type: string;

        /**
         * Optional minimum value of the range.
         */
        min?: number;

        /**
         * Optional maximum value of the range.
         */
        max?: number;

        /**
         * Optional step value between min and max.
         */
        step?: number;

        /**
         * Initial sample value for this parameter.
         */
        value: any;
    }

    /**
     * An IKit is a model-producing class with some sample parameters. Think of it as a packaged model with instructions on how to best use it.
     */
    export interface IKit {

        /**
         * The constructor. The kit must be "new-able" and it must produce an IModel.
         * It can have any number of any type of parameters.
         */
        new (...args: any[]): IModel;

        /**
         * Attached to the constructor is a property named metaParameters which is an array of IMetaParameter objects.
         * Each element of the array corresponds to a parameter of the constructor, in order.
         */
        metaParameters?: IMetaParameter[];
    }

    /**
     * Helper function to use the JavaScript "apply" function in conjunction with the "new" keyword.
     * 
     * @param ctor The constructor for the class which is an IKit.
     * @param args The array of parameters passed to the constructor.
     * @returns A new instance of the class, which implements the IModel interface.
     */
    export function construct(ctor: IKit, args): IModel {
        function F(): void {
            return ctor.apply(this, args);
        }
        F.prototype = ctor.prototype;
        return new F();
    }

    /**
     * Extract just the initial sample values from a kit.
     * 
     * @param ctor The constructor for the class which is an IKit.
     * @returns Array of the inital sample values provided in the metaParameters array.
     */
    export function getParameterValues(ctor: IKit): any[] {
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
