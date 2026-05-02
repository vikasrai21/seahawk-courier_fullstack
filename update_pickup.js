const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/client/ClientPickupPage.jsx', 'utf8');

const regex = /<header className="client-premium-header[\s\S]*?<\/section>/;

const newHeader = `<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Pickup Requests</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Schedule and manage pickups.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-400">
               {pickups.length} requests tracked
             </div>
          </div>
        </div>`;

// Replace the `<div className="min-h-screen bg-[linear-gradient...">` too
code = code.replace(/<div className="min-h-screen bg-\[linear-gradient.*?\]">/, '<div className="min-h-full">');

let newCode = code.replace(regex, newHeader);

fs.writeFileSync('frontend/src/pages/client/ClientPickupPage.jsx', newCode);
