const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/client/ClientBulkTrackPage.jsx', 'utf8');
let newCode = code.replace(/<ClientPortalPageIntro[\s\S]*?<\/section>\r?\n\r?\n\s*<section className="rounded-\[26px\].*?<\/section>/, `<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Bulk Track</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Paste AWB numbers to track multiple shipments at once.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setText(''); setResult(null); }} className="client-action-btn-secondary">
              Clear List
            </button>
            <button onClick={submit} disabled={loading} className="client-action-btn-primary flex items-center gap-2">
              {loading ? 'Tracking...' : 'Track Shipments'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-sm">
          <textarea
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm font-semibold placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all dark:text-white min-h-[120px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'Paste AWB numbers here (comma-separated, spaces, or line breaks)\\ne.g.\\n1234567890\\n2345678901'}
          />
        </div>`);
fs.writeFileSync('frontend/src/pages/client/ClientBulkTrackPage.jsx', newCode);
