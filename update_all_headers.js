const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'frontend/src/pages/client');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let newContent = content;

  // Match the entire ClientPortalPageIntro component
  const introRegex = /<ClientPortalPageIntro\s+([\s\S]*?)\/>/g;
  let match;
  
  // Need to process one by one to use the captured props
  let hasReplaced = false;
  let currentContent = newContent;
  
  while ((match = introRegex.exec(currentContent)) !== null) {
    hasReplaced = true;
    const propsBlock = match[1];
    
    // Extract title, eyebrow, description
    const titleMatch = propsBlock.match(/title=["']([^"']+)["']/);
    const eyebrowMatch = propsBlock.match(/eyebrow=["']([^"']+)["']/);
    const descMatch = propsBlock.match(/description=["']([^"']+)["']/);

    const title = titleMatch ? titleMatch[1] : (eyebrowMatch ? eyebrowMatch[1] : 'Page Title');
    const desc = descMatch ? descMatch[1] : '';

    const newHeader = `<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">${title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">${desc}</p>
        </div>
      </div>`;

    newContent = newContent.replace(match[0], newHeader);
  }

  // Remove premium header
  newContent = newContent.replace(/<header className="client-premium-header[\s\S]*?<\/header>/g, '');
  
  // Remove background gradients on main container
  newContent = newContent.replace(/<div className="min-h-screen bg-\[linear-gradient.*?\]">/g, '<div className="min-h-full">');

  // Remove the import
  newContent = newContent.replace(/import ClientPortalPageIntro.*?\n/, '');

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log('Updated ' + file);
  }
}
