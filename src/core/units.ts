namespace MakerJs.units {

    /**
     * The base type is arbitrary. Other conversions are then based off of this.
     * @private
     */
    var base = unitType.Millimeter;

    /**
     * Initialize all known conversions here.
     * @private
     */
    function init() {
        addBaseConversion(unitType.Centimeter, 10);
        addBaseConversion(unitType.Meter, 1000);
        addBaseConversion(unitType.Inch, 25.4);
        addBaseConversion(unitType.Foot, 25.4 * 12);
    }

    /**
     * Table of conversions. Lazy load upon first conversion.
     * @private
     */
    var table: { [unitType: string]: { [unitType: string]: number }; };

    /**
     * Add a conversion, and its inversion.
     * @private
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
     * @private
     */
    function addBaseConversion(destUnitType: string, value: number) {
        addConversion(destUnitType, base, value);
    }

    /**
     * Get a conversion ratio between a source unit and a destination unit. 
     * 
     * @param srcUnitType unitType converting from.
     * @param destUnitType unitType converting to.
     * @returns Numeric ratio of the conversion.
     */
    export function conversionScale(srcUnitType: string, destUnitType: string): number {

        if (srcUnitType == destUnitType) {
            return 1;
        }

        //This will lazy load the table with initial conversions.
        if (!table) {
            table = {};
            init();
        }

        //look for a cached conversion in the table.
        if (!table[srcUnitType][destUnitType]) {

            //create a new conversionsand cache it in the table.
            addConversion(srcUnitType, destUnitType, table[srcUnitType][base] * table[base][destUnitType]);
        }

        return table[srcUnitType] && table[srcUnitType][destUnitType];
    }

    /**
     * Check to see if unit type is a valid Maker.js unit. 
     * 
     * @param tryUnit unit type to check.
     * @returns Boolean true if unit type is valid.
     */
    export function isValidUnit(tryUnit: string) {
        for (let id in unitType) {
            if (unitType[id] == tryUnit) {
                return true;
            }
        }
        return false;
    }
}
