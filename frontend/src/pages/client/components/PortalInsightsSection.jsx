import { useState } from 'react';
import { Link } from 'react-router-dom';

const TABS = [
  { key: 'actions', label: 'Quick Actions' },
  { key: 'insights', label: 'Intelligence' },
];

export default function PortalInsightsSection({ quickActions, insightItems }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('actions');

  return (
    <section className="client-premium-card p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.12em] text-orange-500">More Tools</div>
          <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">Insights and shortcuts</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            Kept below the core dashboard so the home view stays focused.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          {expanded ? 'Hide Section' : 'Expand Section'}
        </button>
      </div>

      {expanded && (
        <>
          <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-900">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                  activeTab === tab.key
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'actions' ? (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <Link
                to="/portal/track"
                className="col-span-1 rounded-2xl border border-cyan-600 bg-gradient-to-r from-cyan-600/95 to-blue-600/95 px-4 py-4 text-white transition hover:-translate-y-[1px] hover:shadow-[0_12px_28px_-14px_rgba(34,211,238,0.7)] sm:col-span-2"
              >
                <div className="text-sm font-black uppercase tracking-[0.1em]">Primary Action</div>
                <div className="mt-1 text-2xl font-black">Track / Scan AWB</div>
                <div className="mt-1 text-sm font-semibold text-cyan-50">Fastest route to shipment inspection and timeline checks.</div>
              </Link>

              {quickActions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-3 transition hover:-translate-y-[1px] hover:border-orange-200 hover:bg-orange-50/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-orange-700 dark:hover:bg-slate-800"
                >
                  <div className="text-sm font-black text-slate-900 dark:text-slate-100">{action.label}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">{action.note}</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {insightItems.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3 text-sm font-semibold text-white dark:border-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
