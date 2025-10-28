export function setupControls(camera) {
  const move = { forward: false, backward: false, left: false, right: false };
  let pitch = 0;
  let yaw = 0;

  window.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement !== document.body) return;
    const sensitivity = 0.002;
    yaw -= e.movementX * sensitivity;
    pitch -= e.movementY * sensitivity;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
  });

  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyW") move.forward = true;
    if (e.code === "KeyS") move.backward = true;
    if (e.code === "KeyA") move.left = true;
    if (e.code === "KeyD") move.right = true;
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "KeyW") move.forward = false;
    if (e.code === "KeyS") move.backward = false;
    if (e.code === "KeyA") move.left = false;
    if (e.code === "KeyD") move.right = false;
  });

  window.addEventListener("click", () => document.body.requestPointerLock());

  function update() {
    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  }

  return { update, move };
}
