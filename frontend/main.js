import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createScene } from "./scene.js";
import { setupControls } from "./controls.js";
import { setupPhysics } from "./physics.js";
import { setupMultiplayer } from "./multiplayer.js";

const { scene, camera, renderer } = createScene();
const controls = setupControls(camera);
const { world, sphereBody, sphereMesh, playerBody } = setupPhysics(scene);
setupMultiplayer(scene, playerBody); // 🟢 ← マルチプレイ同期

document.body.appendChild(renderer.domElement);

function animate() {
  requestAnimationFrame(animate);
  world.step(1 / 60);
  sphereMesh.position.copy(sphereBody.position);
  camera.position.copy(playerBody.position);

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
