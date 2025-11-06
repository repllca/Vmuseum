from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

connected = {}

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    player_id = id(ws)
    connected[player_id] = ws
    print(f"✅ Connected: {player_id}")

    try:
        while True:
            data = await ws.receive_json()
            # 全員にブロードキャスト
            for pid, conn in connected.items():
                if pid != player_id:
                    await conn.send_json({"id": player_id, **data})
    except WebSocketDisconnect:
        print(f"❌ Disconnected: {player_id}")
        del connected[player_id]
