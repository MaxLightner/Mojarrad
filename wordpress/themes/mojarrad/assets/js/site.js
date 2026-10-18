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
    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("is-open", !expanded);
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }
})();
