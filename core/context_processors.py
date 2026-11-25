from blog.models import Category


def site(request):
    return {
        "SITE_NAME": "Meridiano",
        "SITE_TAGLINE": "Ideas claras sobre tecnología, diseño y desarrollo web.",
        "footer_categories": Category.objects.all()[:5],
    }
