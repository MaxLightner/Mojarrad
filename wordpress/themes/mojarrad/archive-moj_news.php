<?php get_header(); ?>
<section class="editorial-page-heading container">
  <div><span class="editorial-index">NIKA BANA / UPDATES</span><span class="section-label">خبرها و یادداشت‌ها</span><h1>از دفتر فنی <em>تا کارگاه.</em></h1></div>
  <p>خبرها، یادداشت‌های کوتاه و موضوعاتی که به تصمیم‌گیری دقیق‌تر در پروژه‌های ساختمانی کمک می‌کنند.</p>
</section>
<section class="container editorial-archive">
  <?php if(have_posts()): ?><div class="card-grid journal-grid"><?php while(have_posts()):the_post();mojarrad_render_editorial_card();endwhile; ?></div><nav class="archive-pagination"><?php the_posts_pagination(); ?></nav>
  <?php else: ?><div class="archive-empty"><h2>مطالب این بخش در حال آماده‌سازی است.</h2><a href="<?php echo esc_url(mojarrad_link('blog')); ?>" class="text-link">مطالعه مجله فنی ←</a></div><?php endif; ?>
</section>
<?php get_footer(); ?>