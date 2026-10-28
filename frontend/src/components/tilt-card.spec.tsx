import { fireEvent, render, screen } from '@testing-library/react'
import { TiltCard } from '@/components/tilt-card'

describe('TiltCard', () => {
  it('renders its children', () => {
    render(<TiltCard>Hello</TiltCard>)

    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('applies a tilt transform on mouse move based on cursor position', () => {
    const { container } = render(<TiltCard>Hello</TiltCard>)
    const card = container.firstChild as HTMLElement

    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 100,
      right: 200,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    })

    fireEvent.mouseMove(card, { clientX: 130, clientY: 50 })

    expect(card.style.transform).toBe(
      'perspective(1000px) rotateX(0deg) rotateY(-1.5deg) translateZ(10px)',
    )
  })

  it('resets the transform when the mouse leaves', () => {
    const { container } = render(<TiltCard>Hello</TiltCard>)
    const card = container.firstChild as HTMLElement

    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 100,
      right: 200,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    })

    fireEvent.mouseMove(card, { clientX: 130, clientY: 50 })
    fireEvent.mouseLeave(card)

    expect(card.style.transform).toBe(
      'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)',
    )
  })
})
