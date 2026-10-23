// A section's progression as a tree (SPEC 6.5, 12). The strip shows the
// active path through it; any slot can hold alternatives (sibling nodes).
// An alternative with no continuation of its own shares the slot's existing
// one, so the active path may run on through nodes that hang off a sibling;
// adding or changing a chord after such an alternative first copies the
// shared chords up to that point, giving it its own continuation.
// Every function returns a new progression and leaves its input alone.
import {
  layOut,
  type ChordName,
  type Dur,
  type Key,
  type MeterMap,
  type Note,
  type Placement,
} from '../theory'

// The exact shape a chord was added in, from a chord box: its notes with
// octaves, lowest first, and on guitar its frets (low string first, null
// for muted). Playback and the chord box use it, so a chosen inversion or
// neck position is heard and shown as picked.
export type ChordVoicing = {
  instrument: 'keyboard' | 'guitar'
  notes: Note[]
  frets?: (number | null)[]
}

// What else a chord can be added with.
export type AddOptions = {
  keyChange?: Key
  voicing?: ChordVoicing
  length?: Dur
}

export type ChordNode = {
  id: string
  chord: ChordName
  parent?: string
  children: string[]
  // A key change from this chord on: later chords are read in it (SPEC 6.4).
  keyChange?: Key
  voicing?: ChordVoicing
  // How long the chord lasts, as a fraction of a whole note (SPEC 12's
  // ChordEvent.length); one bar when unset.
  length?: Dur
  // The child the active path last went through, so switching back to this
  // node restores the branch that was showing.
  activeChild?: string
}

export type Progression = {
  nodes: Record<string, ChordNode>
  roots: string[]
  activePath: string[]
}

export const EMPTY_PROGRESSION: Progression = {
  nodes: {},
  roots: [],
  activePath: [],
}

function nextId(p: Progression): string {
  const numbers = Object.keys(p.nodes).map((id) => Number(id.slice(1)) || 0)
  return `n${Math.max(0, ...numbers) + 1}`
}

function node(p: Progression, id: string): ChordNode {
  const found = p.nodes[id]
  if (!found) throw new Error(`no chord node ${id}`)
  return found
}

// The chord nodes along the active path.
export function pathNodes(p: Progression): ChordNode[] {
  return p.activePath.map((id) => node(p, id))
}

// The chords of the active path up to and including a slot.
export function chordsUpTo(p: Progression, index: number): ChordName[] {
  return pathNodes(p)
    .slice(0, index + 1)
    .map((n) => n.chord)
}

// The alternatives at a slot: the node and its siblings, in order.
export function alternatives(p: Progression, index: number): string[] {
  const id = p.activePath[index]
  const parent = node(p, id).parent
  return parent === undefined ? p.roots : node(p, parent).children
}

// Whether the chord at a slot belongs to a sibling's continuation rather
// than to the chord before it on the path.
export function isShared(p: Progression, index: number): boolean {
  return (
    index > 0 && node(p, p.activePath[index]).parent !== p.activePath[index - 1]
  )
}

// The key a slot's chord is read in: the last key change before it on the
// path, or the section's key.
export function keyAt(p: Progression, index: number, sectionKey: Key): Key {
  let key = sectionKey
  pathNodes(p)
    .slice(0, index)
    .forEach((n) => {
      if (n.keyChange) key = n.keyChange
    })
  return key
}

// The key for what follows a slot: its own key change counts too.
export function keyAfter(p: Progression, index: number, sectionKey: Key): Key {
  return keyAt(p, index + 1, sectionKey)
}

// Records each node's active child along the path.
function remember(p: Progression): Progression {
  const nodes = { ...p.nodes }
  p.activePath.forEach((id, i) => {
    const child = p.activePath[i + 1]
    if (child && nodes[id].children.includes(child)) {
      nodes[id] = { ...nodes[id], activeChild: child }
    }
  })
  return { ...p, nodes }
}

