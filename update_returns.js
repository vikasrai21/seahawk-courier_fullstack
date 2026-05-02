const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/client/ClientReturnsPage.jsx', 'utf8');

const regex = /<ClientPortalPageIntro[\s\S]*?\/>/;

const newHeader = `<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Returns</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Request, track, and complete reverse logistics.</p>
        </div>
      </div>`;

let newCode = code.replace(regex, newHeader);
fs.writeFileSync('frontend/src/pages/client/ClientReturnsPage.jsx', newCode);
