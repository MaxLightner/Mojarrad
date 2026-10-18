<?php /* Template Name: Technical blog */ get_header(); ?>
<section class="container page-top">
  <span class="section-label">دانش ساخت</span><h1 class="page-title">وبلاگ تخصصی ساخت</h1>
  <p class="page-intro muted">تکنولوژی‌ها و روش‌هایی که در ساخت‌وساز به کار می‌بریم.</p>
  <?php $q=new WP_Query(array('post_type'=>'post','post_status'=>'publish','posts_per_page'=>12,'paged'=>max(1,get_query_var('paged')))); ?>
  <?php if($q->have_posts()): ?><div class="card-grid">
    <?php while($q->have_posts()):$q->the_post();mojarrad_render_editorial_card();endwhile; ?>
  </div><?php echo wp_kses_post(paginate_links(array('total'=>$q->max_num_pages))); ?>
  <?php else: ?><p class="notice">هنوز مطلبی منتشر نشده است.</p><?php endif;wp_reset_postdata(); ?>
</section>
<?php get_footer(); ?>
