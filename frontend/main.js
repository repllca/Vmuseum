// ===============================
//  Main VR Museum Frontend
//  （P=閲覧モード / Raycastで選択→拡大表示 / works数に応じて可変）
//  + ChatLogはUser/AIのみ（systemはtoast）
//  + 4面配置（front/back/left/right）
//  + test.csv をフロントで読み込み（F番号→title/width/height/imagefilename）
//  + 作品ごとにサイズ可変（実寸m→スケール変換）
//  + ✅ 説明をボタンで全体ON/OFF
// ===============================
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

import { setupControls } from "./controls.js";
import { setupMultiplayer } from "./multiplayer.js";
import { createArtFrame } from "./exhibits/artFrame.js";

import { setupHudInput } from "./ui/hubInput.js";
import { createChatLog } from "./ui/chatLog.js";
import { createImageViewer } from "./ui/imageViewer.js";
import { createToast } from "./ui/toast.js";

import { loadCatalogCsv } from "./ui/catalogCsv.js";

import { createScene, ROOM } from "./scene.js";
import { setupPhysics } from "./physics.js";

// ============================================================
// シーン初期化
// ============================================================
const { scene, camera, renderer, frames } = await createScene();
const { world, sphereBody, sphereMesh, playerBody } = setupPhysics(scene, ROOM);

document.body.appendChild(renderer.domElement);

// ============================================================
// UI（ChatLogはUser/AIのみ、状態はtoast）
// ============================================================
const chatLog = createChatLog({
  title: "User ↔ AI",
  initialOpen: true,
  width: 420,
  maxHeight: 260,
  bottom: 18,
  right: 18,
});

const toast = createToast({ right: 18, bottom: 290 });
toast.show("🟢 VR Museum started");

const viewer = createImageViewer();

// ============================================================
// ✅ 説明表示トグル（全フレーム一括）
// ============================================================
let descriptionsVisible = true;

function createToggleDescButton({ right = 18, top = 18 } = {}) {
  const btn = document.createElement("button");
  btn.textContent = "📝 説明: ON";
  btn.style.position = "fixed";
  btn.style.right = `${right}px`;
  btn.style.top = `${top}px`;
  btn.style.zIndex = 9999;
  btn.style.padding = "10px 12px";
  btn.style.borderRadius = "10px";
  btn.style.border = "1px solid rgba(255,255,255,0.25)";
  btn.style.background = "rgba(0,0,0,0.55)";
  btn.style.color = "white";
  btn.style.cursor = "pointer";
  btn.style.backdropFilter = "blur(6px)";
  btn.style.userSelect = "none";

  btn.addEventListener("click", () => {
    descriptionsVisible = !descriptionsVisible;
    btn.textContent = descriptionsVisible ? "📝 説明: ON" : "📝 説明: OFF";
    applyDescriptionsVisibilityToAllFrames(descriptionsVisible);
    toast.show(descriptionsVisible ? "📝 説明を表示" : "📝 説明を非表示");
  });

  document.body.appendChild(btn);
  return btn;
}

function applyDescriptionsVisibilityToFrame(frame, visible) {
  if (!frame) return;

  // ✅ artFrame.js が setDescriptionsVisible を返している場合
  if (typeof frame.setDescriptionsVisible === "function") {
    frame.setDescriptionsVisible(visible);
    return;
  }

  // ✅ フォールバック（userData.isArtworkDesc の可視性切替）
  if (frame.group) {
    frame.group.traverse((o) => {
      if (o?.userData?.isArtworkDesc) o.visible = visible;
    });
  }
}

function applyDescriptionsVisibilityToAllFrames(visible) {
  for (const f of frames) applyDescriptionsVisibilityToFrame(f, visible);
}

// ボタン設置
createToggleDescButton({ right: 18, top: 18 });

// ============================================================
// test.csv（フロントでロード）
// ============================================================
let catalogMap = new Map();

async function initCatalog() {
  try {
    catalogMap = await loadCatalogCsv("./assets/test.csv");
    toast.show(`📚 catalog loaded: ${catalogMap.size}`);
  } catch (e) {
    console.error("catalog load failed:", e);
    toast.show("⚠️ catalog csv load failed");
    catalogMap = new Map();
  }
}
await initCatalog();

function resolveImageUrlFromMeta(meta) {
  if (meta?.imagefilename) return `./assets/GoghDB/${meta.imagefilename}`;

  if (meta?.wikimediaurl && meta.wikimediaurl.includes("upload.wikimedia.org")) {
    return meta.wikimediaurl;
  }
  return null;
}

