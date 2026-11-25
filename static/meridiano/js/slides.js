import { $, $$, fetchJSON } from "./utilities.js";
import { notify } from "./notifications.js";

/** Carrusel del panel: reordenar con botones o arrastrando filas (usa los endpoints de mover existentes). */
export function initSlides() {
  const table = $("[data-slide-table]");
  if (!table) return;
  const body = $("tbody", table);
  const live = $("[data-slide-live]");
  let busy = false;

  const rows = () => [...body.rows];
  const refresh = () => rows().forEach((row, i, all) => {
    $("[data-order]", row).textContent = i + 1;
    $("[data-move-form='up']", row).hidden = i === 0;
    $("[data-move-form='down']", row).hidden = i === all.length - 1;
  });

  async function move(row, steps) {
    const direction = steps < 0 ? "up" : "down";
    const url = row.dataset[direction === "up" ? "urlUp" : "urlDown"];
    for (let n = 0; n < Math.abs(steps); n += 1) await fetchJSON(url);
  }

  // Botones subir / bajar
  body.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-move-form]");
    if (!form) return;
    event.preventDefault();
    if (busy) return;
    busy = true;
    const row = form.closest("tr");
    const up = form.dataset.moveForm === "up";
    try {
      await fetchJSON(form.action);
      const sibling = up ? row.previousElementSibling : row.nextElementSibling;
      if (sibling) up ? sibling.before(row) : sibling.after(row);
      refresh();
      if (live) live.textContent = `${$("strong", row)?.textContent ?? "Diapositiva"} movida a la posición ${rows().indexOf(row) + 1}.`;
      (form.hidden ? $("[data-move-form]:not([hidden]) button", row) : $("button", form))?.focus();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      busy = false;
    }
  });

  // Arrastrar y soltar
  let dragged = null;
  let startIndex = 0;
  body.addEventListener("dragstart", (event) => {
    dragged = event.target.closest("tr");
    if (!dragged) return;
    startIndex = rows().indexOf(dragged);
    dragged.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", dragged.dataset.id);
  });
  body.addEventListener("dragover", (event) => {
    if (!dragged) return;
    event.preventDefault();
    const target = event.target.closest("tr");
    if (!target || target === dragged) return;
    const rect = target.getBoundingClientRect();
    if (event.clientY < rect.top + rect.height / 2) target.before(dragged);
    else target.after(dragged);
  });
  body.addEventListener("dragend", async () => {
    if (!dragged) return;
    const row = dragged;
    dragged = null;
    row.classList.remove("is-dragging");
    const delta = rows().indexOf(row) - startIndex;
    refresh();
    if (!delta || busy) return;
    busy = true;
    try {
      await move(row, delta);
      notify("Orden actualizado.", "success", 2500);
    } catch (error) {
      notify(`${error.message} Se recarga la página para mostrar el orden real.`, "error");
      setTimeout(() => location.reload(), 1200);
    } finally {
      busy = false;
    }
  });
  refresh();
}
