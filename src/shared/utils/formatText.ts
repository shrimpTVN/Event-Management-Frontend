/**
 * Normalizes and preserves authentic event title string exactly as entered by organizers/admin.
 */
export function formatEventTitle(title?: string): string {
  if (!title) return ''
  return title.trim()
}

/**
 * Safely sanitizes an image preview URL to prevent DOM text reinterpretation as HTML (XSS).
 * Strictly permits only safe protocols (blob: or data:image/) and escapes any meta-characters.
 */
export function sanitizeImageSrc(url?: string | null): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:image/')) {
    return encodeURI(trimmed)
  }
  return ''
}
