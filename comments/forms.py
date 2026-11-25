from django import forms

from .models import Comment


class CommentForm(forms.ModelForm):
    parent = forms.IntegerField(required=False, widget=forms.HiddenInput)

    class Meta:
        model = Comment
        fields = ["content"]
        widgets = {"content": forms.Textarea(attrs={"rows": 4, "placeholder": "Escribe tu comentario", "class": "input"})}
        labels = {"content": "Tu comentario"}

    def clean_content(self):
        text = self.cleaned_data["content"].strip()
        if len(text) < 3:
            raise forms.ValidationError("El comentario debe tener al menos 3 caracteres.")
        return text
