import { $ } from "./utilities.js";

const mobile = window.matchMedia("(max-width: 860px)");

export function initAdmin() {
  const sidebar = $("#admin-sidebar");
  const toggle = $("#sidebar-toggle");
  const scrim = $("#admin-scrim");
  if (!sidebar || !toggle) return;

  const set = (open, { restoreFocus = false } = {}) => {
    sidebar.classList.toggle("is-open", open);
    scrim.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) $("a", sidebar)?.focus();
    else if (restoreFocus) toggle.focus();
  };
  // En móvil la barra cerrada no debe poder enfocarse con el teclado.
  const sync = () => sidebar.toggleAttribute("inert", mobile.matches && !sidebar.classList.contains("is-open"));

  toggle.addEventListener("click", () => { set(!sidebar.classList.contains("is-open")); sync(); });
  scrim.addEventListener("click", () => { set(false); sync(); });
  sidebar.addEventListener("click", (event) => { if (event.target.closest("a")) { set(false); sync(); } });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sidebar.classList.contains("is-open")) { set(false, { restoreFocus: true }); sync(); }
  });
  mobile.addEventListener("change", () => { set(false); sync(); });
  sync();
}
