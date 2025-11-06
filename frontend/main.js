// ===============================
//  Main VR Museum Frontend
// ===============================
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createScene } from "./scene.js";
import { setupControls } from "./controls.js";
import { setupPhysics } from "./physics.js";
import { setupMultiplayer } from "./multiplayer.js";

// === シーン初期化 ===
const { scene, camera, renderer } = createScene();
const controls = setupControls(camera);
const { world, sphereBody, sphereMesh, playerBody } = setupPhysics(scene);
setupMultiplayer(scene, playerBody); // 🧠 マルチプレイ同期

// === レンダラーをページに追加 ===
document.body.appendChild(renderer.domElement);

// === ウィンドウリサイズ対応 ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === キー入力による移動制御 ===
function handlePlayerMovement() {
  const move = new THREE.Vector3();

  if (controls.move.forward) move.z -= 1;
  if (controls.move.backward) move.z += 1;
  if (controls.move.left) move.x -= 1;
  if (controls.move.right) move.x += 1;

  if (move.length() > 0) {
    move.normalize();
    move.applyEuler(camera.rotation);
    playerBody.velocity.x = move.x * 3;
    playerBody.velocity.z = move.z * 3;
  }
}

// === メインループ ===
function animate() {
  requestAnimationFrame(animate);

  // --- 物理ステップ ---
  world.step(1 / 60);

  // --- 球体メッシュの同期 ---
  sphereMesh.position.copy(sphereBody.position);

  // --- カメラをプレイヤーに追従 ---
  camera.position.copy(playerBody.position);
  camera.position.y += 1.6; // 目線の高さ

  // --- 移動制御 ---
  handlePlayerMovement();

  // --- コントロール更新 ---
  controls.update();

  // --- 描画 ---
  renderer.render(scene, camera);
}

// === 実行 ===
animate();
console.log("🎮 VR Museum frontend started successfully!");
