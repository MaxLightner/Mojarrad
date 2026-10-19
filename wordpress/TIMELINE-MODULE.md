# Mojarrad Core v0.4 — Timeline module

WordPress route: /timeline/?project=ID (requires authentication and project assignment).

## Implemented
- Project timeline with point events, start/end stage records and matching stage labels; stage rows become official reports automatically.
- Admin, executor, engineer and foreman create events; admin/executor may modify or soft-delete other events. Engineers and foremen modify only their own.
- Owner and supervisor see only formal reports; supervisor sees no comments, messages or financial events. Members with other roles do not see financial events.
- Event comments have management/team/owner/contractor scopes and optional follow-up. Author, executor or admin can resolve and reopen follow-ups.
- Private JPG/PNG/WebP/PDF evidence per event, including optional images attached to comments; non-manager uploads require approval.
- Admin/executor moderation and restoration of soft-deleted events.
- Login/session + WordPress REST nonce; per-project permission checks on every endpoint and every private download.

## REST endpoints (all require WordPress authentication)
- GET, POST: /wp-json/mojarrad/v1/projects/{id}/timeline
- PATCH, DELETE: /wp-json/mojarrad/v1/timeline/{id}
- PATCH: /wp-json/mojarrad/v1/timeline/{id}/restore
- POST: /wp-json/mojarrad/v1/timeline/{id}/comments
- PATCH: /wp-json/mojarrad/v1/comments/{id}/resolve
- POST multipart: /wp-json/mojarrad/v1/timeline/{id}/media
- PATCH: /wp-json/mojarrad/v1/media/{id}/moderate
- GET admin-post.php?action=mojarrad_private_media&media_id={id}&_wpnonce={nonce} for authenticated download.

## Schema and hosting safety
- Schema v2 is additive: project membership, events with soft deletion/stage group, comments and private-media records.
- Set define('MOJARRAD_PRIVATE_DIR','/srv/private/nikabana-files'); in wp-config.php to an absolute folder outside every web document root. If vault resolution finds a web path, uploads fail closed.
- Uploads capped at 6 MB/file, 40 files/user/hour and 80 files/event. Filenames randomized; MIME validated; private content is never published to WordPress Media Library.
- For production configure backups, malware scanning, file retention and secure hosting. Private media is not accessible through a public uploads URL.

## Verified / tests
- GitHub CI checks PHP/JS syntax and runs real WordPress + MySQL.
- demo/timeline-smoke.php exercises roles and cross-project privacy for timeline, stages, comments, follow-up, editing, deletion.
- HTTP integration workflow also checks real authenticated routes, contact submissions, upload/download and image moderation.
- Responsive browser test covers 320–1365px and signed-in owner timeline at 375px.

## Remaining limitations
- Detailed annotated-image editor (drawing arrows on photos), notifications, audit journal and external backup are not yet implemented.
- Finance/payment actions are reserved for the future finance module.
- Form dates use Gregorian input; display dates are formatted in the Persian calendar.
- The stage summary represents loaded events; pagination fetches older events.
- Historical SQLite records have not yet been imported. Demo events are not real site activity.
- Do not deploy with real confidential documents until hosted storage, backup and permission regression have been tested in the target environment.
