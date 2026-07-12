import type { RoomState } from "../../shared/types/game";

export type PlayerCredentials = {
  playerId: string;
  playerToken: string;
};

export type CreateRoomResult =
  | ({ ok: true; room: RoomState } & PlayerCredentials)
  | { ok: false; code: "ROOM_CODE_TAKEN" };

export type JoinRoomErrorCode = "ROOM_NOT_FOUND" | "ROOM_FULL" | "GAME_ALREADY_STARTED" | "NAME_ALREADY_USED";

export type JoinRoomResult =
  | ({ ok: true; room: RoomState } & PlayerCredentials)
  | { ok: false; code: JoinRoomErrorCode };
