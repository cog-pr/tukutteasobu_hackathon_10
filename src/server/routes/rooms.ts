import { Hono } from "hono";
import type { CreateRoomResponse, JoinRoomResponse } from "../../shared/types/api";
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
      const response = {
        roomCode,
        playerId: result.playerId,
        playerToken: result.playerToken,
      } satisfies CreateRoomResponse;
      return c.json(response);
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

  const response = {
    roomCode: roomCodeValidation.value.roomCode,
    playerId: result.playerId,
    playerToken: result.playerToken,
  } satisfies JoinRoomResponse;
  return c.json(response);
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
