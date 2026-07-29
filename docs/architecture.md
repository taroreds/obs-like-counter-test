# アーキテクチャ

## 1. 目的

この文書は、OBS用高評価目標ウィジェットの構造と責務を記録するものです。

本プロジェクトは、依存関係を持たない小規模なソフトウェアとして設計します。主な実行環境は、ローカルファイルを読み込むOBS Studioのブラウザソースです。

## 2. 実行フロー

`index.html` は、ローカルファイルとして次の順序で同期的に読み込みます。順序には依存関係があります。

```text
config.js        設定の定義
    ↓
state.js         createStateStore を internal へ登録
    ↓
render.js        renderWidget を internal へ登録
    ↓
persistence.js   createStatePersistence を internal へ登録
    ↓
app.js           初期化を実行
    ↓
transport.js     createChannelTransport を internal へ登録
    ↓
input-channel.js 通信を初期化
```

`app.js` の内部処理は次の順序です。

```text
configからstoreを生成
    ↓
保存値をload
    ↓
有効な保存値があれば set-current / set-goal で復元
    ↓
外観クラスをbodyへ適用
    ↓
公開APIを window.LIKE_GOAL へ設定
    ↓
初期描画
    ↓
render購読を登録
    ↓
永続化購読を登録
```

保存値の復元は、初期描画・render購読・永続化購読・BroadcastChannelの初期state送信より前に行います。復元時のdispatchが永続化購読より先に実行されるため、復元自体が保存を発生させることはありません。

`config.js` が存在しない、または設定名前空間を定義しない場合でも、`app.js` は既定値を使って起動します。`config.js` 自体の構文エラーはブラウザのコンソールに記録されますが、後続スクリプトが読み込まれる環境では同様に既定値での起動を試みます。

## 3. ファイルの責務

| ファイル | 責務 |
| --- | --- |
| `index.html` | 表示ページのDOM構造と、CSS・JavaScriptの読み込み順を定義する。 |
| `style.css` | テーマ、配置、サイズ、表示デザインを定義する。 |
| `config.js` | 利用者が編集する起動時設定を定義する。 |
| `state.js` | 実行時状態の生成、検証、変更、購読通知を担当する。 |
| `render.js` | 状態スナップショットをDOMへ描画する。 |
| `persistence.js` | localStorageへの `current` と `goal` の保存、読み込み、削除、保存値の検証を担当する。 |
| `app.js` | 設定と外観を初期化し、状態管理・描画・永続化を接続する。公開APIを設定する。 |
| `transport.js` | BroadcastChannelの生成、送受信、購読、終了を担当する。プロトコルとDOMは扱わない。 |
| `input-channel.js` | 表示ページ側の通信アダプター。受信actionを検証して公開APIへ渡し、状態変更時に最新stateを送信する。 |
| `controller.html` | 操作パネルのDOM構造と、CSS・JavaScriptの読み込み順を定義する。 |
| `controller.css` | 操作パネルの表示デザインを定義する。 |
| `controller.js` | 操作入力を通信メッセージへ変換し、受信stateを表示する。状態の正本を持たない。 |

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

controllerの再読み込み時は再同期要求を送ります。Browser Sourceの再読み込み時は、保存値が有効ならcurrentとgoalを復元してから起動時state送信でcontrollerを更新します。

正式対応する構成は表示ページ1つ、controller1つです。複数の表示ページは同じアクションを受け取って状態競合を起こし得るため、今回の実装では対応しません。

## 8. 実行時状態の永続化

`persistence.js` はlocalStorageを使い、currentとgoalだけを保存します。DOM、BroadcastChannel、state.jsの内部状態には触れません。保存形式は次のとおりです。

```json
{
  "version": 1,
  "current": 42,
  "goal": 100
}
```

保存キーは `obs-like-goal-widget-state-v1:<encodeURIComponent(location.pathname)>` の形式です。同じindex.htmlのパスでは同じ保存データを使い、別フォルダへの移動またはコピーは別の保存領域として扱います。

起動時はconfigからストアを生成した後、初期描画・render購読・永続化購読の前に保存値を読み込みます。有効な保存値は既存の `set-current` と `set-goal` アクションで復元します。保存データがない初回起動時は自動保存しません。

通常の状態変更後は永続化購読がcurrentとgoalを保存します。`reset-counter`後はcurrent 0と現在のgoalを保存します。`reset-all`時は保存を一時的に抑止し、状態変化の有無にかかわらず保存キーを削除します。次の通常状態変更から保存を再開します。

localStorageの取得、読み書き、削除、JSON処理の例外は捕捉してconsoleへ記録します。利用不能または不正な保存データの場合はconfigの初期値で継続し、表示とBroadcastChannel通信を停止しません。
