import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createRoom } from '../client/services/rooms'
import { savePlayerSession, type PlayerSession } from '../client/services/playerSession'
import { getApiErrorMessage } from '../client/services/apiClient'
import { useSubmitLock } from '../client/hooks/useSubmitLock'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PhoneScreen } from '../components/PhoneScreen'
import { RoomCodeBadge } from '../components/RoomCodeBadge'
import { TextField } from '../components/TextField'
import { GAME_CONFIG } from '../shared/constants'
import { validatePlayerName } from '../shared/validation/playerName'

export function CreateRoomPage() {
  const [playerName, setPlayerName] = useState('')
  const [session, setSession] = useState<PlayerSession | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { isSubmitting, run } = useSubmitLock()
  const nameValidation = validatePlayerName(playerName)

  const handleCreate = async () => {
    if (!nameValidation.valid) {
      setErrorMessage(nameValidation.message)
      return
    }

    setErrorMessage(null)
    try {
      const response = await run(() => createRoom({ playerName: nameValidation.value }))
      if (!response) return
      savePlayerSession(response)
      setSession(response)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  if (session) {
    return (
      <PhoneScreen className="gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/rooms/new"
            aria-label="戻る"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-neutral-300 bg-white text-neutral-700"
          >
            ←
          </Link>
          <h1 className="text-lg font-bold text-neutral-900">ルームを作成しました</h1>
        </div>

        <RoomCodeBadge roomCode={session.roomCode} />
        <p className="text-sm text-neutral-500">このコードをほかのプレイヤーに伝えてください。</p>

        <div className="mt-auto flex flex-col gap-3">
          <Link to="/lobby">
            <Button variant="primary">ロビーへ進む</Button>
          </Link>
        </div>
      </PhoneScreen>
    )
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
        <h1 className="text-lg font-bold text-neutral-900">ルームを作る</h1>
      </div>

      <Card className="text-sm leading-relaxed text-neutral-500">
        ルームを作成すると、6桁のコードが発行されます。
        <br />
        そのコードを友達に共有して一緒に遊びましょう。
      </Card>

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

      <div className="grid h-16 place-items-center rounded-xl border border-dashed border-neutral-300 text-center text-xs text-neutral-400">
        （追加オプション予定）
        <br />
        最大プレイヤー数など
      </div>

      {errorMessage && <p role="alert" className="text-sm font-bold text-rose-600">{errorMessage}</p>}

      <div className="mt-auto flex flex-col gap-3">
        <Button variant="primary" disabled={!nameValidation.valid || isSubmitting} onClick={handleCreate}>
          {isSubmitting ? 'ルームを作成しています…' : 'ルームを作成する'}
        </Button>
      </div>
    </PhoneScreen>
  )
}
