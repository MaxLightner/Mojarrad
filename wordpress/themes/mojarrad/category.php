<?php get_header(); ?>
<section class="editorial-page-heading container">
  <div><span class="editorial-index">NIKA BANA / TOPICS</span><span class="section-label">موضوعات مجله</span><h1><?php single_cat_title(); ?></h1></div>
  <p><?php echo esc_html(category_description()?wp_strip_all_tags(category_description()):'منتخبی از یادداشت‌های فنی و اجرایی در این موضوع. برای دیدن همه مقاله‌ها به مجله فنی بازگردید.'); ?></p>
</section>
<section class="container editorial-archive">
  <?php if(have_posts()): ?><div class="card-grid journal-grid"><?php while(have_posts()):the_post();mojarrad_render_editorial_card();endwhile; ?></div><div class="archive-pagination"><?php the_posts_pagination(); ?></div>
  <?php else: ?><div class="archive-empty"><h2>در این موضوع هنوز مطلبی منتشر نشده است.</h2><a class="text-link" href="<?php echo esc_url(mojarrad_link('blog')); ?>">بازگشت به مجله فنی ←</a></div><?php endif; ?>
</section>
<?php get_footer(); ?>