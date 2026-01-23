import type { AboutCard } from '../../core/constants';
import type { Component } from './toast';

export function createAboutCard(card: AboutCard): Component {
  const link = document.createElement('a');
  link.className = 'gif-card gif-card--about';
  link.href = card.linkUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `${card.label} - opens in new tab`);

  const img = document.createElement('img');
  img.className = 'gif-card__image';
  img.src = card.gifUrl;
  img.alt = card.label;
  img.loading = 'lazy';
  link.appendChild(img);

  const label = document.createElement('div');
  label.className = 'gif-card__about-label';
  label.textContent = `${card.emoji} ${card.label}`;
  link.appendChild(label);

  return { element: link, destroy: () => {} };
}
