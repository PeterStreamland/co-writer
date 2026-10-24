import { useEffect, useRef } from 'preact/hooks'
import type { ComponentChildren } from 'preact'

// The melody lane and the rows under the progression, scrolled together
// (PLAN Phase 7 task 6): each lays its bars out in a strip of its own, and
// scrolling any one sideways scrolls the others to the same place, so their
// bars stay lined up under each other.
export function Timeline({ children }: { children: ComponentChildren }) {
  const ref = useRef<HTMLDivElement>(null)
  // A row just added, or a lane just shown, starts where the others are.
  useEffect(() => {
    const strips = ref.current?.querySelectorAll<HTMLElement>('.lane-bars')
    if (!strips?.length) return
    const at = Math.max(...Array.from(strips, (s) => s.scrollLeft))
    for (const s of strips) if (s.scrollLeft !== at) s.scrollLeft = at
  })
  useEffect(() => {
    const box = ref.current
    if (!box) return
    let syncing = false
    const onScroll = (e: Event) => {
      const from = e.target
      if (syncing || !(from instanceof HTMLElement)) return
      if (!from.classList.contains('lane-bars')) return
      syncing = true
      for (const other of box.querySelectorAll<HTMLElement>('.lane-bars')) {
        if (other !== from) other.scrollLeft = from.scrollLeft
      }
      requestAnimationFrame(() => (syncing = false))
    }
    // Scroll events don't bubble, so listen as they go down.
    box.addEventListener('scroll', onScroll, true)
    return () => box.removeEventListener('scroll', onScroll, true)
  }, [])
  return (
    <div class="timeline" ref={ref}>
      {children}
    </div>
  )
}
