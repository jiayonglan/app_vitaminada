from django.conf import settings
from django.db import models


class GalleryImage(models.Model):
    title = models.CharField("nombre", max_length=120)
    description = models.CharField("descripción", max_length=240, blank=True)
    alt_text = models.CharField("texto alternativo", max_length=160)
    image = models.ImageField("archivo", upload_to="gallery/")
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="uploads")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "imagen"
        verbose_name_plural = "imágenes"

    def __str__(self):
        return self.title
