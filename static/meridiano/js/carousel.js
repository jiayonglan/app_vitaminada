import { $, $$, prefersReducedMotion } from "./utilities.js";

const INTERVAL = 6000;

export function initCarousels() {
  $$("[data-carousel]").forEach(setup);
}

function setup(root) {
  const track = $("[data-carousel-track]", root);
  const slides = $$("[data-carousel-slide]", root);
  if (!track || slides.length === 0) return; // sin diapositivas: no hay nada que inicializar
  const dotsBox = $("[data-carousel-dots]", root);
  const controls = $("[data-carousel-controls]", root);
  const pauseBtn = $("[data-carousel-pause]", root);
  const live = $("[data-carousel-live]", root);
  let index = 0;
  let timer = null;
  let userPaused = prefersReducedMotion();
  let hoverPaused = false;

  if (slides.length < 2) {
    controls?.setAttribute("hidden", "");
    show(0);
    return;
  }

  const dots = slides.map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel-dot";
    dot.setAttribute("aria-label", `Ir a la diapositiva ${i + 1} de ${slides.length}`);
    dot.addEventListener("click", () => { show(i); });
    dotsBox.append(dot);
    return dot;
  });

  function show(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((slide, n) => {
      const active = n === index;
      slide.setAttribute("aria-hidden", String(!active));
      slide.toggleAttribute("inert", !active);
    });
    dots.forEach((dot, n) => (n === index ? dot.setAttribute("aria-current", "true") : dot.removeAttribute("aria-current")));
    if (live && (userPaused || hoverPaused)) live.textContent = `Diapositiva ${index + 1} de ${slides.length}`;
  }

  function stop() { clearInterval(timer); timer = null; }
  function start() {
    stop();
    if (!userPaused && !hoverPaused && !document.hidden) timer = setInterval(() => show(index + 1), INTERVAL);
  }
  function syncPauseButton() {
    pauseBtn.setAttribute("aria-label", userPaused ? "Reanudar reproducción automática" : "Pausar reproducción automática");
    $("use", pauseBtn).setAttribute("href", userPaused ? "#i-play" : "#i-pause");
    track.setAttribute("aria-live", userPaused ? "polite" : "off");
  }

  $("[data-carousel-prev]", root).addEventListener("click", () => { show(index - 1); start(); });
  $("[data-carousel-next]", root).addEventListener("click", () => { show(index + 1); start(); });
  dots.forEach((dot) => dot.addEventListener("click", start));
  pauseBtn.addEventListener("click", () => { userPaused = !userPaused; syncPauseButton(); start(); });

  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") { show(index - 1); start(); }
    else if (event.key === "ArrowRight") { show(index + 1); start(); }
  });
  root.addEventListener("mouseenter", () => { hoverPaused = true; stop(); });
  root.addEventListener("mouseleave", () => { hoverPaused = false; start(); });
  root.addEventListener("focusin", () => { hoverPaused = true; stop(); });
  root.addEventListener("focusout", () => { hoverPaused = false; start(); });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  // Soporte táctil: deslizar horizontalmente
  let startX = null;
  let startY = null;
  const viewport = $("[data-carousel-viewport]", root);
  viewport.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
  viewport.addEventListener("touchend", (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    startX = startY = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) { show(index + (dx < 0 ? 1 : -1)); start(); }
  }, { passive: true });

  syncPauseButton();
  show(0);
  start();
}
