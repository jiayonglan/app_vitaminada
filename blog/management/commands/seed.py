import random
from datetime import timedelta
from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone
from PIL import Image, ImageDraw

from blog.models import Category, Post
from carousel.models import CarouselSlide
from comments.models import Comment
from gallery.models import GalleryImage
from likes.models import Like

User = get_user_model()

CATEGORIES = [
    ("Desarrollo web", "Frontend, backend y todo lo que hay en medio."),
    ("Python", "Lenguaje, librerías y buenas prácticas."),
    ("Django", "Construir aplicaciones con el framework de Python."),
    ("Diseño", "Interfaces claras y sistemas de diseño."),
    ("Accesibilidad", "Webs que puede usar todo el mundo."),
    ("Rendimiento", "Cargas rápidas y experiencias fluidas."),
    ("Bases de datos", "Modelado, consultas y PostgreSQL."),
    ("Carrera", "Aprender, practicar y crecer como desarrollador."),
]

TITLES = [
    "Por qué un sistema de diseño ahorra semanas de trabajo", "Django en producción: lo que aprendí al desplegar", "CSS Grid explicado con tres layouts reales",
    "Accesibilidad en formularios: errores que todos cometemos", "PostgreSQL: índices que sí merece la pena crear", "De Symfony a Django: qué cambia y qué no",
    "Tipografía en la web: elegir una familia y sacarle partido", "JavaScript sin frameworks: cuándo basta con el navegador", "Cómo estructurar CSS modular sin morir en el intento",
    "Fetch API y CSRF: peticiones seguras desde el navegador", "Imágenes responsive que no frenan tu página", "Modelar un blog con Django ORM paso a paso",
    "Paginación y búsqueda: la experiencia que esperan los lectores", "Contraste de color: cómo comprobarlo antes de publicar", "Un carrusel accesible, sin librerías",
    "Testing en Django: empezar por lo que importa", "Animaciones útiles: cuándo mover algo en pantalla", "Cómo documentar un proyecto para tu yo del futuro",
    "Docker para desarrollo local con Django y PostgreSQL", "Modo oscuro: decisiones de diseño antes del código", "Seguridad básica en aplicaciones Django",
    "Moderación de comentarios sin complicarse", "Optimizar consultas: select_related y prefetch_related", "Diseño de paneles de administración legibles",
    "Aprender en público: por qué escribir un blog técnico ayuda",
]

PARAGRAPHS = [
    "Cuando empiezas un proyecto web, la tentación es resolverlo todo a la vez. Lo que mejor funciona en la práctica es lo contrario: decidir pocas cosas, bien, y repetirlas en toda la aplicación.",
    "Un buen punto de partida es escribir las reglas en un único lugar. En CSS eso son las variables; en Django, los modelos y las plantillas base. Todo lo demás se apoya en ellas.",
    "La legibilidad no es un detalle estético. Una línea demasiado larga, un contraste débil o un botón sin estado de foco son barreras reales para quien lee y para quien navega con teclado.",
    "Medir antes de optimizar evita trabajo inútil. Abre las herramientas del navegador, revisa qué se descarga y qué bloquea el renderizado, y corrige primero lo que más pesa.",
    "El mejor código es el que se entiende al volver a él seis meses después. Nombres claros, funciones pequeñas y archivos con una única responsabilidad valen más que cualquier truco.",
    "Probar con datos reales cambia la perspectiva. Los títulos largos, las imágenes sin texto alternativo y las listas vacías aparecen enseguida y obligan a diseñar los estados que nadie recuerda.",
]


def gradient(size, c1, c2, label=""):
    w, h = size
    img = Image.new("RGB", size, c1)
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        draw.line([(0, y), (w, y)], fill=tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3)))
    cx, cy, r = int(w * 0.72), int(h * 0.38), int(h * 0.42)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=tuple(min(255, int(c + 22)) for c in c2))
    buf = BytesIO()
    img.save(buf, "JPEG", quality=82)
    return ContentFile(buf.getvalue())


PALETTES = [((21, 91, 208), (118, 160, 232)), ((45, 43, 48), (109, 137, 181)), ((15, 79, 191), (181, 199, 216)),
            ((60, 90, 140), (200, 214, 232)), ((30, 64, 120), (150, 180, 220)), ((22, 128, 74), (170, 215, 190))]


