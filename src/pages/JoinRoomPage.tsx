import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { PhoneScreen } from '../components/PhoneScreen'
import { RoomCodeInput } from '../components/RoomCodeInput'
import { TextField } from '../components/TextField'

const MAX_NAME_LENGTH = 10
const ROOM_CODE_LENGTH = 6

export function JoinRoomPage() {
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')

  const isRoomCodeValid = roomCode.length === ROOM_CODE_LENGTH
  const isNameValid = playerName.trim().length > 0 && Array.from(playerName).length <= MAX_NAME_LENGTH
  const canJoin = isRoomCodeValid && isNameValid

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
        <RoomCodeInput value={roomCode} onChange={setRoomCode} length={ROOM_CODE_LENGTH} />
        <p className="mt-1 text-center text-xs text-neutral-400">友達から受け取った6桁のコードを入力</p>
      </div>

      <TextField
        label="プレイヤー名"
        maxLength={MAX_NAME_LENGTH}
        value={playerName}
        onChange={(event) => setPlayerName(event.target.value)}
        placeholder="あなたの名前を入力"
        helperText="10文字以内"
        errorMessage={
          Array.from(playerName).length > MAX_NAME_LENGTH ? '10文字以内で入力してください。' : undefined
        }
      />

      <div className="mt-auto flex flex-col gap-3">
        <Button variant="primary" disabled={!canJoin} onClick={() => navigate('/lobby')}>
          参加する
        </Button>
      </div>
    </PhoneScreen>
  )
}
