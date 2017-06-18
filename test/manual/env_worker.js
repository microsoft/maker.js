importScripts('../target/js/browser.maker.js?' + new Date().valueOf());
var makerjs = require('makerjs');
postMessage(makerjs.environment);
