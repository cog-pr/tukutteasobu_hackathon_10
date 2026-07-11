# tukutteasobu_hackathon_10

React、Vite、TypeScript、Tailwind CSS を使った最小構成のフロントエンドです。

## 必要な環境

- Node.js 20.19 以上、または 22.12 以上
- npm

## 起動方法

```bash
npm install
npm run dev
```

ターミナルに表示された URL（通常は `http://localhost:5173`）をブラウザで開いてください。

## ビルド

```bash
npm run build
```

## ゲーム画面の確認方法

`npm run dev` 後、ブラウザで `http://localhost:5173/#/screens` を開くと、実装済みの全画面への
リンク一覧（開発用の画面一覧ページ）が表示されます。ここから各画面を個別に確認できます。

画面遷移は React Router（HashRouter）による仮のものです。API・WebSocket・OpenAI API・
センサーには接続しておらず、すべて `src/data/dummyData.ts` のダミーデータで表示しています。

| 画面 | URL | 内容 |
|---|---|---|
| トップ画面 | `/#/` | タイトル・遊び方・ルーム作成/参加への導線 |
| ルーム作成画面 | `/#/rooms/new` | プレイヤー名入力 → ルームコード発行 |
| ルーム参加画面 | `/#/rooms/join` | ルームコード・プレイヤー名入力 |
| ロビー画面 | `/#/lobby` | 参加者一覧・準備状態・ゲーム開始 |
| ラウンド開始画面 | `/#/round-intro` | 挑戦者発表演出 |
| 回答画面（挑戦者） | `/#/answering/challenger` | お題への回答入力・確定（`validateAnswer`で検証） |
| 回答待ち画面（ほかのプレイヤー） | `/#/answering/waiting` | 挑戦者・AIの回答待ち表示 |
| 投票画面 | `/#/voting` | 回答A・Bへの投票 |
| 投票中の待機画面（挑戦者） | `/#/voting/waiting` | 挑戦者は結果を待つのみ |
| 回答公開画面 | `/#/reveal` | 正体・投票数・勝者・得点変動を順に表示 |
| 挽回チャレンジ画面 | `/#/revenge` | 超連打チャレンジ（挑戦者/ほかのプレイヤー表示切替） |
| 最終結果画面 | `/#/result` | 最終得点・ラウンド結果・MVP回答 |

スマートフォン表示の確認は、ブラウザのデベロッパーツールで幅375px相当のデバイスに切り替えて
行ってください。