class Command(BaseCommand):
    help = "Carga datos de ejemplo: 8 categorías, 25 posts, 50 comentarios, 3 usuarios, 1 admin y 5 diapositivas."

    def handle(self, *args, **options):
        random.seed(7)
        if Post.objects.exists():
            self.stdout.write("Ya hay datos. Usa 'flush' antes de volver a cargar el seeder.")
            return
        admin = User.objects.create_superuser("admin@meridiano.test", "admin@meridiano.test", "Admin12345!",
                                              first_name="Lucía", last_name="Navarro")
        users = []
        for first, last in [("Marta", "Ibáñez"), ("Pablo", "Serrano"), ("Elena", "Costa")]:
            email = f"{first.lower()}@meridiano.test"
            users.append(User.objects.create_user(email, email, "Usuario12345!", first_name=first, last_name=last))
        cats = [Category.objects.create(name=n, description=d) for n, d in CATEGORIES]
        now = timezone.now()
        posts = []
        for i, title in enumerate(TITLES):
            body = "\n\n".join(random.sample(PARAGRAPHS, 4))
            body += "\n\n## Ideas clave\n\n- Empieza con poco y mide.\n- Reutiliza antes de crear.\n- Cuida los estados vacíos y de error.\n\n" + random.choice(PARAGRAPHS)
            post = Post(title=title, summary=random.choice(PARAGRAPHS)[:150].rsplit(" ", 1)[0] + ".", content=body,
                        category=cats[i % len(cats)], author=admin, status=Post.Status.PUBLISHED,
                        is_featured=i in (0, 1, 5), published_at=now - timedelta(days=i * 3 + 1))
            c1, c2 = PALETTES[i % len(PALETTES)]
            post.image.save(f"post-{i + 1}.jpg", gradient((1200, 675), c1, c2), save=False)
            post.save()
            posts.append(post)
        for post in posts:
            for u in random.sample(users + [admin], random.randint(0, 4)):
                Like.objects.get_or_create(user=u, post=post)
        statuses = [Comment.Status.APPROVED] * 4 + [Comment.Status.PENDING, Comment.Status.REJECTED]
        sample = ["Muy buen artículo, justo lo que necesitaba.", "Gracias por explicarlo con ejemplos concretos.",
                  "¿Podrías ampliar la parte final en otro post?", "Lo probé en mi proyecto y funciona bien.",
                  "Interesante enfoque, me gusta que sea tan práctico.", "Me quedo con la idea de empezar con poco."]
        made = []
        for i in range(50):
            parent = random.choice(made) if made and i % 5 == 0 else None
            c = Comment.objects.create(post=parent.post if parent else random.choice(posts), user=random.choice(users),
                                       parent=parent.parent or parent if parent else None,
                                       content=random.choice(sample), status=random.choice(statuses))
            made.append(c)
        slides = [("Ideas claras para construir la web", "Artículos sobre desarrollo, diseño y buenas prácticas.", "Leer el blog", "/blog/"),
                  ("Aprende con ejemplos reales", "Guías paso a paso con código que puedes ejecutar.", "Ver categorías", "/categorias/"),
                  ("Una comunidad que comenta", "Participa en las publicaciones y comparte tu punto de vista.", "Crear cuenta", "/cuenta/registro/"),
                  ("Diseño que se entiende", "Interfaces limpias, accesibles y rápidas.", "", ""),
                  ("Escríbenos", "Cuéntanos qué te gustaría leer a continuación.", "Contactar", "/contacto/")]
        for i, (t, d, bt, bu) in enumerate(slides):
            s = CarouselSlide(title=t, description=d, button_text=bt, button_url=bu, order=i + 1)
            c1, c2 = PALETTES[(i + 2) % len(PALETTES)]
            s.image.save(f"slide-{i + 1}.jpg", gradient((1600, 700), c1, c2), save=False)
            s.save()
        for i in range(4):
            g = GalleryImage(title=f"Imagen de ejemplo {i + 1}", description="Recurso de la galería.",
                             alt_text="Fondo abstracto en tonos azules", uploaded_by=admin)
            c1, c2 = PALETTES[i % len(PALETTES)]
            g.image.save(f"gallery-{i + 1}.jpg", gradient((900, 600), c1, c2), save=False)
            g.save()
        self.stdout.write(self.style.SUCCESS(
            "Datos cargados. Admin: admin@meridiano.test / Admin12345!  |  Usuarios: marta@meridiano.test / Usuario12345!"))
