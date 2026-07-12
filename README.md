# tukutteasobu_hackathon_10

React、Vite、TypeScript、Tailwind CSS を使ったフロントエンドと、Hono + Cloudflare Workers /
Durable Object によるサーバー（`src/server/`）で構成されています。

フロントエンドはルーム作成・参加のREST APIと、ゲーム進行全体（ロビー〜最終結果〜再戦）を
扱うWebSocket APIの両方に接続されており、4台の端末（またはブラウザの複数タブ）で最初から
最後まで実際にプレイできます。サーバー側はヘルスチェックAPIと、ルーム作成・参加・確認のHTTP
API、ゲーム進行を管理するDurable Object（`GameRoom`）のWebSocket APIを提供します。

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
起動します。

```bash
npm run dev:worker
```

デフォルトで `http://127.0.0.1:8787`（起動時のログに表示されるポート。ポートが使用中の
場合は自動的にずれることがあります）で起動します。動作確認例:

```bash
curl http://127.0.0.1:8787/api/health
# => {"ok":true}

curl -X POST http://127.0.0.1:8787/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"playerName":"たけし"}'
# => {"roomCode":"AB37X2","playerId":"player_xxx","playerToken":"token_xxx"}

curl -X POST http://127.0.0.1:8787/api/rooms/AB37X2/join \
  -H "Content-Type: application/json" \
  -d '{"playerName":"サトウ"}'
# => {"playerId":"player_yyy","playerToken":"token_yyy"}

curl http://127.0.0.1:8787/api/rooms/AB37X2
# => {"exists":true,"canJoin":true,"playerCount":2,"hasStarted":false}
```

`playerId`・`playerToken` はルーム作成・参加時にのみ発行され、`GET /api/rooms/:roomCode` の
レスポンスには含まれません。リクエストが不正な場合や、ルームが満員・開始済み・名前重複などの
理由で処理できない場合は `{"code":"ROOM_FULL","message":"このルームは満員です"}` のように
`code`／`message` を持つJSONを400/404/409のいずれかのステータスで返します。

```bash
curl http://127.0.0.1:8787/api/dev/rooms/AB37X2/state
# => {"version":2,"roomCode":"AB37X2","phase":"LOBBY","players":[...],...}
```

`api/dev/rooms/:roomCode/state` は Worker から Durable Object（`GameRoom`）の内部状態を直接
確認するための開発用APIです。本番環境（`ENVIRONMENT=production`）では 404 を返します。ルームの
作成・参加・確認には `/api/rooms` 系の正式なAPIを使用してください。

ローカルでの動かし方は2通りあります。

- **フロントエンドを個別に高速リロードしながら開発する場合**: `vite`（HTTP: 5173）と
  `wrangler dev`（デフォルト HTTP: 8787）を別プロセスとして起動します。この場合、
  フロントエンドから実際のサーバーへ接続するために、リポジトリ直下に `.env.local` を作成し、
  `wrangler dev` の起動ログに表示されたURLを `VITE_API_BASE_URL` として指定してください
  （`.env.local` は `.gitignore` 対象です）。

  ```text
  VITE_API_BASE_URL=http://127.0.0.1:8787
  ```

  未設定の場合は `window.location.origin`（`vite`のURL）宛にリクエストしてしまい、サーバーに
  届きません。

- **本番相当の構成（フロントエンド・APIを同一Workerから配信）で確認する場合**: `wrangler.jsonc`
  の `assets` 設定により、ビルド済みのフロントエンド（`dist/`）とAPIを同じWorkerから配信できます。

  ```bash
  npm run build
  npm run dev:worker
  ```

  起動後のURL（例: `http://127.0.0.1:8787`）をブラウザで開くだけで、フロントエンドと
  API・WebSocketが同一オリジンから配信されるため `VITE_API_BASE_URL` の設定は不要です。
  実機（スマートフォン）で確認する場合は、PCと同じWi-Fiに接続したうえでPCのLAN内IPアドレス
  （例: `http://192.168.x.x:8787`）を各端末で開いてください（複数プロセス・複数ポートを
  意識する必要がなく、4端末での確認に向いています）。フロントエンドの変更を反映するには
  `npm run build` を都度実行してください。

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

