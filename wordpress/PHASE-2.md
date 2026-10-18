# Phase 2 implementation — public website and editorial backend
Date: 2026-10-18. Status: code committed for review. NOT install-tested or deployed.

Implemented
- Responsive RTL public template system reproducing the source sections: large image-led hero, brand/navigation, quick links, project cards, sales, news and blog teasers, footer.
- Header mobile menu and theme switcher (navy/dark/light/pastel). No heavy runtime dependencies.
- 49 original bundled images/fonts/logo files copied by original Git blob SHA to assets/, including Vazirmatn, with original Next.js originals retained.
- Project post type with editable subtitle, location, area, year, status, progress, dates, for-sale flag, price, description, featured image and multiple gallery attachment IDs.
- Lifecycle statuses (in-progress/completed/future) created when plugin activates.
- Public project archive grouped by status, single in-progress project with progress, completed project gallery, sale page/CTA.
- Public news and officials content types, WordPress-native blog, dedicated about/consulting/collaborate and editorial templates.
- Server-side POST lead handler stores private admin-only records; nonce, validation, honeypot and basic IP throttling. No public read endpoints.
- Activation adds missing route pages without overwriting existing pages.

Known gaps before Phase 2 can be accepted
- No actual WordPress/PHP runtime test in this environment. PHP lint and integration tests required.
- Original WebGL 3D hero, cinematic Framer Motion animations, and exact pixel-level UI parity are not yet implemented. Hero is an original static project photo.
- Public project and article data are NOT automatically imported. Existing demo records remain only in Prisma seed.
- All legal/factual claims and contact details in the historical source site must be confirmed before publication.
- Project detail has no operational private timeline/dashboard link until Phase 3.
- Import/mapping (including media attachment IDs) and responsive visual comparison are pending.
- New pages are created only when the plugin is first activated; if it was already active at v0.1, temporarily deactivate/reactivate after taking a backup, or create pages manually and assign their templates.
- No staging host was provided; this is a source-level implementation.

Remaining roadmap
1. Phase 2 acceptance: run PHP lint/WordPress smoke tests; import approved public content; tune 3D/animations and visual fidelity.
2. Phase 3A: project membership administration and role-specific dashboard with per-project access tests.
3. Phase 3B: timeline, reports, images, comments, moderation, reference versioning, private files.
4. Phase 3C: contracts, payments, documents, teams, archive/recovery.
5. Phase 4: security/regression/performance QA, migration/backups, packaging and production deployment.

Safety: do not upload private contracts/payments or real customer documents into public WordPress Media Library. Keep private API endpoints disabled until ACL is tested.
