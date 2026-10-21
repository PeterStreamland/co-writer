import { useEffect, useState } from 'preact/hooks'
import { AuditPage } from './audit/AuditPage.tsx'
import { Spike } from './spike/Spike.tsx'
import { Workspace } from './workspace/Workspace.tsx'

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
  return <Workspace />
}
