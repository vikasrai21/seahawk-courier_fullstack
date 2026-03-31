const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

walk('./src', function(filePath) {
  if (!filePath.endsWith('.jsx') && !filePath.endsWith('.css')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace Syne specifically
  content = content.replace(/fontFamily:\s*['"]?Syne[^}]*['"]?/gi, "fontFamily: 'inherit'");
  content = content.replace(/font-family:\s*['"]?Syne[^;]*;/gi, "font-family: inherit;");
  
  // Replace var(--font-head) 
  content = content.replace(/fontFamily:\s*['"]?var\(--font-head\)['"]?/gi, "fontFamily: 'inherit'");
  content = content.replace(/font-family:\s*var\(--font-head\);/gi, "font-family: inherit;");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed Syne/head fonts:', filePath);
  }
});
