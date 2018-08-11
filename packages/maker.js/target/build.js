const browserify = require('browserify');
const fs = require('fs');
const utf8 = 'utf8';

//add versioned header to top of declaration file
const dts = './dist/index.d.ts';
var tsdHeader = fs.readFileSync('./target/tsd-header.txt', utf8);
var versionedHeader = tsdHeader.replace(/#VERSION#/, require('../package.json').version);
var content = fs.readFileSync(dts, utf8);
fs.writeFileSync(dts, versionedHeader + content, utf8);

//add version code to bottom of js file
const js = './dist/index.js';
fs.appendFileSync(js, 'MakerJs.version = "' + require('../package.json').version + '";\n');

//browserify
const b = browserify();
b.plugin('licensify');
b.ignore('buffer');
b.require(js, { expose: 'makerjs' });
b.bundle(function (err, buf) {
    const header = fs.readFileSync('./target/header.txt', utf8);
    const browserCode = header + buf.toString(utf8);
    fs.writeFileSync('./dist/browser.maker.js', browserCode, utf8);

    //also copy to web
    fs.writeFileSync('../../docs/target/js/browser.maker.js', browserCode, utf8);

    //append header to node version
    const nodeCode = header + fs.readFileSync(js, utf8);
    const nodeFooter = fs.readFileSync('./target/node-requires.js', utf8);
    fs.writeFileSync(js, nodeCode + nodeFooter, utf8);
});
