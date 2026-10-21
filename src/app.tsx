import { useEffect, useState } from 'preact/hooks'
import { AuditPage } from './audit/AuditPage.tsx'
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
  const hash = useHash()
  if (hash === '#/spike') return <Spike />
  if (hash === '#/audit') return <AuditPage />
  return (
    <main>
      <h1>Co-Writer is running</h1>
      <p>
        <a href="#/audit">Phase 1 audit: every key's scales and chords</a>
      </p>
      <p>
        <a href="#/spike">Library spike (temporary)</a>
      </p>
    </main>
  )
}