function enrichWorksWithCatalog(works) {
  return works.map((w) => {
    const id = String(w.id ?? "").trim();
    const meta = catalogMap.get(id);

    const url = resolveImageUrlFromMeta(meta);

    return {
      ...w,
      title: w.title && String(w.title).trim() ? w.title : (meta?.title_en ?? ""),
      w_m: meta?.w_m ?? null,
      h_m: meta?.h_m ?? null,
      url: url ?? w.url ?? "",
    };
  });
}

// ============================================================
// HUD（TDZ回避）
// ============================================================
let hud = null;

// ============================================================
// 閲覧モード（PでON/OFF）
// ============================================================
let viewMode = false;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// hover（任意：うっすら明るく）
let lastHover = null;
let lastHoverColor = null;

function setViewMode(on) {
  viewMode = on;

  if (viewMode && document.pointerLockElement) {
    document.exitPointerLock?.();
  }

  toast.show(viewMode ? "🔍 閲覧モード ON" : "🎮 移動モード ON");
}

window.addEventListener("keydown", (e) => {
  if (e.code === "KeyP") setViewMode(!viewMode);
});

// canvas基準のNDC
function updateMouseNDCFromEvent(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
}

// シーンから「絵Mesh」だけ集める
function getArtworkMeshes() {
  const list = [];
  scene.traverse((obj) => {
    if (obj.isMesh && obj.userData?.isArtwork) list.push(obj);
  });
  return list;
}

function setHover(mesh) {
  if (lastHover && lastHover.material && lastHoverColor) {
    if (lastHover.material.color) lastHover.material.color.copy(lastHoverColor);
  }

  lastHover = mesh;

  if (!lastHover || !lastHover.material || !lastHover.material.color) {
    lastHoverColor = null;
    return;
  }

  lastHoverColor = lastHover.material.color.clone();
  lastHover.material.color.lerp(new THREE.Color(0xffffff), 0.15);
}

window.addEventListener("pointermove", (e) => {
  if (!viewMode) return;
  if (hud?.isTyping?.()) return;
  if (viewer.isOpen()) return;

  updateMouseNDCFromEvent(e);
  raycaster.setFromCamera(mouse, camera);

  const hits = raycaster.intersectObjects(getArtworkMeshes(), true);
  const hitMesh = hits[0]?.object ?? null;
  setHover(hitMesh);
});

window.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  if (!viewMode) return;
  if (hud?.isTyping?.()) return;
  if (viewer.isOpen()) return;

  updateMouseNDCFromEvent(e);
  raycaster.setFromCamera(mouse, camera);

  const hits = raycaster.intersectObjects(getArtworkMeshes(), true);
  if (hits.length === 0) return;

  const mesh = hits[0].object;

  const url = mesh.userData?.getArtworkUrl?.();
  const label = mesh.userData?.getArtworkLabel?.() ?? "";
  const reason = mesh.userData?.getArtworkReason?.() ?? "";

  if (!url) {
    toast.show("⚠️ URL取得できませんでした");
    return;
  }

  // viewer.show(url, title, reason) 仕様
  const title = label ? `🖼 ${label}` : "🖼 Artwork";

  // ✅ 説明OFFなら reason だけ消す
  const showReason = descriptionsVisible ? reason : "";
  viewer.show(url, title, showReason);
});

// ============================================================
// works受け取りの形を吸収する（重要）
// ============================================================
function normalizePayload(data) {
  if (!data) return null;

  if (data.curator_comment || data.works) return data;

  if (data.json && (data.json.curator_comment || data.json.works)) return data.json;
  if (data.data && (data.data.curator_comment || data.data.works)) return data.data;
  if (data.result && (data.result.curator_comment || data.result.works)) return data.result;

  if (typeof data.text === "string") {
    const s = data.text.trim();
    if (s.startsWith("{") && s.endsWith("}")) {
      try {
        return JSON.parse(s);
      } catch {
        // ignore
      }
    }
  }

  return data;
}

function normalizeWorks(payload) {
  const works = Array.isArray(payload?.works) ? payload.works : [];
  return works
    .filter((w) => w && w.id)
    .map((w) => ({
      id: String(w.id),
      title: String(w.title ?? ""),
      reason: String(w.reason ?? ""),
      url: w.url ? String(w.url) : "",
      w: typeof w.w === "number" ? w.w : null,
      h: typeof w.h === "number" ? w.h : null,
    }));
}

