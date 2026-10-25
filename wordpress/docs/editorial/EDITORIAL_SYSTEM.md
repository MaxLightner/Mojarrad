# NIKABANA Editorial System — approved architecture to implement

Status: implemented in WordPress v0.6.3: first article draft import, SEO metadata, lightweight cover, legacy-post audit, password-authenticated frontend /editorial/ preview, explicitly assigned approver capability, request-changes note, schedule/immediate publish, approval log and revision-hash invalidation for edited scheduled posts. Real cPanel Cron, missed-publication alerting and a strict dedicated writer service account remain to implement. Updated: 2026-10-25 (Asia/Tehran).
Production Git branch: `wordpress`; WordPress plugin: `wordpress/plugins/mojarrad-core`; theme: `wordpress/themes/mojarrad`.
Do not publish, delete, or change public URLs merely because a new GitHub article draft is added.

## Editorial identity

«دیدگاه نیکابنا — مسئله‌های واقعی صنعت ساختمان»

Blog first; news later. Blog is for informed problem framing, evidence, responsible opinion and reports from site practice, not generic SEO filler. Formats:
- طرح مسئله: reveal trade-offs without forcing a final recommendation
- زیر ذره‌بین: compare dated, sourced data
- از دل کارگاه: anonymized authentic incidents, only after factual verification
- دو دیدگاه: clearly attributed arguments and unresolved choices

Core desks: اقتصاد ساخت، واقعیت کارگاه، روابط و مسئولیت‌ها، آینده ساخت، ساخت در مشهد.
Avoid made-up site anecdotes, current price claims without source/date, generic architectural tutorials and AI-generated statements presented as engineer eyewitness accounts.

## Storage boundary and roles

- GitHub stores planning, source article drafts, source notes and versioned WordPress code.
- WordPress DB stores real editable drafts, review status, authors, publication dates and production media. GitHub deployment must never overwrite an edited real WP post.
- The first article exists as GitHub Markdown source and a deployed HTML snapshot under `plugins/mojarrad-core/editorial/`. Its importer runs once, creates a WordPress `draft`, and never overwrites later manual edits. The administrator can copy the private site review URL from the editorial box in the WordPress editor. The reviewer follows `/editorial/?article=POST_ID`, logs in with their provisioned account if necessary, and sees the SAME PHP article template part used on the public single-post page; there is no need to open wp-admin.
- Imported drafts remain private until a WordPress publisher explicitly approves them.
- Ordinary project roles (`moj_engineer`, `moj_supervisor`, `moj_owner` etc.) DO NOT convey editorial publishing permissions.
- Editorial drafting service account: only create/edit designated own drafts via restricted authentication; no publish/delete/users or project-private-data capabilities.
- Editorial approver (e.g. مهندس حسین مجرد): admin ticks «تأیید مقالات نیکابنا» on the designated user's WordPress profile; this assigns user-specific `moj_approve_editorial`, independent of project membership. Administrators also have reviewer access.
- Administrator: manage roles/accounts, override emergency schedule, view audit and migration tools.
- Only the administrator provisions accounts; no public registration/SMS.

## User flow

1. New article enters WordPress as `draft` from prepared GitHub source or authorized editor.
2. Editorial completeness checks: source credibility, geography/date of every statistic, SEO fields, internal link, ownership of imagery, spelling, mobile readability.
3. Mark the article for editorial review (the seeded first draft is already marked). Approver opens a private site URL `/editorial/?article=POST_ID` and previews the exact same article template as the public site. Anonymous visits redirect to the site's username/password login, regular members receive HTTP 403, and successful editorial login returns to that article.
4. Reviewer buttons now implemented: «بازگشت برای اصلاح» with a required note; «تأیید و زمان‌بندی انتشار» with an Asia/Tehran datetime input defaulting to next Thursday 10:00; separate «تأیید و انتشار فوری». Submitted decisions go through a capability-checked, nonce-checked server endpoint and return to the site's reviewer page.
5. Approved post with a future date uses WordPress native `future` status. This is the only status entering public publication queue.
6. Material edits to a scheduled approved post (title, excerpt or body) clear its approval hash and return it to `pending`. WordPress revisions are retained; log reviewer, action, UTC timestamp and scheduled Tehran date. Changes to already-public posts are not automatically unpublished.
7. At release, public `publish` post appears in /blog/ and sitemap. Failed/missed scheduled events alert administrators.

WordPress already has `draft`, `pending`, `future`, `publish`, revisions and preview. Reuse core, do not create duplicate post storage. Review UI and approval enforcement need custom code.

## Reviewer interface /editorial/ (implemented basic approval flow; advanced diagnostics planned)

- Current list view has status-labeled article cards; separate filter tabs remain a design enhancement.
- Current cards show title and publication status. Evidence count, reviewer diff and SEO checklist within the frontend are still planned.
- Detail renders through the same template part as the public article; mobile/desktop toggle remains planned (the page itself is responsive).
- SEO title/meta are editable in wp-admin by the content editor and visible through source HTML; a dedicated frontend snippet/social preview remains planned.
- Approver can return with a required note, approve a Tehran-local future slot, or explicitly publish immediately. Merely viewing the link cannot publish.
- Frontend GET requires a logged-in, designated editorial user; POST decisions check capability + WordPress nonce. The URL carries only the article ID, never a password or publishing token. Anonymous requests redirect to login; other site users get HTTP 403; draft content is never exposed through a public REST response.

## Calendar

