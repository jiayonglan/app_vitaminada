from django.contrib import messages
from django.contrib.auth import get_user_model
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.messages.views import SuccessMessageMixin
from django.core.exceptions import PermissionDenied
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse_lazy
from django.utils.http import url_has_allowed_host_and_scheme
from django.views import View
from django.views.generic import CreateView, DeleteView, UpdateView

from blog.models import Category, Post
from carousel.models import CarouselSlide
from comments.models import Comment
from contact.models import ContactMessage
from gallery.models import GalleryImage
from likes.models import Like

from .forms import CategoryForm, GalleryImageForm, PostForm, SlideForm

User = get_user_model()


class StaffRequired(LoginRequiredMixin, UserPassesTestMixin):
    def test_func(self):
        return self.request.user.is_staff

    def handle_no_permission(self):
        if self.request.user.is_authenticated:
            raise PermissionDenied
        return super().handle_no_permission()


def paginate(request, queryset, per_page=10):
    params = request.GET.copy()
    params.pop("page", None)
    return Paginator(queryset, per_page).get_page(request.GET.get("page")), params.urlencode()


class PageView(StaffRequired, View):
    template_name = ""
    section = ""

    def get_context(self, request, **kwargs):
        return {}

    def get(self, request, *args, **kwargs):
        ctx = {"section": self.section, **self.get_context(request, **kwargs)}
        return render(request, self.template_name, ctx)


class Index(PageView):
    template_name = "dashboard/index.html"
    section = "index"

    def get_context(self, request, **kwargs):
        by_category = list(Category.objects.annotate(total=Count("posts")).order_by("-total")[:6])
        top = max([c.total for c in by_category] or [1]) or 1
        for c in by_category:
            c.percent = round(c.total * 100 / top)
        stats = [
            ("Publicaciones", Post.objects.count(), "dashboard:posts"),
            ("Usuarios", User.objects.count(), "dashboard:users"),
            ("Comentarios", Comment.objects.count(), "dashboard:comments"),
            ("Comentarios pendientes", Comment.objects.filter(status="pending").count(), "dashboard:comments"),
            ("Mensajes", ContactMessage.objects.count(), "dashboard:messages"),
            ("Categorías", Category.objects.count(), "dashboard:categories"),
            ("Imágenes", GalleryImage.objects.count(), "dashboard:images"),
            ("Diapositivas", CarouselSlide.objects.count(), "dashboard:slides"),
        ]
        return {
            "stats": stats,
            "by_category": by_category,
            "likes_total": Like.objects.count(),
            "latest_comments": Comment.objects.select_related("user", "post").order_by("-created_at")[:5],
            "unread": ContactMessage.objects.filter(is_read=False).count(),
        }


# ---------- Publicaciones ----------
class PostList(PageView):
    template_name = "dashboard/post_list.html"
    section = "posts"

    def get_context(self, request, **kwargs):
        q = request.GET.get("q", "").strip()
        status = request.GET.get("estado", "")
        cat = request.GET.get("categoria", "")
        posts = Post.objects.select_related("category", "author")
        if q:
            posts = posts.filter(Q(title__icontains=q) | Q(summary__icontains=q))
        if status in ("draft", "published"):
            posts = posts.filter(status=status)
        if cat:
            posts = posts.filter(category__slug=cat)
        page, qs = paginate(request, posts)
        return {"page": page, "qs": qs, "q": q, "status": status, "cat": cat, "categories": Category.objects.all()}


class PostCreate(StaffRequired, SuccessMessageMixin, CreateView):
    model = Post
    form_class = PostForm
    template_name = "dashboard/form.html"
    success_url = reverse_lazy("dashboard:posts")
    success_message = "Publicación guardada."
    extra_context = {"section": "posts", "title": "Nueva publicación", "back": "dashboard:posts", "multipart": True}

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super().form_valid(form)


class PostUpdate(StaffRequired, SuccessMessageMixin, UpdateView):
    model = Post
    form_class = PostForm
    template_name = "dashboard/form.html"
    success_url = reverse_lazy("dashboard:posts")
    success_message = "Cambios guardados."
    extra_context = {"section": "posts", "title": "Editar publicación", "back": "dashboard:posts", "multipart": True}


class PostDelete(StaffRequired, DeleteView):
    model = Post
    success_url = reverse_lazy("dashboard:posts")
    http_method_names = ["post"]

    def form_valid(self, form):
        messages.success(self.request, "Publicación eliminada.")
        return super().form_valid(form)


