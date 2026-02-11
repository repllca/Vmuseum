// controls.js
export function setupControls(camera, { canPointerLock = () => true } = {}) {
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

  // ★ クリックでの pointer lock は “許可される時だけ”
  window.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    if (!canPointerLock()) return;

    // ★ SecurityError を握りつぶす（競合しても落ちない）
    const p = document.body.requestPointerLock?.();
    if (p?.catch) p.catch(() => {});
  });

  function update() {
    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  }

  return { update, move };
}
