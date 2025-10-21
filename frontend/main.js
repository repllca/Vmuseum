import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { VRButton } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/VRButton.js";

let camera, scene, renderer;
let rotation = { x: 0, y: 0 };
const move = { forward: false, backward: false, left: false, right: false };
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const speed = 3.0;

init();
animate();

function init() {
  // --- シーン ---
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x808080);

  // --- カメラ ---
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 3);

  // --- ライト ---
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff);
  dirLight.position.set(0, 20, 10);
  scene.add(dirLight);

  // --- 床 ---
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({ color: 0x999999 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // --- 壁（部屋） ---
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(10, 5, 10),
    new THREE.MeshStandardMaterial({ color: 0xaaaaaa, side: THREE.BackSide })
  );
  scene.add(room);

  // --- レンダラー ---
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  // --- VRボタン ---
  document.body.appendChild(VRButton.createButton(renderer));

  // --- キー操作 ---
  document.addEventListener("keydown", e => {
    if (e.code === "KeyW") move.forward = true;
    if (e.code === "KeyS") move.backward = true;
    if (e.code === "KeyA") move.left = true;
    if (e.code === "KeyD") move.right = true;
  });
  document.addEventListener("keyup", e => {
    if (e.code === "KeyW") move.forward = false;
    if (e.code === "KeyS") move.backward = false;
    if (e.code === "KeyA") move.left = false;
    if (e.code === "KeyD") move.right = false;
  });

  // --- マウス操作 ---
  document.addEventListener("mousemove", e => {
    if (document.pointerLockElement === renderer.domElement) {
      rotation.y -= e.movementX * 0.002;
      rotation.x -= e.movementY * 0.002;
      rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, rotation.x));
    }
  });

  document.body.addEventListener("click", () => {
    renderer.domElement.requestPointerLock();
  });

  // --- リサイズ対応 ---
  window.addEventListener('resize', onWindowResize);
}

function updateCamera(delta) {
  // 移動減衰
  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  // 移動方向
  direction.z = Number(move.forward) - Number(move.backward);
  direction.x = Number(move.right) - Number(move.left);
  direction.normalize();

  if (move.forward || move.backward) velocity.z -= direction.z * speed * delta;
  if (move.left || move.right) velocity.x -= direction.x * speed * delta;

  // カメラ回転
  camera.rotation.x = rotation.x;
  camera.rotation.y = rotation.y;

  // カメラ移動
  const forward = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
  const right = new THREE.Vector3(1, 0, 0).applyEuler(camera.rotation);
  camera.position.addScaledVector(forward, velocity.z * delta);
  camera.position.addScaledVector(right, velocity.x * delta);
}

let prevTime = performance.now();

function animate() {
  renderer.setAnimationLoop(() => {
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    updateCamera(delta);
    renderer.render(scene, camera);
    prevTime = time;
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
