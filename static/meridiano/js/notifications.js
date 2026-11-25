import { $, $$ } from "./utilities.js";

let container;

function getContainer() {
  if (!container) {
    container = document.createElement("div");
    container.className = "toasts";
    container.setAttribute("role", "status");
    container.setAttribute("aria-live", "polite");
    document.body.append(container);
  }
  return container;
}

/** Muestra una notificación. type: "success" | "error" | "info". */
export function notify(message, type = "info", timeout = 5000) {
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  if (type === "error") toast.setAttribute("role", "alert");
  const text = document.createElement("span");
  text.textContent = message;
  const close = document.createElement("button");
  close.type = "button";
  close.className = "toast-close";
  close.setAttribute("aria-label", "Cerrar notificación");
  close.innerHTML = '<svg class="icon" aria-hidden="true" width="16" height="16"><use href="#i-x"/></svg>';
  const remove = () => toast.remove();
  close.addEventListener("click", remove);
  toast.append(text, close);
  getContainer().append(toast);
  if (timeout) setTimeout(remove, timeout);
}

/** Convierte los mensajes de django.contrib.messages en notificaciones. */
export function initServerMessages() {
  const list = $("[data-messages]");
  if (!list) return;
  $$("li", list).forEach((item) => {
    const level = item.dataset.level || "info";
    notify(item.textContent.trim(), level.includes("error") ? "error" : level.includes("success") ? "success" : "info");
  });
  list.remove();
}
