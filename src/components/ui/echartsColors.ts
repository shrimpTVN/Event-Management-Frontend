// Canvas accepts space-separated HSL, but zrender's emphasis color parser needs commas.
export function toEChartsHsl(value: string, fallback: string): string {
  const parts = value.trim().split(/[\s,]+/)
  if (
    parts.length !== 3 ||
    !/^-?[\d.]+$/.test(parts[0]) ||
    !/^[\d.]+%$/.test(parts[1]) ||
    !/^[\d.]+%$/.test(parts[2])
  )
    return fallback
  return `hsl(${parts.join(', ')})`
}
