import { $, $$ } from "./utilities.js";

const mobile = window.matchMedia("(max-width: 860px)");

function focusable(root) {
  return $$('a[href], button:not([disabled]), input:not([disabled])', root).filter((el) => el.offsetParent !== null);
}

function initMenu() {
  const toggle = $("#menu-toggle");
  const nav = $("#primary-nav");
  if (!toggle || !nav) return;

  const set = (open, { restoreFocus = false } = {}) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    $("use", toggle).setAttribute("href", open ? "#i-x" : "#i-menu");
    if (open) focusable(nav)[0]?.focus();
    else if (restoreFocus) toggle.focus();
  };

  toggle.addEventListener("click", () => set(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) set(false);
  });
  document.addEventListener("click", (event) => {
    if (nav.classList.contains("is-open") && !nav.contains(event.target) && !toggle.contains(event.target)) set(false);
  });
  document.addEventListener("keydown", (event) => {
    if (!nav.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      set(false, { restoreFocus: true });
    } else if (event.key === "Tab") {
      // Mantiene el foco dentro del menú abierto (botón + enlaces).
      const items = [toggle, ...focusable(nav)];
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  mobile.addEventListener("change", () => set(false));
}

function initSearchPanel() {
  const toggle = $("#search-toggle");
  const panel = $("#search-panel");
  if (!toggle || !panel) return;
  const set = (open, restoreFocus = false) => {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (open) $("input", panel).focus();
    else if (restoreFocus) toggle.focus();
  };
  toggle.addEventListener("click", () => set(panel.hidden));
  panel.addEventListener("keydown", (event) => {
    if (event.key === "Escape") set(false, true);
  });
}

function initDropdowns() {
  $$("[data-dropdown]").forEach((root) => {
    const button = $("[data-dropdown-toggle]", root);
    const menu = $("[data-dropdown-menu]", root);
    const items = () => $$("a, button", menu);
    const set = (open, focusFirst = false) => {
      menu.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
      if (open && focusFirst) items()[0]?.focus();
    };
    button.addEventListener("click", () => set(menu.hidden));
    button.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") { event.preventDefault(); set(true, true); }
    });
    root.addEventListener("keydown", (event) => {
      if (menu.hidden) return;
      const list = items();
      const index = list.indexOf(document.activeElement);
      if (event.key === "Escape") { set(false); button.focus(); }
      else if (event.key === "ArrowDown") { event.preventDefault(); list[(index + 1) % list.length].focus(); }
      else if (event.key === "ArrowUp") { event.preventDefault(); list[(index - 1 + list.length) % list.length].focus(); }
      else if (event.key === "Home") { event.preventDefault(); list[0].focus(); }
      else if (event.key === "End") { event.preventDefault(); list[list.length - 1].focus(); }
    });
    document.addEventListener("click", (event) => {
      if (!menu.hidden && !root.contains(event.target)) set(false);
    });
    root.addEventListener("focusout", (event) => {
      if (!menu.hidden && !root.contains(event.relatedTarget)) set(false);
    });
  });
}

export function initNavigation() {
  initMenu();
  initSearchPanel();
  initDropdowns();
}
