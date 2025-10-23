import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function setupControls(camera) {
  const move = { forward: false, backward: false, left: false, right: false };
  let pitch = 0; // 上下回転
  let yaw = 0;   // 左右回転
  const speed = 0.1;

  // マウス移動イベント
  window.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement !== document.body) return;
    const sensitivity = 0.002;
    yaw -= e.movementX * sensitivity;
    pitch -= e.movementY * sensitivity;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
  });

  // キーボード
  window.addEventListener("keydown", (e) => {
    switch (e.code) {
      case "KeyW": move.forward = true; break;
      case "KeyS": move.backward = true; break;
      case "KeyA": move.left = true; break;
      case "KeyD": move.right = true; break;
    }
  });

  window.addEventListener("keyup", (e) => {
    switch (e.code) {
      case "KeyW": move.forward = false; break;
      case "KeyS": move.backward = false; break;
      case "KeyA": move.left = false; break;
      case "KeyD": move.right = false; break;
    }
  });

  // クリックでロック
  window.addEventListener("click", () => {
    document.body.requestPointerLock();
  });

  // カメラ更新ロジック
  function update() {
    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    const direction = new THREE.Vector3();
    if (move.forward) direction.z -= 1;
    if (move.backward) direction.z += 1;
    if (move.left) direction.x -= 1;
    if (move.right) direction.x += 1;
    direction.normalize();

    const moveVector = new THREE.Vector3(direction.x, 0, direction.z);
    moveVector.applyEuler(camera.rotation);
    camera.position.addScaledVector(moveVector, speed);
  }

  return { update };
}
