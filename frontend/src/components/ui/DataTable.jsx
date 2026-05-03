// src/components/ui/DataTable.jsx — Unified, premium enterprise data table
// Replaces all ad-hoc table implementations across the portal
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Skeleton } from './Skeleton';

const PAGE_SIZES = [10, 25, 50, 100];

/**
 * DataTable — Enterprise-grade table component with:
 * - Sortable columns
 * - Client-side search
 * - Pagination
 * - Loading skeletons
 * - Empty states
 * - Responsive horizontal scroll
 * - Dark mode support
 * - Row click handlers
 * - Sticky headers
 *
 * @param {Object[]} columns - Column definitions: { key, label, sortable, render, align, width, className }
 * @param {Object[]} data - Row data array
 * @param {boolean} loading - Show skeleton loading state
 * @param {string} emptyIcon - Emoji for empty state
 * @param {string} emptyTitle - Title for empty state
 * @param {string} emptyMessage - Message for empty state
 * @param {Function} onRowClick - Row click handler (row, index) => void
 * @param {boolean} searchable - Enable search bar
 * @param {string} searchPlaceholder - Search input placeholder
 * @param {boolean} paginated - Enable pagination
 * @param {number} pageSize - Default page size
 * @param {boolean} compact - Compact row padding
 * @param {string} className - Additional wrapper className
 * @param {React.ReactNode} actions - Header action buttons
 * @param {string} title - Table title
 * @param {boolean} stickyHeader - Make header sticky
 * @param {boolean} striped - Alternate row backgrounds
 * @param {Function} rowClassName - (row, index) => className
 */
export function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyIcon = '📭',
  emptyTitle = 'No data found',
  emptyMessage = 'Try adjusting your filters or check back later.',
  onRowClick,
  searchable = false,
  searchPlaceholder = 'Search...',
  paginated = true,
  pageSize: defaultPageSize = 10,
  compact = false,
  className = '',
  actions,
  title,
  stickyHeader = true,
  striped = false,
  rowClassName,
  onExport,
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Search filtering
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  // Sorting
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find(c => c.key === sortKey);
    return [...filtered].sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (col?.sortValue) { va = col.sortValue(a); vb = col.sortValue(b); }
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va).toLowerCase(), sb = String(vb).toLowerCase();
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [filtered, sortKey, sortDir, columns]);

  // Pagination
  const totalPages = paginated ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const pageData = paginated ? sorted.slice(page * pageSize, (page + 1) * pageSize) : sorted;

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const cellPad = compact ? 'px-4 py-2.5' : 'px-5 py-3.5';

  // Loading skeleton
  if (loading) {
    return (
      <div className={`table-shell overflow-hidden ${className}`}>
        {(title || searchable || actions) && (
          <div className="flex items-center justify-between gap-4 p-5 border-b border-slate-100 dark:border-slate-800/60">
            {title && <Skeleton className="h-6 w-40 rounded-xl" />}
            <div className="flex gap-2 ml-auto">
              {searchable && <Skeleton className="h-9 w-48 rounded-xl" />}
              {actions && <Skeleton className="h-9 w-24 rounded-xl" />}
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={i} className={`${cellPad} table-head`}>
                    <Skeleton className="h-3 w-16 rounded-full" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, ri) => (
                <tr key={ri} className="border-b border-slate-50 dark:border-slate-800/40">
                  {columns.map((_, ci) => (
                    <td key={ci} className={cellPad}>
                      <Skeleton className="h-4 w-full rounded-lg" style={{ maxWidth: ci === 0 ? 120 : 80 }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={`table-shell overflow-hidden ${className}`}>
      {/* Header bar */}
      {(title || searchable || actions || onExport) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            {title && (
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">{title}</h3>
            )}
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-full">
              {sorted.length} {sorted.length === 1 ? 'row' : 'rows'}
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {searchable && (
              <div className="relative flex-1 sm:flex-initial">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(0); }}
                  placeholder={searchPlaceholder}
                  className="input !pl-9 !py-2 !text-xs !rounded-xl !w-full sm:!w-52"
                />
              </div>
            )}
            {onExport && (
              <button onClick={onExport} className="btn-ghost btn-sm flex items-center gap-1.5">
                <Download size={13} /> Export
              </button>
            )}
            {actions}
          </div>
        </div>
      )}

      {/* Table with horizontal scroll */}
      <div className="overflow-x-auto shk-table-scroll">
        <table className="tbl w-full">
          <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`${cellPad} table-head whitespace-nowrap select-none ${col.sortable !== false ? 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors' : ''} ${col.className || ''}`}
                  style={{ width: col.width, textAlign: col.align || 'left', minWidth: col.minWidth }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.label}
                    {col.sortable !== false && (
                      <span className="inline-flex flex-col opacity-40 hover:opacity-80 transition-opacity">
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        ) : (
                          <ChevronsUpDown size={12} />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 animate-in">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-sky-50 dark:from-amber-900/20 dark:to-sky-900/20 border border-amber-100 dark:border-amber-800/30 flex items-center justify-center text-2xl shadow-sm">
                      {emptyIcon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{emptyTitle}</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">{emptyMessage}</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              pageData.map((row, ri) => (
                <tr
                  key={row.id || ri}
                  className={`
                    border-b border-slate-50 dark:border-slate-800/30 transition-all duration-150
                    ${onRowClick ? 'cursor-pointer hover:bg-orange-50/40 dark:hover:bg-orange-500/[0.04] active:bg-orange-50/60' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}
                    ${striped && ri % 2 === 1 ? 'bg-slate-25 dark:bg-slate-800/10' : ''}
                    ${rowClassName ? rowClassName(row, ri) : ''}
                  `}
                  onClick={() => onRowClick?.(row, ri)}
                  style={{ animationDelay: `${ri * 20}ms` }}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={`${cellPad} text-sm text-slate-700 dark:text-slate-300 ${col.className || ''}`}
                      style={{ textAlign: col.align || 'left', minWidth: col.minWidth }}
                    >
                      {col.render ? col.render(row[col.key], row, ri) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && sorted.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Showing</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 outline-none"
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span>of {sorted.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) { pageNum = i; }
              else if (page < 3) { pageNum = i; }
              else if (page > totalPages - 4) { pageNum = totalPages - 5 + i; }
              else { pageNum = page - 2 + i; }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`min-w-[28px] h-7 rounded-lg text-xs font-bold transition-all ${
                    page === pageNum
                      ? 'bg-slate-900 text-white dark:bg-orange-600 shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .shk-table-scroll::-webkit-scrollbar { height: 4px; }
        .shk-table-scroll::-webkit-scrollbar-track { background: transparent; }
        .shk-table-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        [data-theme="dark"] .shk-table-scroll::-webkit-scrollbar-thumb { background: rgba(99,130,191,0.2); }
        .animate-in { animation: shk-table-reveal 0.4s ease forwards; }
        @keyframes shk-table-reveal {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
