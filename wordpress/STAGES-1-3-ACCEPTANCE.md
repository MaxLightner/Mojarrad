# Delivery and acceptance: stages 1–3

Completed in source:
1. Core plugin wiring: CPTs project/news/official/leads, role setup, project lifecycle, metadata editor, gallery selector, server-side lead form handlers, automatic upgrade without reactivation or destructive seed.
2. Public design: original 49 visual files (42 JPG optimized), Persian Vazirmatn/RTL and theme palette, 9-floor Three.js hero with pause / reduced motion / theme handling / fallback; public pages, header/footer, project category/archive/single/gallery, sales, news/blog/officials.
3. Membership dashboard: native WordPress sessions, frontend login form, user and project membership admin pages, per-role sidebar and cards, restricted project list, global administrator/executor behavior, scoped read REST endpoints and admin-only user assignment.

Automated evidence:
- WordPress PHP/JS Syntax Check (GitHub Actions).
- Three.js hero npm/esbuild production bundle (GitHub Actions).
- WordPress Real Install / ACL Integration (real WordPress/MySQL, demo members and cross-project data access test).

These gates are NOT yet satisfied:
- Browser screenshot visual parity against the original React site; accessibility at several viewport sizes.
- Authenticated browser HTTP login/logout workflow verification (GitHub integration job may be extended for this).
- Complete functional tests of form submission and editor gallery, and quality of 3D on different browsers/GPUs.
- Features in stages 4–6 (timeline, documents/payments, production).

This scope must not be equated with production completion. Stages 1–3 are feature foundations with working account access; private project-management operations are deliberately deferred.
