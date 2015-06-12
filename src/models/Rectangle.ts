/// <reference path="connectthedots.ts" />

module MakerJs.models {
    export class Rectangle extends ConnectTheDots {
        constructor(public width: number, public height: number) {
            super(true, [[0, 0], [width, 0], [width, height], [0, height]]);
        }
    }
} 