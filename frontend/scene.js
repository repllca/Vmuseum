import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createArtFrame } from "./exhibits/artFrame.js";

// ✅ physics/main からも使えるように export
export const ROOM = {
  width: 30,
  height: 30,
  depth: 30,
};

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x808080);

  const WALL = {
    yCenter: ROOM.height / 2,
    zFront: -ROOM.depth / 2, // 正面壁（奥側）
    zBack: ROOM.depth / 2,
  };

  // ============================================================
  // カメラ（壁が見える位置）
  // ============================================================
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 1.8, WALL.zBack - 4);       // 後ろ壁の少し手前
  camera.lookAt(0, 1.8, WALL.zFront + 2);           // 正面壁方向を見る

  // ============================================================
  // レンダラー
  // ============================================================
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // ============================================================
  // 光
  // ============================================================
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.0));
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
  directionalLight.position.set(6, 12, 8);
  scene.add(directionalLight);

  // ============================================================
  // 床
  // ============================================================
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.width, ROOM.depth),
    new THREE.MeshStandardMaterial({ color: 0x999999 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.userData.placeable = true;
  scene.add(floor);

  // ============================================================
  // 部屋（内側の箱）
  // ============================================================
  const roomShell = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM.width, ROOM.height, ROOM.depth),
    new THREE.MeshStandardMaterial({ color: 0xaaaaaa, side: THREE.BackSide })
  );
  roomShell.position.set(0, WALL.yCenter, 0);
  scene.add(roomShell);

  // ============================================================
  // 正面壁（raycast/貼り付け用に明示）
  // ============================================================
  const wallFront = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.width, ROOM.height),
    new THREE.MeshStandardMaterial({ color: 0xaaaaaa, side: THREE.FrontSide })
  );
  wallFront.position.set(0, WALL.yCenter, WALL.zFront);
  wallFront.userData.placeable = true;
  scene.add(wallFront);

  // ============================================================
  // 🖼 正面壁に3枚貼る（ID→assets/GoghDB）
  // ============================================================
  const frames = [];
  const wallForward = new THREE.Vector3(0, 0, 10); // 壁の手前方向(+Z)
  const floatFromWall = 0; // ← 埋まり/チラつき防止。大きめでOK

  const frameY = -6.0; // プレイヤー目線(1.6-1.8)付近に合わせる
  const frameXs = [-3, 0, 3]; // 広い部屋なので間隔広め

  const workIds = ["F452", "F737", "F451"]; // 仮（Geminiで差し替える）

  for (let i = 0; i < 3; i++) {
    const id = workIds[i];

    // 壁上の基準点（正面壁） + 手前へ浮かせ
    const pos = new THREE.Vector3(frameXs[i], frameY, WALL.zFront)
      .add(wallForward.clone().multiplyScalar(floatFromWall));

    const frame = createArtFrame([id], pos, {
      mode: "id",
      assetsBase: "./assets/GoghDB",
    });

    // 壁に正面向き
    frame.group.lookAt(pos.clone().add(wallForward));

    scene.add(frame.group);
    frames.push(frame);
  }

  return { scene, camera, renderer, frames };
}
