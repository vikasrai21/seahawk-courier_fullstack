import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function PageHeader({ title, subtitle, breadcrumbs = [], actions, icon: Icon }) {
  const { dark } = useTheme();
  const crumbColor = dark ? '#64748b' : '#94a3b8';

  return (
    <div className="shk-page-header animate-in">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="shk-page-header__crumbs">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              <span className="shk-page-header__crumb">{b}</span>
              {i < breadcrumbs.length - 1 && <ChevronRight size={10} color={crumbColor} />}
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="shk-page-header__row flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="shk-page-header__copy min-w-[300px] flex-1">
          <div className="shk-page-header__title-row flex items-center gap-4 mb-2">
            {Icon && (
              <div className="shk-page-header__icon shrink-0">
                <Icon size={20} color="#f97316" />
              </div>
            )}
            <h1 className="shk-page-header__title text-2xl lg:text-3xl font-black">{title}</h1>
          </div>
          {subtitle && (
            <p className="shk-page-header__subtitle text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="shk-page-header__actions flex-wrap lg:justify-end gap-3">{actions}</div>
        )}
      </div>

      <div className="shk-page-header__rule" />
    </div>
  );
}
