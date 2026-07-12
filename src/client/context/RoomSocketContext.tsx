import { createContext, useContext, type ReactNode } from 'react'
import { useRoomSocket } from '../hooks/useRoomSocket'

type RoomSocketValue = ReturnType<typeof useRoomSocket>

const RoomSocketContext = createContext<RoomSocketValue | null>(null)

export function RoomSocketProvider({ children }: { children: ReactNode }) {
  const value = useRoomSocket()
  return <RoomSocketContext.Provider value={value}>{children}</RoomSocketContext.Provider>
}

export function useRoomSocketContext(): RoomSocketValue {
  const value = useContext(RoomSocketContext)
  if (!value) throw new Error('useRoomSocketContext must be used within a RoomSocketProvider')
  return value
}
