from django.urls import path

from . import views

app_name = "comments"

urlpatterns = [path("<int:post_id>/crear/", views.create, name="create")]
