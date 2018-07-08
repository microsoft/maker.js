namespace MakerJsPlayground {

    interface IFontLoad {
        paramIndexes: number[];
        font?: opentype.Font;
    }

    interface IFontMap {
        [fontId: string]: IFontLoad;
    }

    export class FontLoader {

        private fontParameters: IFontMap = {};
        private fontRefs = 0;
        private fontsLoaded = 0;
        private paramValuesCopy: any[];

        public successCb: (values: any[]) => void;
        public failureCb: (failedFontId: string) => void;

        constructor(public baseUrl: string, private opentypeLib: typeof opentype, private metaParameters: MakerJs.IMetaParameter[], private paramValues: any[]) {

            if (metaParameters) {
                metaParameters.forEach((metaParameter, i) => {
                    if (metaParameter.type !== 'font') return;

                    //TODO use match

                    this.fontRefs++;

                    var id = paramValues[i];

                    if (id in this.fontParameters) {
                        this.fontParameters[id].paramIndexes.push(i);
                    } else {
                        this.fontParameters[id] = { paramIndexes: [i] };
                    }
                });
            }

        }

        private static getConstraints(spec: string) {
            const specs = spec.split(' ');
            const add: string[] = [];
            const remove: string[] = [];

            specs.forEach(s => {
                if (!s) return;
                if (s[0] === '!') {
                    remove.push(s.substring(2));
                } else if (s === '*') {
                    add.push(s);
                } else {
                    add.push(s.substring(1));
                }
            });

            return { add, remove };
        }

        private static hasTags(font: IFont, tags: string[]) {
            for (var i = 0; i < tags.length; i++) {
                if (tags[i] === '*') return true;
                if (font.tags.indexOf(tags[i]) >= 0) return true;
            }
        }

        public static fontMatches(font: IFont, spec: string): boolean {
            const constraints = FontLoader.getConstraints(spec);
            if (FontLoader.hasTags(font, constraints.remove)) return false;
            return FontLoader.hasTags(font, constraints.add);
        }

        private findFirstFontIdMatching(spec: string) {
            for (var fontId in fonts) {
                var font = fonts[fontId];
                if (FontLoader.fontMatches(font, spec)) return fontId;
            }
            return null;
        }

        public getParamValuesWithFontSpec() {

            if (this.fontRefs === 0) {
                return this.paramValues;
            } else {

                this.paramValuesCopy = this.paramValues.slice(0);

                for (var spec in this.fontParameters) {
                    var firstFont = this.findFirstFontIdMatching(spec);

                    //substitute font ids with fonts
                    this.fontParameters[spec].paramIndexes.forEach(index => this.paramValuesCopy[index] = firstFont);
                }

                return this.paramValuesCopy;
            }
        }

        public load() {

            if (this.fontRefs === 0) {
                this.successCb(this.paramValues);
            } else {

                this.paramValuesCopy = this.paramValues.slice(0);

                for (var fontId in this.fontParameters) {
                    this.loadFont(fontId);
                }
            }
        }

        private loaded() {
            this.fontsLoaded++;
            if (this.fontsLoaded === this.fontRefs) {
                this.successCb(this.paramValuesCopy);
            }
        }

        private loadFont(fontId: string) {

            //load a font asynchronously
            this.opentypeLib.load(this.baseUrl + fonts[fontId].path, (err, font) => {
                if (err) {
                    this.failureCb(fontId);
                } else {

                    //substitute font ids with fonts
                    this.fontParameters[fontId].font = font;
                    this.fontParameters[fontId].paramIndexes.forEach(index => this.paramValuesCopy[index] = font);
                    this.loaded();
                }
            });
        }

    }
}