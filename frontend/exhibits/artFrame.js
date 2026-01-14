// exhibits/artFrame.js（差し替え版：説明ON/OFF対応）
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

function idToUrl(id, basePath = "./assets/GoghDB") {
  return `${basePath}/${id}.jpg`;
}

// ===============================
// テキストSprite（CanvasTexture）
// ===============================
function makeTextSprite(
  text,
  {
    fontSize = 36,
    padding = 16,
    maxWidth = 720,
    lineHeight = 1.25,
    textColor = "white",
    bgColor = "rgba(0,0,0,0.55)",
  } = {}
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const font = `${fontSize}px sans-serif`;
  ctx.font = font;

  // 簡易wrap（日本語は単語分割が効きにくいので、長すぎたら文字で折る）
  const raw = String(text ?? "").replace(/\r\n/g, "\n");
  const paragraphs = raw.split("\n");

  const measure = (s) => ctx.measureText(s).width;

  const wrapLine = (line) => {
    if (!line) return [""];
    // まずスペース区切りで試す
    const words = line.split(/\s+/).filter((w) => w.length > 0);
    if (words.length >= 2) {
      const lines = [];
      let cur = "";
      for (const w of words) {
        const next = cur ? `${cur} ${w}` : w;
        if (measure(next) <= maxWidth) cur = next;
        else {
          if (cur) lines.push(cur);
          cur = w;
        }
      }
      if (cur) lines.push(cur);
      return lines;
    }
    // 日本語等：文字で折る
    const lines = [];
    let cur = "";
    for (const ch of line) {
      const next = cur + ch;
      if (measure(next) <= maxWidth) cur = next;
      else {
        if (cur) lines.push(cur);
        cur = ch;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  };

  const lines = [];
  for (const p of paragraphs) {
    const wrapped = wrapLine(p);
    for (const w of wrapped) lines.push(w);
  }

  const textW = Math.min(
    maxWidth,
    Math.max(1, ...lines.map((l) => measure(l)))
  );
  const textH = Math.ceil(lines.length * fontSize * lineHeight);

  canvas.width = Math.ceil(textW + padding * 2);
  canvas.height = Math.ceil(textH + padding * 2);

  // resizeで消えるので再設定
  ctx.font = font;
  ctx.textBaseline = "top";

  // bg
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // text
  ctx.fillStyle = textColor;
  let y = padding;
  for (const line of lines) {
    ctx.fillText(line, padding, y);
    y += fontSize * lineHeight;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(mat);

  // px -> world
  const pxToWorld = 0.005;
  sprite.scale.set(canvas.width * pxToWorld, canvas.height * pxToWorld, 1);

  // disposeを持たせる（更新用）
  sprite.userData.__disposeTextTexture = () => {
    try {
      if (sprite.material?.map) sprite.material.map.dispose?.();
      sprite.material?.dispose?.();
    } catch {
      // ignore
    }
  };

  return sprite;
}

function markAsDescription(obj) {
  if (!obj) return obj;
  obj.userData = obj.userData || {};
  obj.userData.isArtworkDesc = true;
  return obj;
}

function setDescriptionsVisibleInGroup(group, visible) {
  if (!group) return;
  group.traverse((o) => {
    if (o?.userData?.isArtworkDesc) o.visible = visible;
  });
}

export function createArtFrame(
  items,
  position = new THREE.Vector3(0, 1.5, -3),
  options = {}
) {
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

    // ✅ 説明の配置（必要なら main.js からも上書き可能）
    descOffsetY = -(frameHeight / 2 + 0.45),
    descOffsetZ = paintingOffsetZ + 0.02,
    descMaxWidthPx = 760,
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

  // ===============================
  // ✅ 説明（Sprite）
  // ===============================
  let titleSprite = null;
  let reasonSprite = null;

  function rebuildDescriptionSprites() {
    // 古いのを破棄
    if (titleSprite) {
      titleSprite.userData?.__disposeTextTexture?.();
      group.remove(titleSprite);
      titleSprite = null;
    }
    if (reasonSprite) {
      reasonSprite.userData?.__disposeTextTexture?.();
      group.remove(reasonSprite);
      reasonSprite = null;
    }

    const label = currentWork.title
      ? `${currentWork.title} (${currentWork.id})`
      : currentWork.id || "Artwork";

    const reason = String(currentWork.reason ?? "").trim();

    titleSprite = markAsDescription(
      makeTextSprite(`🖼 ${label}`, {
        fontSize: 34,
        maxWidth: descMaxWidthPx,
        bgColor: "rgba(0,0,0,0.55)",
      })
    );
    titleSprite.position.set(0, descOffsetY, descOffsetZ);
    group.add(titleSprite);

    // reason は空なら作らない（or 非表示）
    if (reason) {
      reasonSprite = markAsDescription(
        makeTextSprite(reason, {
          fontSize: 28,
          maxWidth: descMaxWidthPx,
          bgColor: "rgba(0,0,0,0.35)",
        })
      );

      // タイトルの下に配置（タイトルSprite高さから計算）
      const gap = 0.12;
      const y = descOffsetY - (titleSprite.scale.y / 2 + reasonSprite.scale.y / 2 + gap);
      reasonSprite.position.set(0, y, descOffsetZ);
      group.add(reasonSprite);
    }
  }

  function applyCurrent() {
    currentWork = normalizeWork(currentItems[currentIndex]);

    const url = toUrl(currentItems[currentIndex]);
    loader.load(url, (tex) => {
      if (paintingMat.map && paintingMat.map.dispose) paintingMat.map.dispose();
      paintingMat.map = tex;
      paintingMat.needsUpdate = true;
    });

    // ✅ 説明テキストも更新
    rebuildDescriptionSprites();
  }

  // Raycast対象
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

  // ✅ 初期の説明生成
  rebuildDescriptionSprites();

  // ✅ 説明ON/OFF API（main.js から呼べる）
  function setDescriptionsVisible(visible) {
    setDescriptionsVisibleInGroup(group, visible);
  }

  return {
    group,
    setWorks,
    setWork,
    setWorkId,
    paintingMesh,
    frameMesh,
    // ✅ 追加
    setDescriptionsVisible,
  };
}
