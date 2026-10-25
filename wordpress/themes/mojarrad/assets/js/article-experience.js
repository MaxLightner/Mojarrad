/* Reading progress, chapter navigation and one-time visual reveals. */
(function () {
  "use strict";
  var article = document.querySelector(".article-experience");
  if (!article) return;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var progress = article.querySelector(".article-reading-progress > span");
  var ticking = false;
  function updateProgress() {
    ticking = false;
    if (!progress) return;
    var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    var value = max ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
    progress.style.transform = "scaleX(" + value.toFixed(4) + ")";
  }
  function schedule() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateProgress);
  }
  updateProgress();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });

  var heads = Array.prototype.slice.call(article.querySelectorAll(".article-prose h2[id]"));
  var links = Array.prototype.slice.call(article.querySelectorAll(".article-chapter-nav a"));
  function setActive(id) {
    links.forEach(function (a) {
      var active = a.getAttribute("href") === "#" + id;
      a.classList.toggle("is-active", active);
      if (active) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  }
  if ("IntersectionObserver" in window) {
    var chapterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: "-10% 0px -70% 0px", threshold: 0 });
    heads.forEach(function (h) { chapterObserver.observe(h); });
    var figureObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          figureObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.15 });
    Array.prototype.forEach.call(article.querySelectorAll(".article-flow-figure"), function (figure) {
      if (reduced) figure.classList.add("in-view");
      else figureObserver.observe(figure);
    });
  } else {
    if (heads.length) setActive(heads[0].id);
    Array.prototype.forEach.call(article.querySelectorAll(".article-flow-figure"), function (figure) {
      figure.classList.add("in-view");
    });
  }
})();