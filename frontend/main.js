// ===============================
//  Main VR Museum Frontend
//  （P=閲覧モード / Raycastで選択→拡大表示 / works数に応じて可変）
//  + works空対策（payload形の吸収）
//  + 起動時に初期展示を表示
// ===============================
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

import { setupControls } from "./controls.js";
import { setupMultiplayer } from "./multiplayer.js";
import { createArtFrame } from "./exhibits/artFrame.js";

import { setupHudInput } from "./ui/hubInput.js";
import { createChatLog } from "./ui/chatLog.js";
import { createImageViewer } from "./ui/imageViewer.js";

import { createScene, ROOM } from "./scene.js";
import { setupPhysics } from "./physics.js";

// ============================================================
// シーン初期化
// ============================================================
const { scene, camera, renderer, frames } = await createScene();
const { world, sphereBody, sphereMesh, playerBody } = setupPhysics(scene, ROOM);

document.body.appendChild(renderer.domElement);

// ============================================================
// UI
// ============================================================
const chatLog = createChatLog({
  title: "Curator ↔ User",
  initialOpen: true,
  width: 520,
  maxHeight: 300,
});
chatLog.addSystem("🟢 VR Museum frontend started");

const viewer = createImageViewer();

// HUD（TDZ回避）
let hud = null;

// ============================================================
// 閲覧モード（PでON/OFF）
// ============================================================
let viewMode = false;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let lastHover = null;
let lastHoverColor = null;

function setViewMode(on) {
  viewMode = on;

  if (viewMode && document.pointerLockElement) {
    document.exitPointerLock?.();
  }

  chatLog.addSystem(viewMode ? "🔍 閲覧モード ON（絵をクリックで拡大）" : "🎮 移動モード ON");
}

window.addEventListener("keydown", (e) => {
  if (e.code === "KeyP") setViewMode(!viewMode);
});

function updateMouseNDCFromEvent(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
}

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
    chatLog.addSystem("⚠️ この絵はURL取得できませんでした");
    return;
  }

  const caption = [label ? `🖼 ${label}` : "🖼 Artwork", reason].filter(Boolean).join("\n\n");
  viewer.show(url, caption);
});

// ============================================================
// works受け取りの形を吸収する（重要）
// ============================================================
function normalizePayload(data) {
  if (!data) return null;

  // 1) まず直下に works があるならそれを使う
  if (data.curator_comment || data.works) return data;

  // 2) よくあるラッパー
  if (data.json && (data.json.curator_comment || data.json.works)) return data.json;
  if (data.data && (data.data.curator_comment || data.data.works)) return data.data;
  if (data.result && (data.result.curator_comment || data.result.works)) return data.result;

  // 3) ★ 最重要：text に JSON が文字列で入っている場合を救う
  if (typeof data.text === "string") {
    const s = data.text.trim();
    if (s.startsWith("{") && s.endsWith("}")) {
      try {
        const parsed = JSON.parse(s);
        return parsed;
      } catch {
        // ここで落ちたら raw のまま返す
      }
    }
  }

  return data;
}

function normalizeWorks(payload) {
  const works = Array.isArray(payload?.works) ? payload.works : [];
  // idがあるものだけ残す（title/reasonは任意）
  return works
    .filter((w) => w && w.id)
    .map((w) => ({
      id: String(w.id),
      title: String(w.title ?? ""),
      reason: String(w.reason ?? ""),
      url: w.url ? String(w.url) : "",
    }));
}

// ============================================================
// フレーム可変：works数に合わせて増減＋並べる
// ============================================================
function layoutPositionsOnBackWall(n) {
  const z = -(ROOM?.depth ? ROOM.depth / 2 - 0.3 : 4.7);
  const y = 1.6;

  const spacing = 5.2;
  const total = (n - 1) * spacing;
  const startX = -total / 2;

  const positions = [];
  for (let i = 0; i < n; i++) {
    positions.push(new THREE.Vector3(startX + i * spacing, y, z));
  }
  return positions;
}

