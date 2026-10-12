// Hash-based routing so GitHub Pages needs no server rewrites.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { GameMode, Store } from './types'
import { t } from './i18n'
import { addRecord, loadStore, saveStore } from './storage'
import { loadBundled, sessionWords } from './wordlists'
import Home from './screens/Home'
import Parent from './screens/Parent'
import Round from './screens/Round'

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function App() {
  const bundled = useMemo(loadBundled, [])
  const [initial] = useState(loadStore)
  const [store, setStore] = useState<Store>(initial.store)
  const [storageWarn, setStorageWarn] = useState(initial.degraded)
  const [session, setSession] = useState<{ listId: string; mode: GameMode } | null>(null)
  const hash = useHash()

  const lists = useMemo(() => [...bundled, ...store.customLists], [bundled, store.customLists])
  const [listId, setListId] = useState(lists[0]?.id ?? '')

  // Ref-based persist keeps onRecord callbacks from going stale mid-round.
  const storeRef = useRef(store)
  storeRef.current = store
  const persist = (fn: (s: Store) => Store) => {
    const next = fn(storeRef.current)
    storeRef.current = next
    setStore(next)
    if (!saveStore(next)) setStorageWarn(true)
  }

  let screen
  if (hash.startsWith('#/parent')) {
    screen = <Parent allLists={lists} store={store} persist={persist} onBack={() => (window.location.hash = '#/')} />
  } else if (hash.startsWith('#/game') && session) {
    const list = lists.find((l) => l.id === session.listId)
    const words = list ? sessionWords(list, store.selectedWords) : []
    screen =
      list && words.length > 0 ? (
        <Round
          list={list}
          words={words}
          mode={session.mode}
          settings={store.settings}
          onExit={() => {
            setSession(null)
            window.location.hash = '#/'
          }}
          onRecord={(a) => persist((st) => addRecord(st, a))}
        />
      ) : (
        <HomeScreen />
      )
  } else {
    screen = <HomeScreen />
  }

  function HomeScreen() {
    return (
      <Home
        lists={lists}
        store={store}
        listId={listId}
        setListId={setListId}
        onParent={() => (window.location.hash = '#/parent')}
        onStart={(mode) => {
          const list = lists.find((l) => l.id === listId) ?? lists[0]
          if (!list) return
          setSession({ listId: list.id, mode })
          window.location.hash = '#/game'
        }}
      />
    )
  }

  return (
    <>
      {storageWarn && <div className="banner">{t.pmStorageWarn}</div>}
      {screen}
    </>
  )
}
