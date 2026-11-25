from django.contrib import messages
from django.shortcuts import redirect, render

from .forms import ContactForm


def contact(request):
    form = ContactForm(request.POST or None, initial=_initial(request))
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Mensaje enviado. Te responderemos lo antes posible.")
        return redirect("contact:contact")
    return render(request, "contact/contact.html", {"form": form})


def _initial(request):
    if request.user.is_authenticated:
        return {"name": request.user.get_full_name(), "email": request.user.email}
    return {}
