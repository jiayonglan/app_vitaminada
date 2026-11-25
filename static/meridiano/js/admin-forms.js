import { $, $$, renderPreview, slugify } from "./utilities.js";
import { notify } from "./notifications.js";

export function initAdminForms() {
  $$("form[data-validate]").forEach((form) => {
    if (!form.closest(".admin-form")) return;
    autoSlug(form);
    imageField(form);
    editorPreview(form);
    guardUnsaved(form);
  });
}

/** Genera el slug mientras escribes el título, salvo que lo edites a mano o ya exista. */
function autoSlug(form) {
  const slug = form.elements.slug;
  const source = form.elements.title || form.elements.name;
  if (!slug || !source) return;
  let touched = slug.value !== "";
  slug.addEventListener("input", () => { touched = true; });
  source.addEventListener("input", () => { if (!touched) slug.value = slugify(source.value); });
}

/** Vista previa de la imagen elegida, arrastrar y soltar y aviso de tamaño. */
function imageField(form) {
  $$('input[type="file"]', form).forEach((input) => {
    const field = input.closest("[data-field]");
    const preview = document.createElement("img");
    preview.className = "upload-preview";
    preview.alt = "Vista previa de la imagen seleccionada";
    preview.hidden = true;
    input.insertAdjacentElement("afterend", preview);
    let url = null;

    const show = () => {
      const file = input.files[0];
      if (url) URL.revokeObjectURL(url);
      if (!file) { preview.hidden = true; return; }
      if (!file.type.startsWith("image/")) { input.value = ""; preview.hidden = true; notify("El archivo debe ser una imagen.", "error"); return; }
      if (file.size > 5 * 1024 * 1024) notify("La imagen pesa más de 5 MB; el servidor la rechazará.", "error");
      url = URL.createObjectURL(file);
      preview.src = url;
      preview.hidden = false;
    };
    input.addEventListener("change", show);

    ["dragenter", "dragover"].forEach((name) => field.addEventListener(name, (event) => { event.preventDefault(); field.classList.add("is-over"); }));
    ["dragleave", "drop"].forEach((name) => field.addEventListener(name, () => field.classList.remove("is-over")));
    field.addEventListener("drop", (event) => {
      event.preventDefault();
      if (!event.dataTransfer.files.length) return;
      input.files = event.dataTransfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
}

/** Pestañas Escribir / Vista previa con recuento de palabras para el contenido. */
function editorPreview(form) {
  const textarea = form.elements.content;
  if (!textarea) return;
  const bar = document.createElement("div");
  bar.className = "editor-tabs";
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Modo del editor");
  const write = Object.assign(document.createElement("button"), { type: "button", className: "chip", textContent: "Escribir" });
  const view = Object.assign(document.createElement("button"), { type: "button", className: "chip", textContent: "Vista previa" });
  const stats = document.createElement("span");
  stats.className = "text-sm text-muted tabular";
  bar.append(write, view, stats);
  const pane = document.createElement("div");
  pane.className = "prose preview-pane";
  pane.hidden = true;
  textarea.before(bar);
  textarea.after(pane);

  const count = () => {
    const words = textarea.value.trim() ? textarea.value.trim().split(/\s+/).length : 0;
    stats.textContent = `${words} palabras · ${Math.max(1, Math.round(words / 220))} min de lectura`;
  };
  const mode = (preview) => {
    textarea.hidden = preview;
    pane.hidden = !preview;
    write.setAttribute("aria-pressed", String(!preview));
    view.setAttribute("aria-pressed", String(preview));
    if (preview) pane.innerHTML = renderPreview(textarea.value) || '<p class="text-muted">Todavía no has escrito nada.</p>';
  };
  write.addEventListener("click", () => { mode(false); textarea.focus(); });
  view.addEventListener("click", () => mode(true));
  textarea.addEventListener("input", count);
  count();
  mode(false);
}

/** Avisa si hay cambios sin guardar y permite guardar con Ctrl/Cmd + S. */
function guardUnsaved(form) {
  const snapshot = () => JSON.stringify([...new FormData(form)]
    .filter(([key]) => key !== "csrfmiddlewaretoken")
    .map(([key, value]) => [key, typeof value === "string" ? value : `${value.name}:${value.size}`]));
  const initial = snapshot();
  let submitting = false;
  form.addEventListener("submit", () => { submitting = true; });
  window.addEventListener("beforeunload", (event) => {
    if (!submitting && snapshot() !== initial) { event.preventDefault(); event.returnValue = ""; }
  });
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); form.requestSubmit(); }
  });
}
