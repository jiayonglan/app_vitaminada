import { $$ } from "./utilities.js";
import { notify } from "./notifications.js";

async function copy(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  if (!ok) throw new Error("copy failed");
}

export function initShare() {
  $$("[data-share]").forEach((button) => {
    if (!navigator.share) return; // sin Web Share API se queda oculto y se usa "Copiar enlace"
    button.hidden = false;
    button.addEventListener("click", async () => {
      try {
        await navigator.share({ title: button.dataset.title, text: button.dataset.text, url: button.dataset.url });
      } catch (error) {
        if (error.name !== "AbortError") notify("No se pudo abrir el menú de compartir.", "error");
      }
    });
  });
  $$("[data-copy-link]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await copy(button.dataset.url);
        notify("Enlace copiado al portapapeles.", "success", 3000);
      } catch {
        notify("No se pudo copiar el enlace. Cópialo desde la barra de direcciones.", "error");
      }
    });
  });
}
