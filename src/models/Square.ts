module MakerJs.models {
    export class Square extends Rectangle {
        constructor(side: number) {
            super(side, side);
        }
    }

    (<IKit>Square).metaParameters = [
        { title: "side", type: "range", min: 1, max: 100, value: 100 }
    ];
}