// Copies shared chords up to a slot under the path's own nodes, so the
// alternative before them gets its own continuation.
function materialise(p: Progression, upTo: number): Progression {
  let out = p
  for (let i = 1; i <= upTo && i < out.activePath.length; i++) {
    if (!isShared(out, i)) continue
    const original = node(out, out.activePath[i])
    const parentId = out.activePath[i - 1]
    const id = nextId(out)
    const copy: ChordNode = {
      id,
      chord: original.chord,
      parent: parentId,
      children: [],
    }
    if (original.keyChange) copy.keyChange = original.keyChange
    if (original.voicing) copy.voicing = original.voicing
    if (original.length) copy.length = original.length
    const parent = node(out, parentId)
    const activePath = [...out.activePath]
    activePath[i] = id
    out = {
      ...out,
      nodes: {
        ...out.nodes,
        [id]: copy,
        [parentId]: { ...parent, children: [...parent.children, id] },
      },
      activePath,
    }
  }
  return out
}

function addNode(
  p: Progression,
  parentId: string | undefined,
  chord: ChordName,
  { keyChange, voicing, length }: AddOptions,
): { p: Progression; id: string } {
  const id = nextId(p)
  const added: ChordNode = { id, chord, children: [] }
  if (parentId !== undefined) added.parent = parentId
  if (keyChange) added.keyChange = keyChange
  if (voicing) added.voicing = voicing
  if (length) added.length = length
  const nodes = { ...p.nodes, [id]: added }
  let roots = p.roots
  if (parentId === undefined) roots = [...roots, id]
  else {
    const parent = node(p, parentId)
    nodes[parentId] = { ...parent, children: [...parent.children, id] }
  }
  return { p: { ...p, nodes, roots }, id }
}

// Adds a chord after a slot (-1 for before the first). After the last chord
// it extends the path; anywhere else it becomes an alternative at the next
// slot, sharing that slot's continuation. It can carry a key change (a
// pivot) and the exact shape it was picked in.
export function addAfter(
  p: Progression,
  index: number,
  chord: ChordName,
  options: AddOptions = {},
): Progression {
  const own = index >= 0 ? materialise(p, index) : p
  const parentId = index >= 0 ? own.activePath[index] : undefined
  const added = addNode(own, parentId, chord, options)
  const rest = own.activePath.slice(index + 2)
  return remember({
    ...added.p,
    activePath: [...own.activePath.slice(0, index + 1), added.id, ...rest],
  })
}

// Adds several chords in turn after a slot, as typed (Phase 5 task 1) or
// taken from a lens: the first as addAfter would, each of the rest after the
// one before, each with its own options. After -1 the chords make a new
// branch from the start, leaving the old one as the first slot's
// alternative.
export function addAllAfter(
  p: Progression,
  index: number,
  chords: ChordName[],
  options: AddOptions[] = [],
): Progression {
  return chords.reduce(
    (out, chord, i) => addAfter(out, index + i, chord, options[i]),
    p,
  )
}

// The path on from a node: its last active child, else its first, and so on.
function continuation(p: Progression, id: string): string[] {
  const path: string[] = []
  let current = node(p, id)
  while (current.children.length) {
    const next =
      current.activeChild && current.children.includes(current.activeChild)
        ? current.activeChild
        : current.children[0]
    path.push(next)
    current = node(p, next)
  }
  return path
}

// Switches a slot to the next (step 1) or previous (step -1) alternative.
// The chords after it stay unless the alternative has its own continuation.
export function switchAt(
  p: Progression,
  index: number,
  step: number,
): Progression {
  const options = alternatives(p, index)
  if (options.length < 2) return p
  const at = options.indexOf(p.activePath[index])
  const chosen = options[(at + step + options.length) % options.length]
  const head = [...p.activePath.slice(0, index), chosen]
  const own = continuation(p, chosen)
  const activePath = own.length
    ? [...head, ...own]
    : [...head, ...p.activePath.slice(index + 1)]
  return remember({ ...p, activePath })
}

