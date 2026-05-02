const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/client/ClientOrdersQueuePage.jsx', 'utf8');
let newCode = code.replace(/<ClientPortalPageIntro[\s\S]*?\/>/, `<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Orders Queue</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage draft orders and review pending fulfillments.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="client-action-btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Hide draft form' : '+ New Order'}
            </button>
          </div>
        </div>`);
fs.writeFileSync('frontend/src/pages/client/ClientOrdersQueuePage.jsx', newCode);
