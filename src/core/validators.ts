// @specs/DOMAIN.md § 5.4 - URL validation rules
const GIF_EXTENSIONS = ['.gif', '.webp', '.mp4'] as const;

const KNOWN_HOSTS = [
  'giphy.com',
  'media.giphy.com',
  'tenor.com',
  'media.tenor.com',
  'imgur.com',
  'i.imgur.com',
  'gfycat.com',
  'media.discordapp.net',
  'cdn.discordapp.com',
] as const;

export function isValidGifUrl(url: string): boolean {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }

  const pathname = parsedUrl.pathname.toLowerCase();
  const hasGifExtension = GIF_EXTENSIONS.some(ext => pathname.endsWith(ext));

  const hostname = parsedUrl.hostname.toLowerCase();
  const isKnownHost = KNOWN_HOSTS.some(
    host => hostname === host || hostname.endsWith('.' + host)
  );

  return hasGifExtension || isKnownHost;
}

// Single emoji detection using Unicode property escapes
const EMOJI_REGEX = /^\p{Emoji_Presentation}(\u{FE0F})?$/u;
const EMOJI_WITH_VS_REGEX = /^\p{Emoji}\u{FE0F}$/u;

export function isValidEmoji(value: string): boolean {
  if (value.length === 0) return false;
  return EMOJI_REGEX.test(value) || EMOJI_WITH_VS_REGEX.test(value);
}
