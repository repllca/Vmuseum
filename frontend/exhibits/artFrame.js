
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function createArtFrame(imageUrls, position = new THREE.Vector3(0, 1.5, -3)) {
  const group = new THREE.Group();

  // === 額縁 ===
  const frameGeom = new THREE.BoxGeometry(2.2, 1.6, 0.1);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 }); // 木っぽい
  const frameMesh = new THREE.Mesh(frameGeom, frameMat);
  frameMesh.position.copy(position);
  group.add(frameMesh);

  // === 絵 ===
  const loader = new THREE.TextureLoader();
  let currentIndex = 0;
  const paintingGeom = new THREE.PlaneGeometry(2, 1.4);
  const paintingMat = new THREE.MeshBasicMaterial({
    map: loader.load(imageUrls[currentIndex]),
  });
  const paintingMesh = new THREE.Mesh(paintingGeom, paintingMat);
  paintingMesh.position.set(position.x, position.y, position.z + 0.051);
  group.add(paintingMesh);

  // === ボタン（左右） ===
  const buttonGeom = new THREE.BoxGeometry(0.2, 0.2, 0.05);
  const leftBtn = new THREE.Mesh(buttonGeom, new THREE.MeshStandardMaterial({ color: 0x5555ff }));
  leftBtn.position.set(position.x - 1.5, position.y, position.z + 0.05);
  const rightBtn = new THREE.Mesh(buttonGeom, new THREE.MeshStandardMaterial({ color: 0x55ff55 }));
  rightBtn.position.set(position.x + 1.5, position.y, position.z + 0.05);

  group.add(leftBtn);
  group.add(rightBtn);

  // === マウスクリック処理 ===
  let renderer, camera;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([leftBtn, rightBtn]);
    if (intersects.length > 0) {
      const btn = intersects[0].object;
      if (btn === leftBtn) currentIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
      else currentIndex = (currentIndex + 1) % imageUrls.length;
      paintingMat.map = loader.load(imageUrls[currentIndex]);
    }
  }

  return {
    group,
    initInteraction: (rendererRef, cameraRef) => {
      renderer = rendererRef;
      camera = cameraRef;
      window.addEventListener("click", onClick);
    },
  };
}
