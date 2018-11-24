namespace MakerJs.dimensions {

    export class Size {
        constructor(
            public arrowSize = 5,
            public arrowSpanAngle = 45,
            public accuracy = .001,
            public textOffset = 10,
            public entensionLength = 10,
            public extensionAnchor = 0.5
        ) { }

        public static fromArgs(args: number[]) {
            const size = {} as Size;
            const sizeArgs = args.splice(0, (<IKit>Size).metaParameters.length);
            Size.apply(size, sizeArgs);
            return size;
        }
    }

    (<IKit>Size).metaParameters = [
        { title: "arrow size", type: "range", min: 1, max: 25, value: 5 },
        { title: "arrow span angle", type: "range", min: 5, max: 135, value: 45 },
        {
            title: "accuracy", type: "select", value: [
                0.0001, 0.001, 0.01, 0.1, 1.0
            ]
        },
        { title: "text offset", type: "range", min: 0, max: 50, value: 10 },
        { title: "extension length", type: "range", min: 1, max: 50, value: 10 },
        { title: "extension anchor", type: "range", min: 0, max: 1, value: 0.5, step: 0.1 }
    ];
}
