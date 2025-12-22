// ui/chatLog.js
export function createChatLog({
  title = "Chat",
  initialOpen = true,
  width = 420,
  maxHeight = 260,
  bottom = 18,
  right = 18,
} = {}) {
  injectStyleOnce();

  const root = document.createElement("div");
  root.className = "vr-chat";

  root.style.width = `${width}px`;
  root.style.right = `${right}px`;
  root.style.bottom = `${bottom}px`;

  const header = document.createElement("div");
  header.className = "vr-chat__header";

  const titleEl = document.createElement("div");
  titleEl.className = "vr-chat__title";
  titleEl.textContent = title;

  const btn = document.createElement("button");
  btn.className = "vr-chat__toggle";
  btn.textContent = initialOpen ? "—" : "＋";

  header.appendChild(titleEl);
  header.appendChild(btn);

  const body = document.createElement("div");
  body.className = "vr-chat__body";

  const list = document.createElement("div");
  list.className = "vr-chat__list";
  body.appendChild(list);

  root.appendChild(header);
  root.appendChild(body);
  document.body.appendChild(root);

  let open = initialOpen;
  setOpen(open);

  btn.addEventListener("click", () => setOpen(!open));
  header.addEventListener("dblclick", () => setOpen(!open));

  function setOpen(v) {
    open = v;
    body.style.display = open ? "block" : "none";
    btn.textContent = open ? "—" : "＋";
  }

  function push(role, text) {
    if (!text) return;

    const item = document.createElement("div");
    item.className = `vr-chat__msg vr-chat__msg--${role}`;

    const bubble = document.createElement("div");
    bubble.className = "vr-chat__bubble";
    bubble.textContent = String(text);

    item.appendChild(bubble);
    list.appendChild(item);

    // 最新にスクロール
    list.scrollTop = list.scrollHeight;
  }

  return {
    // ★ これだけ使う（systemはUIに出さない）
    addUser: (text) => push("user", text),
    addAI: (text) => push("ai", text),

    // 表示制御
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!open),
    isOpen: () => open,
  };
}

let __styleInjected = false;
function injectStyleOnce() {
  if (__styleInjected) return;
  __styleInjected = true;

  const style = document.createElement("style");
  style.textContent = `
    .vr-chat{
      position: fixed;
      z-index: 9000;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(0,0,0,0.35);
      border: 1px solid rgba(255,255,255,0.12);
      background: rgba(20,20,20,0.68);
      backdrop-filter: blur(10px);
    }
    .vr-chat__header{
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding: 10px 12px;
      cursor: pointer;
      user-select: none;
      background: rgba(0,0,0,0.35);
      border-bottom: 1px solid rgba(255,255,255,0.10);
    }
    .vr-chat__title{
      color:#fff;
      font-size: 13px;
      opacity: 0.95;
      letter-spacing: 0.2px;
    }
    .vr-chat__toggle{
      width: 34px;
      height: 28px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.14);
      background: rgba(0,0,0,0.25);
      color: #fff;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
    }
    .vr-chat__toggle:hover{ background: rgba(255,255,255,0.08); }

    .vr-chat__body{
      max-height: 260px;
      overflow: hidden;
    }
    .vr-chat__list{
      max-height: 260px;
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .vr-chat__msg{
      display:flex;
      width: 100%;
    }
    .vr-chat__msg--user{ justify-content: flex-end; }
    .vr-chat__msg--ai{ justify-content: flex-start; }

    .vr-chat__bubble{
      max-width: 86%;
      padding: 8px 10px;
      border-radius: 14px;
      color: #fff;
      font-size: 13px;
      line-height: 1.45;
      white-space: pre-wrap;
      word-break: break-word;
      border: 1px solid rgba(255,255,255,0.10);
    }
    .vr-chat__msg--user .vr-chat__bubble{
      background: rgba(80,140,255,0.22);
    }
    .vr-chat__msg--ai .vr-chat__bubble{
      background: rgba(255,255,255,0.10);
    }

    /* scroll bar */
    .vr-chat__list::-webkit-scrollbar{ width: 10px; }
    .vr-chat__list::-webkit-scrollbar-thumb{
      background: rgba(255,255,255,0.12);
      border-radius: 999px;
      border: 2px solid rgba(0,0,0,0);
      background-clip: padding-box;
    }
  `;
  document.head.appendChild(style);
}
