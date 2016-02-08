var fs = require('fs');
var ver = require('../package.json').version + '.';
var dir_src = './target/js/';
var dir_dest = './archive/';
var suffix = 'maker.js';

function cp(src, dest) {
    fs.createReadStream(src).pipe(fs.createWriteStream(dest));
}

function inject(prefix) {
    var pre = prefix + '.';
    cp(dir_src + pre + suffix, dir_dest + pre + ver + suffix);    
}

inject('browser');
inject('node');
