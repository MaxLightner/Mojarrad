(function () {
  "use strict";
  var body = document.body;
  var themes = ["navy", "dark", "light", "pastel"];
  var selector = document.getElementById("moj-theme");
  var saved = "navy";
  try { saved = localStorage.getItem("mojarrad-theme") || "navy"; } catch (e) {}
  if (!themes.includes(saved)) saved = "navy";
  body.setAttribute("data-moj-theme", saved);
  if (selector) {
    selector.value = saved;
    selector.addEventListener("change", function () {
      var value = themes.includes(selector.value) ? selector.value : "navy";
      body.setAttribute("data-moj-theme", value);
      try { localStorage.setItem("mojarrad-theme", value); } catch (e) {}
    });
  }
  var toggle = document.getElementById("menu-toggle");
  var nav = document.getElementById("primary-nav");
  if (toggle && nav) {
    function setMenu(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "بستن فهرست" : "باز کردن فهرست");
    }
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });
    document.addEventListener("click", function (event) {
      if (toggle.getAttribute("aria-expanded") === "true" && !nav.contains(event.target) && !toggle.contains(event.target)) {
        setMenu(false);
      }
    });
    window.matchMedia("(min-width: 881px)").addEventListener("change", function (event) {
      if (event.matches) setMenu(false);
    });
  }
})();
