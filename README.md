# tukutteasobu_hackathon_10

React、Vite、TypeScript、Tailwind CSS を使ったフロントエンドと、Hono + Cloudflare Workers /
Durable Object によるサーバー（`src/server/`）で構成されています。

現時点ではフロントエンドとサーバーAPIは接続されていません（フロントエンドは
`src/data/dummyData.ts` のダミーデータで動作します）。サーバー側はヘルスチェックAPIと、
Durable Objectの動作確認用の開発用APIのみを提供する最小構成です。

## 必要な環境

- Node.js 22.12 以上（Wrangler / Cloudflare Workers のローカル実行に Node.js 22 以上が必要です）
- npm

## フロントエンドの起動方法

```bash
npm install
npm run dev
```

ターミナルに表示された URL（通常は `http://localhost:5173`）をブラウザで開いてください。

## ビルド

```bash
npm run build
```

`tsc -b` によるフロントエンド・サーバー双方の型チェックと、`vite build` によるフロントエンドの
本番ビルドを行います。

## サーバー（Cloudflare Worker）のローカル起動方法

サーバーは [Wrangler](https://developers.cloudflare.com/workers/wrangler/) を使ってローカルで
起動します。フロントエンド（`npm run dev`）とは別プロセスとして起動してください。

```bash
npm run dev:worker
```

デフォルトで `http://127.0.0.1:8787` で起動します。動作確認例:

```bash
curl http://127.0.0.1:8787/api/health
# => {"ok":true}

curl http://127.0.0.1:8787/api/dev/rooms/AB37X2/state
# => {"version":1,"roomCode":"AB37X2","phase":"LOBBY","createdAt":...,"updatedAt":...}
```

`api/dev/rooms/:roomCode/state` は Worker から Durable Object（`GameRoom`）を呼び出せることを
確認するための開発用APIです。本番環境（`ENVIRONMENT=production`）では 404 を返します。後続の
ルームAPI実装Issueで置き換え・削除される前提のため、正式なルームAPIではありません。

現時点ではフロントエンドとサーバーは連携していないため、フロントエンド開発用の `vite`（HTTP:
5173）とサーバー確認用の `wrangler dev`（HTTP: 8787）を別々のプロセスとして起動する運用です。

## Durable Object migration の適用方法

Durable Object のクラス構成は `wrangler.jsonc` の `migrations` に定義しています。追加の手動操作は
不要で、`npm run dev:worker`（ローカル）や `npm run deploy`（本番）を実行するたびに Wrangler が
自動的に適用します。`wrangler.jsonc` の bindings を変更した場合は、`npx wrangler types` を再実行
して `worker-configuration.d.ts`（生成された型定義。コミット対象）を更新してください。

## Secret の設定方法

APIキーなどの Secret 値は `wrangler.jsonc` やリポジトリへ直接書き込まないでください。

- **本番**: `npx wrangler secret put <NAME>` で Cloudflare 側に安全に登録します。
- **ローカル**: リポジトリ直下に `.dev.vars` ファイルを作成し、`NAME=value` の形式で記述します
  （`.dev.vars` は `.gitignore` 対象です。コミットしないでください）。

AI回答生成サービスでは、以下のSecret／環境変数を使用します。

```text
AI_PROVIDER
OPENAI_API_KEY
OPENAI_MODEL
MINIMAX_API_KEY
MINIMAX_MODEL
```

本番環境ではAPIキーをWrangler Secretとして登録します。

```bash
npx wrangler secret put OPENAI_API_KEY
# MiniMaxを使用する場合
npx wrangler secret put MINIMAX_API_KEY
```

モデル名はコードへ直接書かず、デプロイ環境の変数として`OPENAI_MODEL`を設定してください。
ローカル確認時は、コミット対象外の`.dev.vars`へ次の形式で設定します。

```text
OPENAI_API_KEY=your-local-key
OPENAI_MODEL=your-model-id
```

MiniMaxを使用する場合は、`.dev.vars`を次のように設定します。

```text
AI_PROVIDER=minimax
MINIMAX_API_KEY=your-local-key
MINIMAX_MODEL=your-model-id
```

`AI_PROVIDER`を省略した場合はOpenAIを使用します。設定できる値は`openai`または
`minimax`です。プロバイダーごとのAPIキーを別々に保持し、別サービスの接続先へ
誤送信しない構成です。

どちらかが未設定の場合やOpenAI APIが失敗した場合は、ゲームを中断せず、リポジトリ内の固定回答へ
自動的に切り替わります。APIキーやAPIレスポンス全体をログへ出力しない実装です。

## テスト方法

```bash
npm run test
```

Vitest の `projects` 機能で、フロントエンドの既存テストと、`@cloudflare/vitest-pool-workers`
（実際の Workers ランタイム上でHono/Durable Objectを動かすテスト基盤）によるサーバーのテストを
まとめて実行します。

## デプロイ方法

```bash
npm run deploy
```

内部で `wrangler deploy` を実行し、Worker と Durable Object の migration を Cloudflare へ反映
します。事前に `wrangler login` などで Cloudflare アカウントの認証が必要です。

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
