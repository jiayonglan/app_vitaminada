from django.db import models


class ContactMessage(models.Model):
    name = models.CharField("nombre", max_length=100)
    email = models.EmailField("correo electrónico")
    subject = models.CharField("asunto", max_length=150)
    message = models.TextField("mensaje", max_length=3000)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
