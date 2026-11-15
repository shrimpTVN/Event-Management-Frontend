import { useEffect, useState } from 'react'

export function getPosterColor(pixels: Uint8ClampedArray): string | null {
  const bins = new Map<string, { count: number; r: number; g: number; b: number }>()
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue
    const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]]
    const key = `${r >> 5},${g >> 5},${b >> 5}`
    const bin = bins.get(key) || { count: 0, r: 0, g: 0, b: 0 }
    bin.count++
    bin.r += r
    bin.g += g
    bin.b += b
    bins.set(key, bin)
  }
  const dominant = [...bins.values()].sort((a, b) => b.count - a.count)[0]
  if (!dominant) return null
  return `rgb(${Math.round((dominant.r / dominant.count) * 0.8)}, ${Math.round((dominant.g / dominant.count) * 0.8)}, ${Math.round((dominant.b / dominant.count) * 0.8)})`
}

export function PosterBackdrop({ src }: { src: string }) {
  const [sample, setSample] = useState<{ src: string; color: string } | null>(null)
  useEffect(() => {
    let cancelled = false
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 24
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) return
        context.drawImage(image, 0, 0, 24, 24)
        const color = getPosterColor(context.getImageData(0, 0, 24, 24).data)
        if (!cancelled && color) setSample({ src, color })
      } catch {
        // Images without CORS support retain the opaque, darkened image backdrop.
      }
    }
    image.src = src
    return () => {
      cancelled = true
      image.onload = null
    }
  }, [src])
  const color = sample?.src === src ? sample.color : null
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden bg-slate-900 pointer-events-none"
    >
      {color ? (
        <div className="absolute inset-0" style={{ backgroundColor: color }} />
      ) : (
        <div
          className="absolute -inset-12 bg-cover bg-center blur-3xl brightness-75"
          style={{ backgroundImage: `url(${src})` }}
        />
      )}
    </div>
  )
}
