import { ROOM_CODE_CHARACTERS, ROOM_CODE_LENGTH } from "../../shared/constants";

// ROOM_CODE_CHARACTERS.length is 32 (a power of two), so `byte % length` maps
// the 256 possible byte values onto it with no modulo bias.
export function generateRoomCode(): string {
  const bytes = new Uint8Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(bytes);

  let code = "";
  for (const byte of bytes) {
    code += ROOM_CODE_CHARACTERS[byte % ROOM_CODE_CHARACTERS.length];
  }

  return code;
}
