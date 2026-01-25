import type { FilterSize } from './types';

// Hex color validation: #RGB or #RRGGBB format
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;

export function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR_REGEX.test(value);
}

const VALID_FILTER_SIZES: readonly FilterSize[] = ['small', 'medium', 'large'];

export function isValidFilterSize(value: unknown): value is FilterSize {
  return typeof value === 'string' && VALID_FILTER_SIZES.includes(value as FilterSize);
}
