# Mojarrad WordPress migration

Status: PHASE 1 FOUNDATION ONLY, not a complete site. The original Next.js source remains at repository root, unchanged.

## Local installation
1. Install WordPress 6.5+ on PHP 8.1+ and MySQL/MariaDB.
2. Copy wordpress/plugins/mojarrad-core to wp-content/plugins/mojarrad-core and activate it.
3. Copy wordpress/themes/mojarrad to wp-content/themes/mojarrad and activate it.
4. Set the WordPress site title, description, navigation menu and permalinks.
5. Create and publish a Project with featured image from WP Admin. Inspect the front page, /projects/ archive and project detail.
6. While logged in, GET /wp-json/mojarrad/v1/me/projects (with WP REST nonce for cookie-auth browser clients).

## Already implemented
- RTL WordPress theme skeleton with homepage, project archive/detail and generic pages.
- Standalone core plugin with public project post type, lifecycle taxonomy, custom non-admin roles, project-membership table, timeline foundation table and a membership-filtered authenticated REST endpoint.
- No seed accounts, no demo passwords, no public project-management APIs.

## Not yet implemented
The original Next.js styling, animations, 3D hero, all 13 page views, full dashboard, private attachments, project timeline editing, comments, invoices, documents, contracts, migrations, functional and security testing, deployment.

DO NOT use this foundation with private customer project data. A secure media layer and complete per-action authorization checks must be implemented and tested first.

See MIGRATION-PLAN.md for inventory, mapping, risks, gates and implementation order. Real SQLite DB was not available in Git.
