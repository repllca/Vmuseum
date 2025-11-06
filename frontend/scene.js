import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createArtFrame } from "./exhibits/artFrame.js"; // 🖼 額縁モジュールを追加

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x808080);

  // === カメラ設定 ===
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2, 5);

  // === レンダラー ===
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // === 光 ===
  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
  scene.add(light);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  // === 床 ===
  const floorGeometry = new THREE.PlaneGeometry(10, 10);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // === 壁（外殻）===
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(10, 5, 10),
    new THREE.MeshStandardMaterial({ color: 0xaaaaaa, side: THREE.BackSide })
  );
  scene.add(room);

  // === 🖼 中央の展示品を追加 ===
  const artworks = [
    "./assets/art1.jpg",
    "./assets/art2.jpg",
    "./assets/art3.jpg",
  ];

  // 中央に配置（壁の中央あたり）
  const artFrame = createArtFrame(artworks, new THREE.Vector3(0, 1.5, 0));
  scene.add(artFrame.group);

  // カメラとレンダラーを渡してクリック操作有効化
  artFrame.initInteraction(renderer, camera);

  return { scene, camera, renderer };
}
