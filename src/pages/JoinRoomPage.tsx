import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSubmitLock } from '../client/hooks/useSubmitLock'
import { getApiErrorMessage } from '../client/services/apiClient'
import { savePlayerSession } from '../client/services/playerSession'
import { joinRoom } from '../client/services/rooms'
import { Button } from '../components/Button'
import { PhoneScreen } from '../components/PhoneScreen'
import { RoomCodeInput } from '../components/RoomCodeInput'
import { TextField } from '../components/TextField'
import { GAME_CONFIG, ROOM_CODE_LENGTH } from '../shared/constants'
import { validatePlayerName } from '../shared/validation/playerName'
import { validateRoomCode } from '../shared/validation/roomCode'

export function JoinRoomPage() {
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { isSubmitting, run } = useSubmitLock()
  const roomCodeValidation = validateRoomCode(roomCode)
  const nameValidation = validatePlayerName(playerName)
  const canJoin = roomCodeValidation.valid && nameValidation.valid

  const handleJoin = async () => {
    if (!roomCodeValidation.valid) {
      setErrorMessage(roomCodeValidation.message)
      return
    }
    if (!nameValidation.valid) {
      setErrorMessage(nameValidation.message)
      return
    }

    setErrorMessage(null)
    try {
      const response = await run(() =>
        joinRoom(roomCodeValidation.value, { playerName: nameValidation.value }),
      )
      if (!response) return
      savePlayerSession(response)
      navigate('/lobby')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  return (
    <PhoneScreen className="gap-4">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="戻る"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-neutral-300 bg-white text-neutral-700"
        >
          ←
        </Link>
        <h1 className="text-lg font-bold text-neutral-900">ルームに参加</h1>
      </div>

      <div>
        <span className="mb-1 block text-sm font-bold text-neutral-700">ルームコード（6桁）</span>
        <RoomCodeInput
          value={roomCode}
          onChange={setRoomCode}
          length={ROOM_CODE_LENGTH}
          disabled={isSubmitting}
        />
        <p className={`mt-1 text-center text-xs ${roomCode.length > 0 && !roomCodeValidation.valid ? 'text-rose-500' : 'text-neutral-400'}`}>
          {roomCode.length > 0 && !roomCodeValidation.valid
            ? roomCodeValidation.message
            : '友達から受け取った6桁のコードを入力'}
        </p>
      </div>

      <TextField
        label="プレイヤー名"
        maxLength={GAME_CONFIG.maxPlayerNameLength}
        value={playerName}
        disabled={isSubmitting}
        onChange={(event) => setPlayerName(event.target.value)}
        placeholder="あなたの名前を入力"
        helperText={`${GAME_CONFIG.maxPlayerNameLength}文字以内`}
        errorMessage={playerName.length > 0 && !nameValidation.valid ? nameValidation.message : undefined}
      />

      {errorMessage && <p role="alert" className="text-sm font-bold text-rose-600">{errorMessage}</p>}

      <div className="mt-auto flex flex-col gap-3">
        <Button variant="primary" disabled={!canJoin || isSubmitting} onClick={handleJoin}>
          {isSubmitting ? '参加しています…' : '参加する'}
        </Button>
      </div>
    </PhoneScreen>
  )
}