内部で `npm run build`（フロントエンドのビルド）→ `wrangler deploy` を実行します。
`wrangler.jsonc` の `assets` 設定により、ビルド済みのフロントエンド（`dist/`）とAPI・
WebSocketを同一Workerから同一オリジンで配信するため、フロントエンド側の追加設定
（`VITE_API_BASE_URL`等）やCORSの実装は不要です。Durable Objectのmigrationも同時に
Cloudflareへ反映されます。事前に `wrangler login` などで Cloudflare アカウントの認証が
必要です。AI回答生成用のSecret（前述）は本番では別途 `wrangler secret put` で設定して
ください（未設定でもゲーム自体は固定回答で動作します）。

## ゲーム画面の確認方法

`npm run dev` 後、ブラウザで `http://localhost:5173/#/screens` を開くと、実装済みの全画面への
リンク一覧（開発用の画面一覧ページ）が表示されます。ただし、`/lobby` 以降のゲームプレイ画面は
実際のルーム接続（`RoomSocketProvider`／`GameplayLayout`）を前提としているため、ルームに参加
していない状態でこれらのURLへ直接アクセスしても「サーバーに接続しています…」の表示のまま止まる
か、正しいフェーズの画面へ自動的に戻されます。個別に見た目を確認したい場合は、下記の4端末での
プレイ確認を行ってください。

`/lobby` 以降の画面遷移は、サーバー（Durable Object `GameRoom`）が `STATE_SYNC` で送る
`phase` の変化に追従して自動的に行われます（`src/client/lib/gameplayRouting.ts` の
`resolveGameplayRoute`）。各端末が押したボタンでその場で遷移するのではなく、サーバー側の
ゲーム進行がすべての端末の画面を一元的に切り替えます。

| 画面 | URL | 内容 |
|---|---|---|
| トップ画面 | `/#/` | タイトル・遊び方・ルーム作成/参加への導線 |
| ルーム作成画面 | `/#/rooms/new` | プレイヤー名入力 → ルームコード発行 |
| ルーム参加画面 | `/#/rooms/join` | ルームコード・プレイヤー名入力 |
| ロビー画面 | `/#/lobby` | 参加者一覧・準備状態・ゲーム開始（ホストのみ） |
| ラウンド開始画面 | `/#/round-intro` | 挑戦者発表演出 |
| 回答画面（挑戦者） | `/#/answering/challenger` | お題への回答入力・確定（`validateAnswer`で検証） |
| 回答待ち画面（ほかのプレイヤー） | `/#/answering/waiting` | 挑戦者・AIの回答待ち表示 |
| 投票画面 | `/#/voting` | 回答A・Bへの投票（挑戦者は投票不可） |
| 投票中の待機画面（挑戦者） | `/#/voting/waiting` | 挑戦者は結果を待つのみ |
| 回答公開画面 | `/#/reveal` | 正体・投票数・勝者・得点変動を順に表示 |
| 挽回チャレンジ画面 | `/#/revenge` | 超連打チャレンジ（挑戦者） |
| 挽回チャレンジ観戦画面 | `/#/revenge/waiting` | 超連打チャレンジの進捗を見守る（挑戦者以外） |
| ラウンド結果画面 | `/#/round-result` | このラウンドの勝敗・得点 |
| 最終結果画面 | `/#/result` | 最終得点・ラウンド結果・MVP回答・再戦（ホストのみ） |

## 4端末（マルチタブ）でのプレイ確認手順

1. `npm run dev:worker` でサーバーを起動し、`npm run dev` でフロントエンドを起動する
   （前述の `.env.local` で `VITE_API_BASE_URL` を設定しておく）。
2. ブラウザで4つのタブ（または実機4台）を開き、1つ目でルーム作成、残り3つでルームコードを
   使って参加する。
3. 全員がロビーで「準備OK」にし、ホストが「ゲームを開始する」を押すと、4端末すべての画面が
   自動的にラウンド開始画面へ切り替わる。
4. 以降、挑戦者の回答・全員の投票・超連打チャレンジ（AIが勝った場合）を経て、3点先取までの
   ラウンドを繰り返しプレイできることを確認する。
5. プレイ中に1端末をリロード（またはネットワーク切断→再接続）しても、サーバーが送る
   `STATE_SYNC` により現在のフェーズへ自動的に復帰することを確認する。
6. 最終結果画面でホストが「もう一度遊ぶ」を押すと、全端末がロビーへ戻ることを確認する。

上記のサーバー主導のフェーズ遷移・秘匿ルール（投票前は回答内容を見せない等）・超連打の
不正申告防止は、`npm test` 内の `GameRoom.gameplay.test.ts` でも自動テストされています。

スマートフォン表示の確認は、ブラウザのデベロッパーツールで幅375px相当のデバイスに切り替えて
行ってください。