function buildWallConfigs() {
  const halfW = ROOM.width / 2;
  const halfD = ROOM.depth / 2;
  const yCenter = ROOM.height / 2;

  // 壁面の「中心点」「内向き法線」「横方向（右）」
  return [
    // 0: 正面（奥） z = -halfD, 内側は +Z
    {
      name: "front",
      center: new THREE.Vector3(0, yCenter, -halfD),
      normal: new THREE.Vector3(0, 0, 1),
      right: new THREE.Vector3(1, 0, 0),
      span: ROOM.width, // 横に並べられる長さ
    },
    // 1: 背面（手前） z = +halfD, 内側は -Z
    {
      name: "back",
      center: new THREE.Vector3(0, yCenter, +halfD),
      normal: new THREE.Vector3(0, 0, -1),
      right: new THREE.Vector3(-1, 0, 0), // カメラから見て右方向が揃うように
      span: ROOM.width,
    },
    // 2: 左壁 x = -halfW, 内側は +X
    {
      name: "left",
      center: new THREE.Vector3(-halfW, yCenter, 0),
      normal: new THREE.Vector3(1, 0, 0),
      right: new THREE.Vector3(0, 0, -1),
      span: ROOM.depth,
    },
    // 3: 右壁 x = +halfW, 内側は -X
    {
      name: "right",
      center: new THREE.Vector3(+halfW, yCenter, 0),
      normal: new THREE.Vector3(-1, 0, 0),
      right: new THREE.Vector3(0, 0, 1),
      span: ROOM.depth,
    },
  ];
}

// worksを4面に振り分けて、壁ごとにグリッド配置する
function layoutPositionsOnFourWalls(works, {
  floatFromWall = 0.35,  // ★壁からの浮かせ（大きめで確実に）
  baseY = 2.8,           // ★床から浮かせる（目線より上）
  topMargin = 1.2,       // 天井との余裕
  colGap = 1.6,          // 横の隙間
  rowGap = 1.8,          // 縦の隙間
  defaultFrameW = 4.4,
  defaultFrameH = 3.2,
  sideMargin = 1.5,      // 端の余裕
} = {}) {
  const walls = buildWallConfigs();

  // 壁ごとにworks indexを集める
  const byWall = walls.map(() => []);
  for (let i = 0; i < works.length; i++) {
    byWall[i % 4].push(i);
  }

  // 位置結果（index -> {pos, normal}）
  const out = new Array(works.length);

  for (let w = 0; w < walls.length; w++) {
    const wall = walls[w];
    const indices = byWall[w];
    if (indices.length === 0) continue;

    // 使える横幅
    const usableSpan = Math.max(0, wall.span - sideMargin * 2);

    // 何列置けるか（今は等サイズ想定。将来は work.w/h で可変にする）
    const cellW = defaultFrameW + colGap;
    const cols = Math.max(1, Math.floor(usableSpan / cellW));

    // 上方向
    const up = new THREE.Vector3(0, 1, 0);

    for (let k = 0; k < indices.length; k++) {
      const idx = indices[k];
      const col = k % cols;
      const row = Math.floor(k / cols);

      // 左端→右へ
      const xOffset = (col - (cols - 1) / 2) * cellW;

      // baseYから上へ積む（部屋高さを超えないように）
      const y = Math.min(
        ROOM.height - topMargin,
        baseY + row * (defaultFrameH + rowGap)
      );

      const anchor = wall.center.clone();
      anchor.y = y;

      // 壁面上で横方向へずらす
      anchor.add(wall.right.clone().multiplyScalar(xOffset));

      // 壁から少し浮かす
      const pos = anchor.clone().add(wall.normal.clone().multiplyScalar(floatFromWall));

      out[idx] = { pos, normal: wall.normal.clone() };
    }
  }

  return out;
}
function syncFramesToWorks(works) {
  const n = works.length;

  // 4面レイアウト
  const placements = layoutPositionsOnFourWalls(works, {
    floatFromWall: 0.35,  // ★もっと浮かす
    baseY: 2.8,           // ★床から浮かす
    colGap: 1.8,
    rowGap: 2.0,
    defaultFrameW: 4.4,
    defaultFrameH: 3.2,
  });

  // 増やす
  while (frames.length < n) {
    const frame = createArtFrame([], new THREE.Vector3(0, 0, 0), {
      assetsBase: "./assets/GoghDB",
      mode: "auto",
      // 将来：作品サイズをここに入れる
      frameWidth: 4.4,
      frameHeight: 3.2,
      paintingWidth: 4.0,
      paintingHeight: 2.8,
    });
    scene.add(frame.group);
    frames.push(frame);
  }

  // 減らす
  while (frames.length > n) {
    const removed = frames.pop();
    if (removed?.group) scene.remove(removed.group);
  }

  // 位置・向き・内容反映
  for (let i = 0; i < n; i++) {
    const p = placements[i];
    if (!p) continue;

    const frame = frames[i];
    frame.group.position.copy(p.pos);

    // 壁に貼り付く向き（表面が壁の法線方向を向く）
    frame.group.lookAt(p.pos.clone().add(p.normal));

    // 内容
    if (frame.setWork) frame.setWork(works[i]);
    else if (frame.setWorkId) frame.setWorkId(works[i]?.id);
  }
}

