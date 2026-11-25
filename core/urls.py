from django.urls import path

from blog.views import category_list

from . import views

app_name = "core"

urlpatterns = [
    path("", views.home, name="home"),
    path("categorias/", category_list, name="categories"),
]
