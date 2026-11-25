from django import forms


class StyledFormMixin:
    """Añade las clases CSS del sistema de diseño a todos los widgets."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            widget = field.widget
            if isinstance(widget, forms.HiddenInput):
                continue
            if isinstance(widget, forms.CheckboxInput):
                css = "checkbox"
            elif isinstance(widget, forms.FileInput):
                css = "input input-file"
            elif isinstance(widget, forms.Select):
                css = "input select"
            else:
                css = "input"
            widget.attrs["class"] = f'{widget.attrs.get("class", "")} {css}'.strip()
