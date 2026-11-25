import { $ } from "./utilities.js";

/** Abre el diálogo de confirmación accesible y devuelve true/false. */
export function confirmDialog({ title, text, confirmLabel = "Confirmar" }) {
  const dialog = $("#confirm-dialog");
  if (!dialog || typeof dialog.showModal !== "function") {
    return Promise.resolve(window.confirm(`${title}\n\n${text}`));
  }
  $("#confirm-title", dialog).textContent = title;
  $("#confirm-text", dialog).textContent = text;
  const ok = $("[data-dialog-confirm]", dialog);
  ok.textContent = confirmLabel;
  return new Promise((resolve) => {
    const onClose = () => {
      dialog.removeEventListener("close", onClose);
      resolve(dialog.returnValue === "confirm");
    };
    dialog.addEventListener("close", onClose);
    dialog.returnValue = "cancel";
    dialog.showModal();
    $("[data-dialog-cancel]", dialog).focus();
  });
}

/** Cualquier <form data-confirm> pide confirmación antes de enviarse. */
export function initConfirmForms() {
  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.dataset.confirm || form.dataset.confirmed === "1") return;
    event.preventDefault();
    const accepted = await confirmDialog({
      title: form.dataset.confirmTitle || "¿Seguro que quieres continuar?",
      text: form.dataset.confirm,
      confirmLabel: form.dataset.confirmLabel || "Eliminar",
    });
    if (accepted) {
      form.dataset.confirmed = "1";
      // Los formularios AJAX vuelven a lanzar "submit"; los demás se envían de forma normal.
      if (form.hasAttribute("data-ajax-row")) form.requestSubmit();
      else form.submit();
    }
  });
}
