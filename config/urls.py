from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("admin/", include("dashboard.urls")),
    path("cuenta/", include("accounts.urls")),
    path("blog/", include("blog.urls")),
    path("comentarios/", include("comments.urls")),
    path("likes/", include("likes.urls")),
    path("contacto/", include("contact.urls")),
    path("", include("core.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
