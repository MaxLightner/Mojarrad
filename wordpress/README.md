# Nika Bana / Mojarrad WordPress

WordPress theme and supporting plugin live under `wordpress/themes/mojarrad` and `wordpress/plugins/mojarrad-core`. The prior Next.js site on `main` remains unchanged.

## Public design release — 0.6.0

The theme now includes:
- Photography-led homepage, detailed project and gallery layouts, related projects and editorial portfolio archive.
- Full About, Blog, news, sale, collaboration, consulting and people pages in Persian RTL.
- Featured blog story, article pages, category links, responsive mobile styling and reduced-motion support.
- The existing secure project-office/timeline infrastructure stays intact.

The plugin imports **missing** public material once when v0.6 is installed or upgraded: 8 portfolio projects, 8 evergreen technical articles, 3 editorial updates, and the About copy. It checks each slug and **never overwrites** existing customer posts, documents, users or membership data. Imported posts carry `_mojarrad_legacy_import` metadata for editorial review. Original demo accounts, fictional staff/public-officials, market-price news, time-sensitive news, unverified active sale offers, and sale prices are intentionally excluded. This is a curated public-content migration from the prior **demo seed**, not a verified real-world database migration; the site owner must validate project attribution, dates, area and current status.

## Upgrade an installed WordPress site

1. Back up WordPress database and `wp-content` on your host.
2. Replace or upgrade `wp-content/plugins/mojarrad-core` using the folder in this branch; keep the plugin activated.
3. Replace or upgrade `wp-content/themes/mojarrad` and activate it.
4. Open the home page once so the versioned one-time import runs. Confirm projects, blog and news are populated.
5. Verify imported project facts in **Projects** and editorial content in **Posts / News** before declaring it a production factual record. The public templates do not present historic in-progress estimates as real-time values.

No CLI or Next.js process is required on the WordPress host.

## Browser preview

Open the [v6 Playground blueprint](https://playground.wordpress.net/?blueprint-url=https%3A%2F%2Fraw.githubusercontent.com%2FMaxLightner%2FMojarrad%2Fwordpress%2Fwordpress%2Fplayground%2Fblueprint-v6.json). It installs the current plugin/theme and selected public content without sample user identities. Older v5 demo is retained for private-module testing.

## Project and editing workflow

- Edit projects at **WP Admin → Projects**. Cover can be a WP featured image; gallery via WP media selector.
- Edit technical articles at **Posts** and updates at **News**.
- About copy is editable from **Pages → About**.
- The public content import does not alter manually edited existing items; edit originals normally after import.
- Production private files must stay outside the public media library, as described in the existing security notes.

## Verification

- PHP and JavaScript lint workflows under `.github/workflows`.
- WordPress Playground v6 checks the content types and seed counts.
- Validate layout in both mobile and desktop browsers on the target WordPress host before launch.
