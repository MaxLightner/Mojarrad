<?php get_header(); ?>
<section class="container page-top">
  <span class="section-label">چهره‌ها</span><h1 class="page-title">معرفی مسئولین</h1>
  <p class="page-intro muted">مدیران گروه و مسئولان نهادهای مرتبط.</p>
  <?php if(have_posts()): ?><div class="card-grid"><?php while(have_posts()):the_post(); ?>
    <article class="card-lux official-card">
      <?php if(has_post_thumbnail())the_post_thumbnail('thumbnail'); ?>
      <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
      <p class="section-label"><?php echo esc_html(mojarrad_meta('official_role')); ?></p>
      <div class="muted"><?php echo esc_html(wp_trim_words(get_the_content(),30)); ?></div>
    </article>
  <?php endwhile; ?></div><?php the_posts_pagination(); ?>
  <?php else: ?><p class="notice">هنوز اطلاعاتی منتشر نشده است.</p><?php endif; ?>
</section>
<?php get_footer(); ?>
