/* Nika Bana front page motion. No libraries; respects reduced motion. */
(function () {
  "use strict";
  var hero = document.querySelector(".home-cinematic");
  if (!hero) return;

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var sections = Array.prototype.slice.call(document.querySelectorAll(".home-reveal, .home-quick-access"));
  if (!reduced && "IntersectionObserver" in window) {
    document.body.classList.add("home-motion-enabled");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    sections.forEach(function (section) { observer.observe(section); });
  } else {
    sections.forEach(function (section) { section.classList.add("in-view"); });
  }

  var progress = document.querySelector(".home-reading-progress > span");
  var ticking = false;
  function updateProgress() {
    ticking = false;
    if (!progress) return;
    var root = document.documentElement;
    var possible = Math.max(0, root.scrollHeight - window.innerHeight);
    var value = possible ? Math.max(0, Math.min(1, window.scrollY / possible)) : 0;
    progress.style.transform = "scaleX(" + value.toFixed(4) + ")";
  }
  function scheduleProgress() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateProgress);
  }
  updateProgress();
  window.addEventListener("scroll", scheduleProgress, { passive: true });
  window.addEventListener("resize", scheduleProgress, { passive: true });

  /* Gentle pointer-responsive architectural lettering behind the hero;
     the existing Three.js model keeps its own interaction logic. */
  if (!reduced && window.matchMedia && window.matchMedia("(pointer: fine)").matches) {
    var watermark = hero.querySelector(".home-hero-watermark");
    var pointerTick = false;
    var px = 0, py = 0;
    if (watermark) {
      hero.addEventListener("pointermove", function (event) {
        var bounds = hero.getBoundingClientRect();
        px = ((event.clientX - bounds.left) / bounds.width - 0.5) * 22;
        py = ((event.clientY - bounds.top) / bounds.height - 0.5) * 16;
        if (pointerTick) return;
        pointerTick = true;
        window.requestAnimationFrame(function () {
          pointerTick = false;
          watermark.style.setProperty("--home-mark-x", px.toFixed(1) + "px");
          watermark.style.setProperty("--home-mark-y", py.toFixed(1) + "px");
        });
      }, { passive: true });
      hero.addEventListener("pointerleave", function () {
        watermark.style.setProperty("--home-mark-x", "0px");
        watermark.style.setProperty("--home-mark-y", "0px");
      });
    }
  }
})();