import { useEffect, useState } from 'preact/hooks'

// True on a phone-width screen (40rem or less), following the window as it
// resizes.
export function useNarrow(): boolean {
  const query = '(max-width: 40rem)'
  const [narrow, setNarrow] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const list = matchMedia(query)
    const onChange = () => setNarrow(list.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [])
  return narrow
}
