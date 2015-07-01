var fs = require('fs');
var browserify = require('browserify');
var pjson = require('../package.json');

var prefix = 'makerjs-';
var prefixLen = prefix.length;

function demoify(name) {
	var filename = './demos/' + name + '.js';
	console.log('writing ' + filename);	
	var b = browserify();
	b.exclude('makerjs');
	b.require(prefix + name, { expose: name});
	b.bundle().pipe(fs.createWriteStream(filename));
}

for (var key in pjson.dependencies) {
	if (key.indexOf(prefix) == 0) {
		var name = key.substring(prefixLen);
		demoify(name);
	}
}
