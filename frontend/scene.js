// scene.js
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createArtFrame } from "./exhibits/artFrame.js";

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
    zFront: -ROOM.depth / 2, // 奥側 = -15
    zBack: ROOM.depth / 2,   // 手前側 = +15
  };

  // ============================================================
  // カメラ（奥壁が見える位置）
  // ============================================================
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 1.8, WALL.zBack - 4); // z=11
  camera.lookAt(0, 1.8, WALL.zFront + 2);      // z=-13

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
  // 正面壁（視認用・raycast用）
  // ============================================================
  const wallFrontMat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });

  const wallFront = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.width, ROOM.height),
    wallFrontMat
  );
  wallFront.position.set(0, WALL.yCenter, WALL.zFront);
  wallFront.userData.placeable = true;
  scene.add(wallFront);

  // ============================================================
  // 🖼 正面壁に初期3枚（確実に見える）
  // ============================================================
  const frames = [];

  const wallNormal = new THREE.Vector3(0, 0, 1); // 正面壁の内向き（+Z）
  const floatFromWall = 0.25;                    // ★確実に見えるよう大きめ
  const frameY = 1.8;                            // ★目線
  const frameXs = [-6, 0, 6];

  const workIds = ["F452", "F737", "F451"];

  for (let i = 0; i < workIds.length; i++) {
    const anchor = new THREE.Vector3(frameXs[i], frameY, WALL.zFront);
    const pos = anchor.clone().add(wallNormal.clone().multiplyScalar(floatFromWall));

    const frame = createArtFrame([{ id: workIds[i] }], pos, {
      mode: "id",
      assetsBase: "./assets/GoghDB",
    });

    // ★ groupの位置は artFrame.js 内で設定済み（ローカル座標なので回転OK）
    frame.group.lookAt(pos.clone().add(wallNormal));

    scene.add(frame.group);
    frames.push(frame);
  }

  return { scene, camera, renderer, frames };
}