# ---------- Categorías ----------
class CategoryList(PageView):
    template_name = "dashboard/category_list.html"
    section = "categories"

    def get_context(self, request, **kwargs):
        return {"categories": Category.objects.annotate(total=Count("posts"))}


class CategoryCreate(StaffRequired, SuccessMessageMixin, CreateView):
    model = Category
    form_class = CategoryForm
    template_name = "dashboard/form.html"
    success_url = reverse_lazy("dashboard:categories")
    success_message = "Categoría creada."
    extra_context = {"section": "categories", "title": "Nueva categoría", "back": "dashboard:categories"}


class CategoryUpdate(StaffRequired, SuccessMessageMixin, UpdateView):
    model = Category
    form_class = CategoryForm
    template_name = "dashboard/form.html"
    success_url = reverse_lazy("dashboard:categories")
    success_message = "Cambios guardados."
    extra_context = {"section": "categories", "title": "Editar categoría", "back": "dashboard:categories"}


class CategoryDelete(StaffRequired, DeleteView):
    model = Category
    success_url = reverse_lazy("dashboard:categories")
    http_method_names = ["post"]

    def form_valid(self, form):
        if self.object.posts.exists():
            messages.error(self.request, "No se puede eliminar una categoría con publicaciones asociadas.")
            return redirect(self.success_url)
        messages.success(self.request, "Categoría eliminada.")
        return super().form_valid(form)


# ---------- Usuarios ----------
class UserList(PageView):
    template_name = "dashboard/user_list.html"
    section = "users"

    def get_context(self, request, **kwargs):
        q = request.GET.get("q", "").strip()
        users = User.objects.order_by("-date_joined")
        if q:
            users = users.filter(Q(first_name__icontains=q) | Q(last_name__icontains=q) | Q(email__icontains=q))
        page, qs = paginate(request, users)
        return {"page": page, "qs": qs, "q": q}


class UserToggle(StaffRequired, View):
    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        if user == request.user:
            messages.error(request, "No puedes desactivar tu propia cuenta.")
        else:
            user.is_active = not user.is_active
            user.save(update_fields=["is_active"])
            messages.success(request, "Cuenta activada." if user.is_active else "Cuenta desactivada.")
        return redirect("dashboard:users")


class UserDelete(StaffRequired, View):
    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        if user == request.user or user.posts.exists():
            messages.error(request, "No se puede eliminar este usuario (es tu cuenta o tiene publicaciones).")
        else:
            user.delete()
            messages.success(request, "Usuario eliminado.")
        return redirect("dashboard:users")


# ---------- Comentarios ----------
class CommentList(PageView):
    template_name = "dashboard/comment_list.html"
    section = "comments"

    def get_context(self, request, **kwargs):
        status = request.GET.get("estado", "pending")
        if status not in ("pending", "approved", "rejected"):
            status = "pending"
        comments = Comment.objects.filter(status=status).select_related("user", "post").order_by("-created_at")
        counts = {s: Comment.objects.filter(status=s).count() for s in ("pending", "approved", "rejected")}
        page, qs = paginate(request, comments)
        return {"page": page, "qs": qs, "status": status, "counts": counts}


def is_ajax(request):
    return request.headers.get("X-Requested-With") == "XMLHttpRequest"


def comment_counts():
    return {s: Comment.objects.filter(status=s).count() for s in ("pending", "approved", "rejected")}


class CommentAction(StaffRequired, View):
    action = ""

    def post(self, request, pk):
        comment = get_object_or_404(Comment, pk=pk)
        if self.action == "delete":
            comment.delete()
            text = "Comentario eliminado."
        else:
            comment.status = Comment.Status.APPROVED if self.action == "approve" else Comment.Status.REJECTED
            comment.save(update_fields=["status"])
            text = "Comentario aprobado." if self.action == "approve" else "Comentario rechazado."
        if is_ajax(request):
            return JsonResponse({"ok": True, "message": text, "counts": comment_counts()})
        messages.success(request, text)
        target = request.POST.get("next", "")
        if not url_has_allowed_host_and_scheme(target, allowed_hosts={request.get_host()}):
            target = "dashboard:comments"
        return redirect(target)


