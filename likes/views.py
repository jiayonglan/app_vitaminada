from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST

from blog.models import Post

from .models import Like


@require_POST
def toggle(request, post_id):
    if not request.user.is_authenticated:
        return JsonResponse({"ok": False, "error": "Inicia sesión para dar like."}, status=401)
    post = get_object_or_404(Post.objects.published(), pk=post_id)
    like, created = Like.objects.get_or_create(user=request.user, post=post)
    if not created:
        like.delete()
    return JsonResponse({"ok": True, "liked": created, "count": post.likes.count()})