// ============================================================
// 4面レイアウト（front/back/left/right）
// ============================================================
function buildWallConfigs() {
  const halfW = ROOM.width / 2;
  const halfD = ROOM.depth / 2;
  const yCenter = ROOM.height / 2;

  return [
    {
      name: "front",
      center: new THREE.Vector3(0, yCenter, -halfD),
      normal: new THREE.Vector3(0, 0, 1),
      right: new THREE.Vector3(1, 0, 0),
      span: ROOM.width,
    },
    {
      name: "back",
      center: new THREE.Vector3(0, yCenter, +halfD),
      normal: new THREE.Vector3(0, 0, -1),
      right: new THREE.Vector3(-1, 0, 0),
      span: ROOM.width,
    },
    {
      name: "left",
      center: new THREE.Vector3(-halfW, yCenter, 0),
      normal: new THREE.Vector3(1, 0, 0),
      right: new THREE.Vector3(0, 0, -1),
      span: ROOM.depth,
    },
    {
      name: "right",
      center: new THREE.Vector3(+halfW, yCenter, 0),
      normal: new THREE.Vector3(-1, 0, 0),
      right: new THREE.Vector3(0, 0, 1),
      span: ROOM.depth,
    },
  ];
}

function layoutPositionsOnFourWalls(
  works,
  {
    floatFromWall = 0.75,
    baseY = 4.0,
    topMargin = 1.2,
    sideMargin = 2.0,
    rowGap = 2.2,
    colGap = 2.0,
  } = {}
) {
  const walls = buildWallConfigs();
  const byWall = walls.map(() => []);

  for (let i = 0; i < works.length; i++) byWall[i % 4].push(i);

  const out = new Array(works.length);

  for (let w = 0; w < walls.length; w++) {
    const wall = walls[w];
    const indices = byWall[w];
    if (indices.length === 0) continue;

    const usableSpan = Math.max(0, wall.span - sideMargin * 2);

    let currentRowY = baseY;
    let currentRowWidth = 0;
    let rowStartIndex = 0;

    for (let k = 0; k < indices.length; k++) {
      const idx = indices[k];
      const work = works[idx];
      const { fw, fh } = sizeFromWork(work);

      if (currentRowWidth + fw + (k > rowStartIndex ? colGap : 0) > usableSpan) {
        const rowHeights = indices
          .slice(rowStartIndex, k)
          .map((i) => sizeFromWork(works[i]).fh);
        const rowMaxH = rowHeights.length ? Math.max(...rowHeights) : 0;

        currentRowY += rowMaxH + rowGap;
        currentRowWidth = 0;
        rowStartIndex = k;
      }

      if (currentRowY + fh / 2 > ROOM.height - topMargin) {
        console.warn(`絵が壁のスペースを超えました: ${work.title}`);
        continue;
      }

      const xOffset = currentRowWidth + fw / 2 - usableSpan / 2;
      const anchor = wall.center.clone();
      anchor.y = currentRowY + fh / 2;
      anchor.add(wall.right.clone().multiplyScalar(xOffset));

      const pos = anchor.clone().add(wall.normal.clone().multiplyScalar(floatFromWall));
      out[idx] = { pos, normal: wall.normal.clone() };

      currentRowWidth += fw + colGap;
    }
  }

  return out;
}

// ============================================================
// 作品サイズ（実寸m→scene単位）
// ============================================================
const SCALE = 8.0;

function sizeFromWork(work) {
  const srcW = work.w_m ?? work.w ?? null;
  const srcH = work.h_m ?? work.h ?? null;

  const w = srcW ? srcW * SCALE : 4.4;
  const h = srcH ? srcH * SCALE : 3.2;

  const fw = Math.min(Math.max(w, 2.5), 10.0);
  const fh = Math.min(Math.max(h, 2.0), 8.0);

  return { fw, fh };
}

// ============================================================
// フレーム可変：works数に合わせて増減＋4面配置
// ============================================================
function syncFramesToWorks(works) {
  const n = works.length;

  const placements = layoutPositionsOnFourWalls(works, {
    floatFromWall: 0.75,
    baseY: 4.0,
    colGap: 2.0,
    rowGap: 2.2,
  });

  while (frames.length < n) frames.push(null);
  while (frames.length > n) {
    const removed = frames.pop();
    if (removed?.group) scene.remove(removed.group);
  }

  for (let i = 0; i < n; i++) {
    const p = placements[i];
    if (!p) continue;

    const work = works[i];
    const { fw, fh } = sizeFromWork(work);

    const old = frames[i];
    if (old?.group) scene.remove(old.group);

    const frame = createArtFrame([work], p.pos, {
      mode: "url",
      assetsBase: "./assets/GoghDB",

      frameWidth: fw,
      frameHeight: fh,
      frameDepth: 0.1,

      paintingWidth: Math.max(0.2, fw - 0.4),
      paintingHeight: Math.max(0.2, fh - 0.4),
      paintingOffsetZ: 0.051,
    });

    // ✅ ここで状態反映（重要）
    applyDescriptionsVisibilityToFrame(frame, descriptionsVisible);

    frame.group.lookAt(p.pos.clone().add(p.normal));
    scene.add(frame.group);
    frames[i] = frame;
  }
}
// ============================================================
// 起動時の初期展示（まず見せる）

