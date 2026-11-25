import { $, $$, debounce } from "./utilities.js";
import { notify } from "./notifications.js";

const SKELETON = `<div class="grid grid--3" aria-hidden="true">${`
  <div class="card"><div class="skeleton skeleton-media"></div><div class="card-body">
    <div class="skeleton skeleton-line" style="width:30%"></div>
    <div class="skeleton skeleton-line" style="width:90%;height:24px"></div>
    <div class="skeleton skeleton-line" style="width:100%"></div>
    <div class="skeleton skeleton-line" style="width:60%"></div>
  </div></div>`.repeat(6)}</div>`;

/** Búsqueda y filtros en vivo: sigue usando la búsqueda real de Django (/blog/?q=…&categoria=…). */
export function initLiveResults() {
  const region = $("[data-live-region]");
  const form = $("[data-live-form]");
  if (!region || !form) return;
  const status = $("[data-live-status]");
  let controller = null;
  let skeletonTimer = null;

  const buildURL = () => {
    const params = new URLSearchParams();
    new FormData(form).forEach((value, key) => { if (String(value).trim()) params.set(key, String(value).trim()); });
    const qs = params.toString();
    return qs ? `${form.action}?${qs}` : form.action;
  };

  async function load(url, { push = true, focus = false } = {}) {
    controller?.abort();
    controller = new AbortController();
    clearTimeout(skeletonTimer);
    region.setAttribute("aria-busy", "true");
    const results = $("[data-live-results]", region);
    const previous = results?.innerHTML;
    // El esqueleto solo aparece si la respuesta tarda más de 150 ms
    skeletonTimer = setTimeout(() => { if (results) results.innerHTML = SKELETON; }, 150);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (!response.ok) throw new Error(String(response.status));
      const doc = new DOMParser().parseFromString(await response.text(), "text/html");
      const fresh = $("[data-live-region]", doc);
      if (!fresh) throw new Error("respuesta sin resultados");
      region.innerHTML = fresh.innerHTML;
      document.title = doc.title;
      history[push ? "pushState" : "replaceState"]({ live: true }, "", url);
      const params = new URL(url, location.href).searchParams;
      if (form.elements.categoria) form.elements.categoria.value = params.get("categoria") || "";
      if (document.activeElement !== form.elements.q) form.elements.q.value = params.get("q") || "";
      const count = Number(fresh.dataset.count);
      if (status) status.textContent = `${count} resultado${count === 1 ? "" : "s"}`;
      if (focus) { region.scrollIntoView({ block: "start" }); region.focus({ preventScroll: true }); }
    } catch (error) {
      if (error.name === "AbortError") return;
      if (results && previous !== undefined) results.innerHTML = previous;
      notify("No se pudieron cargar los resultados. Inténtalo de nuevo.", "error");
    } finally {
      clearTimeout(skeletonTimer);
      region.setAttribute("aria-busy", "false");
    }
  }

  const typing = debounce(() => load(buildURL(), { push: false }), 300);
  form.elements.q.addEventListener("input", typing);
  form.addEventListener("submit", (event) => { event.preventDefault(); load(buildURL()); });
  region.addEventListener("click", (event) => {
    const link = event.target.closest("a.chip, .pagination a, [data-live-link]");
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || link.target) return;
    event.preventDefault();
    load(link.href, { focus: true });
  });
  window.addEventListener("popstate", () => load(location.href, { push: false }));
  history.replaceState({ live: true }, "", location.href);
}

/** Sugerencias al escribir en el buscador de la cabecera (usa /blog/?q=…). */
export function initHeaderSuggest() {
  const input = $("#header-search");
  const box = $("[data-suggestions]");
  if (!input || !box) return;
  const list = $("ul", box);
  const note = $("[data-suggest-note]", box);
  let controller = null;

  const hide = () => { box.hidden = true; };
  const links = () => $$("a", list);

  const run = debounce(async () => {
    const q = input.value.trim();
    if (q.length < 2) { hide(); return; }
    controller?.abort();
    controller = new AbortController();
    try {
      const response = await fetch(`${input.form.action}?q=${encodeURIComponent(q)}`, { signal: controller.signal, headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (!response.ok) throw new Error();
      const doc = new DOMParser().parseFromString(await response.text(), "text/html");
      const total = Number($("[data-live-region]", doc)?.dataset.count || 0);
      const items = $$(".card", doc).slice(0, 5).map((card) => {
        const anchor = $(".card-title a", card);
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = anchor.getAttribute("href");
        a.className = "suggestion";
        const title = document.createElement("strong");
        title.textContent = anchor.textContent.trim();
        const meta = document.createElement("span");
        meta.textContent = $(".badge", card)?.textContent.trim() || "";
        a.append(title, meta);
        li.append(a);
        return li;
      });
      list.replaceChildren(...items);
      note.textContent = total ? `${total} resultado${total === 1 ? "" : "s"} para «${q}». Pulsa Intro para verlos todos.` : `No hay resultados para «${q}».`;
      box.hidden = false;
    } catch (error) {
      if (error.name !== "AbortError") hide();
    }
  }, 250);

  input.addEventListener("input", run);
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" && links().length && !box.hidden) { event.preventDefault(); links()[0].focus(); }
  });
  box.addEventListener("keydown", (event) => {
    const all = links();
    const index = all.indexOf(document.activeElement);
    if (event.key === "ArrowDown") { event.preventDefault(); all[Math.min(index + 1, all.length - 1)]?.focus(); }
    else if (event.key === "ArrowUp") { event.preventDefault(); if (index <= 0) input.focus(); else all[index - 1].focus(); }
    else if (event.key === "Escape") { event.stopPropagation(); hide(); input.focus(); }
  });
  document.addEventListener("click", (event) => { if (!box.hidden && !box.contains(event.target) && event.target !== input) hide(); });
}
