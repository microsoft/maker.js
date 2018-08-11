const fs = require('fs');
const utf8 = 'utf8';

//copy main readme here for publishing
var readme = fs.readFileSync('../../README.md', utf8);
fs.writeFileSync('./README.md', readme, utf8);
