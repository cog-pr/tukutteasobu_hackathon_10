import { Hono } from "hono";
import { validateCreateRoomRequest, validateGetRoomRequest, validateJoinRoomRequest } from "../../shared/validation/api";
import { apiErrorStatus, fixedApiError } from "../lib/apiError";
import { generateRoomCode } from "../lib/roomCode";
import type { Env } from "../types/env";

const MAX_ROOM_CODE_ATTEMPTS = 20;

export const rooms = new Hono<{ Bindings: Env }>();

rooms.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const validation = validateCreateRoomRequest(body);
  if (!validation.valid) {
    return c.json({ code: "INVALID_REQUEST", message: validation.message }, 400);
  }

  const { playerName } = validation.value;

  for (let attempt = 0; attempt < MAX_ROOM_CODE_ATTEMPTS; attempt++) {
    const roomCode = generateRoomCode();
    const stub = c.env.GAME_ROOM.getByName(roomCode);
    const result = await stub.createRoom(roomCode, playerName);

    if (result.ok) {
      return c.json({ roomCode, playerId: result.playerId, playerToken: result.playerToken });
    }
  }

  return c.json({ code: "INTERNAL_ERROR", message: "ルームを作成できませんでした。もう一度お試しください。" }, 500);
});

rooms.post("/:roomCode/join", async (c) => {
  const roomCodeValidation = validateGetRoomRequest({ roomCode: c.req.param("roomCode") });
  if (!roomCodeValidation.valid) {
    return c.json({ code: "INVALID_ROOM_CODE", message: roomCodeValidation.message }, 400);
  }

  const body = await c.req.json().catch(() => null);
  const nameValidation = validateJoinRoomRequest(body);
  if (!nameValidation.valid) {
    return c.json({ code: "INVALID_REQUEST", message: nameValidation.message }, 400);
  }

  const stub = c.env.GAME_ROOM.getByName(roomCodeValidation.value.roomCode);
  const result = await stub.joinRoom(nameValidation.value.playerName);

  if (!result.ok) {
    return c.json(fixedApiError(result.code), apiErrorStatus(result.code));
  }

  return c.json({ playerId: result.playerId, playerToken: result.playerToken });
});

rooms.get("/:roomCode", async (c) => {
  const roomCodeValidation = validateGetRoomRequest({ roomCode: c.req.param("roomCode") });
  if (!roomCodeValidation.valid) {
    return c.json({ code: "INVALID_ROOM_CODE", message: roomCodeValidation.message }, 400);
  }

  const stub = c.env.GAME_ROOM.getByName(roomCodeValidation.value.roomCode);
  const info = await stub.getRoomInfo();

  return c.json(info);
});
