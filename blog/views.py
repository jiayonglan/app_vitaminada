from django.conf import settings
from django.core.paginator import Paginator
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404, render

from comments.forms import CommentForm
from comments.models import Comment
from likes.models import Like

from .models import Category, Post


def post_list(request):
    q = request.GET.get("q", "").strip()
    slug = request.GET.get("categoria", "").strip()
    posts = Post.objects.published().with_counts()
    if q:
        posts = posts.filter(Q(title__icontains=q) | Q(content__icontains=q) | Q(summary__icontains=q))
    current = Category.objects.filter(slug=slug).first() if slug else None
    if current:
        posts = posts.filter(category=current)
    page = Paginator(posts, settings.POSTS_PER_PAGE).get_page(request.GET.get("page"))
    params = request.GET.copy()
    params.pop("page", None)
    return render(request, "blog/post_list.html", {
        "page": page,
        "q": q,
        "current_category": current,
        "categories": Category.objects.all(),
        "qs": params.urlencode(),
        "has_filters": bool(q or current),
    })


def post_detail(request, slug):
    post = get_object_or_404(Post.objects.published().with_counts(), slug=slug)
    approved = Comment.objects.filter(status=Comment.Status.APPROVED).select_related("user")
    top_level = approved.filter(post=post, parent=None)
    replies_by_parent = {}
    for reply in approved.filter(post=post).exclude(parent=None):
        replies_by_parent.setdefault(reply.parent_id, []).append(reply)
    for c in top_level:
        c.reply_list = replies_by_parent.get(c.id, [])
    liked = request.user.is_authenticated and Like.objects.filter(user=request.user, post=post).exists()
    related = Post.objects.published().with_counts().filter(category=post.category).exclude(pk=post.pk)[:3]
    return render(request, "blog/post_detail.html", {
        "post": post,
        "comments": top_level,
        "comment_total": top_level.count() + sum(len(v) for v in replies_by_parent.values()),
        "comment_form": CommentForm(),
        "liked": liked,
        "related": related,
    })


def category_list(request):
    categories = Category.objects.annotate(total=Count("posts", filter=Q(posts__status="published")))
    return render(request, "blog/category_list.html", {"categories": categories})
