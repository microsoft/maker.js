var MakerJsPlayground;
(function (MakerJsPlayground) {
    var FontLoader = (function () {
        function FontLoader(opentype, metaParameters, paramValues) {
            var _this = this;
            this.opentype = opentype;
            this.metaParameters = metaParameters;
            this.paramValues = paramValues;
            this.fontParameters = {};
            this.fontRefs = 0;
            this.fontsLoaded = 0;
            this.baseUrl = '/maker.js/fonts/';
            if (metaParameters) {
                metaParameters.forEach(function (metaParameter, i) {
                    if (metaParameter.type !== 'font')
                        return;
                    //TODO use match
                    _this.fontRefs++;
                    var id = paramValues[i];
                    if (id in _this.fontParameters) {
                        _this.fontParameters[id].paramIndexes.push(i);
                    }
                    else {
                        _this.fontParameters[id] = { paramIndexes: [i] };
                    }
                });
            }
        }
        FontLoader.fontMatches = function (font, spec) {
            if (!spec || spec === '*')
                return true;
            var specHashtags = spec.trim().split('#').map(function (s) { return s.trim(); });
            for (var i = 0; i < specHashtags.length; i++) {
                var specHashtag = specHashtags[i];
                if (font.tags.indexOf(specHashtag) >= 0)
                    return true;
            }
            return false;
        };
        FontLoader.prototype.findFirstFontIdMatching = function (spec) {
            for (var fontId in fonts) {
                var font = fonts[fontId];
                if (FontLoader.fontMatches(font, spec))
                    return fontId;
            }
            return null;
        };
        FontLoader.prototype.getParamValuesWithFontSpec = function () {
            var _this = this;
            if (this.fontRefs === 0) {
                return this.paramValues;
            }
            else {
                this.paramValuesCopy = this.paramValues.slice(0);
                for (var spec in this.fontParameters) {
                    var firstFont = this.findFirstFontIdMatching(spec);
                    //substitute font ids with fonts
                    this.fontParameters[spec].paramIndexes.forEach(function (index) { return _this.paramValuesCopy[index] = firstFont; });
                }
                return this.paramValuesCopy;
            }
        };
        FontLoader.prototype.load = function () {
            if (this.fontRefs === 0) {
                this.successCb(this.paramValues);
            }
            else {
                this.paramValuesCopy = this.paramValues.slice(0);
                for (var fontId in this.fontParameters) {
                    this.loadFont(fontId);
                }
            }
        };
        FontLoader.prototype.loaded = function () {
            this.fontsLoaded++;
            if (this.fontsLoaded === this.fontRefs) {
                this.successCb(this.paramValuesCopy);
            }
        };
        FontLoader.prototype.loadFont = function (fontId) {
            var _this = this;
            //load a font asynchronously
            this.opentype.load(this.baseUrl + fonts[fontId].path, function (err, font) {
                if (err) {
                    _this.failureCb(fontId);
                }
                else {
                    //substitute font ids with fonts
                    _this.fontParameters[fontId].font = font;
                    _this.fontParameters[fontId].paramIndexes.forEach(function (index) { return _this.paramValuesCopy[index] = font; });
                    _this.loaded();
                }
            });
        };
        return FontLoader;
    }());
    MakerJsPlayground.FontLoader = FontLoader;
})(MakerJsPlayground || (MakerJsPlayground = {}));
//# sourceMappingURL=fontloader.js.map