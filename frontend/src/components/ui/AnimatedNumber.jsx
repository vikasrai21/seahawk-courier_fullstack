// src/components/ui/AnimatedNumber.jsx — Smooth number counter animation
import { useState, useEffect, useRef } from 'react';

/**
 * AnimatedNumber — Smoothly animates between number values
 * Used in dashboard stat cards, analytics counters, wallet balances
 *
 * @param {number} value - Target number
 * @param {number} duration - Animation duration in ms
 * @param {string} prefix - Text before number (e.g., '₹')
 * @param {string} suffix - Text after number (e.g., '%')
 * @param {number} decimals - Decimal places
 * @param {string} locale - Number locale (default: 'en-IN')
 * @param {string} className - Additional className
 */
export function AnimatedNumber({
  value = 0,
  duration = 800,
  prefix = '',
  suffix = '',
  decimals = 0,
  locale = 'en-IN',
  className = '',
}) {
  const [display, setDisplay] = useState(0);
  const animRef = useRef(null);
  const startRef = useRef(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    const startVal = display;
    const endVal = Number(value) || 0;
    if (startVal === endVal) return;

    startRef.current = startVal;
    startTimeRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startRef.current + (endVal - startRef.current) * eased;
      setDisplay(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [value, duration]);

  const formatted = display.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

/**
 * TrendIndicator — Shows up/down trend with color and animation
 */
export function TrendIndicator({ value, label = 'vs last period', className = '' }) {
  if (value == null || isNaN(value)) return null;
  const isPositive = value >= 0;
  const absVal = Math.abs(value).toFixed(1);

  return (
    <span className={`shk-trend ${isPositive ? 'shk-trend--up' : 'shk-trend--down'} ${className}`}>
      <span className="shk-trend-arrow">{isPositive ? '↑' : '↓'}</span>
      <span className="shk-trend-value">{absVal}%</span>
      {label && <span className="shk-trend-label">{label}</span>}

      <style>{`
        .shk-trend {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 8px;
          animation: shk-trend-in 0.4s ease forwards;
        }
        .shk-trend--up {
          color: #059669;
          background: rgba(16, 185, 129, 0.08);
        }
        .shk-trend--down {
          color: #dc2626;
          background: rgba(239, 68, 68, 0.08);
        }
        .shk-trend-arrow {
          font-size: 12px;
        }
        .shk-trend-label {
          font-weight: 500;
          opacity: 0.6;
          font-size: 10px;
        }
        @keyframes shk-trend-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </span>
  );
}
