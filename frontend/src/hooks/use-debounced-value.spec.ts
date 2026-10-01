import { act, renderHook } from '@testing-library/react'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('first', 500))

    expect(result.current).toBe('first')
  })

  it('does not update the debounced value before the delay has elapsed', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'first', delay: 500 } },
    )

    rerender({ value: 'second', delay: 500 })
    vi.advanceTimersByTime(499)

    expect(result.current).toBe('first')
  })

  it('updates the debounced value once the delay has elapsed', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'first', delay: 500 } },
    )

    rerender({ value: 'second', delay: 500 })
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('second')
  })

  it('resets the timer on each change, so only the latest value survives after one full delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'r', delay: 500 } },
    )

    rerender({ value: 're', delay: 500 })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    rerender({ value: 'rea', delay: 500 })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    rerender({ value: 'react', delay: 500 })
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('r')

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe('react')
  })

  it('clears the pending timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    const { unmount } = renderHook(() => useDebouncedValue('first', 500))

    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
  })
})
