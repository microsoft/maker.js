var fs = require('fs')

var header = fs.readFileSync('./target/tsd-header.txt', 'utf8');
var versionedHeader = header.replace(/#VERSION#/, require('../package.json').version);
var content = fs.readFileSync('./target/maker.d.ts', 'utf8');

process.stdout.write(versionedHeader + content);
