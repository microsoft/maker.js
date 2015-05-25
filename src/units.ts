/// <reference path="maker.ts" />

module Maker.Units {

    var base = UnitType.Millimeter;

    function init() {
        addBaseConversion(UnitType.Centimeter, 10);
        addBaseConversion(UnitType.Meter, 1000);
        addBaseConversion(UnitType.Inch, 25.4);
        addBaseConversion(UnitType.Foot, 25.4 * 12);
    }

    var table: { [unitType: string]: { [unitType: string]: number }; };

    function addConversion(srcUnitType: string, destUnitType: string, value: number) {

        function row(unitType) {
            if (!table[unitType]) {
                table[unitType] = {};
            }
            return table[unitType];
        }

        row(srcUnitType)[destUnitType] = value;
        row(destUnitType)[srcUnitType] = 1 / value;
    }

    function addBaseConversion(destUnitType: string, value: number) {
        addConversion(destUnitType, base, value);
    }

    export function ConversionScale(srcUnitType: string, destUnitType: string): number {

        if (srcUnitType == destUnitType) {
            return 1;
        }

        if (!table) {
            table = {};
            init();
        }

        if (!table[srcUnitType][destUnitType]) {
            addConversion(srcUnitType, destUnitType, table[srcUnitType][base] * table[base][destUnitType]);
        }

        return table[srcUnitType][destUnitType];
    }

}
