import { useEffect, useState } from 'preact/hooks'
import { Spike } from './spike/Spike.tsx'

function useHash() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const onChange = () => setHash(location.hash)
    addEventListener('hashchange', onChange)
    return () => removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export function App() {
  if (useHash() === '#/spike') return <Spike />
  return (
    <main>
      <h1>Co-Writer is running</h1>
      <p>
        <a href="#/spike">Library spike (temporary)</a>
      </p>
    </main>
  )
}