// ============================================================
// 起動時の初期展示（ここで“最初にある程度絵を表示”）
// ============================================================
const INITIAL_WORKS = [
  {
    id: "F458",
    title: "ひまわり",
    reason: "初期展示：鮮やかな黄色が特徴の代表作。",
  },
  {
    id: "F587",
    title: "麦畑と糸杉",
    reason: "初期展示：黄金の麦畑と青空の対比が美しい。",
  },
  {
    id: "F422",
    title: "種まく人",
    reason: "初期展示：夕日の光と躍動的な筆致。",
  },
];

syncFramesToWorks(INITIAL_WORKS);
chatLog.addSystem(`🖼 初期展示を ${INITIAL_WORKS.length} 枚表示しました`);

// ============================================================
// HUD 入力（ユーザインプット）
// ============================================================
hud = setupHudInput({
  apiBase: "http://localhost:8000",

  onSend: (text) => {
    chatLog.addUser(text);
  },

  onResponse: (data) => {
    // ★ 受け取り形を吸収
    const payloadRaw = normalizePayload(data);

    // デバッグしたい時はこれを一時的にONにすると一発で原因が分かる
    // console.log("[onResponse] raw:", data);
    // console.log("[onResponse] payload:", payloadRaw);

    if (payloadRaw?.curator_comment) {
      chatLog.addAI(payloadRaw.curator_comment);
    } else if (payloadRaw?.error) {
      chatLog.addAI(`❌ ${String(payloadRaw.error)}`);
    } else if (typeof payloadRaw?.text === "string" && payloadRaw.text.trim()) {
      // もし text で返すAPIならここ
      chatLog.addAI(payloadRaw.text.trim());
    }

    const works = normalizeWorks(payloadRaw);

    if (works.length === 0) {
      // ★ “空でした” は出すけど、初期展示は残す（クリアしない）
      chatLog.addSystem("⚠️ works が空でした（初期展示を維持します）");
      return;
    }

    syncFramesToWorks(works);
    chatLog.addSystem(`🧩 展示を ${works.length} 枚に更新しました`);
  },
});

// ============================================================
// Controls（閲覧モード中はpointer lockしない）
// ※ controls.js は canPointerLock対応版にしてね
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
  if (hud.isTyping() || viewMode || viewer.isOpen()) {
    playerBody.velocity.x = 0;
    playerBody.velocity.z = 0;
    return;
  }

  const move = new THREE.Vector3();

  if (controls.move.forward) move.z -= 1;
  if (controls.move.backward) move.z += 1;
  if (controls.move.left) move.x -= 1;
  if (controls.move.right) move.x += 1;

  if (move.lengthSq() > 0) {
    move.normalize();

    const yaw = camera.rotation.y;
    const sinY = Math.sin(yaw);
    const cosY = Math.cos(yaw);

    const dirX = move.x * cosY - move.z * sinY;
    const dirZ = move.x * sinY + move.z * cosY;

    playerBody.velocity.x = dirX * 3;
    playerBody.velocity.z = dirZ * 3;
  } else {
    playerBody.velocity.x = 0;
    playerBody.velocity.z = 0;
  }
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
console.log("🟢 VR Museum frontend started (Variable frames + initial works)");
