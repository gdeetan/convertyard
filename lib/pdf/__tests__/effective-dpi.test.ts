import { describe, it, expect } from 'vitest';
import { computeEffectiveDpi } from '../effective-dpi';

describe('computeEffectiveDpi', () => {
  it('returns 300 when a 300px image is drawn at 72pt (1 inch)', () => {
    expect(computeEffectiveDpi({ pixelWidth: 300, renderedPoints: 72 })).toBe(300);
  });

  it('returns 150 when a 300px image is drawn at 144pt (2 inches)', () => {
    expect(computeEffectiveDpi({ pixelWidth: 300, renderedPoints: 144 })).toBe(150);
  });

  it('returns Infinity when renderedPoints is 0 (defensive: caller should treat as "skip")', () => {
    expect(computeEffectiveDpi({ pixelWidth: 300, renderedPoints: 0 })).toBe(Infinity);
  });

  it('handles fractional results without rounding', () => {
    expect(computeEffectiveDpi({ pixelWidth: 100, renderedPoints: 50 })).toBeCloseTo(144, 5);
  });
});
