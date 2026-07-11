import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PhoneScreen } from '../components/PhoneScreen'
import { RoomCodeBadge } from '../components/RoomCodeBadge'
import { TextField } from '../components/TextField'
import { DUMMY_ROOM_CODE } from '../data/dummyData'
import { useLocalGame } from '../client/hooks/useLocalGame'

const MAX_NAME_LENGTH = 10

export function CreateRoomPage() {
  const { actions } = useLocalGame()
  const [playerName, setPlayerName] = useState('')
  const [created, setCreated] = useState(false)

  const isNameValid = playerName.trim().length > 0 && Array.from(playerName).length <= MAX_NAME_LENGTH

  if (created) {
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

        <RoomCodeBadge roomCode={DUMMY_ROOM_CODE} />

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
        maxLength={MAX_NAME_LENGTH}
        value={playerName}
        onChange={(event) => setPlayerName(event.target.value)}
        placeholder="あなたの名前を入力"
        helperText="10文字以内"
        errorMessage={
          Array.from(playerName).length > MAX_NAME_LENGTH ? '10文字以内で入力してください。' : undefined
        }
      />

      <div className="grid h-16 place-items-center rounded-xl border border-dashed border-neutral-300 text-center text-xs text-neutral-400">
        （追加オプション予定）
        <br />
        最大プレイヤー数など
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <Button variant="primary" disabled={!isNameValid} onClick={() => { actions.createPlayers(playerName); setCreated(true) }}>
          ルームを作成する
        </Button>
      </div>
    </PhoneScreen>
  )
}
