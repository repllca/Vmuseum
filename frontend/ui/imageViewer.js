// ui/imageViewer.js
// ===============================
// Fullscreen Image Viewer (Overlay)
// - show(url, title, reason)
// - hide()
// ===============================

export function createImageViewer({
  mount = document.body,
  zIndex = 10000,
} = {}) {
  injectStyleOnce();

  const root = document.createElement("div");
  root.className = "vr-imgviewer";
  root.style.zIndex = String(zIndex);
  root.style.display = "none";

  const backdrop = document.createElement("div");
  backdrop.className = "vr-imgviewer__backdrop";

  const panel = document.createElement("div");
  panel.className = "vr-imgviewer__panel";

  // Title (Top Caption)
  const titleEl = document.createElement("div");
  titleEl.className = "vr-imgviewer__title";

  // Image Element
  const img = document.createElement("img");
  img.className = "vr-imgviewer__img";
  img.alt = "Artwork";

  // Reason (Bottom Caption)
  const reasonEl = document.createElement("div");
  reasonEl.className = "vr-imgviewer__reason";

  // Close Button
  const closeBtn = document.createElement("button");
  closeBtn.className = "vr-imgviewer__close";
  closeBtn.textContent = "×";

  // Append elements
  panel.appendChild(titleEl);
  panel.appendChild(closeBtn);
  panel.appendChild(img);
  panel.appendChild(reasonEl);

  root.appendChild(backdrop);
  root.appendChild(panel);
  mount.appendChild(root);

function show(url, title = "", reason = "") {
  img.src = String(url ?? "");
  titleEl.textContent = title ? String(title) : "Untitled";

  const r = reason ? String(reason) : "";
  reasonEl.textContent = r;
  reasonEl.style.display = r ? "block" : "none";

  root.style.display = "block";
  if (document.pointerLockElement) document.exitPointerLock();
}

  function hide() {
    root.style.display = "none";
    img.src = "";
  }

  // close handlers
  closeBtn.addEventListener("click", hide);
  backdrop.addEventListener("click", hide);
  window.addEventListener("keydown", (e) => {
    if (root.style.display === "none") return;
    if (e.key === "Escape") hide();
  });

  return { el: root, show, hide, isOpen: () => root.style.display !== "none" };
}

let __imgviewer_style_injected = false;
function injectStyleOnce() {
  if (__imgviewer_style_injected) return;
  __imgviewer_style_injected = true;

  const style = document.createElement("style");
  style.textContent = `
.vr-imgviewer{
  position: fixed;
  inset: 0;
  display: none;
  pointer-events: auto;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif;
}

.vr-imgviewer__backdrop{
  position: absolute;
  inset: 0;
  background:
    radial-gradient(1200px 800px at 50% 30%, rgba(255,255,255,0.10), transparent 60%),
    rgba(0,0,0,0.80);
  backdrop-filter: blur(8px);
}

/* panel: 3段を強制 (header / body / footer) */
.vr-imgviewer__panel{
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(92vw, 1100px);
  height: min(92vh, 760px);
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.14);
  background: linear-gradient(180deg, rgba(30,30,30,0.94), rgba(16,16,16,0.94));
  box-shadow: 0 30px 90px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04) inset;

  display: flex;
  flex-direction: column;
}

/* Header */
.vr-imgviewer__title{
  flex: 0 0 auto;
  padding: 14px 52px 12px 18px;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.00));
  border-bottom: 1px solid rgba(255,255,255,0.10);

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Close (ヘッダー上に浮かす) */
.vr-imgviewer__close{
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.16);
  background: rgba(0,0,0,0.35);
  color:#fff;
  font-size: 20px;
  cursor:pointer;
  line-height: 1;
  display: grid;
  place-items: center;
}
.vr-imgviewer__close:hover{ background: rgba(255,255,255,0.08); }

/* Body (画像はここに必ず収める) */
.vr-imgviewer__img{
  flex: 1 1 auto;     /* ← ここが重要: 真ん中で伸び縮みする */
  min-height: 0;      /* ← overflow/containが壊れるのを防ぐ */
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 16px 18px;
  box-sizing: border-box;

  background:
    radial-gradient(900px 500px at 50% 45%, rgba(255,255,255,0.06), rgba(0,0,0,0.0) 65%),
    #0f0f10;
}

/* Footer (解説は下固定 + 長文スクロール) */
.vr-imgviewer__reason{
  flex: 0 0 auto;
  padding: 12px 18px 16px 18px;
  color: rgba(235,235,235,0.86);
  font-size: 13.5px;
  line-height: 1.6;
  text-align: left;

  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.00));
  border-top: 1px solid rgba(255,255,255,0.10);

  max-height: 28vh;   /* 下が長いときはここだけスクロール */
  overflow: auto;
}

/* optional scrollbar */
.vr-imgviewer__reason::-webkit-scrollbar{ width: 10px; }
.vr-imgviewer__reason::-webkit-scrollbar-thumb{
  background: rgba(255,255,255,0.14);
  border-radius: 999px;
  border: 2px solid rgba(0,0,0,0.20);
}

@media (max-width: 520px){
  .vr-imgviewer__panel{ width: 94vw; height: 92vh; border-radius: 16px; }
  .vr-imgviewer__title{ font-size: 15px; padding: 12px 48px 10px 14px; }
  .vr-imgviewer__img{ padding: 12px; }
  .vr-imgviewer__reason{ font-size: 13px; padding: 10px 12px 14px 12px; max-height: 34vh; }
}
  `;
  document.head.appendChild(style);
}
