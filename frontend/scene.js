import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x808080); // 灰色の背景

  // カメラ
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.6, 3);

  // レンダラー
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // ===== ライティング =====
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);

  // ===== 床 =====
  const floorGeometry = new THREE.PlaneGeometry(10, 10);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2; // 平面を水平にする
  floor.position.y = 0; // 高さ0に設置
  scene.add(floor);

  // ===== 壁と天井 =====
  // BoxGeometry(幅, 高さ, 奥行)
  // side: THREE.BackSide で「内側を描画」
  const roomGeometry = new THREE.BoxGeometry(10, 5, 10);
  const roomMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    side: THREE.BackSide, // 内側を見せる
  });
  const room = new THREE.Mesh(roomGeometry, roomMaterial);
  scene.add(room);

  // ===== テスト用オブジェクト =====
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x44aa88 })
  );
  box.position.set(0, 0.5, -2);
  scene.add(box);

  // ===== ウィンドウサイズに対応 =====
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}
