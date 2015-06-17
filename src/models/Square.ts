/// <reference path="rectangle.ts" />

module MakerJs.models {
    export class Square extends Rectangle {
        constructor(public id: string, side: number) {
            super(id, side, side);
        }
    }
} 