import { $, $$, slugify } from "./utilities.js";

/** Lectura: tiempo estimado, barra de progreso e índice con seguimiento de sección. */
export function initReading() {
  const prose = $(".prose");
  if (!prose) return;

  const words = prose.textContent.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 220));
  $$("[data-reading-time]").forEach((el) => { el.textContent = `${minutes} min de lectura`; el.hidden = false; });

  const bar = $("[data-read-progress]");
  if (bar) {
    bar.parentElement.hidden = false;
    let ticking = false;
    const update = () => {
      const rect = prose.getBoundingClientRect();
      const progress = Math.min(Math.max((window.innerHeight * 0.3 - rect.top) / rect.height, 0), 1);
      bar.style.transform = `scaleX(${progress})`;
      ticking = false;
    };
    const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
  }

  const toc = $("[data-toc]");
  const headings = $$("h2", prose);
  if (!toc || headings.length < 3) return;
  const used = new Set();
  const list = $("ol", toc);
  const links = headings.map((heading) => {
    let id = slugify(heading.textContent) || "seccion";
    while (used.has(id)) id += "-2";
    used.add(id);
    heading.id = id;
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${id}`;
    a.textContent = heading.textContent;
    li.append(a);
    list.append(li);
    return a;
  });
  toc.hidden = false;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => link.removeAttribute("aria-current"));
      links.find((link) => link.hash === `#${entry.target.id}`)?.setAttribute("aria-current", "true");
    });
  }, { rootMargin: "-15% 0px -75% 0px" });
  headings.forEach((heading) => observer.observe(heading));
}
