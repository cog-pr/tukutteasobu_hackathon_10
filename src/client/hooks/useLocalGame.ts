import { useSyncExternalStore } from 'react'
import { localGameStore } from '../stores/localGameStore'

export function useLocalGame() {
  return { state: useSyncExternalStore(localGameStore.subscribe, localGameStore.getSnapshot), actions: localGameStore }
}
