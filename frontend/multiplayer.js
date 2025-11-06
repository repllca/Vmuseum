import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function setupMultiplayer(scene, playerBody) {
  const socket = new WebSocket("ws://localhost:8000/ws");
  const otherPlayers = new Map();

  socket.addEventListener("open", () => {
    console.log("🟢 WebSocket Connected");
  });

  // 自分の位置を定期的に送信
  setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          position: playerBody.position,
        })
      );
    }
  }, 50);

  // 他プレイヤーの更新を受信
  socket.addEventListener("message", (event) => {
    const { id, position } = JSON.parse(event.data);

    if (!otherPlayers.has(id)) {
      // 👤 他プレイヤーの3Dモデルを生成
      const geom = new THREE.BoxGeometry(0.5, 1.8, 0.5);
      const mat = new THREE.MeshStandardMaterial({ color: 0x00ffff });
      const mesh = new THREE.Mesh(geom, mat);
      scene.add(mesh);
      otherPlayers.set(id, mesh);
    }

    const mesh = otherPlayers.get(id);
    mesh.position.set(position.x, position.y, position.z);
  });
}
