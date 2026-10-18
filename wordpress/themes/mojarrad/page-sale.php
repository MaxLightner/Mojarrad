<?php /* Template Name: Property sales */ get_header(); ?>
<section class="container page-top">
  <span class="section-label">فرصت‌های سرمایه‌گذاری</span><h1 class="page-title">املاک در فروش</h1>
  <p class="page-intro muted">پروژه‌های آماده فروش و بازدید گروه نیکا بنا.</p>
  <?php if(post_type_exists('moj_project')):
    $q=new WP_Query(array('post_type'=>'moj_project','post_status'=>'publish','posts_per_page'=>12,'paged'=>max(1,get_query_var('paged')),'meta_query'=>array(array('key'=>'moj_for_sale','value'=>'1'))));
    if($q->have_posts()): ?>
      <div class="card-grid"><?php while($q->have_posts()):$q->the_post();mojarrad_render_project_card();endwhile; ?></div>
      <?php echo wp_kses_post(paginate_links(array('total'=>$q->max_num_pages))); ?>
    <?php else: ?><p class="notice">در حال حاضر ملکی برای فروش موجود نیست.</p><?php endif;wp_reset_postdata();
  endif; ?>
  <section class="section"><h2>همکاری در فروش</h2><?php get_template_part('template-parts/lead-form',null,array('type'=>'sale')); ?></section>
</section>
<?php get_footer(); ?>
