# BroadcastChannel 通信スパイク

## 1. 目的

このスパイクは、OBSのローカルファイルBrowser Sourceとカスタムブラウザドックの間で、`BroadcastChannel` による双方向通信が成立するかを確認するための診断ツールです。

各ページは、URL、オリジン、プロトコル、User-Agent、BroadcastChannel対応状況、送受信件数、最後の送受信メッセージ、時刻付きログを表示します。

## 2. 製品本体との関係

このフォルダのファイルは技術検証専用です。製品本体の `index.html`、状態管理、描画処理、設定には組み込みません。

このスパイクが成功しても、controller機能を本体へ組み込む判断は別途行います。

## 3. 通常ブラウザでの確認手順

1. `source.html` と `dock.html` を同じ通常ブラウザで開きます。
2. 各ページで、`BroadcastChannel対応`、`location.href`、`location.origin`、`location.protocol` を記録します。
3. 両ページで読み込み時の `hello` メッセージが受信されることを確認します。先に開いたページは後から開いたページのhelloだけを受信するため、両方向の確認には次のPING試験を行います。
4. `source.html` の「PINGを送信」を押し、`dock.html` がPINGを受信してPONGを1回返信することを確認します。
5. `dock.html` の「PINGを送信」を押し、逆方向でも同じ結果になることを確認します。

## 4. Live Serverを使った同一オリジン対照試験

Live Serverはこの製品の要件ではなく、通信方式を比較するためだけの任意の対照環境です。

1. 開発環境で `spikes/broadcast-channel` をLive ServerなどのローカルWebサーバーから公開します。
2. 同じホスト・ポートの `source.html` と `dock.html` を開きます。
3. 両ページの `location.origin` が同じであることを確認します。
4. 双方向PING/PONGが成功することを確認します。

この対照試験が成功し、file URLまたはOBSだけで失敗する場合は、BroadcastChannel自体ではなくローカルファイルまたはOBSの実行コンテキストが原因である可能性を記録できます。

## 5. file URLでの試験

1. エクスプローラーから `source.html` と `dock.html` を開きます。
2. `location.protocol` が `file:`、`location.origin` がどのように表示されるか記録します。
3. 双方向PING/PONGを実行します。
4. 通信しない場合も、画面上の診断情報とログを保存します。

file URLのオリジン扱いは実行環境によって異なるため、通常ブラウザでの結果をOBSでの結果と同一視しません。

## 6. OBS Browser Sourceへの登録手順

Browser Sourceには2つの登録方法があり、`docs/decisions.md` D-011 によれば通信結果が異なる。この節では両方を登録し、それぞれの `location.origin` を記録する。

登録方法の違いが通信結果に影響する理由は、まだ確認されていない。両構成の `location.origin` が異なるかどうかが、原因を判定する材料になる。

### 構成A：「ローカルファイル」を有効にする

1. OBSで検証用シーンを開きます。
2. ブラウザソースを追加します。名前は `spike-A` などとし、構成Bと区別できるようにします。
3. 「ローカルファイル」のチェックを**入れます**。
4. 「参照」から `spikes/broadcast-channel/source.html` を選択します。
5. 幅1920、高さ1080を指定します。
6. 画面に診断パネルが表示されることを確認します。
7. パネルの `location.href`、`location.origin`、`location.protocol` を §10 の記録欄へ転記します。

### 構成B：「ローカルファイル」を無効にし、URL欄へfile URLを入力する

1. 同じシーンにもう1つブラウザソースを追加します。名前は `spike-B` などとします。
2. 「ローカルファイル」のチェックを**外します**。
3. URL欄へ `source.html` のfile URLを入力します。Windowsの例：`file:///C:/path/to/spikes/broadcast-channel/source.html`
4. 幅1920、高さ1080を指定します。
5. 画面に診断パネルが表示されることを確認します。
6. パネルの `location.href`、`location.origin`、`location.protocol` を §10 の記録欄へ転記します。

### 値の読み取りとボタン操作

診断パネルの `location.href` は長いfile URLです。プレビューの縮小表示では読み取れません。

ソースを右クリックして「インタラクト」を選ぶと、等倍のウィンドウが開きます。値を読み取れるほか、「PINGを送信」ボタンも押せます。

Browser Sourceで値を確認するときは、常にインタラクトを使ってください。

インタラクトウィンドウでは値の選択・コピーができない場合があります。その際は手入力するか、スクリーンショットを撮ってください。

### 注意

