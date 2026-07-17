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

1. OBSで検証用シーンを開きます。
2. ブラウザソースを追加します。
3. 「ローカルファイル」を有効にします。
4. `spikes/broadcast-channel/source.html` を指定します。
5. 幅1920、高さ1080を指定します。
6. 画面左上に診断パネルが表示されることを確認します。

## 7. OBSカスタムブラウザドックへの登録手順

1. OBSの「表示」メニューから「ドック」→「カスタムブラウザドック」を開きます。
2. 任意のドック名を入力します。例：`BroadcastChannel 診断`。
3. URL欄に `dock.html` のfile URLを入力します。Windowsの例：`file:///C:/path/to/spikes/broadcast-channel/dock.html`
4. ドックを表示し、診断情報と「PINGを送信」ボタンが表示されることを確認します。

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

| 項目 | 記録 |
| --- | --- |
| 実施日 | |
| OBSバージョン | |
| OS | |
| Browser Sourceのhref | |
| Browser Sourceのorigin | |
| Dockのhref | |
| Dockのorigin | |
| sourceからdockへの通信結果 | |
| dockからsourceへの通信結果 | |
| 再読み込み後の結果 | |
| OBS再起動後の結果 | |
| 判定 | 成功／失敗／保留 |
| 備考 | |
