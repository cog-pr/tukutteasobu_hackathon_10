import { DurableObject } from "cloudflare:workers";
import type { Env } from "../types/env";

// TODO: 共通型整備Issueのマージ後にRoomStateへ置き換える
export type InitialRoomState = {
  version: number;
  roomCode: string;
  phase: "LOBBY";
  createdAt: number;
  updatedAt: number;
};

const ROOM_STATE_KEY = "roomState";

export class GameRoom extends DurableObject<Env> {
  async getState(roomCode: string): Promise<InitialRoomState> {
    const existing = await this.ctx.storage.get<InitialRoomState>(ROOM_STATE_KEY);
    if (existing) {
      return existing;
    }

    const now = Date.now();
    const initialState: InitialRoomState = {
      version: 1,
      roomCode,
      phase: "LOBBY",
      createdAt: now,
      updatedAt: now,
    };

    await this.ctx.storage.put(ROOM_STATE_KEY, initialState);
    return initialState;
  }
}
