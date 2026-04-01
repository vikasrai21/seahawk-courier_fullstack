import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function PageHeader({ title, subtitle, breadcrumbs = [], actions, icon: Icon }) {
  const { dark } = useTheme();
  const crumbColor = dark ? '#64748b' : '#94a3b8';

  return (
    <div className="shk-page-header">
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

      <div className="shk-page-header__row">
        <div className="shk-page-header__copy">
          <div className="shk-page-header__title-row">
            {Icon && (
              <div className="shk-page-header__icon">
                <Icon size={18} color="#f97316" />
              </div>
            )}
            <h1 className="shk-page-header__title">{title}</h1>
          </div>
          {subtitle && (
            <p className="shk-page-header__subtitle">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="shk-page-header__actions">{actions}</div>
        )}
      </div>

      <div className="shk-page-header__rule" />
    </div>
  );
}
