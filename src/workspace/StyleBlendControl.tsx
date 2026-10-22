import type { StyleBlend, StyleSet } from '../theory'
import { blendLabel } from './style-blend'

// The style blend control in the header (SPEC 2, 6.6): style A, a slider in
// 25% steps from 100% A to 100% B, and style B.
export function StyleBlendControl({
  styles,
  value,
  onChange,
}: {
  styles: StyleSet
  value: StyleBlend
  onChange: (blend: StyleBlend) => void
}) {
  const picker = (which: 'a' | 'b', label: string) => (
    <select
      aria-label={label}
      value={value[which]}
      onChange={(e) =>
        onChange({ ...value, [which]: (e.target as HTMLSelectElement).value })
      }
    >
      {styles.styles.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  )
  return (
    <div class="style-blend">
      <span>Style:</span>
      {picker('a', 'First style')}
      <input
        type="range"
        min={0}
        max={1}
        step={0.25}
        value={value.mix}
        aria-label="Mix between the two styles"
        aria-valuetext={blendLabel(styles, value)}
        onInput={(e) =>
          onChange({
            ...value,
            mix: Number((e.target as HTMLInputElement).value),
          })
        }
      />
      {picker('b', 'Second style')}
      <span class="muted">{blendLabel(styles, value)}</span>
    </div>
  )
}
