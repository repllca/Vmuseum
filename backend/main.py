from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ✅ .env を読み込む（GEMINI_API_KEY / MODEL_NAME / PROMPT_TXT_PATH / CSV_PATH など）
load_dotenv()

# ✅ Gemini SDK
from google import genai  # pip: google-genai

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# WebSocket: Multiplayer sync
# ============================================================
connected: dict[int, WebSocket] = {}

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    player_id = id(ws)
    connected[player_id] = ws
    print(f"✅ Connected: {player_id}")

    try:
        while True:
            data = await ws.receive_json()
            for pid, conn in list(connected.items()):
                if pid != player_id:
                    await conn.send_json({"id": player_id, **data})
    except WebSocketDisconnect:
        print(f"❌ Disconnected: {player_id}")
        connected.pop(player_id, None)


# ============================================================
# Gemini: prompt.txt + test.csv を結合して投げる
# ============================================================

class GeminiRequest(BaseModel):
    user_text: str = ""
    # 必要ならAPI呼び出しごとに上書きできるように（省略可）
    prompt_txt_path: Optional[str] = None
    csv_path: Optional[str] = None


def _read_text_file(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"File not found: {str(path)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read {str(path)}: {e}")


@app.post("/gemini")
async def gemini_endpoint(req: GeminiRequest):
    # ✅ パス解決（/app 配下で動かす想定）
    base_dir = Path(os.getenv("APP_BASE_DIR", "/app"))

    prompt_txt = Path(req.prompt_txt_path) if req.prompt_txt_path else Path(
        os.getenv("PROMPT_TXT_PATH", "prompt.txt")
    )
    csv_file = Path(req.csv_path) if req.csv_path else Path(
        os.getenv("CSV_PATH", "test.csv")
    )

    # 相対パスなら /app 基準に寄せる
    if not prompt_txt.is_absolute():
        prompt_txt = base_dir / prompt_txt
    if not csv_file.is_absolute():
        csv_file = base_dir / csv_file

    prompt_text = _read_text_file(prompt_txt)
    csv_text = _read_text_file(csv_file)
    #試験用
    csv_text = "ネットのやつを参考にしてね"
    # ✅ 長すぎるCSVをそのまま入れると詰むので、上限を設ける（必要なら .env で調整）
    max_chars = int(os.getenv("MAX_CONTEXT_CHARS", "22220000"))
    if len(csv_text) > max_chars:
        csv_text = csv_text[:max_chars] + "\n\n[TRUNCATED]\n"

    model = os.getenv("MODEL_NAME", "gemini-2.5-flash")

    combined = f"""# System / Instructions (prompt.txt)
{prompt_text}

# CSV (test.csv)
{csv_text}

# User request
{req.user_text}
"""

    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY (or GOOGLE_API_KEY) is not set in environment/.env",
        )

    try:
        # GEMINI_API_KEY が環境にあれば client = genai.Client() でOK
        client = genai.Client()
        resp = client.models.generate_content(
            model=model,
            contents=combined,
        )
        return {"text": getattr(resp, "text", None) or str(resp)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {e}")


# ============================================================
# User input -> 既存 gemini_endpoint() に流して返す
# ============================================================

class UserInputRequest(BaseModel):
    text: str
    ts: Optional[int] = None
    # 省略可：フロントから上書きしたい場合
    prompt_txt_path: Optional[str] = None
    csv_path: Optional[str] = None


@app.post("/api/user_input")
async def user_input_endpoint(req: UserInputRequest):
    print(f"📝 user_input: text={req.text} ts={req.ts}")

    # ✅ 既存の /gemini の処理にそのまま合流
    gemini_req = GeminiRequest(
        user_text=req.text,
        prompt_txt_path=req.prompt_txt_path,
        csv_path=req.csv_path,
    )

    result = await gemini_endpoint(gemini_req)  # {"text": "..."}
    return {"ok": True, **result}
