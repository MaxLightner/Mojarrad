# Mojarrad Next.js to WordPress — audited roadmap
Audit date: 2026-10-18. Baseline: main; 13 view components; 24 API route.ts files; Prisma schema; roles and permissions.
Target: deployable WP theme + custom plugin on standard PHP/MySQL host, independent from Next.js, Prisma and SQLite.
Current state: phase 1 scaffold only. No functionality or visual parity claims.

## Screens and mapping
- home → custom front page; about → WP Page.
- projects, project-detail, sale → moj_project post type, archive, single and sale filter.
- timeline-view, dashboard → new project-aware authenticated dashboard powered by secure WP REST endpoints.
- news, blog → WP posts / editorial types with editor and taxonomy.
- officials → structured staff/official type.
- consulting, collaborate → validated public forms and private lead records.
- login → WordPress native password/session management with branded login UI.
Visual parity inventory: site header/footer, 3D hero, page transitions, theme switcher, fonts, images, responsive styling, full timeline and role-specific widgets. Source hash navigation must become permalink navigation.

## API inventory — 24 existing route files
- auth, admin/users → WP identities/roles and project membership.
- projects, projects/[slug], admin/projects → public projects and privileged editing.
- timeline, updates, comments, uploads → stages, events, reports, photos/approval and follow-ups.
- references, references/message → versioned project references and discussions.
- payments, contract → access-restricted financial ledger and terms.
- documents, workers, contacts → records restricted by project and role.
- projects/[slug]/archive → verified restorable backup before record deletion.
- requests → lead submission, spam prevention, validation.
- blog, admin/blog, news, admin/news, officials, admin/images → content management.
Original README says dependencies were not installed nor behavior tested as part of uploading the Next.js version. Backend code presence is not a proof of an operating backend.

## Roles and authorization
Original admin → WordPress administrator; executor → moj_executor; engineer → moj_engineer; foreman → moj_foreman; supervisor → moj_supervisor; owner → moj_owner; contractor → moj_contractor.
Original rule: admin/executor see all projects; all others require per-project assignment. New membership table moj_project_access serves this.
Original policy to reproduce and test:
- Owner and supervisor: only official timeline reports; supervisor gets no payments or comments.
- Financial records: only administrator, executor and assigned owner.
- Comments audience: management, team, owner, contractor; author exception; individual follow-up resolution policy.
- References edits: administrator, executor, assigned owner.
- Documents viewing: administrator, executor, assigned engineer/foreman/owner/supervisor. Restrict writes further.
- Project archive and user administration: administrator only.
All private read AND write endpoints must check both authenticated role and project membership. Front-end hiding is never authorization.

## Data model
WordPress CPT moj_project + taxonomy moj_project_status for public content. WP native users/posts for identities/editorial.
Custom DB tables: user-project assignment and project timeline events (created in this scaffold).
Future versioned tables: comments/follow-up, file approvals, references/messages, payments, contracts, documents, workers, contacts, leads, archives, audit trail.
Sensitive uploads must be outside publicly retrievable media paths and be downloaded through permission-checked handlers. Avoid storing private files in public WP media library.

## Risks from original code
- Prisma seed has known demo credentials: NEVER migrate the seeded passwords.
- Original protected route files may point to world-readable URLs in public/uploads.
- Fast salted SHA-256 password hashing should be replaced by native WordPress authentication.
- Next build ignores TypeScript errors; existing behavior needs regression tests.
- SQLite db/custom.db and .env are not in Git; no verified live-data migration is possible yet.
- Old archive operation deletes source project after ZIP; verify restorability, durable backup and consistency before deletion.

## Milestones / acceptance criteria
PHASE 1 [foundation]
[x] screen/API inventory and permission mapping
[x] independent theme/plugin and activation hooks
[x] project post type and lifecycle taxonomy
[x] project-access and timeline DB tables
[x] authenticated project-filtered read endpoint
[ ] install, lint and smoke test on local WordPress (not executed here)

PHASE 2 [public site]
[ ] original visual components and images, responsive parity, accessibility
[ ] project fields and galleries, sales, editorial, officials, forms
[ ] content import and image mapping

PHASE 3 [private backend]
[ ] assignment UI; full role-based dashboard
[ ] timeline and event/stage/report CRUD with ACL; comments/followups and approvals
[ ] financials, contracts, staff, documents, reference revisions, private downloads
[ ] per-role and cross-project security tests
[ ] immutable audit events, safe archival/restoration and automated backups

PHASE 4 [production]
[ ] staging install test; PHP lint, WP coding standards, functional tests
[ ] nonce/CSRF and uploads validation; rate limiting; performance and mobile QA
[ ] complete deployment, migrations, theme/plugin ZIP exports, rollback test

Keep the original main branch untouched. Do not deploy this incomplete skeleton in place of the existing site.
