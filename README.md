# バーチャルミュージアム
## １．システム概要
### 1.1 目的
パーソナライズされた体験を提供したい。ユーザの入力:　
### 1.2 背景



## ２




GEMINI_API_KEY=

# model name (例: gemini-2.5-flash)
GEMINI_MODEL=gemini-2.5-flash

# container内のパス（dockerで /app に置く想定）
PROMPT_TXT_PATH=/app/prompt.txt
CSV_PATH=/app/test.csv

# 503対策
GEMINI_MAX_RETRIES=5
GEMINI_BASE_BACKOFF_SEC=1.0
