module MakerJs.models {

    export class Oval extends RoundRectangle {

        constructor(width: number, height: number) {
            super(width, height, Math.min(height / 2, width / 2));
        }

    }

    (<IKit>Oval).metaParameters = [
        { title: "width", type: "range", min: 1, max: 100, value: 50 },
        { title: "height", type: "range", min: 1, max: 100, value: 100 }
    ];
}
