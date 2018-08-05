/// <reference path="csg.d.ts" />
/// <reference path="io.d.ts" />

declare namespace jscad {
    interface StlSerializerOptions extends io.Options {
        binary?: boolean;
    }

    interface StlSerializer {
        serialize: (CSGObject: CSG, options?: StlSerializerOptions) => string | ArrayBuffer[];
    }
}
