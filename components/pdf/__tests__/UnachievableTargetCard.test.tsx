// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { UnachievableTargetCard } from '../UnachievableTargetCard';

afterEach(() => cleanup());

describe('UnachievableTargetCard', () => {
  it('shows best-possible size and target', () => {
    render(<UnachievableTargetCard bestBytes={720_000} targetBytes={500_000} onKeep={() => {}} onRasterize={() => {}} />);
    expect(screen.getAllByText(/720 KB/).length).toBeGreaterThan(0);
    expect(screen.getByText(/500 KB/)).toBeDefined();
  });

  it('calls onKeep when the Keep button is clicked', () => {
    const onKeep = vi.fn();
    render(<UnachievableTargetCard bestBytes={720_000} targetBytes={500_000} onKeep={onKeep} onRasterize={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /keep as/i }));
    expect(onKeep).toHaveBeenCalledOnce();
  });

  it('calls onRasterize when the Rasterize button is clicked', () => {
    const onRasterize = vi.fn();
    render(<UnachievableTargetCard bestBytes={720_000} targetBytes={500_000} onKeep={() => {}} onRasterize={onRasterize} />);
    fireEvent.click(screen.getByRole('button', { name: /rasterize anyway/i }));
    expect(onRasterize).toHaveBeenCalledOnce();
  });

  it('warns that rasterize breaks searchable text', () => {
    render(<UnachievableTargetCard bestBytes={720_000} targetBytes={500_000} onKeep={() => {}} onRasterize={() => {}} />);
    expect(screen.getByText(/breaks searchable text/i)).toBeDefined();
  });
});