構成Aと構成Bを同時に表示すると、2つのsourceが同じチャンネルに参加します。dockからのPINGに両方が応答するため、送受信件数が想定と異なります。

通信試験を行う際は、一方のソースだけを表示状態にしてください。表示状態の切り替えには、シーン内でのソースの表示・非表示（目のアイコン）を使います。

`location.origin` の記録だけであれば、両方を同時に表示しても構いません。

## 7. OBSカスタムブラウザドックへの登録手順

1. OBSの「表示」メニューから「ドック」→「カスタムブラウザドック」を開きます。
2. 任意のドック名を入力します。例：`BroadcastChannel 診断`。
3. URL欄に `dock.html` のfile URLを入力します。Windowsの例：`file:///C:/path/to/spikes/broadcast-channel/dock.html`
4. ドックを表示し、診断情報と「PINGを送信」ボタンが表示されることを確認します。
5. 診断パネルの `location.href`、`location.origin`、`location.protocol` を §10 の記録欄へ転記します。

ドックの登録方法は1つだけです。Browser Sourceのような「ローカルファイル」の選択肢はありません。

## 8. 成功判定

次のすべてを満たす場合、対象環境でBroadcastChannelによる双方向通信は成功です。

* sourceとdockの両方でBroadcastChannelが利用可能またはチャンネル生成成功と表示される。
* sourceからのPINGに対してdockがPONGを1回返信し、sourceが受信する。
* dockからのPINGに対してsourceがPONGを1回返信し、dockが受信する。
* 送受信件数、最後の送受信メッセージ、通信ログが各ページで更新される。

## 9. 失敗判定

次のいずれかなら失敗または要調査です。

* BroadcastChannelが未対応と表示される。
* チャンネル生成または送信で例外が記録される。
* 両ページでチャンネル生成に成功しているのに、PING/PONGが一方向または双方向で届かない。
* 再読み込みやOBS再起動後に期待した通信が再現しない。

失敗しても診断パネルとログは表示され続けます。表示されたURL、オリジン、プロトコル、User-Agentとログを結果欄へ転記してください。

## 10. 結果記録欄

実機で確認した内容だけを記入してください。未実施の欄は空欄のまま残します。

### 共通

| 項目 | 記録 |
| --- | --- |
| 実施日 | 2026-08-02 |
| OBSバージョン | 32.2.2.1 |
| OS | Windows 11 25H2 |
| 通常ブラウザ名とバージョン | |

### 通常ブラウザ（file URL）

| 項目 | 記録 |
| --- | --- |
| source.html の href | `file:///C:/.../spikes/broadcast-channel/source.html` |
| source.html の origin | `file://` |
| dock.html の href | `file:///C:/.../spikes/broadcast-channel/dock.html` |
| dock.html の origin | `file://` |
| source → dock | 成功 |
| dock → source | 成功 |

### OBS 構成A（「ローカルファイル」を有効）

| 項目 | 記録 |
| --- | --- |
| Browser Sourceの href | `http://absolute/C:/...` |
| Browser Sourceの origin | `http://absolute` |
| Browser Sourceの protocol | `http:` |
| dockの href | `file:///C:/.../spikes/broadcast-channel/dock.html` |
| dockの origin | `file://` |
| source → dock | 失敗 |
| dock → source | 失敗 |

### OBS 構成B（「ローカルファイル」を無効、URL欄へfile URL）

| 項目 | 記録 |
| --- | --- |
| Browser Sourceの href | `file:///C:/.../spikes/broadcast-channel/source.html` |
| Browser Sourceの origin | `file://` |
| Browser Sourceの protocol | `file:` |
| dockの href | `file:///C:/.../spikes/broadcast-channel/dock.html` |
| dockの origin | `file://` |
| source → dock | 成功 |
| dock → source | 成功 |
| 再読み込み後の結果 | 成功 |
| OBS再起動後の結果 | 成功。origin にも変化なし |

### 判定

| 項目 | 記録 |
| --- | --- |
| 構成Aと構成Bで origin は一致したか | 不一致 |
| 通信可否の違いを origin の差で説明できるか | 説明できる |
| 総合判定 | 成功 |
| 備考 | Browser Source の `navigator.userAgent` は構成A・Bとも `OBS/32.2.2.1` を含む。構成Aではチャンネル生成もPING送信も成功し、例外もエラーも発生しないまま届かない。 |

`navigator.userAgent` は行が長いため、必要に応じて備考欄へ記入してください。
