// ===============================
//  Main VR Museum Frontend
//  （Raycast設置モード + HUD入力分離）
// ===============================
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { setupControls } from "./controls.js";
import { setupMultiplayer } from "./multiplayer.js";
import { createArtFrame } from "./exhibits/artFrame.js";
import { setupHudInput } from "./ui/hubInput.js";
import { createScene, ROOM } from "./scene.js";
import { setupPhysics } from "./physics.js";
// ============================================================
// シーン初期化
// ============================================================
const { scene, camera, renderer, frames } = await createScene();
const { world, sphereBody, sphereMesh, playerBody } = setupPhysics(scene, ROOM);
const controls = setupControls(camera);
  setupPhysics(scene, { width: 30, height: 30, depth: 30 });
setupMultiplayer(scene, playerBody); // 不要ならコメントアウトOK

document.body.appendChild(renderer.domElement);

// ============================================================
// HUD 入力（ユーザインプット）
// ============================================================
const hud = setupHudInput({
  apiBase: "http://localhost:8000",
  onResponse: (data) => {
    const payload =
      data?.json ??
      (() => {
        try { return JSON.parse(data?.text ?? ""); } catch { return null; }
      })();

    if (!payload) return;

    const ids = Array.isArray(payload.works)
      ? payload.works.map((w) => w.id).filter(Boolean)
      : [];

    if (ids.length === 0) return;

    for (let i = 0; i < frames.length; i++) {
      const id = ids[i % ids.length];
      frames[i].setWorkId(id);
    }
  },
});

// ============================================================
// リサイズ対応
// ============================================================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================
// 🧩 Raycast設置モード
// ============================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let placingMode = false;
// Raycast対象を「置ける面」だけにする
function getPlaceableMeshes() {
  const list = [];
  scene.traverse((obj) => {
    if (obj.isMesh && obj.userData?.placeable) list.push(obj);
  });
  return list;
}

// 設置プレビュー
const preview = new THREE.Mesh(
  new THREE.PlaneGeometry(0.8, 0.6),
  new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    depthTest: false,
  })
);
preview.visible = false;
scene.add(preview);

// Pキーで設置モード切替
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyP") {
    placingMode = !placingMode;
    preview.visible = placingMode;
    console.log(placingMode ? "🎯 設置モード ON" : "🚫 設置モード OFF");
  }
});

function updateMouseNDC(e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

// プレビュー更新
window.addEventListener("pointermove", (e) => {
  if (!placingMode) return;

  updateMouseNDC(e);
  raycaster.setFromCamera(mouse, camera);

  const hits = raycaster.intersectObjects(getPlaceableMeshes(), true);
  if (hits.length === 0) {
    preview.visible = false;
    return;
  }

  const hit = hits[0];
  preview.visible = true;
  preview.position.copy(hit.point);

  const n = hit.face?.normal?.clone() ?? new THREE.Vector3(0, 1, 0);
  n.transformDirection(hit.object.matrixWorld);
  preview.lookAt(hit.point.clone().add(n));
  preview.position.add(n.multiplyScalar(0.01));
});

// クリックで展示設置
window.addEventListener("pointerdown", (e) => {
  if (!placingMode || e.button !== 0) return;

  updateMouseNDC(e);
  raycaster.setFromCamera(mouse, camera);

  const hits = raycaster.intersectObjects(getPlaceableMeshes(), true);
  if (hits.length === 0) return;

  const hit = hits[0];
  const point = hit.point.clone();
  const n = hit.face?.normal?.clone() ?? new THREE.Vector3(0, 1, 0);
  n.transformDirection(hit.object.matrixWorld);

  console.log("🖼 Frame placed at:", point);

  const frame = createArtFrame(
    ["./assets/art1.jpg", "./assets/art2.jpg", "./assets/art3.jpg"],
    point
  );

  frame.group.position.copy(point).add(n.clone().multiplyScalar(0.01));
  frame.group.lookAt(point.clone().add(n));

  scene.add(frame.group);
  frame.initInteraction(renderer, camera);
});

// ============================================================
// 🎮 プレイヤー移動・物理・描画
// ============================================================
const clock = new THREE.Clock();
const fixedTimeStep = 1 / 60;
const maxSubSteps = 3;

function handlePlayerMovement() {
  // HUD入力中は移動させない
  if (hud.isTyping()) {
    playerBody.velocity.x = 0;
    playerBody.velocity.z = 0;
    return;
  }

  const move = new THREE.Vector3();

  if (controls.move.forward) move.z -= 1;
  if (controls.move.backward) move.z += 1;
  if (controls.move.left) move.x -= 1;
  if (controls.move.right) move.x += 1;

  if (move.lengthSq() > 0) {
    move.normalize();

    const yaw = camera.rotation.y;
    const sinY = Math.sin(yaw);
    const cosY = Math.cos(yaw);

    const dirX = move.x * cosY - move.z * sinY;
    const dirZ = move.x * sinY + move.z * cosY;

    playerBody.velocity.x = dirX * 3;
    playerBody.velocity.z = dirZ * 3;
  } else {
    playerBody.velocity.x = 0;
    playerBody.velocity.z = 0;
  }
}

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);
  world.step(fixedTimeStep, dt, maxSubSteps);

  sphereMesh.position.copy(sphereBody.position);

  camera.position.copy(playerBody.position);
  camera.position.y += 1.6;

  handlePlayerMovement();
  controls.update();
  renderer.render(scene, camera);
}

// ============================================================
// 実行
// ============================================================
animate();
console.log("🟢 VR Museum frontend started (HUD分離構成)");
