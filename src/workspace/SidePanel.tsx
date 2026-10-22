import type { ComponentChildren } from 'preact'
import { useState } from 'preact/hooks'

export type Tab = { id: string; label: string; content: ComponentChildren }

// The side panel (SPEC 2): one tab per tool, under the instrument view at
// full width (David's choice). On a phone it is a sheet along the bottom of
// the screen that opens and closes, so the instrument view stays in sight
// above it. Explore and Suggest are the tabs so far; the rest arrive with
// their phases.
export function SidePanel({
  tabs,
  open,
  onOpenChange,
}: {
  tabs: Tab[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [active, setActive] = useState(tabs[0].id)
  const current = tabs.find((t) => t.id === active) ?? tabs[0]
  return (
    <aside class={open ? 'side open' : 'side'}>
      <div class="side-bar">
        <div class="tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={tab.id === current.id}
              aria-controls="side-content"
              onClick={() => {
                setActive(tab.id)
                onOpenChange(true)
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          class="sheet-toggle"
          aria-expanded={open}
          aria-controls="side-content"
          onClick={() => onOpenChange(!open)}
        >
          {open ? 'Hide ▾' : 'Show ▴'}
        </button>
      </div>
      <div
        class="side-content"
        id="side-content"
        role="tabpanel"
        aria-labelledby={`tab-${current.id}`}
      >
        {current.content}
      </div>
    </aside>
  )
}
