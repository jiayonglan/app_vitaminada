from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render

from comments.models import Comment
from likes.models import Like

from .forms import ProfileForm, RegisterForm


def register(request):
    if request.user.is_authenticated:
        return redirect("core:home")
    form = RegisterForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.save()
        login(request, user)
        messages.success(request, "Cuenta creada. Ya puedes comentar y dar like.")
        return redirect("core:home")
    return render(request, "accounts/register.html", {"form": form})


@login_required
def profile(request):
    user = request.user
    return render(request, "accounts/profile.html", {
        "comments": Comment.objects.filter(user=user).select_related("post").order_by("-created_at")[:10],
        "likes": Like.objects.filter(user=user).select_related("post", "post__category")[:10],
        "my_posts": user.posts.select_related("category")[:10] if user.is_staff else [],
    })


@login_required
def profile_edit(request):
    form = ProfileForm(request.POST or None, instance=request.user)
    if request.method == "POST" and form.is_valid():
        user = form.save(commit=False)
        user.username = user.email
        user.save()
        messages.success(request, "Perfil actualizado.")
        return redirect("accounts:profile")
    return render(request, "accounts/profile_edit.html", {"form": form})