# ---------- Mensajes ----------
class MessageList(PageView):
    template_name = "dashboard/message_list.html"
    section = "messages"

    def get_context(self, request, **kwargs):
        page, qs = paginate(request, ContactMessage.objects.all(), 15)
        return {"page": page, "qs": qs}


class MessageDetail(PageView):
    template_name = "dashboard/message_detail.html"
    section = "messages"

    def get_context(self, request, pk):
        msg = get_object_or_404(ContactMessage, pk=pk)
        if not msg.is_read:
            msg.is_read = True
            msg.save(update_fields=["is_read"])
        return {"msg": msg}


class MessageDelete(StaffRequired, View):
    def post(self, request, pk):
        get_object_or_404(ContactMessage, pk=pk).delete()
        if is_ajax(request):
            return JsonResponse({"ok": True, "message": "Mensaje eliminado.",
                                 "counts": {"unread": ContactMessage.objects.filter(is_read=False).count()}})
        messages.success(request, "Mensaje eliminado.")
        return redirect("dashboard:messages")


# ---------- Imágenes ----------
class ImageList(StaffRequired, View):
    def get(self, request):
        return self._render(request, GalleryImageForm())

    def post(self, request):
        form = GalleryImageForm(request.POST, request.FILES)
        if form.is_valid():
            image = form.save(commit=False)
            image.uploaded_by = request.user
            image.save()
            messages.success(request, "Imagen subida.")
            return redirect("dashboard:images")
        return self._render(request, form)

    def _render(self, request, form):
        page, qs = paginate(request, GalleryImage.objects.select_related("uploaded_by"), 12)
        return render(request, "dashboard/image_list.html", {"section": "images", "page": page, "qs": qs, "form": form})


class ImageDelete(StaffRequired, View):
    def post(self, request, pk):
        get_object_or_404(GalleryImage, pk=pk).delete()
        messages.success(request, "Imagen eliminada.")
        return redirect("dashboard:images")


# ---------- Carrusel ----------
class SlideList(PageView):
    template_name = "dashboard/slide_list.html"
    section = "slides"

    def get_context(self, request, **kwargs):
        return {"slides": CarouselSlide.objects.all()}


class SlideCreate(StaffRequired, SuccessMessageMixin, CreateView):
    model = CarouselSlide
    form_class = SlideForm
    template_name = "dashboard/form.html"
    success_url = reverse_lazy("dashboard:slides")
    success_message = "Diapositiva creada."
    extra_context = {"section": "slides", "title": "Nueva diapositiva", "back": "dashboard:slides", "multipart": True}

    def get_initial(self):
        return {"order": CarouselSlide.objects.count() + 1}


class SlideUpdate(StaffRequired, SuccessMessageMixin, UpdateView):
    model = CarouselSlide
    form_class = SlideForm
    template_name = "dashboard/form.html"
    success_url = reverse_lazy("dashboard:slides")
    success_message = "Cambios guardados."
    extra_context = {"section": "slides", "title": "Editar diapositiva", "back": "dashboard:slides", "multipart": True}


class SlideDelete(StaffRequired, DeleteView):
    model = CarouselSlide
    success_url = reverse_lazy("dashboard:slides")
    http_method_names = ["post"]

    def form_valid(self, form):
        messages.success(self.request, "Diapositiva eliminada.")
        return super().form_valid(form)


class SlideToggle(StaffRequired, View):
    def post(self, request, pk):
        slide = get_object_or_404(CarouselSlide, pk=pk)
        slide.is_active = not slide.is_active
        slide.save(update_fields=["is_active"])
        messages.success(request, "Diapositiva activada." if slide.is_active else "Diapositiva desactivada.")
        return redirect("dashboard:slides")


class SlideMove(StaffRequired, View):
    def post(self, request, pk, direction):
        slides = list(CarouselSlide.objects.all())
        idx = next((i for i, s in enumerate(slides) if s.pk == pk), None)
        if idx is None:
            if is_ajax(request):
                return JsonResponse({"ok": False, "error": "La diapositiva ya no existe."}, status=404)
            return redirect("dashboard:slides")
        swap = idx - 1 if direction == "arriba" else idx + 1
        if 0 <= swap < len(slides):
            slides[idx], slides[swap] = slides[swap], slides[idx]
            for position, slide in enumerate(slides, start=1):
                if slide.order != position:
                    slide.order = position
                    slide.save(update_fields=["order"])
        if is_ajax(request):
            return JsonResponse({"ok": True})
        return redirect("dashboard:slides")
