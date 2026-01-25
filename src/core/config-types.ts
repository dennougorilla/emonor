// Configuration defaults and CSS mappings
// FilterSize type is defined in types.ts for Library integration

import type { FilterSize } from './types';

// Default configuration values
export const DEFAULT_ACCENT_COLOR = '#34d399';
export const DEFAULT_FILTER_SIZE: FilterSize = 'medium';

// Filter size CSS mappings
export const FILTER_SIZE_VALUES = {
  small: { height: 32, emojiSize: 16, paddingX: 10 },
  medium: { height: 38, emojiSize: 18, paddingX: 12 },
  large: { height: 44, emojiSize: 22, paddingX: 14 },
} as const;
