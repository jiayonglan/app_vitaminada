from django import forms

from blog.models import Category, Post
from carousel.models import CarouselSlide
from core.forms import StyledFormMixin
from gallery.models import GalleryImage


MAX_IMAGE_MB = 5


class ImageSizeMixin:
    def clean_image(self):
        image = self.cleaned_data.get("image")
        if image and hasattr(image, "size") and image.size > MAX_IMAGE_MB * 1024 * 1024:
            raise forms.ValidationError(f"La imagen pesa más de {MAX_IMAGE_MB} MB.")
        return image


class PostForm(ImageSizeMixin, StyledFormMixin, forms.ModelForm):
    class Meta:
        model = Post
        fields = ["title", "slug", "summary", "content", "category", "image", "status", "is_featured"]
        widgets = {"content": forms.Textarea(attrs={"rows": 12}), "summary": forms.Textarea(attrs={"rows": 3}), "image": forms.FileInput}
        help_texts = {
            "slug": "Déjalo vacío para generarlo desde el título.",
            "content": "Formato: ## Título, ### Subtítulo, - listas, **negrita**, *cursiva*. Deja una línea en blanco entre párrafos.",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["slug"].required = False


class CategoryForm(StyledFormMixin, forms.ModelForm):
    class Meta:
        model = Category
        fields = ["name", "slug", "description"]
        help_texts = {"slug": "Déjalo vacío para generarlo desde el nombre."}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["slug"].required = False


class SlideForm(ImageSizeMixin, StyledFormMixin, forms.ModelForm):
    class Meta:
        model = CarouselSlide
        fields = ["title", "description", "image", "button_text", "button_url", "order", "is_active"]
        widgets = {"image": forms.FileInput}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            self.fields["image"].required = False


class GalleryImageForm(ImageSizeMixin, StyledFormMixin, forms.ModelForm):
    class Meta:
        model = GalleryImage
        fields = ["title", "description", "alt_text", "image"]
        widgets = {"image": forms.FileInput}
