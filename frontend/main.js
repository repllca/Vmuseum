// ===============================
//  Main VR Museum Frontend
//  （Raycast設置モード付き）
// ===============================
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createScene } from "./scene.js";
import { setupControls } from "./controls.js";
import { setupPhysics } from "./physics.js";
import { setupMultiplayer } from "./multiplayer.js";
import { createArtFrame } from "./exhibits/artFrame.js";

// === シーン初期化 ===
const { scene, camera, renderer } = await createScene();
const controls = setupControls(camera);
const { world, sphereBody, sphereMesh, playerBody } = setupPhysics(scene);
setupMultiplayer(scene, playerBody); // 🧠 マルチプレイ同期（必要に応じて無効可）

// === レンダラーをページに追加 ===
document.body.appendChild(renderer.domElement);

// === ウィンドウリサイズ対応 ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================
// 🧩 Raycast設置モード（開発者向け）
// ============================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let placingMode = false; // 設置モードのON/OFF

// Pキーで設置モード切り替え
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyP") {
    placingMode = !placingMode;
    console.log(placingMode ? "🎯 設置モード ON" : "🚫 設置モード OFF");
  }
});

// クリックで展示設置
window.addEventListener("click", (e) => {
  if (!placingMode) return;

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const point = intersects[0].point;
    console.log("🖼 Frame placed at:", point);

    const frame = createArtFrame(["./assets/art1.jpg", "./assets/art2.jpg", "./assets/art3.jpg"], point);
    scene.add(frame.group);
    frame.initInteraction(renderer, camera);
  }
});

// ============================================================
// 🎮 プレイヤー移動・物理・描画ループ
// ============================================================

function handlePlayerMovement() {
  const move = new THREE.Vector3();

  if (controls.move.forward) move.z -= 1;
  if (controls.move.backward) move.z += 1;
  if (controls.move.left) move.x -= 1;
  if (controls.move.right) move.x += 1;

  if (move.length() > 0) {
    move.normalize();

    // カメラのY軸回転に合わせて移動
    const yaw = camera.rotation.y;
    const sinY = Math.sin(yaw);
    const cosY = Math.cos(yaw);
    const dirX = move.x * cosY - move.z * sinY;
    const dirZ = move.x * sinY + move.z * cosY;

    playerBody.velocity.x = dirX * 3;
    playerBody.velocity.z = dirZ * 3;
  }
}

function animate() {
  requestAnimationFrame(animate);

  world.step(1 / 60);
  sphereMesh.position.copy(sphereBody.position);

  // カメラ追従
  camera.position.copy(playerBody.position);
  camera.position.y += 1.6;

  handlePlayerMovement();
  controls.update();
  renderer.render(scene, camera);
}

// === 実行 ===
animate();
console.log("🟢 VR Museum frontend started (Raycast設置モード搭載)");
