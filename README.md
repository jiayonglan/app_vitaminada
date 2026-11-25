# Meridiano · blog con Django y frontend Apple UI

Blog completo con Python, Django y PostgreSQL. El frontend es HTML, CSS y JavaScript vanilla (sin Bootstrap, Tailwind, jQuery ni frameworks JS), siguiendo el sistema de diseño `apple-ui-skills` y el Prompt Maestro 2.

## Puesta en marcha

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env              # y exporta las variables, o edita config/settings.py
python manage.py migrate
python manage.py seed             # 8 categorías, 25 posts, 50 comentarios, 3 usuarios, 1 admin, 5 diapositivas
python manage.py runserver
```

PostgreSQL: crea la base de datos `apple_blog` y ajusta `DB_*` en las variables de entorno.
Para probar sin PostgreSQL: `USE_SQLITE=1 python manage.py migrate` (y lo mismo con `seed` y `runserver`).

Accesos de ejemplo:

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@meridiano.test | Admin12345! |
| Lector | marta@meridiano.test | Usuario12345! |

Panel de administración propio: `/admin/` (solo staff). Admin de Django: `/django-admin/`.

## Estructura

```
config/        ajustes y rutas
core/          portada, categorías, contexto global
accounts/      registro, login, recuperar/cambiar contraseña, perfil
blog/          categorías y publicaciones (listado, búsqueda, detalle)
comments/      comentarios con moderación y respuestas
likes/         me gusta (endpoint JSON)
contact/       formulario de contacto
carousel/      diapositivas de la portada
gallery/       imágenes del panel
dashboard/     panel de administración propio
templates/     plantillas Django (base, partials, por app)
static/meridiano/css/   variables, reset, typography, layout, buttons, forms, components,
                        navigation, cards, home, blog, profile, admin, animations, responsive
static/meridiano/js/    módulos ES: main.js carga solo lo que cada página necesita
```

## JavaScript interactivo

- Búsqueda en vivo en `/blog/` (consulta la búsqueda real de Django, actualiza URL e historial, esqueleto de carga y paginación sin recargar).
- Sugerencias al escribir en el buscador de la cabecera, navegables con flechas.
- Atajos de teclado: `/` buscar, `?` ayuda, `g h` inicio, `g b` blog, `g c` categorías, `g k` contacto. En el panel: `g d`, `g p`, `g t`, `g u`, `g o`, `g m`, `g i`, `g r`.
- Carrusel accesible: flechas, indicadores, teclado, deslizar en táctil, pausa y respeto de `prefers-reduced-motion`.
- Likes optimistas con reversión si falla la petición y protección contra doble pulsación.
- Comentarios por Fetch con CSRF, respuestas anidadas, contador, borrador guardado en el navegador, Ctrl/Cmd+Enter y ordenación.
- Lectura: barra de progreso, tiempo estimado e índice con seguimiento de sección.
- Formularios: validación en cliente (la definitiva es la de Django), mostrar/ocultar contraseña, indicadores de requisitos y contadores.
- Panel: moderar comentarios y borrar mensajes sin recargar, tablas ordenables, reordenar el carrusel arrastrando filas o con botones, slug automático, vista previa del contenido y de la imagen, arrastrar imagen, aviso de cambios sin guardar y Ctrl/Cmd+S.
- Confirmación accesible (`<dialog>`) antes de cualquier acción destructiva.

Sin JavaScript todo sigue funcionando con envíos normales de formulario; la confirmación de borrado es la única mejora que se pierde.

## Decisiones de diseño

- La skill apple-ui-skills trae dos tokens poco útiles (`surface-raised` azul y `text-primary` gris). Se usan los valores del prompt: `#F5F7FA` y `#2D2B30`.
- `#6D89B5` solo da 3,5:1 sobre blanco. Para texto se usa `#4A6A96` (5,5:1) y el tono original queda como `--accent-soft`. Se cambia en `static/meridiano/css/variables.css`.
- Inter se carga desde Google Fonts. Para uso sin conexión, descarga la fuente y cambia el `<link>` de `templates/base.html` por una `@font-face` local.
- `main.css` usa `@import` por claridad; para producción conviene concatenarlo en un solo archivo.
- Se omite la sección de newsletter porque el backend no tiene suscripciones.

## Lo que se ha probado

Con Chromium real (Puppeteer): más de 70 comprobaciones de navegación, carrusel, búsqueda, likes, comentarios, formularios, panel, arrastrar y soltar y menú móvil a 375 px, sin errores de consola. Con el cliente de test de Django: todas las rutas públicas y del panel, permisos, CSRF y redirecciones.
No se ha probado en Firefox, Edge ni Safari.
