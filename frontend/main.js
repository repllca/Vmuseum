import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { VRButton } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/VRButton.js";

let camera, scene, renderer;

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

  // --- リサイズ対応 ---
  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}
