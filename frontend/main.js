import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createScene } from "./scene.js";
import { setupControls } from "./controls.js";
import { setupPhysics } from "./physics.js";

const { scene, camera, renderer } = createScene();
const controls = setupControls(camera);
const { world, sphereBody, sphereMesh, playerBody } = setupPhysics(scene);

document.body.appendChild(renderer.domElement);

function animate() {
  requestAnimationFrame(animate);

  // Cannon.js のステップ
  world.step(1 / 60);

  // 球の描画同期
  sphereMesh.position.copy(sphereBody.position);

  // 🔹 カメラをプレイヤーの位置に同期
  camera.position.copy(playerBody.position);

  // 🔹 プレイヤーの移動入力を反映
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

  controls.update();
  renderer.render(scene, camera);
}

animate();
