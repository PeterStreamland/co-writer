// Phase 1 exit criterion: the theory core imports no UI, audio or DOM code.
import { describe, expect, it } from 'vitest'

const sources = import.meta.glob<string>('../../src/theory/**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const allowedPackages = ['tonal']
const domGlobals = /\b(window|document|navigator|AudioContext|localStorage)\b/

describe('src/theory', () => {
  const files = Object.entries(sources)

  it('has source files', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files)('%s imports only theory code and tonal', (file, source) => {
    expect(file.endsWith('.tsx'), 'no JSX in the core').toBe(false)
    const imports = [...source.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1])
    for (const specifier of imports) {
      const ok =
        specifier.startsWith('./') ||
        allowedPackages.some(
          (p) => specifier === p || specifier.startsWith(`${p}/`),
        )
      expect(ok, `${file} imports ${specifier}`).toBe(true)
    }
    expect(source).not.toMatch(domGlobals)
  })
})