// ============================================================
const INITIAL_WORKS = [
  { id: "F458", title: "ひまわり", reason: "初期展示：鮮やかな黄色が印象的です。" },
  { id: "F587", title: "麦畑と糸杉", reason: "初期展示：黄金の麦畑と青空の対比。" },
  { id: "F422", title: "種まく人", reason: "初期展示：夕日の光と躍動的な筆致。" },

  { id: "F482", title: "夜のカフェテラス", reason: "初期展示：夜景の光と色彩が魅力。" },
  { id: "F612", title: "星月夜", reason: "初期展示：渦巻く空の表現が象徴的。" },
  { id: "F476", title: "アルルの寝室", reason: "初期展示：シンプルな構図と色面。" },

  { id: "F527", title: "自画像", reason: "初期展示：視線と筆致に注目。" },
  { id: "F454", title: "花咲くアーモンドの枝", reason: "初期展示：春らしい爽やかな青。" },
  { id: "F630", title: "アイリス", reason: "初期展示：青紫のリズム感。" },

  { id: "F775", title: "雨の橋（日本趣味）", reason: "初期展示：浮世絵風の構図。" },
];

syncFramesToWorks(enrichWorksWithCatalog(INITIAL_WORKS));

// ============================================================
// HUD 入力（ユーザインプット）
// ============================================================
hud = setupHudInput({
  apiBase: "http://localhost:8000",

  onSend: (text) => {
    chatLog.addUser(text);
    chatLog.open();
  },

  onResponse: (data) => {
    const payload = normalizePayload(data);

    if (payload?.curator_comment) {
      chatLog.addAI(payload.curator_comment);
      chatLog.open();
    } else if (payload?.error) {
      chatLog.addAI(`❌ ${String(payload.error)}`);
      chatLog.open();
    } else if (typeof payload?.text === "string" && payload.text.trim()) {
      chatLog.addAI(payload.text.trim());
      chatLog.open();
    }

    const worksRaw = normalizeWorks(payload);
    if (worksRaw.length === 0) {
      toast.show("⚠️ 展示更新なし（works空）");
      return;
    }

    const works = enrichWorksWithCatalog(worksRaw);
    syncFramesToWorks(works);
    toast.show(`🧩 展示を ${works.length} 枚に更新`);
  },
});

// ============================================================
// Controls（閲覧モード中はpointer lockしない）
// ============================================================
const controls = setupControls(camera, {
  canPointerLock: () => !hud.isTyping() && !viewMode && !viewer.isOpen(),
});

// multiplayer（不要ならコメントアウトOK）
setupMultiplayer(scene, playerBody);

// ============================================================
// リサイズ対応
// ============================================================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================
// 🎮 プレイヤー移動・物理・描画
// ============================================================
const clock = new THREE.Clock();
const fixedTimeStep = 1 / 60;
const maxSubSteps = 3;

function handlePlayerMovement() {
  if (hud?.isTyping?.() || viewMode || viewer.isOpen()) {
    playerBody.velocity.x = 0;
    playerBody.velocity.z = 0;
    return;
  }

  let x = 0;
  let z = 0;
  if (controls.move.forward) z += 1;
  if (controls.move.backward) z -= 1;
  if (controls.move.left) x -= 1;
  if (controls.move.right) x += 1;

  if (x === 0 && z === 0) {
    playerBody.velocity.x = 0;
    playerBody.velocity.z = 0;
    return;
  }

  const len = Math.hypot(x, z);
  x /= len;
  z /= len;

  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  right.y = 0;
  right.normalize();

  const dir = new THREE.Vector3()
    .addScaledVector(right, x)
    .addScaledVector(forward, z)
    .normalize();

  const speed = 6;

  playerBody.velocity.x = dir.x * speed;
  playerBody.velocity.z = dir.z * speed;
}

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);
  world.step(fixedTimeStep, dt, maxSubSteps);

  sphereMesh.position.copy(sphereBody.position);

  camera.position.copy(playerBody.position);
  camera.position.y += 1.6;

  handlePlayerMovement();
  controls.update();
  renderer.render(scene, camera);
}

animate();
console.log("🟢 VR Museum frontend started");
