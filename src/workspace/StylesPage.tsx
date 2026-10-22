// The style editor page (#/styles, SPEC 6.6): every next-chord rule with a
// 0–5 weight per style. Edits save in this browser; Reset goes back to the
// built-in weights, and Export as default downloads styles.json for Claude to
// commit as the new defaults.
import { useEffect, useState } from 'preact/hooks'
import { BUILT_IN_STYLES, MAX_WEIGHT, type StyleSet } from '../theory'
import {
  editCount,
  editorGroups,
  exportText,
  isEdited,
  loadStyles,
  saveStyles,
  setWeight,
  tapDot,
} from './style-editor'
import { useNarrow } from './useNarrow'

const GROUPS = editorGroups()

export function StylesPage() {
  const [set, setSet] = useState<StyleSet>(() => loadStyles())
  useEffect(() => saveStyles(set), [set])
  const edits = editCount(set)
  // On a phone one style is shown at a time, picked above the table.
  const narrow = useNarrow()
  const [shown, setShown] = useState(BUILT_IN_STYLES.styles[0].id)
  const styles = narrow ? set.styles.filter((s) => s.id === shown) : set.styles

  function reset() {
    if (confirm('Put every weight back to the built-in values?')) {
      setSet(BUILT_IN_STYLES)
    }
  }

  function download() {
    const blob = new Blob([exportText(set)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'styles.json'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <main class="style-editor">
      <p>
        <a href="#/">← Home</a>
      </p>
      <h1>Style weights</h1>
      <p>
        How much each style likes each kind of chord move, from 0 (never
        suggested near the top) to 5 (full strength). Tap a dot to set the
        weight; tap the last filled dot to take one off. Changes are saved in
        this browser.
      </p>
      <div class="actions">
        <button type="button" onClick={download}>
          Export as default
        </button>
        <button type="button" onClick={reset} disabled={edits === 0}>
          Reset to built-in
        </button>
        <span class="note">
          {edits === 0
            ? 'Using the built-in weights.'
            : `${edits} ${edits === 1 ? 'weight differs' : 'weights differ'} from the built-in ones (marked •).`}
        </span>
      </div>
      {narrow && (
        <div class="style-tabs" role="tablist" aria-label="Style">
          {set.styles.map((style) => (
            <button
              type="button"
              role="tab"
              key={style.id}
              aria-selected={style.id === shown}
              onClick={() => setShown(style.id)}
            >
              {style.name}
            </button>
          ))}
        </div>
      )}
      <div class="scroll">
        <table>
          <thead>
            <tr>
              <th>Move</th>
              {styles.map((style) => (
                <th key={style.id}>{style.name}</th>
              ))}
            </tr>
          </thead>
          {GROUPS.map((group) => (
            <tbody key={group.category}>
              <tr>
                <th class="group" colSpan={styles.length + 1}>
                  {group.label}
                </th>
              </tr>
              {group.rules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.label}</td>
                  {styles.map((style) => (
                    <td key={style.id}>
                      <Dots
                        label={`${rule.label} in ${style.name}`}
                        value={style.weights[rule.id]}
                        edited={isEdited(set, style.id, rule.id)}
                        onChange={(w) =>
                          setSet(setWeight(set, style.id, rule.id, w))
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </main>
  )
}

function Dots(props: {
  label: string
  value: number
  edited: boolean
  onChange: (weight: number) => void
}) {
  const { label, value, edited, onChange } = props
  return (
    <span
      class="dots"
      role="group"
      aria-label={`${label}: ${value} of ${MAX_WEIGHT}`}
    >
      {Array.from({ length: MAX_WEIGHT }, (_, i) => i + 1).map((dot) => (
        <button
          type="button"
          key={dot}
          class={dot <= value ? 'on' : ''}
          aria-label={`Set to ${tapDot(value, dot)}`}
          onClick={() => onChange(tapDot(value, dot))}
        >
          {dot <= value ? '●' : '○'}
        </button>
      ))}
      <span class="edited" aria-hidden="true">
        {edited ? '•' : ''}
      </span>
    </span>
  )
}
