export interface TiltRect {
  left: number
  top: number
  width: number
  height: number
}

export interface Tilt {
  rotateX: number
  rotateY: number
}

export function computeTilt(
  clientX: number,
  clientY: number,
  rect: TiltRect,
): Tilt {
  const x = clientX - rect.left
  const y = clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2

  return {
    rotateX: (y - centerY) / 20,
    rotateY: (centerX - x) / 20,
  }
}