// Puts a chord between a slot and the next one (a passing chord): the next
// chord and everything after it move along one, under the new chord. Other
// alternatives at the next slot stay where they were.
export function insertBetween(
  p: Progression,
  index: number,
  chord: ChordName,
  options: AddOptions = {},
): Progression {
  if (index < 0 || index + 1 >= p.activePath.length) {
    throw new Error(`no chord after slot ${index} to insert before`)
  }
  const own = materialise(p, index + 1)
  const beforeId = own.activePath[index]
  const afterId = own.activePath[index + 1]
  const id = nextId(own)
  const inserted: ChordNode = {
    id,
    chord,
    parent: beforeId,
    children: [afterId],
  }
  if (options.keyChange) inserted.keyChange = options.keyChange
  if (options.voicing) inserted.voicing = options.voicing
  if (options.length) inserted.length = options.length
  const before = node(own, beforeId)
  const nodes = {
    ...own.nodes,
    [id]: inserted,
    [beforeId]: {
      ...before,
      children: before.children.map((c) => (c === afterId ? id : c)),
    },
    [afterId]: { ...node(own, afterId), parent: id },
  }
  const activePath = [
    ...own.activePath.slice(0, index + 1),
    id,
    ...own.activePath.slice(index + 1),
  ]
  return remember({ ...own, nodes, activePath })
}

// Puts several chords, in order, between a slot and the next one.
export function insertAllBetween(
  p: Progression,
  index: number,
  chords: ChordName[],
): Progression {
  return chords.reduce(
    (out, chord, i) => insertBetween(out, index + i, chord),
    p,
  )
}

// Changes the chord at a slot, giving it its own copy first if it was
// shared. The old chord's shape goes with it, replaced by the new chord's
// when it has one (a chord box's Replace). Its length and any key change
// stay.
export function changeAt(
  p: Progression,
  index: number,
  chord: ChordName,
  voicing?: ChordVoicing,
): Progression {
  const own = materialise(p, index)
  const id = own.activePath[index]
  const changed: ChordNode = { ...node(own, id), chord }
  delete changed.voicing
  if (voicing) changed.voicing = voicing
  return { ...own, nodes: { ...own.nodes, [id]: changed } }
}

// Sets the key that the chords after a slot are read in, giving the slot its
// own copy first if it was shared.
export function setKeyChangeAt(
  p: Progression,
  index: number,
  key: Key,
): Progression {
  const own = materialise(p, index)
  const id = own.activePath[index]
  return {
    ...own,
    nodes: { ...own.nodes, [id]: { ...node(own, id), keyChange: key } },
  }
}

// Sets how long the chord at a slot lasts, giving it its own copy first if
// it was shared. No length means one bar, of whatever meter its bar is in.
export function setLengthAt(
  p: Progression,
  index: number,
  length: Dur | undefined,
): Progression {
  const own = materialise(p, index)
  const id = own.activePath[index]
  const changed: ChordNode = { ...node(own, id), length }
  if (!length) delete changed.length
  return { ...own, nodes: { ...own.nodes, [id]: changed } }
}

// Where each chord on the active path falls in the bars, and how long it
// lasts there (SPEC 7.1).
export function timingOf(p: Progression, time: MeterMap): Placement[] {
  return layOut(
    pathNodes(p).map((n) => n.length),
    time,
  )
}

// Makes the path through a node active (the tree view): its ancestors, the
// node, and its continuation.
export function selectNode(p: Progression, id: string): Progression {
  const up: string[] = []
  let current: ChordNode | undefined = node(p, id)
  while (current) {
    up.unshift(current.id)
    current = current.parent === undefined ? undefined : node(p, current.parent)
  }
  return remember({ ...p, activePath: [...up, ...continuation(p, id)] })
}

// Whether a value read back from storage is a usable progression.
export function isProgression(value: unknown): value is Progression {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Progression
  if (!Array.isArray(p.roots) || !Array.isArray(p.activePath)) return false
  if (typeof p.nodes !== 'object' || p.nodes === null) return false
  const ids = Object.keys(p.nodes)
  const known = (id: unknown) => typeof id === 'string' && ids.includes(id)
  return (
    p.roots.every(known) &&
    p.activePath.every(known) &&
    Object.values(p.nodes).every(
      (n) =>
        typeof n?.chord?.root?.letter === 'string' &&
        typeof n.chord.quality === 'string' &&
        Array.isArray(n.children) &&
        n.children.every(known) &&
        (n.parent === undefined || known(n.parent)),
    )
  )
}
