# バーチャルミュージアム

## ①環境構築＆実行(必要最低限)
1.このリポジトリをローカルへgit cloneする
```
git clone git@github.com:repllca/Vmuseum.git
```
2.Vmuseumディレクトリへ移動
```
cd Vmuseum
```
3.以下のコマンドを実行
```
docker compose up --build
```
4.ローカル環境で立っている[localhost:8080](http://localhost:8080)にアクセス
5.終了する場合はターミナルでCtrl + Cを行い、以下のコマンドを実行
```
docker compose  down
```

## ②GeminiAPIを使用する場合
1. backディレクトリに移動し、.envファイルを作成
2. .envファイル内に
```
GEMINI_API_KEY="自分のAPI をここに書く"
# model name (例: gemini-2.5-flash)
GEMINI_MODEL=gemini-2.5-flash

# container内のパス（dockerで /app に置く想定）
PROMPT_TXT_PATH=/app/prompt.txt
CSV_PATH=/app/test.csv

# 503対策
GEMINI_MAX_RETRIES=5
GEMINI_BASE_BACKOFF_SEC=1.0

```
を書いて保存
3. 実行

## ③絵画を表示する場合
### データセットダウンロード
環境にhugingfaceを使えるようにする
frontディレクトリに移動して以下を実行
```
hf download repllca/GoghDB --repo-type dataset --local-dir ./assets　--include "GoghDB/*"
```


## ④その他
bacendディレクトリ内のファイルについて
 - prompt.txt
Geminiに与えるプロンプトが記載されている

 - Dockerfile & requirements.txt
Dockerfileではdocker compose で環境構築に必要様なファイル。requirementsでは、pytonの環境構築にひつようなライブラリが書かrている
 - test.csv
ゴッホの絵画説明などのデータセット情報をまとめたcsvが入っている

 - main.py
サーバを立てたり、フロント側から送られてきたリクエストの処理を行っている

frontendディレクトリ内のファイルについて
 - assetsディレクトリ
ゴッホの絵画のデータなどが入っている
 - exhibitsディレクトリ
絵を表示している額縁などの表示のための情報（サイズや絵のIDなど）を扱っている
 -  uiディレクトリ  
 画面上のテキスト入力部分やAIと会話するためのエリアの表示するためのコードが書かれている

 - controls.js
操作を扱っているファイル
 - physics.js
物理判定を付与するためのファイル
 - scene.js
部屋の大きさや壁などオブジェクトとして置くためのファイル
 - main.js
フロント画面全体の配置や他ファイルの読み込みを行っている
