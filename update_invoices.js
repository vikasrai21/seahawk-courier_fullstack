const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/client/ClientInvoicesPage.jsx', 'utf8');

const regex = /<header className="client-premium-header[\s\S]*?<\/section>/;

const newHeader = `<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Invoices</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Download invoices and export billing ledgers.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/portal/wallet" className="client-action-btn-secondary">
              Open Wallet
            </Link>
          </div>
        </div>`;

// Replace the min-h-screen bg stuff too
code = code.replace(/<div className="min-h-screen bg-\[linear-gradient.*?\]">/, '<div className="min-h-full">');

let newCode = code.replace(regex, newHeader);
fs.writeFileSync('frontend/src/pages/client/ClientInvoicesPage.jsx', newCode);
