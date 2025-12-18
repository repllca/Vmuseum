import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

function idToUrl(id, basePath = "./assets") {
  // assets/F452.jpg みたいに置いてある想定
  return `${basePath}/${id}.jpg`;
}

export function createArtFrame(
  // ✅ 作品ID配列 or 画像URL配列のどちらでもOKにする
  items,
  position = new THREE.Vector3(0, 1.5, -3),
  options = {}
) {
  const {
    assetsBase = "./assets",
    // items がIDなのかURLなのか曖昧なときのため。省略なら自動判定。
    mode = "auto", // "auto" | "id" | "url"
  } = options;

  const group = new THREE.Group();

  // === 額縁 ===
  const frameGeom = new THREE.BoxGeometry(2.2, 1.6, 0.1);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const frameMesh = new THREE.Mesh(frameGeom, frameMat);
  frameMesh.position.copy(position);
  group.add(frameMesh);

  // === 入力を正規化（id/url をURL配列に変換） ===
  let sources = Array.isArray(items) ? items.slice() : [];
  if (sources.length === 0) sources = ["F452"]; // 念のため

  const detectMode = () => {
    if (mode !== "auto") return mode;
    // "http" や ".jpg" が含まれてたらURL扱い、それ以外はID扱い
    const sample = String(sources[0] ?? "");
    if (sample.includes("://") || sample.includes(".jpg") || sample.startsWith("./") || sample.startsWith("/")) {
      return "url";
    }
    return "id";
  };

  const resolvedMode = detectMode();

  const toUrl = (x) => {
    if (resolvedMode === "url") return String(x);
    return idToUrl(String(x), assetsBase);
  };

  // 現在の候補（ID配列でもURL配列でもOK）
  let currentItems = sources;
  let currentIndex = 0;

  // === 絵 ===
  const loader = new THREE.TextureLoader();

  const paintingGeom = new THREE.PlaneGeometry(2, 1.4);
  const paintingMat = new THREE.MeshBasicMaterial({
    map: loader.load(toUrl(currentItems[currentIndex])),
  });

  const paintingMesh = new THREE.Mesh(paintingGeom, paintingMat);
  paintingMesh.position.set(position.x, position.y, position.z + 0.051);
  group.add(paintingMesh);

  // === ボタン（左右） ===
  const buttonGeom = new THREE.BoxGeometry(0.2, 0.2, 0.05);
  const leftBtn = new THREE.Mesh(
    buttonGeom,
    new THREE.MeshStandardMaterial({ color: 0x5555ff })
  );
  leftBtn.position.set(position.x - 1.5, position.y, position.z + 0.05);

  const rightBtn = new THREE.Mesh(
    buttonGeom,
    new THREE.MeshStandardMaterial({ color: 0x55ff55 })
  );
  rightBtn.position.set(position.x + 1.5, position.y, position.z + 0.05);

  group.add(leftBtn);
  group.add(rightBtn);

  function applyCurrent() {
    const url = toUrl(currentItems[currentIndex]);
    paintingMat.map = loader.load(url);
    paintingMat.needsUpdate = true;
  }

  // === 外部から差し替えるAPI ===
  function setWorkIds(ids, index = 0) {
    if (!Array.isArray(ids) || ids.length === 0) return;
    currentItems = ids.slice();
    currentIndex = Math.max(0, Math.min(index, currentItems.length - 1));
    applyCurrent();
  }

  function setWorkId(id) {
    setWorkIds([id], 0);
  }

  // === クリック処理 ===
  let renderer, camera;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onClick(event) {
    if (!renderer || !camera) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([leftBtn, rightBtn], false);

    if (intersects.length > 0) {
      const btn = intersects[0].object;

      if (btn === leftBtn) {
        currentIndex = (currentIndex - 1 + currentItems.length) % currentItems.length;
      } else {
        currentIndex = (currentIndex + 1) % currentItems.length;
      }

      applyCurrent();
    }
  }

  return {
    group,
    initInteraction: (rendererRef, cameraRef) => {
      renderer = rendererRef;
      camera = cameraRef;
      renderer.domElement.addEventListener("click", onClick);
    },

    // ✅ 追加：IDで画像を切り替え
    setWorkIds,
    setWorkId,

    // ついでに外から参照したい時用
    getCurrentWorkId: () => String(currentItems[currentIndex]),
  };
}
