var StringReader = /** @class */ (function () {
    function StringReader(complete) {
        this.complete = complete;
        this.data = [];
    }
    StringReader.prototype.addListener = function (event, listener) {
        return this;
    };
    StringReader.prototype.off = function (event, listener) {
        return this;
    };
    ;
    StringReader.prototype.on = function (event, listener) {
        return this;
    };
    StringReader.prototype.once = function (event, listener) {
        return this;
    };
    StringReader.prototype.eventNames = function () {
        return [];
    };
    StringReader.prototype.prependListener = function () {
        return this;
    };
    StringReader.prototype.prependOnceListener = function () {
        return this;
    };
    StringReader.prototype.rawListeners = function (event) {
        return [];
    };
    StringReader.prototype.removeListener = function (event, listener) {
        return this;
    };
    StringReader.prototype.removeAllListeners = function (event) {
        return this;
    };
    StringReader.prototype.getMaxListeners = function () {
        return 1;
    };
    StringReader.prototype.setMaxListeners = function (n) {
        return this;
    };
    StringReader.prototype.listeners = function (event) {
        return [];
    };
    StringReader.prototype.listenerCount = function (type) {
        return 1;
    };
    StringReader.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return true;
    };
    StringReader.prototype.write = function () {
        var any = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            any[_i] = arguments[_i];
        }
        var string = new TextDecoder("utf-8").decode(arguments[0]);
        this.data.push(string);
        return true;
    };
    StringReader.prototype.end = function () {
        this.complete(this.data.join(''));
    };
    return StringReader;
}());
//# sourceMappingURL=string-reader.js.map