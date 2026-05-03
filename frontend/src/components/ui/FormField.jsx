// src/components/ui/FormField.jsx — Unified form field component
// Replaces inconsistent input styling across NewEntry, Import, Contracts pages
import React, { forwardRef } from 'react';

/**
 * FormField — Consistent form input wrapper with:
 * - Floating/stacked label
 * - Error states with animation
 * - Helper text
 * - Required indicator
 * - Icon prefix/suffix
 * - Dark mode
 *
 * @param {string} label - Field label
 * @param {string} error - Error message
 * @param {string} hint - Helper text
 * @param {boolean} required - Show required indicator
 * @param {React.ReactNode} prefix - Left icon/element
 * @param {React.ReactNode} suffix - Right icon/element
 * @param {string} className - Wrapper className
 * @param {string} size - 'sm' | 'md' | 'lg'
 */
export const FormField = forwardRef(function FormField({
  label,
  error,
  hint,
  required,
  prefix,
  suffix,
  className = '',
  size = 'md',
  children,
  ...rest
}, ref) {
  const sizeClasses = {
    sm: 'text-xs py-2 px-3',
    md: 'text-sm py-3 px-4',
    lg: 'text-base py-3.5 px-5',
  };

  const hasChildren = !!children;

  return (
    <div className={`shk-form-field ${className}`}>
      {label && (
        <label className="shk-form-label">
          {label}
          {required && <span className="shk-form-required">*</span>}
        </label>
      )}
      <div className={`shk-form-input-wrap ${error ? 'shk-form-input-wrap--error' : ''} ${prefix ? 'has-prefix' : ''} ${suffix ? 'has-suffix' : ''}`}>
        {prefix && <span className="shk-form-prefix">{prefix}</span>}
        {hasChildren ? children : (
          <input
            ref={ref}
            className={`shk-form-input ${sizeClasses[size]}`}
            {...rest}
          />
        )}
        {suffix && <span className="shk-form-suffix">{suffix}</span>}
      </div>
      {error && (
        <p className="shk-form-error">{error}</p>
      )}
      {hint && !error && (
        <p className="shk-form-hint">{hint}</p>
      )}

      <style>{`
        .shk-form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .shk-form-label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--shk-text-dim, #94a3b8);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .shk-form-required {
          color: #f97316;
          font-size: 12px;
          line-height: 1;
        }
        .shk-form-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .shk-form-input-wrap.has-prefix .shk-form-input {
          padding-left: 38px;
        }
        .shk-form-input-wrap.has-suffix .shk-form-input {
          padding-right: 38px;
        }
        .shk-form-prefix, .shk-form-suffix {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          color: var(--shk-text-dim, #94a3b8);
          display: flex;
          align-items: center;
          pointer-events: none;
          z-index: 1;
        }
        .shk-form-prefix { left: 12px; }
        .shk-form-suffix { right: 12px; }
        .shk-form-input {
          width: 100%;
          border-radius: 14px;
          border: 1.5px solid var(--shk-border, #e2e8f0);
          background: var(--shk-surface, #ffffff);
          color: var(--shk-text, #0f172a);
          font-weight: 500;
          outline: none;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .shk-form-input::placeholder {
          color: var(--shk-text-dim, #94a3b8);
        }
        .shk-form-input:focus {
          border-color: rgba(249, 115, 22, 0.5);
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.08);
        }
        .shk-form-input:hover:not(:focus) {
          border-color: var(--shk-border-hi, #cbd5e1);
        }
        .shk-form-input-wrap--error .shk-form-input {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08) !important;
        }
        .shk-form-error {
          font-size: 11px;
          font-weight: 600;
          color: #ef4444;
          display: flex;
          align-items: center;
          gap: 4px;
          animation: shk-shake 0.3s ease;
        }
        .shk-form-hint {
          font-size: 11px;
          color: var(--shk-text-dim, #94a3b8);
          font-weight: 500;
        }
        @keyframes shk-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        [data-theme="dark"] .shk-form-input {
          background: var(--shk-surface-soft, #111b30);
          border-color: var(--shk-border, rgba(99,130,191,0.12));
        }
        [data-theme="dark"] .shk-form-input:focus {
          border-color: rgba(249, 115, 22, 0.5);
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12);
        }
      `}</style>
    </div>
  );
});

/**
 * FormSelect — Consistent select dropdown
 */
export const FormSelect = forwardRef(function FormSelect({
  label,
  error,
  hint,
  required,
  options = [],
  placeholder = 'Select...',
  className = '',
  size = 'md',
  ...rest
}, ref) {
  const sizeClasses = {
    sm: 'text-xs py-2 px-3',
    md: 'text-sm py-3 px-4',
    lg: 'text-base py-3.5 px-5',
  };

  return (
    <FormField label={label} error={error} hint={hint} required={required} className={className}>
      <select ref={ref} className={`shk-form-input shk-form-select ${sizeClasses[size]}`} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      <style>{`
        .shk-form-select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px !important;
        }
      `}</style>
    </FormField>
  );
});

/**
 * FormTextarea — Consistent textarea
 */
export const FormTextarea = forwardRef(function FormTextarea({
  label,
  error,
  hint,
  required,
  className = '',
  rows = 3,
  ...rest
}, ref) {
  return (
    <FormField label={label} error={error} hint={hint} required={required} className={className}>
      <textarea ref={ref} rows={rows} className="shk-form-input text-sm py-3 px-4" style={{ resize: 'vertical', minHeight: 80 }} {...rest} />
    </FormField>
  );
});
