<?php get_header(); ?>
<section class="editorial-page-heading container"><div><span class="editorial-index">NIKA BANA / ARTICLES</span><span class="section-label">مجله و یادداشت‌ها</span><h1>دیدگاه‌های <em>اجرایی.</em></h1></div><p>یادداشت‌های کوتاه و بلند درباره مصالح، جزئیات ساخت و معماری.</p></section>
<section class="container editorial-archive">
  <?php if(have_posts()): ?><div class="card-grid journal-grid"><?php while(have_posts()):the_post();mojarrad_render_editorial_card();endwhile; ?></div><nav class="archive-pagination"><?php the_posts_pagination(); ?></nav>
  <?php else: ?><div class="archive-empty"><h2>مطلبی در این بخش یافت نشد.</h2><a href="<?php echo esc_url(home_url('/')); ?>" class="text-link">صفحه اصلی ←</a></div><?php endif; ?>
</section>
<?php get_footer(); ?>