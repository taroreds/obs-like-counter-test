# アーキテクチャ

## 1. 目的

この文書は、OBS用高評価目標ウィジェットの構造と責務を記録するものです。

本プロジェクトは、依存関係を持たない小規模なソフトウェアとして設計します。主な実行環境は、ローカルファイルを読み込むOBS Studioのブラウザソースです。

## 2. 実行フロー

ローカルファイルとして、次の順序で同期的に読み込みます。

```text
config.js
    ↓
state.js
    ↓
render.js
    ↓
app.js
    ↓
初期描画と状態変更時の再描画
```

`config.js` が存在しない、または設定名前空間を定義しない場合でも、`app.js` は既定値を使って起動します。`config.js` 自体の構文エラーはブラウザのコンソールに記録されますが、後続スクリプトが読み込まれる環境では同様に既定値での起動を試みます。

## 3. ファイルの責務

| ファイル | 責務 |
| --- | --- |
| `index.html` | DOM構造とCSS・JavaScriptの読み込み順を定義する。 |
| `style.css` | テーマ、配置、サイズ、表示デザインを定義する。 |
| `config.js` | 利用者が編集する起動時設定を定義する。 |
| `state.js` | 実行時状態の生成、検証、変更、購読通知を担当する。 |
| `render.js` | 状態スナップショットをDOMへ描画する。 |
| `app.js` | 設定と外観を初期化し、状態管理と描画を接続する。 |

## 4. 状態管理

内部状態は `label`、`current`、`goal`、`message` だけを保持します。`achieved` は保存せず、`current >= goal` から導出します。

`getState()` と購読通知は、次の凍結済みスナップショットを返します。

```javascript
{
  label: "高評価ゴール",
  current: 42,
  goal: 100,
  message: "応援ありがとうございます。",
  achieved: false
}
```

状態の変更は `dispatch(action)` だけを通じて行います。`getState()` は呼び出しごとに新しい平坦な凍結オブジェクトを返すため、外部コードは内部状態を直接変更できません。

## 5. 公開API

`window.LIKE_GOAL` は既存オブジェクトを維持して拡張します。外部向けのAPIは次の3つです。

```javascript
window.LIKE_GOAL.getState();
window.LIKE_GOAL.dispatch({ type: "increment", amount: 1 });
window.LIKE_GOAL.subscribe((state) => {
  console.log(state.current);
});
```

`createStateStore` と `renderWidget` は `window.LIKE_GOAL.internal` に置く内部用関数です。入力アダプターはDOMを直接変更せず、公開APIだけを使用します。

## 6. 描画と外観

`app.js` は起動時に検証済みのテーマ、配置、サイズのCSSクラスを `body` へ適用します。これらの外観設定は実行時状態に含めません。

`render.js` は状態を受け取り、既存のDOM IDへ `textContent` で描画します。進捗率は `current / goal` から計算し、表示用の幅を0～100%に制限します。

## 7. BroadcastChannelによる操作パネル通信

技術スパイクで、OBSのBrowser Sourceとカスタムブラウザドックの両方を同じ配布フォルダ内のfile URLとして読み込んだ場合に、BroadcastChannelの双方向通信が成立することを確認しました。

表示側は、OBSの「ローカルファイル」を使わず、URL欄に `file:///.../index.html` を指定します。controllerもカスタムブラウザドックのURL欄に `file:///.../controller.html` を指定します。

```text
controller.html
  ↓ action / sync-request
transport.js
  ↓ BroadcastChannel: obs-like-goal-widget-v1
transport.js
  ↓
input-channel.js
  ↓
window.LIKE_GOAL.dispatch()
  ↓
state.js → render.js
  ↓ state
controller.html
```

`transport.js` はBroadcastChannelの生成、送受信、購読、終了だけを担当します。通信メッセージの意味やDOM操作は持ちません。

`input-channel.js` は表示ページ専用の入力アダプターです。検証済みの通信アクションだけを公開APIの `window.LIKE_GOAL.dispatch()` へ渡します。状態変更は既存の購読機構で検知し、最新stateをcontrollerへ送信します。

controllerは受信したstateを表示するだけであり、実行時状態の正本ではありません。controller起動時は `sync-request` を送信し、表示側は最新stateを返信します。表示側も起動時に初期stateを一度送信します。

controllerの状態は、BroadcastChannelを利用できない `未接続`、state受信待ちの `同期待機`、有効stateを受信済みの `同期済み` です。同期済みは表示ページが現在も存在することを保証しないため、最終同期時刻と再同期ボタンを表示します。heartbeatや切断検知は実装しません。

controllerの再読み込み時は再同期要求を送ります。Browser Sourceの再読み込み時は永続化しないため状態が初期設定へ戻り、起動時state送信でcontrollerを更新します。

正式対応する構成は表示ページ1つ、controller1つです。複数の表示ページは同じアクションを受け取って状態競合を起こし得るため、今回の実装では対応しません。
