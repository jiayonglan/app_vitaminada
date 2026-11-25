from django import template

register = template.Library()


@register.filter
def initials(user):
    name = (user.get_full_name() or user.username).split()
    return "".join(part[0] for part in name[:2]).upper() or "?"


@register.filter
def display_name(user):
    return user.get_full_name() or user.username


import re

from django.core.paginator import Paginator
from django.utils.html import escape
from django.utils.safestring import mark_safe

_INLINE = [
    (re.compile(r"\*\*(.+?)\*\*"), r"<strong>\1</strong>"),
    (re.compile(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])"), r"<em>\1</em>"),
    (re.compile(r"`(.+?)`"), r"<code>\1</code>"),
    (re.compile(r"\[([^\]]+)\]\(((?:https?://|/)[^)\s]+)\)"), r'<a href="\2" rel="noopener">\1</a>'),
]


def _inline(text):
    text = escape(text)
    for pattern, repl in _INLINE:
        text = pattern.sub(repl, text)
    return text


@register.filter
def render_content(value):
    """Convierte texto sencillo (## títulos, - listas, párrafos) en HTML seguro."""
    html = []
    for block in re.split(r"\n\s*\n", (value or "").replace("\r\n", "\n").strip()):
        lines = [ln for ln in block.split("\n") if ln.strip()]
        if not lines:
            continue
        first = lines[0]
        if first.startswith("### "):
            html.append(f"<h3>{_inline(first[4:])}</h3>")
        elif first.startswith("## "):
            html.append(f"<h2>{_inline(first[3:])}</h2>")
        elif first.strip() == "---":
            html.append("<hr>")
        elif all(ln.lstrip().startswith(("- ", "* ")) for ln in lines):
            items = "".join(f"<li>{_inline(ln.lstrip()[2:])}</li>" for ln in lines)
            html.append(f"<ul>{items}</ul>")
        elif all(re.match(r"\d+\.\s", ln.lstrip()) for ln in lines):
            items = "".join(f"<li>{_inline(re.sub(r'^\d+\.\s', '', ln.lstrip()))}</li>" for ln in lines)
            html.append(f"<ol>{items}</ol>")
        else:
            html.append("<p>" + "<br>".join(_inline(ln) for ln in lines) + "</p>")
    return mark_safe("\n".join(html))


@register.simple_tag
def elided_pages(page):
    return list(page.paginator.get_elided_page_range(page.number, on_each_side=1, on_ends=1))


@register.simple_tag
def admin_counts():
    from comments.models import Comment
    from contact.models import ContactMessage

    return {
        "pending": Comment.objects.filter(status="pending").count(),
        "unread": ContactMessage.objects.filter(is_read=False).count(),
    }


@register.simple_tag
def asset(path):
    """URL de un estático con ?v=<fecha de modificación>: evita que el navegador sirva copias antiguas."""
    from django.contrib.staticfiles import finders
    from django.templatetags.static import static
    import os

    found = finders.find(path)
    version = int(os.path.getmtime(found)) if found else 0
    return f"{static(path)}?v={version}"
