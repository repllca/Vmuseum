
// ui/hudInput.js
export function setupHudInput({
  apiBase = "",                // 例: "http://localhost:8000"  / 同一オリジンなら ""
  inputId = "userInput",
  buttonId = "sendBtn",
  onResponse = (data) => {},   // 返答をUIに出すならここで受け取る
  onSend = (text) => {},       // 送信前にログ表示したいならここ
} = {}) {
  const inputEl = document.getElementById(inputId);
  const sendBtn = document.getElementById(buttonId);

  if (!inputEl || !sendBtn) {
    console.warn("HUD elements not found:", { inputId, buttonId });
    return {
      isTyping: () => false,
      focus: () => {},
      send: async () => {},
    };
  }

  let typing = false;

  async function send() {
    const text = (inputEl.value || "").trim();
    if (!text) return;

    onSend(text);

    inputEl.value = "";
    inputEl.focus();

    try {
      const res = await fetch(`${apiBase}/api/user_input`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, ts: Date.now() }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${errText}`);
      }

      const data = await res.json().catch(() => ({}));
      onResponse(data);
      return data;
    } catch (err) {
      console.error("❌ failed to send input:", err);
      onResponse({ ok: false, error: String(err) });
      return { ok: false, error: String(err) };
    }
  }

  inputEl.addEventListener("focus", () => (typing = true));
  inputEl.addEventListener("blur", () => (typing = false));

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send();
    e.stopPropagation(); // 3D側にキーイベントを流さない
  });

  sendBtn.addEventListener("click", send);

  return {
    isTyping: () => typing,
    focus: () => inputEl.focus(),
    send,
  };
}
