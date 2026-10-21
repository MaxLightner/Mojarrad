<?php get_header(); ?>
<section class="container not-found-page">
 <div class="not-found-number">404</div><div><span class="section-label">مسیر ناتمام</span><h1>این صفحه در نقشه ما نیست.</h1><p>ممکن است نشانی عوض شده باشد یا این بخش دیگر در دسترس نباشد. از صفحه اصلی یا آرشیو پروژه‌ها مسیرتان را ادامه دهید.</p><div class="button-row"><a class="btn-gold" href="<?php echo esc_url(home_url('/')); ?>">صفحه اصلی ←</a><a class="btn-outline" href="<?php echo esc_url(mojarrad_link('projects')); ?>">پروژه‌ها</a></div></div>
</section>
<?php get_footer(); ?>