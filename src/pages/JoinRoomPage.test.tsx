// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { JoinRoomResponse } from '../shared/types/api'
import { ApiClientError } from '../client/services/apiClient'
import { JoinRoomPage } from './JoinRoomPage'

const { joinRoomMock, savePlayerSessionMock } = vi.hoisted(() => ({
  joinRoomMock: vi.fn(),
  savePlayerSessionMock: vi.fn(),
}))

vi.mock('../client/services/rooms', () => ({ joinRoom: joinRoomMock }))
vi.mock('../client/services/playerSession', () => ({
  savePlayerSession: savePlayerSessionMock,
}))

const session: JoinRoomResponse = {
  roomCode: 'AB37X2',
  playerId: 'player_2',
  playerToken: 'token_2',
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/rooms/join']}>
      <Routes>
        <Route path="/rooms/join" element={<JoinRoomPage />} />
        <Route path="/lobby" element={<div>ロビー画面</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function fillValidForm() {
  for (const [index, character] of Array.from('ab37x2').entries()) {
    fireEvent.change(screen.getByLabelText(`ルームコード${index + 1}文字目`), {
      target: { value: character },
    })
  }
  fireEvent.change(screen.getByPlaceholderText('あなたの名前を入力'), {
    target: { value: ' さとう ' },
  })
}

describe('JoinRoomPage', () => {
  beforeEach(() => {
    joinRoomMock.mockReset()
    savePlayerSessionMock.mockReset()
  })

  afterEach(cleanup)

  it('正規化したコードで参加し、成功後だけセッション保存と遷移を行う', async () => {
    let resolveRequest!: (value: JoinRoomResponse) => void
    joinRoomMock.mockImplementation(
      () => new Promise<JoinRoomResponse>((resolve) => { resolveRequest = resolve }),
    )
    renderPage()
    fillValidForm()

    const submit = screen.getByRole('button', { name: '参加する' })
    fireEvent.click(submit)
    fireEvent.click(submit)

    expect(joinRoomMock).toHaveBeenCalledOnce()
    expect(joinRoomMock).toHaveBeenCalledWith('AB37X2', { playerName: 'さとう' })
    expect((submit as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText('参加しています…')).toBeTruthy()
    expect(screen.queryByText('ロビー画面')).toBeNull()

    await act(async () => { resolveRequest(session) })

    expect(savePlayerSessionMock).toHaveBeenCalledWith(session)
    await waitFor(() => expect(screen.getByText('ロビー画面')).toBeTruthy())
  })

  it('参加失敗時はロビーへ移動せずAPIエラーを表示する', async () => {
    joinRoomMock.mockRejectedValue(new ApiClientError('ROOM_FULL'))
    renderPage()
    fillValidForm()

    fireEvent.click(screen.getByRole('button', { name: '参加する' }))

    expect((await screen.findByRole('alert')).textContent).toBe('このルームは満員です。')
    expect(savePlayerSessionMock).not.toHaveBeenCalled()
    expect(screen.queryByText('ロビー画面')).toBeNull()
  })

  it('不正なルームコードではAPIを呼ばない', () => {
    renderPage()
    for (const [index, character] of Array.from('O0I1XX').entries()) {
      fireEvent.change(screen.getByLabelText(`ルームコード${index + 1}文字目`), {
        target: { value: character },
      })
    }
    fireEvent.change(screen.getByPlaceholderText('あなたの名前を入力'), {
      target: { value: 'さとう' },
    })

    expect((screen.getByRole('button', { name: '参加する' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(/使用できる文字/)).toBeTruthy()
    expect(joinRoomMock).not.toHaveBeenCalled()
  })
})
