import { $, $$, attachCounter, setBusy } from "./utilities.js";

const PAIRS = [["password1", "password2"], ["new_password1", "new_password2"]];

function messageFor(el) {
  const v = el.validity;
  if (v.valueMissing) return el.type === "checkbox" ? "Debes marcar esta casilla." : "Este campo es obligatorio.";
  if (v.typeMismatch) return el.type === "email" ? "Introduce un correo electrónico válido." : "El valor no es válido.";
  if (v.tooShort) return `Usa al menos ${el.minLength} caracteres.`;
  if (v.tooLong) return `Usa como máximo ${el.maxLength} caracteres.`;
  if (v.patternMismatch) return el.title || "El formato no es válido.";
  if (v.customError) return el.validationMessage;
  return el.validationMessage || "El valor no es válido.";
}

function parts(el) {
  const wrap = el.closest("[data-field]");
  return { wrap, error: wrap?.querySelector(".field-error") };
}

function paint(el, { showValid = true } = {}) {
  const { wrap, error } = parts(el);
  if (!wrap || el.type === "hidden") return true;
  const valid = el.checkValidity();
  wrap.classList.toggle("is-invalid", !valid);
  wrap.classList.toggle("is-valid", valid && showValid && el.value !== "" && el.type !== "checkbox");
  if (error) {
    error.hidden = valid;
    error.textContent = valid ? "" : messageFor(el);
    el.setAttribute("aria-describedby", error.id);
  }
  el.toggleAttribute("aria-invalid", !valid);
  return valid;
}

function checkPasswordMatch(form) {
  PAIRS.forEach(([a, b]) => {
    const first = form.elements[a];
    const second = form.elements[b];
    if (!first || !second) return;
    second.setCustomValidity(second.value && first.value !== second.value ? "Las contraseñas no coinciden." : "");
  });
}

function updateStrength(form) {
  const box = $("[data-strength]", form);
  if (!box) return;
  const first = form.elements.password1 || form.elements.new_password1;
  const second = form.elements.password2 || form.elements.new_password2;
  const rules = {
    length: first.value.length >= 8,
    notnumeric: first.value !== "" && !/^\d+$/.test(first.value),
    match: first.value !== "" && first.value === second.value,
  };
  $$("[data-rule]", box).forEach((li) => li.setAttribute("data-ok", String(rules[li.dataset.rule])));
}

function enhance(form) {
  // Mostrar / ocultar contraseña
  $$('input[type="password"]', form).forEach((input) => {
    const wrap = document.createElement("div");
    wrap.className = "input-wrap";
    input.replaceWith(wrap);
    wrap.append(input);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "input-toggle";
    toggle.setAttribute("aria-pressed", "false");
    toggle.setAttribute("aria-label", "Mostrar contraseña");
    toggle.textContent = "Mostrar";
    toggle.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      toggle.setAttribute("aria-pressed", String(show));
      toggle.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
      toggle.textContent = show ? "Ocultar" : "Mostrar";
    });
    wrap.append(toggle);
  });
  // Contadores en textareas con límite
  $$("textarea[maxlength]", form).forEach(attachCounter);
}

function setup(form) {
  enhance(form);
  // Errores que ya vienen del servidor: los enlaza con su campo para lectores de pantalla.
  $$("[data-field].is-invalid", form).forEach((wrap) => {
    const control = $("input, textarea, select", wrap);
    const error = $(".field-error", wrap);
    if (control && error) { control.setAttribute("aria-invalid", "true"); control.setAttribute("aria-describedby", error.id); }
  });

  form.addEventListener("focusout", (event) => {
    const el = event.target;
    if (!el.matches?.("input, textarea, select") || el.type === "hidden") return;
    checkPasswordMatch(form);
    if (el.value !== "" || el.required) paint(el);
  });
  form.addEventListener("input", (event) => {
    const el = event.target;
    if (!el.matches?.("input, textarea, select")) return;
    checkPasswordMatch(form);
    updateStrength(form);
    if (parts(el).wrap?.classList.contains("is-invalid")) paint(el);
  });

  form.addEventListener("submit", (event) => {
    if (form.dataset.state === "sending") { event.preventDefault(); return; }
    checkPasswordMatch(form);
    const controls = [...form.elements].filter((el) => el.matches("input, textarea, select") && el.type !== "hidden");
    const results = controls.map((el) => ({ el, ok: paint(el) }));
    const firstBad = results.find((r) => !r.ok);
    if (firstBad) {
      event.preventDefault();
      firstBad.el.focus();
      return;
    }
    if (event.defaultPrevented) return;
    form.dataset.state = "sending";
    const submit = $('[type="submit"]', form);
    if (submit?.dataset.loadingText) submit.dataset.original = submit.textContent;
    setTimeout(() => setBusy(submit, true), 0); // tras construir el envío
  });
}

export function initForms() {
  $$("form[data-validate]").forEach(setup);
  // Si el usuario vuelve con el botón "atrás", se restablece el estado de envío.
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    $$("form[data-validate]").forEach((form) => {
      delete form.dataset.state;
      setBusy($('[type="submit"]', form), false);
    });
  });
}
