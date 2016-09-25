namespace MakerJsPlayground {

    interface IFontLoad {
        paramIndexes: number[];
        font?: opentypejs.Font;
    }

    interface IFontMap {
        [fontId: string]: IFontLoad;
    }

    export class FontLoader {

        private fontParameters: IFontMap = {};
        private fontRefs = 0;
        private fontsLoaded = 0;
        private paramValuesCopy: any[];

        public baseUrl = '/maker.js/fonts/';
        public successCb: (values: any[]) => void;
        public failureCb: (failedFontId: string) => void;

        constructor(private opentype: typeof opentypejs, private metaParameters: MakerJs.IMetaParameter[], private paramValues: any[]) {

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

        public static fontMatches(font: IFont, spec: string): boolean {
            if (!spec || spec === '*') return true;

            var specHashtags = spec.trim().split('#').map(s => s.trim());

            for (var i = 0; i < specHashtags.length; i++) {
                var specHashtag = specHashtags[i];
                if (font.tags.indexOf(specHashtag) >= 0) return true;
            }

            return false;
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
            this.opentype.load(this.baseUrl + fonts[fontId].path, (err, font) => {
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