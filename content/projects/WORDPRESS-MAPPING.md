# نگاشت داده پروژه به WordPress

نوع محتوا: `moj_project`، طبقه‌بندی وضعیت: `moj_project_status`. این سند قرارداد **ورود آینده** است؛ در این شاخه هیچ importer اجرا نمی‌شود.

| داده آرشیو GitHub | مقصد WordPress |
| --- | --- |
| `id` | متای شناسه خارجی ثابت `_moj_external_id` برای جلوگیری از رکورد تکراری (در importer آینده) |
| `title`, `slug` | `post_title`, `post_name` |
| `summary`, `description` | `post_excerpt`, `post_content` |
| `details.status` | taxonomy `moj_project_status` (`completed`, `in-progress`, `future`) |
| `subtitle` | `moj_subtitle` |
| `details.public_location` | `moj_location` |
| `details.area_m2` | `moj_area` با واحد مترمربع در نمایش |
| `details.year` | `moj_year` |
| `details.status_description` | `moj_status` |
| `details.start_date`, `details.end_date` | `moj_start_date`, `moj_end_date` |
| `details.progress_percent` | `moj_progress`، فقط اگر عدد معتبر باشد |
| `sale.for_sale` | `moj_for_sale` |
| `sale.price`, `sale.description` | `moj_sale_price`, `moj_sale_description` |
| `media.cover` | تصویر شاخص WordPress attachment |
| `media.gallery` | تصاویر کتابخانه رسانه و `moj_gallery_ids` |

فیلدهای `details.kind`، `services`، `features`، `seo` بعداً در متن معرفی یا متادیتای متناسب منتقل می‌شوند؛ برای آنها مقصد اجرایی فعلاً پیاده‌سازی نشده است.

قواعد انتشار آینده:

- تا زمانی که کاربر فرمان نهایی نداده، هیچ import، تغییر `post_status`، انتشار در سایت یا همگام‌سازی خودکار انجام نشود.
- importer آینده فقط رکوردهای تاییدشده را پردازش کند و ابتدا `draft` بسازد؛ ارتقا به `publish` فرمان جداگانه می‌خواهد.
- عکس بدون `approved_for_public_use=true` نباید روی سایت عمومی منتقل شود.
- پروژه‌های خصوصی، رویدادهای تایم‌لاین و اسناد «دفتر پروژه» **جزء این آرشیو عمومی نیستند**.
