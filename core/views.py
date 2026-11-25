from django.db.models import Count
from django.shortcuts import render

from blog.models import Category, Post
from carousel.models import CarouselSlide


def home(request):
    base = Post.objects.published().with_counts()
    featured = list(base.filter(is_featured=True)[:3])
    recent = base[:6]
    popular = base.order_by("-likes_total", "-published_at")[:4]
    categories = Category.objects.annotate(total=Count("posts")).filter(total__gt=0)
    return render(request, "core/home.html", {
        "slides": CarouselSlide.objects.filter(is_active=True),
        "hero_post": featured[0] if featured else base.first(),
        "featured": featured,
        "recent": recent,
        "popular": popular,
        "categories": categories,
    })
