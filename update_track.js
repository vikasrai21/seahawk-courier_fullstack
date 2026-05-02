const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/client/ClientTrackPage.jsx', 'utf8');
let newCode = code.replace(/<ClientPortalPageIntro[\s\S]*?\/>/, `<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Single Track</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter an AWB to inspect the full journey with milestone state and timeline.</p>
          </div>
        </div>`);
fs.writeFileSync('frontend/src/pages/client/ClientTrackPage.jsx', newCode);
