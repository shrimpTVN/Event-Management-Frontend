/**
 * Normalizes event title string.
 * If the title is entered in ALL CAPS, it converts it to proper sentence / title case
 * while preserving acronyms (CTU, CNTT, IT, AI, LLM, CV, UI/UX, Web3, etc.).
 */
export function formatEventTitle(title?: string): string {
  if (!title) return ''
  const trimmed = title.trim()
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) {
    const lower = trimmed.toLowerCase()
    return lower
      .replace(/(^|[:\-?!."']\s*)([a-z\u00C0-\u024F\u1EA0-\u1EF9])/g, (_, p1, p2) => p1 + p2.toUpperCase())
      .replace(/\bctu\b/gi, 'CTU')
      .replace(/\bit\b/gi, 'IT')
      .replace(/\bllm\b/gi, 'LLM')
      .replace(/\bai\b/gi, 'AI')
      .replace(/\bcv\b/gi, 'CV')
      .replace(/\bui\/ux\b/gi, 'UI/UX')
      .replace(/\bcntt\b/gi, 'CNTT')
      .replace(/\bcntt&tt\b/gi, 'CNTT&TT')
      .replace(/\bweb3\b/gi, 'Web3')
      .replace(/\bfutsal\b/gi, 'Futsal')
      .replace(/\bviettel\b/gi, 'Viettel')
      .replace(/\btammi\b/gi, 'Tammi')
      .replace(/\bcup\b/gi, 'Cup')
      .replace(/\bfigma\b/gi, 'Figma')
      .replace(/\brun\b/gi, 'Run')
      .replace(/\bworkshop\b/gi, 'Workshop')
      .replace(/\bseminar\b/gi, 'Seminar')
      .replace(/\bhackathon\b/gi, 'Hackathon')
  }
  return trimmed
}
