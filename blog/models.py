from django.conf import settings
from django.db import models
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField("nombre", max_length=80, unique=True)
    slug = models.SlugField(max_length=90, unique=True, blank=True)
    description = models.CharField("descripción", max_length=200, blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "categoría"
        verbose_name_plural = "categorías"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class PostQuerySet(models.QuerySet):
    def published(self):
        return self.filter(status=Post.Status.PUBLISHED, published_at__lte=timezone.now())

    def with_counts(self):
        return (
            self.select_related("category", "author")
            .annotate(likes_total=models.Count("likes", distinct=True))
            .order_by("-published_at", "-id")
        )


class Post(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Borrador"
        PUBLISHED = "published", "Publicada"

    title = models.CharField("título", max_length=160)
    slug = models.SlugField(max_length=170, unique=True, blank=True)
    summary = models.CharField("resumen", max_length=300)
    content = models.TextField("contenido")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="posts", verbose_name="categoría")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="posts")
    image = models.ImageField("imagen", upload_to="posts/", blank=True)
    status = models.CharField("estado", max_length=12, choices=Status.choices, default=Status.DRAFT)
    is_featured = models.BooleanField("destacada", default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    published_at = models.DateTimeField("fecha de publicación", default=timezone.now)

    objects = PostQuerySet.as_manager()

    class Meta:
        ordering = ["-published_at"]
        verbose_name = "publicación"
        verbose_name_plural = "publicaciones"

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:150] or "publicacion"
            slug, n = base, 2
            while Post.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse("blog:detail", kwargs={"slug": self.slug})
