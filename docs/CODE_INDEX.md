

このドキュメントはプロジェクトのコード構造を示し、各ファイルやディレクトリの責務と主要なシンボルを要約したものです。

---

## プロジェクト構造

```
.
├── README.md
├── backend
│   ├── Dockerfile
│   ├── main.py
│   ├── prompt.txt
│   ├── requirements.txt
│   └── test.csv
├── docker-compose.yml
├── docs
│   ├── CODE_INDEX.md
│   └── CODE_INDEX_MATERIALS.md
├── frontend
│   ├── Dockerfile
│   ├── assets
│   │   ├── animal3d.pdf
│   │   ├── art1.jpg
│   │   ├── art2.jpg
│   │   └── art3.jpg
│   ├── controls.js
│   ├── exhibits
│   │   └── artFrame.js
│   ├── index.html
│   ├── main.js
│   ├── multiplayer.js
│   ├── physics.js
│   ├── scene.js
│   └── ui
│       ├── catalogCsv.js
│       ├── chatLog.js
│       ├── hubInput.js
│       ├── imageViewer.js
│       └── toast.js
├── test
│   └── src
│       ├── data_loader.py
│       ├── embedding_service.py
│       ├── main.py
│       └── search_engine.py
└── test.html
```

---

## 各ディレクトリとファイルの責務

### ルートディレクトリ

- **README.md**: プロジェクトの概要を記載したドキュメント。
- **docker-compose.yml**: Docker Compose 設定ファイル。サービスの構成を定義。
- **test.html**: テスト用の HTML ファイル（詳細は要確認）。

---

### backend

- **Dockerfile**: Backend サービスの Docker イメージを構築するための設定ファイル。
- **main.py**: Backend サービスのエントリーポイント。主要なロジックが含まれる（詳細は要確認）。
- **prompt.txt**: プロンプトに関する設定やテンプレート（詳細は要確認）。
- **requirements.txt**: Python の依存関係を管理するファイル。
- **test.csv**: テスト用のデータファイル（詳細は要確認）。

---

### docs

- **CODE_INDEX.md**: プロジェクトのコード構造を記載したドキュメント（このファイル）。
- **CODE_INDEX_MATERIALS.md**: CODE_INDEX.md を生成するための材料ファイル。

---

### frontend

- **Dockerfile**: Frontend サービスの Docker イメージを構築するための設定ファイル。
- **index.html**: フロントエンドのエントリーポイントとなる HTML ファイル。
- **main.js**: フロントエンドの主要なロジックを記述。
- **controls.js**: ユーザー操作に関するロジックを管理。
- **multiplayer.js**: マルチプレイヤー機能のロジック。
- **physics.js**: 物理演算に関連するロジック。
- **scene.js**: シーン管理に関するロジック。
- **assets/**: 静的アセット（画像や PDF ファイルなど）を格納。
- **exhibits/artFrame.js**: 展示物のフレームに関するロジック。
- **ui/**: ユーザーインターフェース関連のモジュール。
  - **catalogCsv.js**: カタログデータの管理。
  - **chatLog.js**: チャットログの管理。
  - **hubInput.js**: 入力フォームの管理。
  - **imageViewer.js**: 画像ビューアのロジック。
  - **toast.js**: トースト通知の管理。

---

### test

- **src/data_loader.py**: データの読み込みに関するロジック。
- **src/embedding_service.py**: 埋め込みサービスに関連するロジック。
- **src/main.py**: テスト用のエントリーポイント。
- **src/search_engine.py**: 検索エンジンのロジック。

---

## エントリーポイント

- **backend/main.py**: Backend サービスのエントリーポイント。
- **frontend/index.html**: フロントエンドのエントリーポイント。
- **test/src/main.py**: テストスクリプトのエントリーポイント。

---

## 重要なデータ構造/型

- **backend/main.py**: Backend サービスで使用される主要なデータ構造（詳細は要確認）。
- **test/src/search_engine.py**: 検索エンジンの内部で使用されるデータ構造（詳細は要確認）。

---

## 要確認事項

- **prompt.txt**: ファイルの具体的な役割。
- **test.csv**: データの内容と利用方法。
- **test.html**: テストの目的と内容。
- **backend/main.py**: 主要なデータ構造やロジックの詳細。
- **test/src/search_engine.py**: 検索エンジンのアルゴリズムとデータ構造。
```
```

