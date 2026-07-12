import type { ApiErrorResponse } from '../../shared/types/api'

export type ApiClientErrorCode =
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE'
  | 'INVALID_REQUEST'
  | 'INVALID_ROOM_CODE'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'GAME_ALREADY_STARTED'
  | 'NAME_ALREADY_USED'
  | 'UNKNOWN_ERROR'

const ERROR_MESSAGES: Record<ApiClientErrorCode, string> = {
  NETWORK_ERROR: '通信に失敗しました。接続を確認して、もう一度お試しください。',
  INVALID_RESPONSE: 'サーバーから正しい応答を受け取れませんでした。',
  INVALID_REQUEST: '入力内容を確認してください。',
  INVALID_ROOM_CODE: 'ルームコードが正しくありません。',
  ROOM_NOT_FOUND: 'そのルームは見つかりませんでした。',
  ROOM_FULL: 'このルームは満員です。',
  GAME_ALREADY_STARTED: 'このゲームはすでに始まっています。',
  NAME_ALREADY_USED: '同じ名前のプレイヤーがいます。',
  UNKNOWN_ERROR: '予期しないエラーが発生しました。もう一度お試しください。',
}

const API_ERROR_CODES = new Set<ApiClientErrorCode>([
  'INVALID_REQUEST',
  'INVALID_ROOM_CODE',
  'ROOM_NOT_FOUND',
  'ROOM_FULL',
  'GAME_ALREADY_STARTED',
  'NAME_ALREADY_USED',
])

export class ApiClientError extends Error {
  readonly code: ApiClientErrorCode

  constructor(code: ApiClientErrorCode, message = ERROR_MESSAGES[code]) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
  }
}

export function getApiErrorMessage(error: unknown): string {
  return error instanceof ApiClientError
    ? error.message
    : ERROR_MESSAGES.UNKNOWN_ERROR
}

type ResponseValidator<T> = (value: unknown) => value is T

const getApiBaseUrl = (): string => (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isApiErrorResponse = (value: unknown): value is ApiErrorResponse =>
  isRecord(value) && typeof value.code === 'string' && typeof value.message === 'string'

function toApiError(value: unknown): ApiClientError {
  if (!isApiErrorResponse(value)) return new ApiClientError('INVALID_RESPONSE')
  const code = API_ERROR_CODES.has(value.code as ApiClientErrorCode)
    ? (value.code as ApiClientErrorCode)
    : 'UNKNOWN_ERROR'
  return new ApiClientError(code)
}

export async function requestJson<T>(
  path: string,
  init: RequestInit,
  validateResponse: ResponseValidator<T>,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...init.headers,
      },
    })
  } catch {
    throw new ApiClientError('NETWORK_ERROR')
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.includes('application/json')) {
    throw new ApiClientError('INVALID_RESPONSE')
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new ApiClientError('INVALID_RESPONSE')
  }

  if (!response.ok) throw toApiError(body)
  if (!validateResponse(body)) throw new ApiClientError('INVALID_RESPONSE')
  return body
}
