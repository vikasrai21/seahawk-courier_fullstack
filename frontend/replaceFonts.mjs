import fs from 'fs';
import path from 'path';

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

  // Arial / Helvetica -> Inter
  content = content.replace(/font-family:\s*['"]?Helvetica Neue['"]?,\s*Arial,\s*sans-serif/gi, "font-family: 'Inter', sans-serif");
  content = content.replace(/font-family:\s*Arial,\s*sans-serif/gi, "font-family: 'Inter', sans-serif");

  // DM Sans -> Inter
  content = content.replace(/'DM Sans'/g, "'Inter'");

  // Outfit -> Inter
  content = content.replace(/Outfit,\s*sans-serif/gi, "Inter, sans-serif");
  content = content.replace(/Outfit',\s*-apple-system,\s*sans-serif/gi, "Inter', -apple-system, sans-serif");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
  }
});
