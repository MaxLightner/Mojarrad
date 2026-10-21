<?php /* Template Name: Technical blog */ get_header(); ?>
<?php
$featured=new WP_Query(array('post_type'=>'post','post_status'=>'publish','posts_per_page'=>1,'ignore_sticky_posts'=>true,'meta_query'=>array(array('key'=>'_mojarrad_legacy_import','compare'=>'EXISTS'))));
$category_terms=get_categories(array('hide_empty'=>true));
?>
<section class="editorial-page-heading container">
  <div><span class="editorial-index">NIKA BANA / JOURNAL</span><span class="section-label">مجله فنی</span><h1>فکر، مصالح، <em>ساخت.</em></h1></div>
  <p>یادداشت‌های کاربردی از معماری، تکنولوژی ساخت، جزئیات اجرا و مدیریت پروژه. برای کسانی که می‌خواهند ساختمان را دقیق‌تر بشناسند.</p>
</section>
<?php if($featured->have_posts()):$featured->the_post();
  $source=mojarrad_meta('demo_image');
  $cover=has_post_thumbnail()?get_the_post_thumbnail_url(get_the_ID(),'full'):( $source?mojarrad_asset('images/'.$source):mojarrad_asset('images/aac-1.jpg') );
?>
<section class="container feature-story">
  <a class="feature-story-photo" href="<?php the_permalink(); ?>"><img src="<?php echo esc_url($cover); ?>" alt="<?php echo esc_attr(get_the_title()); ?>" loading="eager"></a>
  <div class="feature-story-copy"><span class="section-label">مطلب منتخب</span><h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2><p><?php echo esc_html(get_the_excerpt()); ?></p><a href="<?php the_permalink(); ?>" class="btn-gold">مطالعه مقاله ←</a></div>
</section>
<?php endif;wp_reset_postdata(); ?>
<section class="container editorial-archive">
  <div class="section-head"><div><span class="section-label">همه یادداشت‌ها</span><h2 class="title-line">مطالب تازه و منتخب</h2></div><span class="archive-counter"><?php echo esc_html(wp_count_posts('post')->publish); ?> مقاله</span></div>
  <?php if($category_terms): ?><div class="topic-pills"><span>موضوعات:</span><?php foreach($category_terms as $term): ?><a href="<?php echo esc_url(get_category_link($term->term_id)); ?>"><?php echo esc_html($term->name); ?></a><?php endforeach; ?></div><?php endif; ?>
  <?php $page=max(1,(int)get_query_var('paged'),(int)get_query_var('page'));$q=new WP_Query(array('post_type'=>'post','post_status'=>'publish','posts_per_page'=>9,'paged'=>$page,'ignore_sticky_posts'=>true)); ?>
  <?php if($q->have_posts()): ?><div class="card-grid journal-grid"><?php while($q->have_posts()):$q->the_post();mojarrad_render_editorial_card();endwhile; ?></div>
    <nav class="archive-pagination" aria-label="صفحات وبلاگ"><?php echo wp_kses_post(paginate_links(array('total'=>$q->max_num_pages,'current'=>$page))); ?></nav>
  <?php else: ?><div class="archive-empty"><h2>یادداشت‌ها به‌زودی در این بخش منتشر می‌شوند.</h2><a href="<?php echo esc_url(mojarrad_link('projects')); ?>" class="text-link">در این فاصله پروژه‌ها را ببینید ←</a></div><?php endif;wp_reset_postdata(); ?>
</section>
<section class="container editorial-contact"><div><span class="section-label">مسیر بعدی</span><h2>دانش فنی باید در <em>پروژه واقعی</em> دیده شود.</h2></div><a class="btn-outline" href="<?php echo esc_url(mojarrad_link('projects')); ?>">پروژه‌ها ←</a></section>
<?php get_footer(); ?>