/* Nika Bana: project mosaic, accessible lightbox and shared map interaction. */
(() => {
  'use strict';
  const root = document.getElementById('moj-portfolio');
  const dataEl = document.getElementById('portfolio-project-data');
  if (!root || !dataEl) return;
  let projects = [];
  try { projects = JSON.parse(dataEl.textContent || '[]'); } catch (_) { return; }

  const $ = id => document.getElementById(id);
  const mosaic = $('portfolio-mosaic');
  const lightbox = $('portfolio-lightbox');
  const panel = lightbox?.querySelector('.portfolio-dialog');
  const stage = $('portfolio-stage-image');
  const title = $('portfolio-dialog-title');
  const count = $('portfolio-image-count');
  const facts = $('portfolio-facts');
  const thumbs = $('portfolio-thumbs');
  const description = $('portfolio-description');
  const previousImage = $('portfolio-prev');
  const nextImage = $('portfolio-next');
  const previousProject = $('portfolio-project-prev');
  const nextProject = $('portfolio-project-next');
  const notice = $('portfolio-map-notice');
  const filters = [...document.querySelectorAll('.portfolio-filter')];
  const tiles = [...document.querySelectorAll('.portfolio-tile')];
  const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let selected = -1;
  let imageIndex = 0;
  let filter = 'all';
  let returnFocus = null;
  let touchStart = null;
  let map = null;
  const mapMarkers = [];
  const placeholder = root.dataset.placeholder || '';

  const visibleIndices = () => projects.map((p, i) => filter === 'all' || p.category === filter ? i : -1).filter(i => i >= 0);
  const currentImages = () => (projects[selected]?.images || []).filter(Boolean);

  function setImage(index) {
    const images = currentImages();
    if (!images.length) return;
    imageIndex = (index + images.length) % images.length;
    stage.src = images[imageIndex];
    stage.alt = projects[selected].title + ' — تصویر ' + (imageIndex + 1);
    count.textContent = images.length > 1 ? (imageIndex + 1) + ' / ' + images.length : '';
    previousImage.hidden = nextImage.hidden = images.length <= 1;
    thumbs.replaceChildren();
    if (images.length > 1) images.forEach((url, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'portfolio-thumb' + (i === imageIndex ? ' is-current' : '');
      button.setAttribute('aria-label', 'نمایش تصویر ' + (i + 1));
      button.setAttribute('aria-pressed', String(i === imageIndex));
      const image = document.createElement('img');
      image.src = url;
      image.alt = '';
      image.loading = 'lazy';
      button.append(image);
      button.addEventListener('click', () => setImage(i));
      thumbs.append(button);
    });
  }

  function fillDetails(index) {
    const project = projects[index];
    if (!project) return;
    selected = index;
    title.textContent = project.title;
    facts.replaceChildren();
    (project.facts || []).forEach(row => {
      const wrapper = document.createElement('div');
      wrapper.className = 'portfolio-fact';
      const label = document.createElement('dt');
      const value = document.createElement('dd');
      label.textContent = row.label;
      value.textContent = row.value;
      wrapper.append(label, value);
      facts.append(wrapper);
    });
    if (!facts.children.length) {
      const empty = document.createElement('p');
      empty.className = 'portfolio-facts-empty';
      empty.textContent = 'اطلاعات تکمیلی این پروژه به‌زودی ثبت می‌شود.';
      facts.append(empty);
    }
    description.textContent = project.description || '';
    description.hidden = !project.description;
    setImage(0);
    const siblings = visibleIndices();
    const disableChange = siblings.length < 2;
    previousProject.hidden = nextProject.hidden = disableChange;
  }

  function updateHash(slug) {
    const target = slug ? '#project=' + encodeURIComponent(slug) : location.pathname + location.search;
    if (slug) {
      if (location.hash !== target) history.pushState({ portfolioProject: slug }, '', target);
    } else {
      history.replaceState(null, '', target);
    }
  }

  function animateFromTile(index) {
    if (motionReduced || !stage || !stage.animate) return;
    const original = tiles[index]?.querySelector('img');
    if (!original || !original.getBoundingClientRect().width) return;
    const from = original.getBoundingClientRect();
    const to = stage.getBoundingClientRect();
    if (!to.width || !to.height) return;
    const flying = original.cloneNode();
    flying.className = 'portfolio-flying-image';
    Object.assign(flying.style, {
      position: 'fixed', zIndex: '10010', pointerEvents: 'none', margin: '0',
      top: from.top + 'px', left: from.left + 'px',
      width: from.width + 'px', height: from.height + 'px',
      objectFit: 'cover', borderRadius: '3px'
    });
    document.body.append(flying);
    stage.style.opacity = '0';
    const animation = flying.animate([
      { top: from.top + 'px', left: from.left + 'px', width: from.width + 'px', height: from.height + 'px', borderRadius: '3px' },
      { top: to.top + 'px', left: to.left + 'px', width: to.width + 'px', height: to.height + 'px', borderRadius: '12px' }
    ], { duration: 480, easing: 'cubic-bezier(.2,.75,.2,1)' });
    animation.finished.catch(() => {}).finally(() => { flying.remove(); stage.style.opacity = ''; });
  }

  function openProject(index, fromTile = false, changeUrl = true) {
    if (!projects[index] || !lightbox) return;
    const opening = selected < 0;
    if (opening) returnFocus = document.activeElement;
    fillDetails(index);
    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('portfolio-dialog-open');
    panel?.scrollTo(0, 0);
    lightbox.querySelector('.portfolio-dialog-scroll')?.scrollTo(0, 0);
    if (fromTile) requestAnimationFrame(() => animateFromTile(index));
    if (changeUrl) updateHash(projects[index].slug);
    if (opening) lightbox.querySelector('.portfolio-close')?.focus({ preventScroll: true });
  }

  function closeProject(changeUrl = true) {
    if (selected < 0 || !lightbox) return;
    selected = -1;
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('portfolio-dialog-open');
    stage.removeAttribute('src');
    if (changeUrl) updateHash('');
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
  }

  function switchProject(delta) {
    const list = visibleIndices();
    if (!list.length || selected < 0) return;
    const at = Math.max(0, list.indexOf(selected));
    openProject(list[(at + delta + list.length) % list.length]);
  }

  function routeFromHash() {
    const match = location.hash.match(/^#project=(.+)$/);
    if (!match) { closeProject(false); return; }
    let slug = '';
    try { slug = decodeURIComponent(match[1]); } catch (_) { return; }
    const index = projects.findIndex(project => project.slug === slug);
    if (index >= 0) openProject(index, false, false);
  }

  tiles.forEach(tile => tile.addEventListener('click', () => openProject(Number(tile.dataset.projectIndex), true)));
  filters.forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter || 'all';
    filters.forEach(b => {
      const active = b === button;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    tiles.forEach(tile => { tile.hidden = filter !== 'all' && tile.dataset.category !== filter; });
    const noResults = $('portfolio-no-results');
    if (noResults) noResults.hidden = !!visibleIndices().length;
    if (map) mapMarkers.forEach(({ marker, index }) => {
      if (filter === 'all' || projects[index].category === filter) marker.addTo(map);
      else map.removeLayer(marker);
    });
  }));

  lightbox?.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => closeProject()));
  previousImage?.addEventListener('click', () => setImage(imageIndex - 1));
  nextImage?.addEventListener('click', () => setImage(imageIndex + 1));
  previousProject?.addEventListener('click', () => switchProject(-1));
  nextProject?.addEventListener('click', () => switchProject(1));
  stage?.addEventListener('error', () => {
    if (placeholder && !stage.src.endsWith(placeholder)) stage.src = placeholder;
  });
  document.addEventListener('keydown', event => {
    if (selected < 0) return;
    if (event.key === 'Escape') { event.preventDefault(); closeProject(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); setImage(imageIndex + 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); setImage(imageIndex - 1); }
    if (event.key === 'Tab') {
      const focusables = [...lightbox.querySelectorAll('button:not([hidden]):not([disabled])')].filter(el => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  stage?.addEventListener('touchstart', event => { touchStart = event.changedTouches[0]?.clientX ?? null; }, { passive: true });
  stage?.addEventListener('touchend', event => {
    if (touchStart === null) return;
    const distance = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
    if (Math.abs(distance) > 55) setImage(imageIndex + (distance < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
  window.addEventListener('popstate', routeFromHash);
  window.addEventListener('hashchange', routeFromHash);
  routeFromHash();

  function loadMap() {
    const mount = $('portfolio-map');
    if (!mount || !notice) return;
    if (!window.L) {
      notice.textContent = 'نقشه در حال حاضر بارگذاری نشد. گالری پروژه‌ها همچنان در دسترس است.';
      return;
    }
    map = L.map(mount, { scrollWheelZoom: false, zoomControl: true }).setView([36.297, 59.606], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 18
    }).addTo(map);
    const bounds = [];
    let pins = 0;
    projects.forEach((project, index) => {
      if (!Number.isFinite(project.latitude) || !Number.isFinite(project.longitude)) return;
      const point = [project.latitude, project.longitude];
      bounds.push(point); pins += 1;
      const marker = L.circleMarker(point, {
        radius: 10, weight: 2, color: '#ffffff', fillColor: '#d99a55',
        fillOpacity: .95, portfolioIndex: index
      }).addTo(map);
      marker.bindTooltip(project.title, { direction: 'top' });
      marker.on('click', () => openProject(index));
      mapMarkers.push({ marker, index });
    });
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    else if (bounds.length === 1) map.setView(bounds[0], 12);
    notice.textContent = pins ? pins.toLocaleString('fa-IR') + ' موقعیت ثبت‌شده روی نقشه' :
      'مختصات دقیق پروژه‌ها هنوز ثبت نشده؛ نقشه آماده اتصال به شناسنامه‌هاست.';
    notice.classList.toggle('has-markers', pins > 0);
  }
  const mapSection = document.querySelector('.portfolio-map-section');
  if (mapSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); loadMap(); }
    }, { rootMargin: '200px' });
    observer.observe(mapSection);
  } else loadMap();
})();
