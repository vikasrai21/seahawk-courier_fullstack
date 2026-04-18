const fs = require('fs');
let content = fs.readFileSync('build-error.log', 'utf8');
console.log(content.substring(0, 3000));
