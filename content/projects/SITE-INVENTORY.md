# Nika Bana — curated public project inventory

Updated: 2026-11-01

The website portfolio currently has **15 named projects**. These names and available facts are explicitly supplied by the site owner. Missing fields are deliberately empty. The two distinct Alimardani 39/5 buildings remain grouped in a **single pending JSON file**, not on the public website inventory.

| External ID | Project | Images held in staging |
| --- | --- | --- |
| nb-0001 | ساختمان بزرگمهر ۹ | 2 AI-assisted images; five floors above ground must be visually verified |
| nb-0002 | ساختمان نبش انوری ۷ | 2 AI-assisted images |
| nb-0003 | ساختمان امام رضا ۶۶ | 1 AI-assisted image |
| nb-0004 | ساختمان کوثر ۱۰ | 1 AI-assisted image |
| nb-0005 | ساختمان امام رضا ۲۷ نبش بوستان ۳ | 5 AI-assisted images |
| nb-0006 | ساختمان امام خمینی ۶۶ | 1 AI-assisted image |
| nb-0007 | ساختمان امام رضا ۶۳ | 1 AI-assisted image |
| nb-0008 | ساختمان امام خمینی ۷۷ | 1 AI-assisted image |
| nb-0009 | پروژه کوهسنگی | Awaiting photos/details |
| nb-0010 | باغ کاهو — پروژه ۱ | Awaiting photos/details |
| nb-0011 | باغ کاهو — پروژه ۲ | Awaiting photos/details |
| nb-0012 | باغ کنگ | Awaiting photos/details |
| nb-0013 | باغ ابراهیم‌آباد | Awaiting photos/details |
| nb-0014 | باغ زشک — پروژه ۱ | Awaiting photos/details |
| nb-0015 | باغ زشک — پروژه ۲ | Awaiting photos/details |

**Editorial distinction:** Publishing a minimal project profile and listing on the website is different from approving an AI-reconstructed image as factual architecture. The public WordPress import manifest initially contains approved location/area/unit/floor figures but no image references; the compressed images stay in staging for review. No person names are included in public manifests unless directly approved for publishing.

**Demo cleanup:** The WordPress release includes an idempotent migration that deletes old showcase fixture posts with legacy markers, demo-image metadata or known original fixture slugs. It never bulk-deletes every unrecognized project. Production deletion happens only once the release is deployed and plugin code executes; a Git commit alone cannot prove deletion from live MySQL.