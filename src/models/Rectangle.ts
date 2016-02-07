module MakerJs.models {
    export class Rectangle extends ConnectTheDots {
        constructor(width: number, height: number) {
            super(true, [[0, 0], [width, 0], [width, height], [0, height]]);
        }
    }

    (<IKit>Rectangle).metaParameters = [
        { title: "width", type: "range", min: 1, max: 100, value: 50 },
        { title: "height", type: "range", min: 1, max: 100, value: 100 }
    ];
}
