# Mojarrad / Nika Bana — independent WordPress implementation

This folder is the WordPress version. The original Next.js project on the main branch remains unchanged.

## Install locally
- WordPress 6.5+, PHP 8.1+, MySQL/MariaDB.
- Copy plugins/mojarrad-core -> wp-content/plugins/mojarrad-core and activate.
- Copy themes/mojarrad -> wp-content/themes/mojarrad and activate.
- Plugin activation/automatic version upgrade registers content types and creates About, Blog, Sale, Consulting, Collaborate, Login and Dashboard pages (existing pages are preserved).
- Go to /wp-admin/edit.php?post_type=moj_project to manage projects. Set title/content, status taxonomy, cover image, project metadata and gallery.
- Admin creates real accounts at Users > Add New and assigns one of six project roles. In project editor > Access project members, check users to grant scoped access.
- Users log in at /login/ and visit /dashboard/.

## One-click Playground
Open the v3 Blueprint:
https://playground.wordpress.net/?blueprint-url=https%3A%2F%2Fraw.githubusercontent.com%2FMaxLightner%2FMojarrad%2Fwordpress%2Fwordpress%2Fplayground%2Fblueprint-v3.json

Playground auto-installs, activates and seeds 9 demo projects, 5 news items, 6 blog posts and sample role users. Demo user passwords are random; to test individual accounts, reset via WP Admin > Users. The dashboard indicates whether the Playground membership/API checks passed.

## Automated checks
- .github/workflows/wordpress-lint.yml — all PHP files and browser JS syntax.
- .github/workflows/wordpress-hero.yml — bundles original-style construction animation using Three.js into a local asset. The 2D fallback remains if WebGL is unavailable.
- .github/workflows/wordpress-smoke.yml — boots a real WordPress/MySQL environment and verifies plugin/theme activation, content fixture, roles and cross-project REST ACL.
- .github/workflows/wordpress-images.yml — optimized 42 JPG assets from 19.46 MB to ~6.05 MB.

## Scope delivered in stages 1–3
- WordPress-powered RTL public pages, multiple theme colors, native blog/news/official editor, sales, consultation and collaboration lead forms.
- Working WordPress users/auth, six construction roles + built-in admin, project assignment via admin metabox and member dashboard with membership-scoped project list.
- Read-only /wp-json/mojarrad/v1/me and /wp-json/mojarrad/v1/me/projects endpoints with WordPress REST cookie+nonce authorization.
- Browser-loadable real Three.js hero with safe static fallback.

## Not yet delivered
- Detailed pixel-by-pixel browser visual comparison against the Next.js site, animation effects other than the hero, accessibility/performance QA on real devices.
- Full construction timeline, project reports and follow-ups, comments, reference versioning, private files, contracts, financial ledgers, staff roster and archives.
- Production domain/hosting deployment, old database migration, live client data.

Private features are deliberately absent or labeled "under development" in the dashboard; they are not misleading clickable controls. Do not put private customer documents in the public WordPress media library.
