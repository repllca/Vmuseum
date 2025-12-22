// ui/imageViewer.js
// ===============================
// Fullscreen Image Viewer (Overlay)
// - show(url, caption)
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

  const top = document.createElement("div");
  top.className = "vr-imgviewer__top";

  const captionEl = document.createElement("div");
  captionEl.className = "vr-imgviewer__caption";

  const closeBtn = document.createElement("button");
  closeBtn.className = "vr-imgviewer__close";
  closeBtn.textContent = "×";

  top.appendChild(captionEl);
  top.appendChild(closeBtn);

  const img = document.createElement("img");
  img.className = "vr-imgviewer__img";
  img.alt = "Artwork";

  panel.appendChild(top);
  panel.appendChild(img);

  root.appendChild(backdrop);
  root.appendChild(panel);
  mount.appendChild(root);

  function show(url, caption = "") {
    img.src = String(url ?? "");
    captionEl.textContent = caption ? String(caption) : "";
    root.style.display = "block";
    // pointer lock解除したい場合
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
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(4px);
    }
    .vr-imgviewer__panel{
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: min(92vw, 1100px);
      height: min(92vh, 700px);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(20,20,20,0.9);
      box-shadow: 0 20px 70px rgba(0,0,0,0.55);
      display: flex;
      flex-direction: column;
    }
    .vr-imgviewer__top{
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding: 10px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.10);
      color:#fff;
      gap: 10px;
    }
    .vr-imgviewer__caption{
      font-size: 13px;
      opacity: 0.95;
      overflow:hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .vr-imgviewer__close{
      width: 34px;
      height: 34px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(0,0,0,0.35);
      color:#fff;
      font-size: 20px;
      cursor:pointer;
      line-height: 1;
    }
    .vr-imgviewer__close:hover{ background: rgba(255,255,255,0.08); }
    .vr-imgviewer__img{
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #111;
    }
  `;
  document.head.appendChild(style);
}
