import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SCard from '../../components/dashboard/SCard';
import { Truck } from 'lucide-react';

describe('SCard Component', () => {
  const defaultProps = {
    title: 'Market Share',
    icon: Truck,
    iconColor: '#10b981',
    dark: true,
  };

  it('renders title and children correctly', () => {
    render(
      <SCard {...defaultProps}>
        <div data-testid="test-child">Child Content</div>
      </SCard>
    );
    expect(screen.getByText('Market Share')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('applies standard styles for dark theme', () => {
    const { container } = render(<SCard {...defaultProps} />);
    const card = container.firstChild;
    // Check if backdrop-filter is applied as part of our premium glassmorphism
    // Note: Inline styles are checked via .style
    expect(card.style.backdropFilter).toContain('blur');
  });

  it('renders icons properly', () => {
    const { container } = render(<SCard {...defaultProps} />);
    const iconWrapper = container.querySelector('svg')?.parentElement;
    expect(iconWrapper).toBeTruthy();
    expect(iconWrapper.style.background).not.toBe('');
    expect(iconWrapper.style.border).not.toBe('');
  });
});
