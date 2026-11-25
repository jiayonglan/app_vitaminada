import { $, $$ } from "./utilities.js";

const IGNORE = "input, textarea, select, [contenteditable='true']";

/** Atajos de teclado definidos en el HTML con data-shortcut="g h" (secuencia) o "/" (tecla). */
export function initShortcuts() {
  const items = $$("[data-shortcut]").map((el) => ({
    keys: el.dataset.shortcut.split(" "),
    label: el.dataset.shortcutLabel || el.getAttribute("aria-label") || el.textContent.trim(),
    el,
  }));
  const dialog = $("#shortcuts-dialog");
  const list = $("[data-shortcuts-list]");

  const openHelp = () => {
    if (!dialog || dialog.open || typeof dialog.showModal !== "function") return;
    list.replaceChildren();
    const rows = [...items.map((i) => [i.keys, i.label]), [["?"], "Mostrar esta ayuda"], [["Esc"], "Cerrar ventanas y menús"]];
    rows.forEach(([keys, label]) => {
      const dt = document.createElement("dt");
      dt.append(...keys.flatMap((key, n) => {
        const kbd = document.createElement("kbd");
        kbd.textContent = key.length === 1 ? key.toUpperCase() : key;
        return n ? [" luego ", kbd] : [kbd];
      }));
      const dd = document.createElement("dd");
      dd.textContent = label;
      list.append(dt, dd);
    });
    dialog.showModal();
    $("button", dialog)?.focus();
  };

  $$("[data-open-shortcuts]").forEach((button) => button.addEventListener("click", openHelp));

  let buffer = [];
  let timer;
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest?.(IGNORE)) return;
    if (event.key === "?") { event.preventDefault(); openHelp(); return; }
    if (document.querySelector("dialog[open]") || event.key.length > 1) return;
    buffer.push(event.key.toLowerCase());
    clearTimeout(timer);
    timer = setTimeout(() => { buffer = []; }, 900);
    const hit = items.find((i) => i.keys.length === buffer.length && i.keys.every((k, n) => k === buffer[n]));
    if (hit) {
      event.preventDefault();
      buffer = [];
      if (hit.el.matches("a[href]")) location.assign(hit.el.href);
      else hit.el.click();
      return;
    }
    if (!items.some((i) => buffer.every((k, n) => i.keys[n] === k))) buffer = [];
  });
}
