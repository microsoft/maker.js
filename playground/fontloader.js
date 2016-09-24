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
        FontLoader.prototype.load = function () {
            if (this.fontRefs === 0) {
                this.successCb(this.paramValues);
            }
            else {
                this.paramValuesCopy = this.paramValues.slice(0);
                for (var id in this.fontParameters) {
                    this.loadFont(id);
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