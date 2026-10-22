import type { StyleBlend, StyleSet } from '../theory'
import { NO_STYLE, blendLabel, withBlending } from './style-blend'

// The style control in the header (SPEC 2, 6.6): a style (or No style),
// and with Blend ticked a slider in 25% steps towards a second style.
export function StyleBlendControl({
  styles,
  value,
  onChange,
}: {
  styles: StyleSet
  value: StyleBlend
  onChange: (blend: StyleBlend) => void
}) {
  const blending = value.b !== undefined
  const options = styles.styles.map((s) => (
    <option key={s.id} value={s.id}>
      {s.name}
    </option>
  ))
  return (
    <div class="style-blend">
      <label>
        Style
        <select
          value={value.a}
          onChange={(e) => {
            const a = (e.target as HTMLSelectElement).value
            onChange(
              a === NO_STYLE
                ? { a, mix: 0 }
                : { ...value, a, b: value.b === a ? undefined : value.b },
            )
          }}
        >
          <option value={NO_STYLE}>No style</option>
          {options}
        </select>
      </label>
      {value.a !== NO_STYLE && (
        <label>
          <input
            type="checkbox"
            checked={blending}
            onChange={(e) =>
              onChange(
                withBlending(
                  styles,
                  value,
                  (e.target as HTMLInputElement).checked,
                ),
              )
            }
          />
          Blend
        </label>
      )}
      {blending && (
        <>
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
          <select
            aria-label="Second style"
            value={value.b}
            onChange={(e) =>
              onChange({ ...value, b: (e.target as HTMLSelectElement).value })
            }
          >
            {options}
          </select>
        </>
      )}
      {(blending || value.a === NO_STYLE) && (
        <span class="muted">{blendLabel(styles, value)}</span>
      )}
    </div>
  )
}
