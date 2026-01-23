import type { EmojiTag } from './types';

// About mode card definition
export interface AboutCard {
  readonly id: string;
  readonly label: string;
  readonly emoji: string;
  readonly gifUrl: string;
  readonly linkUrl: string;
}

export const ABOUT_CARDS: readonly AboutCard[] = [
  { id: 'about-github', label: 'GitHub', emoji: '📦', gifUrl: 'https://media.giphy.com/media/du3J3cXyzhj75IOgvA/giphy.gif', linkUrl: 'https://github.com' },
  { id: 'about-author', label: 'Author', emoji: '👤', gifUrl: 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif', linkUrl: 'https://github.com' },
  { id: 'about-support', label: 'Support', emoji: '💚', gifUrl: 'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif', linkUrl: 'https://github.com' },
] as const;

// @specs/DOMAIN.md § 2.1 - Default tag set
export const DEFAULT_TAGS: readonly EmojiTag[] = [
  { emoji: '😂', label: 'Funny' },
  { emoji: '😭', label: 'Mood' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Hype' },
  { emoji: '👍', label: 'Reaction' },
  { emoji: '🙏', label: 'Thanks' },
  { emoji: '📂', label: 'Other' },
] as const;

// @specs/DOMAIN.md § 5.2 - Storage key
export const STORAGE_KEY = 'emonor_data';

// @specs/INTERACTION.md § 2.6 - Toast duration
export const TOAST_DURATION_MS = 1500;

// @specs/DOMAIN.md § 2.3 - Max custom tags
export const MAX_TAGS = 12;

// @specs/DOMAIN.md § 2.1 - System reserved tag (undeletable)
export const SYSTEM_TAG_EMOJI = '📂';
