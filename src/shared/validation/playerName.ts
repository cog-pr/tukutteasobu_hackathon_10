export type PlayerNameValidationResult =
  | {
      valid: true;
      value: string;
    }
  | {
      valid: false;
      message: string;
    };

const MAX_PLAYER_NAME_LENGTH = 10;
const LINE_BREAK_PATTERN = /[\r\n\u2028\u2029]/u;

/**
 * プレイヤー名を正規化し、ゲームで使用できるか検証します。
 */
export function validatePlayerName(
  name: string,
): PlayerNameValidationResult {
  if (LINE_BREAK_PATTERN.test(name)) {
    return {
      valid: false,
      message: "プレイヤー名に改行は使用できません",
    };
  }

  const value = name.trim();

  if (value.length === 0) {
    return {
      valid: false,
      message: "プレイヤー名を入力してください",
    };
  }

  if (Array.from(value).length > MAX_PLAYER_NAME_LENGTH) {
    return {
      valid: false,
      message: "プレイヤー名は10文字以内で入力してください",
    };
  }

  return { valid: true, value };
}
