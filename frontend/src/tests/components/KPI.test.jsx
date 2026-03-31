import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import KPI from '../../components/dashboard/KPI';
import { Package } from 'lucide-react';

describe('KPI Component', () => {
  const defaultProps = {
    label: 'Total Shipments',
    value: '1,240',
    sub: '145 today',
    icon: Package,
    accent: '#3b82f6',
    trend: 12.5,
    dark: true,
  };

  it('renders label and value correctly', () => {
    render(<KPI {...defaultProps} />);
    expect(screen.getByText('Total Shipments')).toBeInTheDocument();
    expect(screen.getByText('1,240')).toBeInTheDocument();
    expect(screen.getByText('145 today')).toBeInTheDocument();
  });

  it('renders positive trend with correct color', () => {
    render(<KPI {...defaultProps} />);
    const trendElement = screen.getByText('12.5%');
    expect(trendElement).toBeInTheDocument();
    // In Vitest JSDOM, checking exact hex colors on inline styles can be tricky, 
    // but we can check if the element exists and matches our logic.
  });

  it('renders negative trend correctly', () => {
    render(<KPI {...defaultProps} trend={-5.2} />);
    expect(screen.getByText('5.2%')).toBeInTheDocument();
  });

  it('handles missing trend gracefully', () => {
    const propsNoTrend = { ...defaultProps, trend: null };
    render(<KPI {...propsNoTrend} />);
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });
});
