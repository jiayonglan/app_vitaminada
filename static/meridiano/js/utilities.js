// Utilidades compartidas. Sin dependencias.

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function getCookie(name) {
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : "";
}

/** Token CSRF: primero la meta de la plantilla base y, si no, la cookie de Django. */
export function csrfToken() {
  return $('meta[name="csrf-token"]')?.content || getCookie("csrftoken");
}

export class RequestError extends Error {
  constructor(message, { status = 0, data = null } = {}) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/**
 * Petición a un endpoint de Django que responde JSON.
 * Añade CSRF y valida la respuesta. Lanza RequestError con un mensaje legible.
 */
export async function fetchJSON(url, { method = "POST", body = null } = {}) {
  const headers = { "X-Requested-With": "XMLHttpRequest", Accept: "application/json" };
  if (method !== "GET") headers["X-CSRFToken"] = csrfToken();
  let response;
  try {
    response = await fetch(url, { method, headers, body, credentials: "same-origin" });
  } catch {
    throw new RequestError("No hay conexión con el servidor. Comprueba tu red e inténtalo de nuevo.");
  }
  const isJSON = (response.headers.get("content-type") || "").includes("application/json");
  const data = isJSON ? await response.json().catch(() => null) : null;
  if (!response.ok || (data && data.ok === false)) {
    const fallback = response.status >= 500 ? "El servidor ha tenido un problema. Inténtalo más tarde." : "No se pudo completar la acción.";
    throw new RequestError(data?.error || fallback, { status: response.status, data });
  }
  if (!data) throw new RequestError("Respuesta inesperada del servidor.", { status: response.status });
  return data;
}

export function setBusy(button, busy) {
  if (!button) return;
  if (busy) {
    button.setAttribute("aria-busy", "true");
    button.disabled = true;
  } else {
    button.removeAttribute("aria-busy");
    button.disabled = false;
  }
}

export function debounce(fn, wait = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/** Contador "n / máx" bajo un textarea con maxlength. */
export function attachCounter(textarea) {
  const max = Number(textarea.getAttribute("maxlength"));
  if (!max || textarea.dataset.counter) return;
  textarea.dataset.counter = "1";
  const out = document.createElement("p");
  out.className = "help counter tabular";
  out.setAttribute("aria-hidden", "true");
  const update = () => {
    out.textContent = `${textarea.value.length} / ${max}`;
    out.classList.toggle("is-near", textarea.value.length > max * 0.9);
  };
  textarea.addEventListener("input", update);
  textarea.insertAdjacentElement("afterend", out);
  update();
  return update;
}

export function slugify(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const escapeHTML = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function inlineMarkup(text) {
  return escapeHTML(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
}

/** Misma sintaxis que el filtro render_content de Django; solo para la vista previa. */
export function renderPreview(source) {
  return source.replace(/\r\n/g, "\n").trim().split(/\n\s*\n/).map((block) => {
    const lines = block.split("\n").filter((l) => l.trim());
    if (!lines.length) return "";
    const first = lines[0];
    if (first.startsWith("### ")) return `<h3>${inlineMarkup(first.slice(4))}</h3>`;
    if (first.startsWith("## ")) return `<h2>${inlineMarkup(first.slice(3))}</h2>`;
    if (first.trim() === "---") return "<hr>";
    if (lines.every((l) => /^\s*[-*] /.test(l))) return `<ul>${lines.map((l) => `<li>${inlineMarkup(l.trim().slice(2))}</li>`).join("")}</ul>`;
    if (lines.every((l) => /^\s*\d+\.\s/.test(l))) return `<ol>${lines.map((l) => `<li>${inlineMarkup(l.trim().replace(/^\d+\.\s/, ""))}</li>`).join("")}</ol>`;
    return `<p>${lines.map(inlineMarkup).join("<br>")}</p>`;
  }).join("\n");
}
