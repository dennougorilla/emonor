import { describe, it, expect } from 'vitest';
import { createAboutCard } from './about-card';
import type { AboutCard } from '../../core/constants';

const mockCard: AboutCard = {
  id: 'about-test',
  label: 'Test',
  emoji: '🧪',
  gifUrl: 'https://example.com/test.gif',
  linkUrl: 'https://example.com',
};

describe('createAboutCard', () => {
  it('creates an anchor element', () => {
    const { element } = createAboutCard(mockCard);
    expect(element.tagName).toBe('A');
  });

  it('sets href and target for new tab', () => {
    const { element } = createAboutCard(mockCard);
    const link = element as HTMLAnchorElement;
    expect(link.href).toBe('https://example.com/');
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
  });

  it('has gif-card and gif-card--about classes', () => {
    const { element } = createAboutCard(mockCard);
    expect(element.classList.contains('gif-card')).toBe(true);
    expect(element.classList.contains('gif-card--about')).toBe(true);
  });

  it('renders an image with the gif URL', () => {
    const { element } = createAboutCard(mockCard);
    const img = element.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toBe('https://example.com/test.gif');
    expect(img.alt).toBe('Test');
  });

  it('renders a label with emoji and text', () => {
    const { element } = createAboutCard(mockCard);
    const label = element.querySelector('.gif-card__about-label');
    expect(label).not.toBeNull();
    expect(label!.textContent).toBe('🧪 Test');
  });

  it('sets aria-label for accessibility', () => {
    const { element } = createAboutCard(mockCard);
    expect(element.getAttribute('aria-label')).toBe('Test - opens in new tab');
  });
});
