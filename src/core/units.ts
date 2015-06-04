/// <reference path="maker.ts" />

module makerjs.units {

    /**
     * The base type is arbitrary. Other conversions are then based off of this.
     */
    var base = unitType.Centimeter;

    /**
     * Initialize all known conversions here.
     */
    function init() {
        addBaseConversion(unitType.Millimeter, 0.1);
        addBaseConversion(unitType.Meter, 100);
        addBaseConversion(unitType.Inch, 2.54);
        addBaseConversion(unitType.Foot, 2.54 * 12);
    }

    /**
     * Table of conversions. Lazy load upon first conversion.
     */
    var table: { [unitType: string]: { [unitType: string]: number }; };

    /**
     * Add a conversion, and its inversion.
     */
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

    /**
     * Add a conversion of the base unit.
     */
    function addBaseConversion(destUnitType: string, value: number) {
        addConversion(destUnitType, base, value);
    }

    /**
     * Get a conversion ratio between a source unit and a destination unit. This will lazy load the table with initial conversions, 
     * then new cross-conversions will be cached in the table.
     * 
     * @param srcUnitType UnitType converting from.
     * @param destUnitType UnitType converting to.
     * @returns Numeric ratio of the conversion.
     */
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
