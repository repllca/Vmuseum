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
2. .envファイル内にGEMINI_API_KEY="自分のAPIを設定"を書いて保存
3. 実行

## ③絵画を表示する場合
### データセットダウンロード
環境にhugingfaceを使えるようにする
frontディレクトリに移動して以下を実行
```
hf download repllca/GoghDB --repo-type dataset --local-dir ./assets　--include "GoghDB/*"
```



