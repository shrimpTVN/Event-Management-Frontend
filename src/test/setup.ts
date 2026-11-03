import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

vi.mock('@/components/common/ParticleBackground', () => ({
  ParticleBackground: () => null,
}))

class MockOffscreenCanvas {
  width: number
  height: number
  constructor(width = 0, height = 0) {
    this.width = width
    this.height = height
  }
  getContext() {
    return {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: [] }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
    }
  }
}

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.OffscreenCanvas = MockOffscreenCanvas
}
if (typeof globalThis !== 'undefined') {
  // @ts-ignore
  globalThis.OffscreenCanvas = MockOffscreenCanvas
}
