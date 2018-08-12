const fs = require('fs');
const utf8 = 'utf8';

function copyFromRoot(filename) {
    var content = fs.readFileSync(`../../${filename}`, utf8);
    fs.writeFileSync(`./${filename}`, content, utf8);
}

//copy files from root to this folder for publishing
copyFromRoot('LICENSE');
copyFromRoot('README.md');
