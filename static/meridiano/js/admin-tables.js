import { $, $$, fetchJSON, setBusy } from "./utilities.js";
import { notify } from "./notifications.js";

/** Tablas ordenables: ordena las filas de la página actual al pulsar la cabecera. */
function initSortable(table) {
  const body = $("tbody", table);
  const heads = $$("thead th[data-sort]", table);
  heads.forEach((th) => {
    const index = [...th.parentNode.children].indexOf(th);
    const label = th.textContent.trim();
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sort-btn";
    button.textContent = label;
    button.title = `Ordenar esta página por ${label.toLowerCase()}`;
    th.replaceChildren(button);
    th.setAttribute("aria-sort", "none");
    button.addEventListener("click", () => {
      const direction = th.getAttribute("aria-sort") === "ascending" ? "descending" : "ascending";
      heads.forEach((h) => h.setAttribute("aria-sort", "none"));
      th.setAttribute("aria-sort", direction);
      const value = (row) => row.cells[index].dataset.sortValue ?? row.cells[index].textContent.trim().toLowerCase();
      const numeric = th.dataset.sort === "num";
      const rows = [...body.rows].sort((a, b) => (numeric
        ? (parseFloat(value(a)) || 0) - (parseFloat(value(b)) || 0)
        : value(a).localeCompare(value(b), "es", { numeric: true })));
      if (direction === "descending") rows.reverse();
      body.append(...rows);
    });
  });
}

function applyCounts(counts = {}) {
  Object.entries(counts).forEach(([key, value]) => {
    $$(`[data-count="${key}"]`).forEach((el) => { el.textContent = value; });
    $$(`[data-badge="${key}"]`).forEach((el) => {
      const number = $("[data-badge-number]", el);
      if (number) number.textContent = value;
      el.hidden = !value;
    });
  });
}

/** Acciones de fila (aprobar, rechazar, eliminar…) sin recargar la página. */
function initRowActions() {
  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.hasAttribute("data-ajax-row")) return;
    if (form.dataset.confirm && form.dataset.confirmed !== "1") return; // espera al diálogo de confirmación
    event.preventDefault();
    delete form.dataset.confirmed;
    const button = $('[type="submit"]', form);
    setBusy(button, true);
    try {
      const data = await fetchJSON(form.action, { body: new FormData(form) });
      const row = form.closest("tr");
      const body = row.parentElement;
      row.classList.add("row-leaving");
      setTimeout(() => {
        row.remove();
        if (!body.rows.length) location.reload(); // el servidor dibuja el estado vacío
      }, 180);
      applyCounts(data.counts);
      notify(data.message, "success", 3000);
    } catch (error) {
      setBusy(button, false);
      notify(error.message, "error");
    }
  });
}

export function initAdminTables() {
  $$("table[data-sortable]").forEach(initSortable);
  initRowActions();
}
