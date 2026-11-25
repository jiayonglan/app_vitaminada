from django.db import models


class CarouselSlide(models.Model):
    title = models.CharField("título", max_length=120)
    description = models.CharField("descripción", max_length=240, blank=True)
    image = models.ImageField("imagen", upload_to="carousel/")
    button_text = models.CharField("texto del botón", max_length=40, blank=True)
    button_url = models.CharField("enlace del botón", max_length=200, blank=True)
    order = models.PositiveIntegerField("orden", default=0)
    is_active = models.BooleanField("activa", default=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "diapositiva"
        verbose_name_plural = "diapositivas"

    def __str__(self):
        return self.title
