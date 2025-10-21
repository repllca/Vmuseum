from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse

app = FastAPI()

clients = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            print("Received:", data)
            # 全クライアントにブロードキャスト
            for c in clients:
                await c.send_text(f"Echo: {data}")
    except Exception as e:
        print("Client disconnected:", e)
        clients.remove(websocket)
