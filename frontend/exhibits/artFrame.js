import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

/**
 * 作品ID → 画像URL
 * 例: F452 → ./assets/GoghDB/F452.jpg
 */
function idToUrl(id, basePath = "./assets/GoghDB") {
  return `${basePath}/${id}.jpg`;
}

export function createArtFrame(
  items,
  position = new THREE.Vector3(0, 1.5, -3),
  options = {}
) {
  const { assetsBase = "./assets/GoghDB", mode = "auto" } = options;

  const group = new THREE.Group();

  // ============================================================
  // 額縁
  // ============================================================
  const frameGeom = new THREE.BoxGeometry(4.4, 3.2, 0.1);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const frameMesh = new THREE.Mesh(frameGeom, frameMat);
  frameMesh.position.copy(position);
  group.add(frameMesh);

  // ============================================================
  // 入力正規化（ID or URL）
  // ============================================================
  let currentItems = Array.isArray(items) ? items.slice() : [];
  if (currentItems.length === 0) currentItems = ["F452"];

  const detectMode = () => {
    if (mode !== "auto") return mode;
    const sample = String(currentItems[0] ?? "");
    if (
      sample.includes("://") ||
      sample.includes(".jpg") ||
      sample.startsWith("./") ||
      sample.startsWith("/")
    ) {
      return "url";
    }
    return "id";
  };

  const resolvedMode = detectMode();
  const toUrl = (x) =>
    resolvedMode === "url" ? String(x) : idToUrl(String(x), assetsBase);

  // ============================================================
  // 絵（プレーン）
  // ============================================================
  const loader = new THREE.TextureLoader();
  let currentIndex = 0;

  const paintingGeom = new THREE.PlaneGeometry(4, 2.8);
  const paintingMat = new THREE.MeshBasicMaterial({
    map: loader.load(toUrl(currentItems[currentIndex])),
  });

  const paintingMesh = new THREE.Mesh(paintingGeom, paintingMat);
  paintingMesh.position.set(
    position.x,
    position.y,
    position.z + 0.051 // 額縁より少し前
  );
  group.add(paintingMesh);

  function applyCurrent() {
    const url = toUrl(currentItems[currentIndex]);
    paintingMat.map = loader.load(url);
    paintingMat.needsUpdate = true;
  }

  // ============================================================
  // 外部からの操作API（Gemini連携用）
  // ============================================================
  function setWorkIds(ids, index = 0) {
    if (!Array.isArray(ids) || ids.length === 0) return;
    currentItems = ids.slice();
    currentIndex = Math.max(0, Math.min(index, currentItems.length - 1));
    applyCurrent();
  }

  function setWorkId(id) {
    setWorkIds([id], 0);
  }

  // ============================================================
  // 返却
  // ============================================================
  return {
    group,
    setWorkIds,
    setWorkId,
  };
}
