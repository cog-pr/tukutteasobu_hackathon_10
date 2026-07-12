import { Hono } from "hono";
import type { Env } from "../types/env";

// WorkerからDurable Objectを呼び出せることを確認するための開発用API。
// TODO: 後続Issueで正式なルーム参照APIに置き換えるか、不要になった時点で削除する。
export const devRooms = new Hono<{ Bindings: Env }>();

devRooms.get("/:roomCode/state", async (c) => {
  if (c.env.ENVIRONMENT === "production") {
    return c.notFound();
  }

  const roomCode = c.req.param("roomCode");
  const stub = c.env.GAME_ROOM.getByName(roomCode);
  const state = await stub.getState(roomCode);

  return c.json(state);
});
