import { useEffect, useState } from 'preact/hooks'
import { AuditPage } from './audit/AuditPage.tsx'
import { StylesPage } from './workspace/StylesPage.tsx'
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
  if (hash === '#/audit') return <AuditPage />
  if (hash === '#/styles') return <StylesPage />
  return <Workspace />
}
