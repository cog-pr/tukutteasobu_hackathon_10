# UIコード一覧

対象URL：`http://127.0.0.1:5173/`

## 統合プロトタイプ

| ファイル | 役割 |
|---|---|
| `src/client/PrototypeApp.tsx` | トップページ、ルーム、ロビー、回答、投票、結果、挽回チャレンジ、最終結果のUIと状態遷移 |
| `src/styles.css` | 統合プロトタイプ全体のデザイントークン、レイアウト、レスポンシブ、アニメーション |
| `src/main.tsx` | 統合プロトタイプと既存UIの表示切り替え |
| `index.html` | ページタイトル、説明、viewport、テーマカラー |

## UIで利用するデータとロジック

| ファイル | 役割 |
|---|---|
| `src/data/prompts.json` | 大喜利のお題36問 |
| `src/data/prompts.ts` | JSONをTypeScriptから利用するための読み込み |
| `src/types/prompt.ts` | お題の型 |
| `src/shared/validation/playerName.ts` | プレイヤー名の検証 |
| `src/lib/validateAnswer.ts` | 大喜利回答の検証 |
| `src/shared/game/countVotes.ts` | 回答A・Bの投票集計 |
| `src/shared/game/getGameResult.ts` | 3ポイント先取の終了判定 |
| `src/client/lib/time.ts` | `deadlineAt`を使った残り時間計算 |

## 既存UI

`http://127.0.0.1:5173/?ui=original#/` では、統合前の画面を確認できます。

- `src/pages/`
- `src/components/`
- `src/routes.tsx`
- `src/data/dummyData.ts`

既存UIは画面単位のダミープレビューです。統合されたゲーム進行は`PrototypeApp.tsx`に実装されています。

