<?php /* Template Name: About Nika Bana */ get_header(); ?>
<section class="container page-top">
  <span class="section-label">درباره ما</span><h1 class="page-title">ساختنِ اعتماد — مهندس حسین مجرد</h1>
  <p class="page-intro muted">گروه ساختمانی نیکا بنا با رویکرد نظم، کنترل کیفیت و شفافیت در اجرای پروژه‌های ساختمانی.</p>
  <div class="facts">
    <div class="fact"><h2>شفافیت با مالک</h2><p class="muted">ثبت روند اجرا و گزارش‌های منظم پروژه.</p></div>
    <div class="fact"><h2>پایبندی به زمان‌بندی</h2><p class="muted">پیگیری مرحله‌ای روند اجرا و مستندسازی تأخیرها.</p></div>
    <div class="fact"><h2>کیفیت اجرا</h2><p class="muted">کنترل مصالح، ایمنی و جزئیات اجرایی.</p></div>
  </div>
  <div class="article prose">
    <?php while(have_posts()):the_post();the_content();endwhile; ?>
  </div>
  <a class="btn-gold" href="<?php echo esc_url(mojarrad_link('projects')); ?>">مشاهده پروژه‌ها</a>
</section>
<?php get_footer(); ?>
