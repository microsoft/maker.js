namespace MakerJs.kit {
    //construct a model

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
                var value = metaParams[i].value;
                if (Array.isArray(value)) {
                    value = value[0];
                }
                parameters.push(value);
            }
        }
        return parameters;
    }

} 
