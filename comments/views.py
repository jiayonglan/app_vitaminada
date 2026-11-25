from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.template.loader import render_to_string
from django.views.decorators.http import require_POST

from blog.models import Post

from .forms import CommentForm
from .models import Comment


def _wants_json(request):
    return request.headers.get("X-Requested-With") == "XMLHttpRequest" or "application/json" in request.headers.get("Accept", "")


@require_POST
def create(request, post_id):
    post = get_object_or_404(Post.objects.published(), pk=post_id)
    if not request.user.is_authenticated:
        if _wants_json(request):
            return JsonResponse({"ok": False, "errors": {"__all__": ["Inicia sesión para comentar."]}}, status=401)
        return redirect(f"/cuenta/entrar/?next={post.get_absolute_url()}")
    form = CommentForm(request.POST)
    if not form.is_valid():
        if _wants_json(request):
            return JsonResponse({"ok": False, "errors": {k: list(v) for k, v in form.errors.items()}}, status=400)
        messages.error(request, "No se pudo publicar el comentario. Revisa el texto.")
        return redirect(post.get_absolute_url() + "#comentarios")
    parent = None
    parent_id = form.cleaned_data.get("parent")
    if parent_id:
        parent = Comment.objects.filter(pk=parent_id, post=post, status=Comment.Status.APPROVED).first()
        if parent and parent.parent_id:
            parent = parent.parent
    auto = request.user.is_staff
    comment = Comment.objects.create(
        post=post, user=request.user, parent=parent, content=form.cleaned_data["content"],
        status=Comment.Status.APPROVED if auto else Comment.Status.PENDING,
    )
    message = "Comentario publicado." if auto else "Comentario enviado. Se publicará cuando lo apruebe un moderador."
    if _wants_json(request):
        html = render_to_string("comments/_comment.html", {"comment": comment, "post": post, "is_reply": bool(parent)}, request=request) if auto else ""
        return JsonResponse({"ok": True, "approved": auto, "message": message, "html": html,
                             "parent": parent.id if parent else None})
    messages.success(request, message)
    return redirect(post.get_absolute_url() + "#comentarios")
