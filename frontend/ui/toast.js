
// ui/toast.js
export function createToast({ right = 18, bottom = 290 } = {}) {
  injectStyleOnce();

  const root = document.createElement("div");
  root.className = "vr-toast";
  root.style.right = `${right}px`;
  root.style.bottom = `${bottom}px`;
  document.body.appendChild(root);

  function show(message, { duration = 1600 } = {}) {
    const item = document.createElement("div");
    item.className = "vr-toast__item";
    item.textContent = String(message);

    root.appendChild(item);

    // fade in
    requestAnimationFrame(() => item.classList.add("is-on"));

    // remove
    setTimeout(() => {
      item.classList.remove("is-on");
      setTimeout(() => item.remove(), 250);
    }, duration);
  }

  return { show };
}

let __toastStyleInjected = false;
function injectStyleOnce() {
  if (__toastStyleInjected) return;
  __toastStyleInjected = true;

  const style = document.createElement("style");
  style.textContent = `
    .vr-toast{
      position: fixed;
      z-index: 9100;
      display:flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }
    .vr-toast__item{
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 0.18s ease, transform 0.18s ease;
      background: rgba(0,0,0,0.55);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 14px;
      padding: 8px 10px;
      font-size: 12px;
      backdrop-filter: blur(8px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.35);
      max-width: 360px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .vr-toast__item.is-on{
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);
}
