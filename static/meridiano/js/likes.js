import { $, $$, fetchJSON } from "./utilities.js";
import { notify } from "./notifications.js";

function paint(button, liked, count) {
  button.setAttribute("aria-pressed", String(liked));
  $("[data-like-count]", button).textContent = count;
  $("[data-like-label]", button).textContent = liked ? "Quitar me gusta" : "Me gusta";
  $$("[data-like-total]").forEach((el) => (el.textContent = count));
}

export function initLikes() {
  $$("[data-like-url]").forEach((button) => {
    let pending = false;
    button.addEventListener("click", async () => {
      if (pending) return; // evita pulsaciones duplicadas mientras se procesa la petición
      pending = true;
      button.setAttribute("aria-disabled", "true");
      const wasLiked = button.getAttribute("aria-pressed") === "true";
      const before = Number($("[data-like-count]", button).textContent);
      // Actualización optimista: se ve al instante y se revierte si falla.
      paint(button, !wasLiked, before + (wasLiked ? -1 : 1));
      button.classList.remove("is-pop");
      void button.offsetWidth;
      button.classList.add("is-pop");
      try {
        const data = await fetchJSON(button.dataset.likeUrl);
        paint(button, data.liked, data.count);
      } catch (error) {
        paint(button, wasLiked, before);
        notify(error.message, "error");
      } finally {
        pending = false;
        button.removeAttribute("aria-disabled");
      }
    });
  });
}
