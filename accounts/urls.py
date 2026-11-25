from django.contrib.auth import views as auth_views
from django.urls import path, reverse_lazy

from . import views
from .forms import LoginForm, StyledPasswordChangeForm, StyledPasswordResetForm, StyledSetPasswordForm

app_name = "accounts"

urlpatterns = [
    path("registro/", views.register, name="register"),
    path("entrar/", auth_views.LoginView.as_view(template_name="accounts/login.html", authentication_form=LoginForm,
                                                  redirect_authenticated_user=True), name="login"),
    path("salir/", auth_views.LogoutView.as_view(), name="logout"),
    path("perfil/", views.profile, name="profile"),
    path("perfil/editar/", views.profile_edit, name="profile_edit"),
    path("contrasena/cambiar/", auth_views.PasswordChangeView.as_view(
        template_name="accounts/password_change.html", form_class=StyledPasswordChangeForm,
        success_url=reverse_lazy("accounts:password_change_done")), name="password_change"),
    path("contrasena/cambiada/", auth_views.PasswordChangeDoneView.as_view(
        template_name="accounts/password_change_done.html"), name="password_change_done"),
    path("contrasena/recuperar/", auth_views.PasswordResetView.as_view(
        template_name="accounts/password_reset.html", form_class=StyledPasswordResetForm,
        email_template_name="accounts/password_reset_email.txt",
        subject_template_name="accounts/password_reset_subject.txt",
        success_url=reverse_lazy("accounts:password_reset_done")), name="password_reset"),
    path("contrasena/recuperar/enviado/", auth_views.PasswordResetDoneView.as_view(
        template_name="accounts/password_reset_done.html"), name="password_reset_done"),
    path("contrasena/restablecer/<uidb64>/<token>/", auth_views.PasswordResetConfirmView.as_view(
        template_name="accounts/password_reset_confirm.html", form_class=StyledSetPasswordForm,
        success_url=reverse_lazy("accounts:password_reset_complete")), name="password_reset_confirm"),
    path("contrasena/restablecida/", auth_views.PasswordResetCompleteView.as_view(
        template_name="accounts/password_reset_complete.html"), name="password_reset_complete"),
]