Launch: four original reviewed essays over first seven days, distributed 2 day 1, 1 day 3, 1 day 6; not four identical-day uploads.
After launch: one original article each week at a fixed Tehran-local weekday/time (proposed Thursday 10:00); reviewer can change a slot.
Before public launch keep at least six reviewed pieces: four for first week, two in reserve.
Seven high-quality originals are enough for launch; quantity is not a ranking factor. Expand slowly with sourced contributions, not filler.
WordPress WP-Cron may miss a due schedule on a low-traffic site; configure actual cPanel Cron every five minutes to run `wp-cron.php` or WP-CLI cron, monitor missed publications. Deployment polling cron is a DIFFERENT job.

Launch topics:
1. ساختن یا صبر کردن؟ تصمیم دشوار آغاز پروژه در اقتصاد بی‌ثبات (GitHub source: drafts/001-sakhtan-ya-sabr.md)
2. دستمزد و قیمت مصالح: سهم نیروی انسانی از هزینه ساخت واقعاً چه تغییری می‌کند؟
3. ساختمان نیمه‌تمام: هزینه تصمیمی که به تعویق افتاده است
4. چرا برنامه ۱۸ماهه ساخت گاهی سه سال طول می‌کشد؟
5. ناظر ساختمان: مرز مسئولیت فنی و فشارهای اقتصادی
6. آیا ساختمان ساخته‌شده، خریدار بالقوه دارد؟
7. هزینه‌هایی که برآورد اولیه نمی‌بیند

Only #1 is drafted. All other items are editorial queue ideas, not published facts.

## SEO and credibility gate

Each draft must contain:
- immutable short slug, human-readable H1, editable SEO title and meta description;
- one clear user intent/question, original analysis, non-misleading excerpt and logical H2s;
- dated primary sources where possible; other sources explicitly attributed; a fact sheet for numbers including region and time;
- human authorship and reviewer verified; updated date only on substantive change;
- optional contextual links to projects and 2-3 semantically related articles once their URLs exist;
- single canonical, correct BlogPosting JSON-LD author/publisher/date/image, OG image and Twitter card;
- valid article image with copyright permission and meaningful alt text;
- no `noindex` on published originals; private review pages/search/member pages excluded from index;
- WordPress sitemap, Search Console verification, indexing checks and monthly query/page performance review.

WordPress theme now provides baseline titles, editable post-level SEO fields, descriptions, OG/BlogPosting, genuine byline mapping and sitemap suppression for the reviewer page; external search performance monitoring still needs Search Console setup. If an SEO plugin takes over output, emit only one coherent set to avoid duplicate OG/schema/canonicals.
Target lightweight imagery: vector where possible, responsive WebP/AVIF for photos, typical article thumbnails ideally under ~100 KB and hero ideally under ~200 KB when visual quality permits; use srcset/sizes; lazy below fold, preload only LCP image. These are optimization targets not fixed validation limits.

## Existing sample/legacy material: explicit migration policy

`Mojarrad_Starter_Content::import_once()` created 8 production `post` articles with meta `_mojarrad_legacy_import = 2026-10-21`, plus 3 `moj_news` records and a set of project showcase records; this is distinct from `demo/demo-seed.php`, which is Playground only.
The 8 blog slugs/titles:
- heblex-walls — راهنمای انتخاب و اجرای بلوک AAC
- electrical-rough-in — هماهنگی تأسیسات برق پیش از نازک‌کاری
- waterproofing-detail — چک‌لیست آب‌بندی سرویس‌ها و بام
- facade-execution — چطور نمای ساختمان را برای اجرا آماده کنیم؟
- project-timeline — گزارش پیشرفت ساختمانی چه ویژگی‌هایی دارد؟
- terrace-landscape — جزئیات اجرایی تراس و فضای باز ویلا
- architecture-structure — هماهنگی معماری و سازه در اجرا
- construction-estimate — از متره تا برآورد؛ نگاه کاربردی به هزینه ساخت

These posts are real public imported records. Do not conflate with the project's real data or unconditionally delete them. Proposed:
1. In WordPress admin Posts, use the added «ورودی‌های قدیمی نیکابنا» filter to inspect the eight marked posts. Inventory the live WP database by post type + exact legacy meta + status, title, permalink, update history, search performance.
2. Compare each with any human edits after migration and assign Keep/Rewrite/Draft/Redirect.
3. Review with engineer. Preserve revisions, IDs, media and a DB backup. Move generic legacy articles to draft **after approval**, not trash; if a published URL has organic traffic or inbound links, prepare 301 only to a genuinely equivalent new article; otherwise 404/410 or keep as archival, case-by-case.
4. Do not bulk unpublish `moj_project` or `moj_news` as a side effect of blog cleanup; handle separately.
5. Implemented in v0.6.2: `page-blog.php` now selects `_moj_editorial_featured=1` nonlegacy published articles, then falls back to latest nonlegacy published article. The field is editable in the WordPress post editor. Old imported content is no longer the permanent featured story.
6. The public landing still lists all published posts, including legacy posts, until the editor deliberately moves selected posts to draft. Never silently rewrite/depublish existing records through GitHub deployment.

## Acceptance tests before publishing panel goes live

- No unauthenticated preview, pending body or sources leak through page, REST, feeds or search.
- Draft creator cannot approve; project supervisor role alone cannot publish.
- Approval revision hash/version locks; edit after approval requires re-approval.
- Invalid/expired nonce and cross-user access fail.
- Dates use Asia/Tehran WP timezone; schedule survives an unattended low-traffic hour.
- Indexable article has unique title/description/canonical/schema; draft never appears in sitemap.
- Preview matches public rendering and is legible on mobile.
- Original URLs retain permalinks and legacy posts are not removed without explicit selection.
- Cron failure/missed schedule is logged and shown to administrator.

## Operational separation

GitHub commit/deploy updates PHP/CSS/JS, not production content records. Save draft text in GitHub for traceability, but use WordPress as the publishing authority. The reviewer authorizes a WP publication in the WP database, never a GitHub push. Never place login credentials or private project data in drafts.
