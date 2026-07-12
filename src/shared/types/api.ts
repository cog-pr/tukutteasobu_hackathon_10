export type CreateRoomRequest = { playerName: string }
export type CreateRoomResponse = { roomCode: string; playerId: string; playerToken: string }
export type JoinRoomRequest = { playerName: string }
export type JoinRoomResponse = CreateRoomResponse
export type GetRoomRequest = { roomCode: string }
export type GetRoomResponse = { exists: boolean; canJoin: boolean; playerCount: number; hasStarted: boolean }
export type ApiErrorCode = 'INVALID_REQUEST' | 'INVALID_ROOM_CODE' | 'ROOM_NOT_FOUND' | 'ROOM_FULL' | 'GAME_ALREADY_STARTED' | 'NAME_ALREADY_USED'
export type ApiErrorResponse = { code: string; message: string }
