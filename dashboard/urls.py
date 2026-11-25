from django.urls import path

from . import views as v

app_name = "dashboard"

urlpatterns = [
    path("", v.Index.as_view(), name="index"),
    path("publicaciones/", v.PostList.as_view(), name="posts"),
    path("publicaciones/nueva/", v.PostCreate.as_view(), name="post_create"),
    path("publicaciones/<int:pk>/editar/", v.PostUpdate.as_view(), name="post_update"),
    path("publicaciones/<int:pk>/eliminar/", v.PostDelete.as_view(), name="post_delete"),
    path("categorias/", v.CategoryList.as_view(), name="categories"),
    path("categorias/nueva/", v.CategoryCreate.as_view(), name="category_create"),
    path("categorias/<int:pk>/editar/", v.CategoryUpdate.as_view(), name="category_update"),
    path("categorias/<int:pk>/eliminar/", v.CategoryDelete.as_view(), name="category_delete"),
    path("usuarios/", v.UserList.as_view(), name="users"),
    path("usuarios/<int:pk>/estado/", v.UserToggle.as_view(), name="user_toggle"),
    path("usuarios/<int:pk>/eliminar/", v.UserDelete.as_view(), name="user_delete"),
    path("comentarios/", v.CommentList.as_view(), name="comments"),
    path("comentarios/<int:pk>/aprobar/", v.CommentAction.as_view(action="approve"), name="comment_approve"),
    path("comentarios/<int:pk>/rechazar/", v.CommentAction.as_view(action="reject"), name="comment_reject"),
    path("comentarios/<int:pk>/eliminar/", v.CommentAction.as_view(action="delete"), name="comment_delete"),
    path("mensajes/", v.MessageList.as_view(), name="messages"),
    path("mensajes/<int:pk>/", v.MessageDetail.as_view(), name="message_detail"),
    path("mensajes/<int:pk>/eliminar/", v.MessageDelete.as_view(), name="message_delete"),
    path("imagenes/", v.ImageList.as_view(), name="images"),
    path("imagenes/<int:pk>/eliminar/", v.ImageDelete.as_view(), name="image_delete"),
    path("carrusel/", v.SlideList.as_view(), name="slides"),
    path("carrusel/nueva/", v.SlideCreate.as_view(), name="slide_create"),
    path("carrusel/<int:pk>/editar/", v.SlideUpdate.as_view(), name="slide_update"),
    path("carrusel/<int:pk>/eliminar/", v.SlideDelete.as_view(), name="slide_delete"),
    path("carrusel/<int:pk>/activar/", v.SlideToggle.as_view(), name="slide_toggle"),
    path("carrusel/<int:pk>/mover/<str:direction>/", v.SlideMove.as_view(), name="slide_move"),
]
