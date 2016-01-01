var makerjs = require('./../target/js/node.maker.js');
var smile = require('./smile.js');
var m = require('./m.js');

function dependExample() {

    var m1 = makerjs.model.scale(new m(1.5, 0.7, .46, .65, .3, .65, .5, .2, .2), 3);

    var smile1 = new smile(45, .3, .8, 2, .4, .8);
    smile1.origin = [3, 7.5];

    this.models = {
        m1: m1,
        smile1: smile1
    };

    this.units = makerjs.unitType.Inch;
}

module.exports = dependExample;

console.log('dependExample is running!');
console.log(makerjs.exporter.toSVG(new dependExample()));

/*to make this run from node, use this command line (from the root of your git):
node ./examples/dependExample_forNode.js
*/

/*to make this run in the browser, use this command line (from the root of your git):
browserify -r ./examples/dependExample_forNode.js:dependExample --exclude ../target/js/node.maker.js > ./examples/dependExample_forBrowser.js
*/