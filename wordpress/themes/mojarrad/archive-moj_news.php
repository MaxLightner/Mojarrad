<?php get_header(); ?>
<section class="container page-top">
  <span class="section-label">بازار و سیاست</span><h1 class="page-title">آخرین اخبار</h1>
  <p class="page-intro muted">بازار مصالح، قوانین ساخت‌وساز و اخبار گروه ساختمانی.</p>
  <?php if(have_posts()): ?><div class="card-grid"><?php while(have_posts()):the_post();mojarrad_render_editorial_card();endwhile; ?></div>
    <?php the_posts_pagination(); ?>
  <?php else: ?><p class="notice">هنوز خبری منتشر نشده است.</p><?php endif; ?>
</section>
<?php get_footer(); ?>
