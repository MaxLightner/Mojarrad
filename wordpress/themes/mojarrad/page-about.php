<?php /* Template Name: About Nika Bana */ get_header(); ?>
<section class="editorial-hero about-hero">
  <div class="editorial-hero-image"><img src="<?php echo esc_url(mojarrad_asset('images/cons-1.jpg')); ?>" alt="جزئیات یک پروژه ساختمانی" fetchpriority="high"></div>
  <div class="editorial-wash"></div>
  <div class="container editorial-hero-content">
    <span class="editorial-index">NIKA BANA <span> / </span> درباره ما</span>
    <span class="section-label">درباره گروه</span>
    <h1>ساختنِ فضا.<br><em>ساختنِ اعتماد.</em></h1>
    <p>گروه ساختمانی نیکا بنا به مدیریت مهندس حسین مجرد؛ روایتی از معماری، اجرا و توجه به جزئیاتی که کیفیت یک ساختمان را می‌سازند.</p>
    <a href="#our-story" class="btn-outline glass">با رویکرد ما آشنا شوید <span aria-hidden="true">↓</span></a>
  </div>
  <div class="editorial-hero-bottom container"><span>مشهد، ایران</span><span>معماری / ساخت / مدیریت پروژه</span></div>
</section>

<section class="container editorial-story" id="our-story">
  <div class="story-caption"><span class="section-label">01 — نگاه ما</span><div class="story-rule"></div><span class="micro-label">DESIGN × BUILD</span></div>
  <div class="story-body">
    <h2>از اولین خط روی نقشه<br>تا آخرین جزئیات اجرا.</h2>
    <p>ما ساخت‌وساز را مجموعه‌ای از تصمیم‌های پیوسته می‌دانیم. انتخاب مصالح، هماهنگی نقشه‌ها، کیفیت اجرا و مستندسازی کارگاه باید در یک مسیر روشن به یکدیگر متصل باشند.</p>
    <?php while(have_posts()):the_post(); if(trim(wp_strip_all_tags(get_the_content()))): ?>
      <div class="prose about-intro"><?php the_content(); ?></div>
    <?php endif; endwhile; ?>
    <a class="text-link" href="<?php echo esc_url(mojarrad_link('projects')); ?>">نمونه پروژه‌ها را ببینید ←</a>
  </div>
</section>

<section class="container split-photo-section">
  <div class="split-photo-stack">
    <img class="split-photo-primary" loading="lazy" src="<?php echo esc_url(mojarrad_asset('images/villa-z-1.jpg')); ?>" alt="نمای ویلای کوهستانی">
    <img class="split-photo-secondary" loading="lazy" src="<?php echo esc_url(mojarrad_asset('images/cons-n-2.jpg')); ?>" alt="روند اجرای پروژه">
  </div>
  <div class="split-photo-copy">
    <span class="section-label">02 — شیوه کار</span>
    <h2>زیبایی زمانی ارزشمند است که <em>در اجرا هم دوام بیاورد.</em></h2>
    <p>هر پروژه با شرایط زمین، بودجه، نیاز مالک و محدودیت‌های فنی متفاوتی آغاز می‌شود. وظیفه تیم اجرا این است که تصمیم‌های طراحی را به جزئیات قابل ساخت و قابل کنترل تبدیل کند.</p>
    <div class="numbered-principles">
      <div><span>01</span><strong>هماهنگی پیش از اجرا</strong><p>بررسی تداخل‌های معماری، سازه و تأسیسات پیش از آنکه به دوباره‌کاری تبدیل شوند.</p></div>
      <div><span>02</span><strong>کنترل جزئیات</strong><p>توجه به مصالح، زیرسازی، اتصالات و تحویل هر مرحله با کیفیت قابل ارزیابی.</p></div>
      <div><span>03</span><strong>مستندسازی شفاف</strong><p>ثبت اطلاعات و رویدادها برای ارتباط دقیق‌تر میان مالک و عوامل پروژه.</p></div>
    </div>
  </div>
</section>

<section class="editorial-values-band">
  <div class="container">
    <span class="section-label">آنچه برای ما مهم است</span>
    <div class="values-grid">
      <article><span class="value-number">01</span><h3>شفافیت</h3><p>اطلاعات روشن از روند کار و تصمیم‌های مهم پروژه.</p></article>
      <article><span class="value-number">02</span><h3>هماهنگی</h3><p>گفت‌وگوی مؤثر میان طراح، مجری، ناظر و مالک.</p></article>
      <article><span class="value-number">03</span><h3>کیفیت</h3><p>توجه به نقاط حساس اجرا و ثبت نتیجه کنترل‌ها.</p></article>
      <article><span class="value-number">04</span><h3>مسئولیت</h3><p>پیگیری تصمیم‌ها تا رسیدن به نتیجه قابل تحویل.</p></article>
    </div>
  </div>
</section>

<section class="container editorial-contact">
  <div><span class="section-label">ادامه یک گفت‌وگو</span><h2>پروژه بعدی می‌تواند از یک <em>گفت‌وگوی دقیق</em> آغاز شود.</h2></div>
  <a class="btn-gold btn-large" href="<?php echo esc_url(mojarrad_link('consulting')); ?>">درخواست مشاوره <span aria-hidden="true">↖</span></a>
</section>
<?php get_footer(); ?>