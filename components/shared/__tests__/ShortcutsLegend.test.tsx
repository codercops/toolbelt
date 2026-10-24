import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {ShortcutsLegend}  from '../ShortcutsLegend';

const mockShortcuts = [
  { label: 'Encode', keys: ['Ctrl', 'Enter'] }
];

describe('ShortcutsLegend alignment', () => {
  it('renders without crashing with default props', () => {
    const html = renderToString(<ShortcutsLegend shortcuts={mockShortcuts} />);
    expect(html).toContain('Shortcuts');
  });

  it('accepts align="left" prop', () => {
    const html = renderToString(<ShortcutsLegend shortcuts={mockShortcuts} align="left" />);
    expect(html).toBeDefined();
    expect(html).toContain('Shortcuts');
  });

  it('accepts align="right" prop', () => {
    const html = renderToString(<ShortcutsLegend shortcuts={mockShortcuts} align="right" />);
    expect(html).toBeDefined();
    expect(html).toContain('Shortcuts');
  });
});