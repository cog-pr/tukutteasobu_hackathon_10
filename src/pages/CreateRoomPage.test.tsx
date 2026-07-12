// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { CreateRoomResponse } from '../shared/types/api'
import { ApiClientError } from '../client/services/apiClient'
import { CreateRoomPage } from './CreateRoomPage'

const { createRoomMock, savePlayerSessionMock } = vi.hoisted(() => ({
  createRoomMock: vi.fn(),
  savePlayerSessionMock: vi.fn(),
}))

vi.mock('../client/services/rooms', () => ({ createRoom: createRoomMock }))
vi.mock('../client/services/playerSession', () => ({
  savePlayerSession: savePlayerSessionMock,
}))

const session: CreateRoomResponse = {
  roomCode: 'AB37X2',
  playerId: 'player_1',
  playerToken: 'token_1',
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/rooms/new']}>
      <Routes>
        <Route path="/rooms/new" element={<CreateRoomPage />} />
        <Route path="/lobby" element={<div>ロビー画面</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CreateRoomPage', () => {
  beforeEach(() => {
    createRoomMock.mockReset()
    savePlayerSessionMock.mockReset()
  })

  afterEach(cleanup)

  it('実APIの完了後にセッションとルームコードを表示し、ロビーへ進める', async () => {
    let resolveRequest!: (value: CreateRoomResponse) => void
    createRoomMock.mockImplementation(
      () => new Promise<CreateRoomResponse>((resolve) => { resolveRequest = resolve }),
    )
    renderPage()

    fireEvent.change(screen.getByPlaceholderText('あなたの名前を入力'), {
      target: { value: ' たけし ' },
    })
    const submit = screen.getByRole('button', { name: 'ルームを作成する' })
    fireEvent.click(submit)
    fireEvent.click(submit)

    expect(createRoomMock).toHaveBeenCalledOnce()
    expect(createRoomMock).toHaveBeenCalledWith({ playerName: 'たけし' })
    expect((submit as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText('ルームを作成しています…')).toBeTruthy()
    expect(screen.queryByText('ロビー画面')).toBeNull()

    await act(async () => { resolveRequest(session) })

    expect(savePlayerSessionMock).toHaveBeenCalledWith(session)
    expect(document.body.textContent).toContain('AB37X2')
    fireEvent.click(screen.getByRole('button', { name: 'ロビーへ進む' }))
    await waitFor(() => expect(screen.getByText('ロビー画面')).toBeTruthy())
  })

  it('API失敗時はセッションを変更せず、安全なエラーを表示する', async () => {
    createRoomMock.mockRejectedValue(new ApiClientError('NETWORK_ERROR'))
    renderPage()

    fireEvent.change(screen.getByPlaceholderText('あなたの名前を入力'), {
      target: { value: 'たけし' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'ルームを作成する' }))

    expect((await screen.findByRole('alert')).textContent).toBe(
      '通信に失敗しました。接続を確認して、もう一度お試しください。',
    )
    expect(savePlayerSessionMock).not.toHaveBeenCalled()
    expect(screen.queryByText('ロビー画面')).toBeNull()
  })

  it('予期しない例外の技術情報を画面へ表示しない', async () => {
    createRoomMock.mockRejectedValue(new Error('secret stack trace'))
    renderPage()

    fireEvent.change(screen.getByPlaceholderText('あなたの名前を入力'), {
      target: { value: 'たけし' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'ルームを作成する' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('予期しないエラーが発生しました。もう一度お試しください。')
    expect(alert.textContent).not.toContain('secret stack trace')
  })
})
