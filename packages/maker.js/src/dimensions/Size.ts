namespace MakerJs.dimensions {

    export class Size {
        constructor(
            public arrowSize = 5,
            public arrowSpanAngle = 45,
            public textSize = 9,
            public textOffset = 5,
            public entensionLength = 10,
            public extensionAnchor = 0.5
        ) { }

        public static fromArgs(args: number[]) {
            const size = {} as Size;
            const sizeArgs = args.splice(0, 6);
            Size.apply(size, sizeArgs);
            return size;
        }
    }

    (<IKit>Size).metaParameters = [
        { title: "arrow size", type: "range", min: 1, max: 25, value: 5 },
        { title: "arrow span angle", type: "range", min: 5, max: 135, value: 45 },
        { title: "text size", type: "range", min: 1, max: 50, value: 9 },
        { title: "text offset", type: "range", min: 0, max: 50, value: 5 },
        { title: "extension length", type: "range", min: 1, max: 50, value: 10 },
        { title: "extension anchor", type: "range", min: 0, max: 1, value: 0.5, step: 0.1 }
    ];
}
