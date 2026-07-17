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
