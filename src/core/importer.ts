namespace MakerJs.importer {

    /**
     * Create a numeric array from a string of numbers. The numbers may be delimited by anything non-numeric.
     * 
     * Example:
     * ```
     * var n = makerjs.importer.parseNumericList('5, 10, 15.20 25-30-35 4e1 .5');
     * ```
     * 
     * @param s The string of numbers.
     * @returns Array of numbers.
     */
    export function parseNumericList(s: string): number[] {
        var result: number[] = [];

        //http://stackoverflow.com/questions/638565/parsing-scientific-notation-sensibly
        var re = /[\.-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
        var matches: RegExpExecArray;

        while ((matches = re.exec(s)) !== null) {
            if (matches.index === re.lastIndex) {
                re.lastIndex++;
            }
            result.push(parseFloat(matches[0]));
        }

        return result;
    }
}
