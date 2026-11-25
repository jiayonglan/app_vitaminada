import { $$ } from "./utilities.js";

/** Mejoras sobre la búsqueda real de Django (la búsqueda sigue ocurriendo en el servidor). */
export function initSearch() {
  // Elimina parámetros vacíos para mantener URLs limpias.
  $$("form[data-clean-params]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      [...form.elements].forEach((el) => {
        if (el.name && el.type !== "submit" && !el.value.trim()) el.disabled = true;
      });
      setTimeout(() => { if (event.defaultPrevented) [...form.elements].forEach((el) => (el.disabled = false)); }, 0);
    });
  });
  // Filtros tipo <select> que se envían al cambiar.
  $$("select[data-autosubmit]").forEach((select) => {
    select.addEventListener("change", () => select.form.requestSubmit());
  });
}
