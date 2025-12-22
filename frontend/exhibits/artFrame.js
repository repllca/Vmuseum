// exhibits/artFrame.js（差し替え版）
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

function idToUrl(id, basePath = "./assets/GoghDB") {
  return `${basePath}/${id}.jpg`;
}

export function createArtFrame(items, position = new THREE.Vector3(0, 1.5, -3), options = {}) {
  const {
    assetsBase = "./assets/GoghDB",
    mode = "auto",
    // ★ サイズ（将来可変にするため）
    frameWidth = 4.4,
    frameHeight = 3.2,
    frameDepth = 0.1,
    paintingWidth = 4.0,
    paintingHeight = 2.8,
    paintingOffsetZ = 0.051,
  } = options;

  const group = new THREE.Group();
  group.position.copy(position);

  let currentItems = Array.isArray(items) ? items.slice() : [];
  if (currentItems.length === 0) currentItems = [{ id: "F452" }];

  const detectMode = () => {
    if (mode !== "auto") return mode;
    const sample = currentItems[0];
    const s = typeof sample === "string" ? sample : String(sample?.id ?? "");
    if (s.includes("://") || s.includes(".jpg") || s.startsWith("./") || s.startsWith("/")) return "url";
    return "id";
  };
  const resolvedMode = detectMode();

  const toUrl = (x) => {
    if (resolvedMode === "url") {
      if (typeof x === "string") return String(x);
      if (x?.url) return String(x.url);
      return String(x?.id ?? "");
    }
    const id = typeof x === "string" ? x : String(x?.id ?? "");
    return idToUrl(id, assetsBase);
  };

  const normalizeWork = (x) => {
    if (typeof x === "string") return { id: x, title: "", reason: "", url: "" };
    return {
      id: String(x?.id ?? ""),
      title: String(x?.title ?? ""),
      reason: String(x?.reason ?? ""),
      url: x?.url ? String(x.url) : "",
      // 将来：w/h をworkに載せたいならここで拾う
      w: typeof x?.w === "number" ? x.w : null,
      h: typeof x?.h === "number" ? x.h : null,
    };
  };

  let currentIndex = 0;
  let currentWork = normalizeWork(currentItems[currentIndex]);

  // 額縁（ローカル）
  const frameGeom = new THREE.BoxGeometry(frameWidth, frameHeight, frameDepth);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const frameMesh = new THREE.Mesh(frameGeom, frameMat);
  frameMesh.position.set(0, 0, 0);
  group.add(frameMesh);

  // 絵（ローカル）
  const loader = new THREE.TextureLoader();
  const paintingGeom = new THREE.PlaneGeometry(paintingWidth, paintingHeight);
  const paintingMat = new THREE.MeshBasicMaterial({
    map: loader.load(toUrl(currentItems[currentIndex])),
  });
  const paintingMesh = new THREE.Mesh(paintingGeom, paintingMat);
  paintingMesh.position.set(0, 0, paintingOffsetZ);
  group.add(paintingMesh);

  function applyCurrent() {
    currentWork = normalizeWork(currentItems[currentIndex]);

    // 将来：work側のw/hが来たらジオメトリも差し替える（今は未使用）
    // 例：if (currentWork.w && currentWork.h) { ... }

    const url = toUrl(currentItems[currentIndex]);
    loader.load(url, (tex) => {
      if (paintingMat.map && paintingMat.map.dispose) paintingMat.map.dispose();
      paintingMat.map = tex;
      paintingMat.needsUpdate = true;
    });
  }

  paintingMesh.userData.isArtwork = true;
  paintingMesh.userData.getArtworkUrl = () => toUrl(currentItems[currentIndex]);
  paintingMesh.userData.getArtworkLabel = () =>
    currentWork.title ? `${currentWork.title} (${currentWork.id})` : currentWork.id;
  paintingMesh.userData.getArtworkReason = () => currentWork.reason || "";

  // サイズ情報（レイアウト用）
  group.userData.frameW = frameWidth;
  group.userData.frameH = frameHeight;

  function setWorks(works, index = 0) {
    if (!Array.isArray(works) || works.length === 0) return;
    currentItems = works.map(normalizeWork);
    currentIndex = Math.max(0, Math.min(index, currentItems.length - 1));
    applyCurrent();
  }
  function setWork(work) { setWorks([work], 0); }
  function setWorkId(id) { setWork({ id: String(id) }); }

  return { group, setWorks, setWork, setWorkId, paintingMesh, frameMesh };
}
