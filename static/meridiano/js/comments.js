import { $, $$, attachCounter, fetchJSON, setBusy } from "./utilities.js";
import { notify } from "./notifications.js";

const draftKey = (form) => `draft:${form.getAttribute("action")}`;
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } },
  del: (k) => { try { localStorage.removeItem(k); } catch { /* sin almacenamiento */ } },
};

export function initComments() {
  const form = $("#comment-form");
  if (!form) return;
  const textarea = $("textarea", form);
  const parentInput = form.elements.parent;
  const note = $("[data-reply-note]", form);
  const noteName = $("[data-reply-name]", form);
  const errorBox = $("#comment-error");
  const submit = $('[type="submit"]', form);

  attachCounter(textarea);

  // Borrador guardado en el navegador
  const saved = store.get(draftKey(form));
  if (saved) { textarea.value = saved; textarea.dispatchEvent(new Event("input")); }
  textarea.addEventListener("input", () => (textarea.value ? store.set(draftKey(form), textarea.value) : store.del(draftKey(form))));
  // Ctrl/Cmd + Enter para publicar
  textarea.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); form.requestSubmit(); }
  });

  const clearReply = () => { parentInput.value = ""; note.hidden = true; };
  const showError = (text) => {
    errorBox.textContent = text;
    errorBox.hidden = !text;
    textarea.toggleAttribute("aria-invalid", Boolean(text));
    textarea.closest("[data-field]")?.classList.toggle("is-invalid", Boolean(text));
  };

  document.addEventListener("click", (event) => {
    const reply = event.target.closest("[data-reply-to]");
    if (reply) {
      parentInput.value = reply.dataset.replyTo;
      noteName.textContent = reply.dataset.replyName;
      note.hidden = false;
      form.scrollIntoView({ block: "center" });
      textarea.focus();
    }
    if (event.target.closest("[data-reply-cancel]")) { clearReply(); textarea.focus(); }
  });

  textarea.addEventListener("input", () => showError(""));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (form.dataset.state === "sending") return;
    const text = textarea.value.trim();
    if (text.length < 3) { showError("El comentario debe tener al menos 3 caracteres."); textarea.focus(); return; }
    form.dataset.state = "sending";
    setBusy(submit, true);
    try {
      const data = await fetchJSON(form.action, { body: new FormData(form) });
      textarea.value = "";
      textarea.dispatchEvent(new Event("input"));
      store.del(draftKey(form));
      showError("");
      notify(data.message, "success");
      if (data.approved && data.html) insertComment(data);
      clearReply();
    } catch (error) {
      const fieldErrors = error.data?.errors;
      const first = fieldErrors && Object.values(fieldErrors).flat()[0];
      if (error.status === 400 && first) showError(first);
      else notify(first || error.message, "error");
    } finally {
      delete form.dataset.state;
      setBusy(submit, false);
    }
  });

  initSort();
}

function insertComment({ html, parent }) {
  const holder = document.createElement("template");
  holder.innerHTML = html.trim();
  const item = holder.content.firstElementChild;
  item.classList.add("comment--new");
  const target = parent ? $(`[data-comment-id="${parent}"] .comment-replies`) : $("#comment-list");
  if (!target) return;
  target.append(item);
  $("#comments-empty")?.remove();
  const counter = $("[data-comment-count]");
  if (counter) counter.textContent = String(Number(counter.textContent) + 1);
  item.scrollIntoView({ block: "nearest" });
  $("[data-sort-box]")?.removeAttribute("hidden");
}

/** Ordena los comentarios ya cargados (más recientes / más antiguos). */
function initSort() {
  const box = $("[data-sort-box]");
  const list = $("#comment-list");
  if (!box || !list) return;
  const buttons = $$("[data-sort]", box);
  buttons.forEach((button) => button.addEventListener("click", () => {
    const newest = button.dataset.sort === "newest";
    const items = $$(":scope > li", list).sort((a, b) => (Number(a.dataset.created) - Number(b.dataset.created)) * (newest ? -1 : 1));
    list.append(...items);
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
  }));
}
