var fs = require('fs');

fs.appendFileSync('./target/maker.js', 'MakerJs.version = "' + require('../package.json').version + '";\n');
