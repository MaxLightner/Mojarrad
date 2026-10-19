# WordPress version — installation and outstanding release conditions

## Current code, source and one-click demo
- Main Next.js source is kept on the main branch.
- The independent WordPress implementation is in wordpress/ on branch wordpress.
- Public theme: wordpress/themes/mojarrad/
- Functional backend: wordpress/plugins/mojarrad-core/
- Blueprint v5 installs both and creates **demonstration-only** project, financial, reference, document and timeline data:
  https://playground.wordpress.net/?blueprint-url=https%3A%2F%2Fraw.githubusercontent.com%2FMaxLightner%2FMojarrad%2Fwordpress%2Fwordpress%2Fplayground%2Fblueprint-v5.json

## Installing on hosting / WordPress
Download artifact **mojarrad-wordpress-installers** from the latest successful GitHub workflow
"Package Installable WordPress Theme and Plugin" on branch wordpress. It contains:
- mojarrad-core.zip (production plugin without demonstration fixtures)
- mojarrad-theme.zip
- SHA256SUMS

In WordPress admin, Plugins > Add Plugin > Upload Plugin -> mojarrad-core.zip -> Install and Activate.
Next Appearance > Themes > Add Theme > Upload Theme -> mojarrad-theme.zip -> Install and Activate.

PHP 8.1+, MySQL/MariaDB, WordPress 6.5+, extensions mysqli, fileinfo, mbstring, zip, GD recommended. HTTPS mandatory in production.

Set a **private storage directory outside ALL web document roots** in wp-config.php:
define('MOJARRAD_PRIVATE_DIR', '/absolute/non-public/path/mojarrad-private');

Ensure the PHP process can write to it. Public WordPress Media Library MUST NOT be used for confidential project documentation.

The plugin never seeds customer accounts in production. Admin must create each account, assign its role (Owner, Engineer, Foreman, Contractor, Supervisor, Executor), then go to Projects > Edit > Project Members and explicitly assign access.

From dashboard project cards, navigate to Timeline or Project Office. Section tabs are permission-filtered; all API methods enforce role and project membership server-side.

## Implemented in code
- Public RTL pages, news/blog, project details, filtered property sales, officials, forms.
- Native WordPress authentication, role-based dashboard and project membership.
- Project timeline with official reports, stage boundaries, recipient-scoped comments, follow-ups, photo/PDF moderation and private download.
- References with revisions and comments, documents with revisions/private files, payment receipts with financial timeline records, contract status, workers, management contact book.
- Admin-only private ZIP project snapshots containing DB records and stored project evidence. Snapshot creation verifies ZIP checksums; never automatically deletes the live project.
- Project office financial fields validated, role-scoped APIs, audit log table and soft deletion.
- GitHub Actions PHP/JS lint, real WordPress/MySQL integration and mobile browser tests.

## Not represented as finished production features
- Automatic restoration of an archive into the live database: not yet offered, because a safe restore needs mapping users/IDs, conflict handling, file verification, rollback and tests.
- Legacy Next.js SQLite/customer data import: the original runtime SQLite database has not been provided to this repository.
- Real server configuration and deployment: no staging/production host credentials available.
- Security hardening beyond smoke tests (external audit, full backups, restore drills, malware scanning and retention policy), privacy/legal compliance.
- Full visual parity, image annotation editor, push notifications and Persian date picker.
- Archive export includes WordPress project records and private vault evidence; **a complete server backup must also separately include public WordPress uploads and the full WordPress MySQL database**.
- Playground is a sandbox and not persistent production hosting.

Do not publish real financial data until credentials, storage, hosting HTTPS, backup/restore and permission audit are verified.
