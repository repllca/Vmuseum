// ui/chatLog.js
// ===============================
// Chat Log UI Component
// - Three.js canvasの上に重ねる想定
// - addUser/addAI でメッセージ追加
// - 自動スクロール、クリア、表示切替
// ===============================

export function createChatLog({
  mount = document.body,
  width = 420,
  maxHeight = 260,
  title = "Conversation",
  initialOpen = true,
} = {}) {
  injectStyleOnce();

  const root = document.createElement("div");
  root.className = "vr-chatlog";
  root.style.setProperty("--chatlog-width", `${width}px`);
  root.style.setProperty("--chatlog-maxh", `${maxHeight}px`);

  const header = document.createElement("div");
  header.className = "vr-chatlog__header";

  const hTitle = document.createElement("div");
  hTitle.className = "vr-chatlog__title";
  hTitle.textContent = title;

  const right = document.createElement("div");
  right.className = "vr-chatlog__headerRight";

  const btnClear = document.createElement("button");
  btnClear.className = "vr-chatlog__btn";
  btnClear.textContent = "Clear";

  const btnToggle = document.createElement("button");
  btnToggle.className = "vr-chatlog__btn";
  btnToggle.textContent = initialOpen ? "Hide" : "Show";

  right.appendChild(btnClear);
  right.appendChild(btnToggle);

  header.appendChild(hTitle);
  header.appendChild(right);

  const body = document.createElement("div");
  body.className = "vr-chatlog__body";

  const list = document.createElement("div");
  list.className = "vr-chatlog__list";
  body.appendChild(list);

  root.appendChild(header);
  root.appendChild(body);
  mount.appendChild(root);

  let isOpen = initialOpen;
  setOpen(isOpen);

  btnClear.addEventListener("click", () => {
    list.innerHTML = "";
  });

  btnToggle.addEventListener("click", () => {
    isOpen = !isOpen;
    setOpen(isOpen);
  });

  function setOpen(open) {
    body.style.display = open ? "block" : "none";
    btnToggle.textContent = open ? "Hide" : "Show";
  }

  function addMessage({ role, text, meta }) {
    const row = document.createElement("div");
    row.className = `vr-chatlog__row vr-chatlog__row--${role}`;

    const bubble = document.createElement("div");
    bubble.className = `vr-chatlog__bubble vr-chatlog__bubble--${role}`;
    bubble.textContent = String(text ?? "");

    if (meta) {
      const m = document.createElement("div");
      m.className = "vr-chatlog__meta";
      m.textContent = String(meta);
      row.appendChild(m);
    }

    row.appendChild(bubble);
    list.appendChild(row);

    // auto-scroll
    requestAnimationFrame(() => {
      list.scrollTop = list.scrollHeight;
    });
  }

  return {
    el: root,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => {
      isOpen = !isOpen;
      setOpen(isOpen);
    },
    clear: () => (list.innerHTML = ""),
    addUser: (text, meta) => addMessage({ role: "user", text, meta }),
    addAI: (text, meta) => addMessage({ role: "ai", text, meta }),
    addSystem: (text, meta) => addMessage({ role: "system", text, meta }),
  };
}

let __chatlog_style_injected = false;
function injectStyleOnce() {
  if (__chatlog_style_injected) return;
  __chatlog_style_injected = true;

  const style = document.createElement("style");
  style.textContent = `
    .vr-chatlog{
      position: fixed;
      left: 16px;
      bottom: 100px;
      width: var(--chatlog-width, 420px);
      color: #fff;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif;
      z-index: 9999;
      pointer-events: auto;
    }
    .vr-chatlog__header{
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding: 10px 10px;
      border-radius: 12px 12px 0 0;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(6px);
      border: 1px solid rgba(255,255,255,0.12);
      border-bottom: none;
    }
    .vr-chatlog__title{
      font-weight: 700;
      font-size: 13px;
      opacity: 0.95;
    }
    .vr-chatlog__headerRight{ display:flex; gap:8px; }
    .vr-chatlog__btn{
      font-size: 12px;
      padding: 6px 10px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(0,0,0,0.35);
      color: #fff;
      cursor: pointer;
    }
    .vr-chatlog__btn:hover{ background: rgba(255,255,255,0.08); }

    .vr-chatlog__body{
      background: rgba(0,0,0,0.42);
      backdrop-filter: blur(6px);
      border: 1px solid rgba(255,255,255,0.12);
      border-top: none;
      border-radius: 0 0 12px 12px;
      overflow: hidden;
    }
    .vr-chatlog__list{
      max-height: var(--chatlog-maxh, 260px);
      overflow-y: auto;
      padding: 10px;
      display:flex;
      flex-direction: column;
      gap: 8px;
    }
    .vr-chatlog__row{
      display:flex;
      flex-direction: column;
      gap: 4px;
    }
    .vr-chatlog__bubble{
      width: fit-content;
      max-width: 95%;
      padding: 8px 10px;
      border-radius: 12px;
      white-space: pre-wrap;
      word-break: break-word;
      border: 1px solid rgba(255,255,255,0.10);
      line-height: 1.35;
      font-size: 13px;
    }
    .vr-chatlog__row--user{ align-items: flex-end; }
    .vr-chatlog__row--ai{ align-items: flex-start; }
    .vr-chatlog__row--system{ align-items: center; }

    .vr-chatlog__bubble--user{ background: rgba(80,140,255,0.25); }
    .vr-chatlog__bubble--ai{ background: rgba(255,255,255,0.10); }
    .vr-chatlog__bubble--system{
      background: rgba(0,0,0,0.25);
      opacity: 0.9;
      font-size: 12px;
    }
    .vr-chatlog__meta{
      font-size: 11px;
      opacity: 0.75;
    }
  `;
  document.head.appendChild(style);
}
