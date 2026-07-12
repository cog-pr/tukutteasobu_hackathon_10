import type { PublicRoomState } from './game'
export type ClientMessage =
  | { type: 'READY'; ready: boolean }
  | { type: 'START_GAME' }
  | { type: 'SUBMIT_ANSWER'; answer: string }
  | { type: 'CAST_VOTE'; choice: 'A' | 'B' }
  | { type: 'REVENGE_PROGRESS'; value: number }
  | { type: 'REVENGE_RESULT'; result: 'success' | 'failure' }
  | { type: 'REMATCH' }
  | { type: 'PING' }
export type ServerMessage =
  | { type: 'STATE_SYNC'; state: PublicRoomState }
  | { type: 'ERROR'; code: string; message: string }
  | { type: 'PONG' }
