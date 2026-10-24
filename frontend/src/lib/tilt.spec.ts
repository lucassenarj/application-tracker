import { computeTilt } from '@/lib/tilt'

describe('computeTilt', () => {
  it('returns zero rotation when the cursor is at the card center', () => {
    const rect = { left: 0, top: 0, width: 200, height: 100 }

    const result = computeTilt(100, 50, rect)

    expect(result).toEqual({ rotateX: 0, rotateY: 0 })
  })

  it('tilts forward/back based on vertical cursor position', () => {
    const rect = { left: 0, top: 0, width: 200, height: 100 }

    const result = computeTilt(100, 80, rect)

    expect(result.rotateX).toBe(1.5)
    expect(result.rotateY).toBe(0)
  })
  it('tilts left/right based on horizontal cursor position, inverted', () => {
    const rect = { left: 0, top: 0, width: 200, height: 100 }

    const result = computeTilt(130, 50, rect)

    expect(result.rotateY).toBe(-1.5)
    expect(result.rotateX).toBe(0)
  })
})
