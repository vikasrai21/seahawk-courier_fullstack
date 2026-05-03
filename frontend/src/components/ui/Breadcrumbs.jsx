// src/components/ui/Breadcrumbs.jsx — Breadcrumb navigation component
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumbs — Navigation breadcrumbs with:
 * - Clickable links
 * - Current page highlight
 * - Home icon
 * - Responsive truncation
 * - Smooth transitions
 *
 * @param {Array} items - [{ label: string, to?: string }] - last item is current (no link)
 * @param {boolean} showHome - Show home icon as first item
 * @param {string} className - Additional wrapper className
 */
export function Breadcrumbs({ items = [], showHome = true, className = '' }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={`shk-breadcrumbs ${className}`}>
      {showHome && (
        <>
          <Link to="/app" className="shk-breadcrumb-item shk-breadcrumb-home">
            <Home size={13} />
          </Link>
          <ChevronRight size={11} className="shk-breadcrumb-sep" />
        </>
      )}
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {isLast ? (
              <span className="shk-breadcrumb-item shk-breadcrumb-current">{item.label}</span>
            ) : (
              <>
                <Link to={item.to || '#'} className="shk-breadcrumb-item shk-breadcrumb-link">
                  {item.label}
                </Link>
                <ChevronRight size={11} className="shk-breadcrumb-sep" />
              </>
            )}
          </React.Fragment>
        );
      })}

      <style>{`
        .shk-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .shk-breadcrumb-item {
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.15s ease;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
        }
        .shk-breadcrumb-home {
          color: var(--shk-text-dim, #94a3b8);
          padding: 4px;
          border-radius: 6px;
        }
        .shk-breadcrumb-home:hover {
          color: var(--shk-orange, #f97316);
          background: rgba(249, 115, 22, 0.08);
        }
        .shk-breadcrumb-link {
          color: var(--shk-text-dim, #94a3b8);
        }
        .shk-breadcrumb-link:hover {
          color: var(--shk-orange, #f97316);
        }
        .shk-breadcrumb-current {
          color: var(--shk-text, #0f172a);
          font-weight: 700;
        }
        .shk-breadcrumb-sep {
          color: var(--shk-text-dim, #94a3b8);
          opacity: 0.5;
          flex-shrink: 0;
        }
      `}</style>
    </nav>
  );
}
