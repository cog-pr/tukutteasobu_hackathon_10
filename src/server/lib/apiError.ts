import type { ApiErrorCode, ApiErrorResponse } from "../../shared/types/api";

type ApiErrorStatus = 400 | 404 | 409;

const STATUS_BY_CODE: Record<ApiErrorCode, ApiErrorStatus> = {
  INVALID_REQUEST: 400,
  INVALID_ROOM_CODE: 400,
  ROOM_NOT_FOUND: 404,
  ROOM_FULL: 409,
  GAME_ALREADY_STARTED: 409,
  NAME_ALREADY_USED: 409,
};

const MESSAGE_BY_CODE: Record<Exclude<ApiErrorCode, "INVALID_REQUEST" | "INVALID_ROOM_CODE">, string> = {
  ROOM_NOT_FOUND: "そのルームは見つかりませんでした",
  ROOM_FULL: "このルームは満員です",
  GAME_ALREADY_STARTED: "このゲームはすでに始まっています",
  NAME_ALREADY_USED: "同じ名前のプレイヤーがいます",
};

export function apiErrorStatus(code: ApiErrorCode): ApiErrorStatus {
  return STATUS_BY_CODE[code];
}

export function fixedApiError(code: keyof typeof MESSAGE_BY_CODE): ApiErrorResponse {
  return { code, message: MESSAGE_BY_CODE[code] };
}
