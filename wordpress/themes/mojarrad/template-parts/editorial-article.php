<?php
$is_news=get_post_type()==='moj_news';
  $back=$is_news?mojarrad_link('news'):mojarrad_link('blog');
  $back_label=$is_news?'اخبار و یادداشت‌ها':'مجله فنی';
  $source=mojarrad_meta('demo_image');
  $editorial_cover=(string)get_post_meta(get_the_ID(),'_moj_editorial_cover',true);
  $cover=has_post_thumbnail()?get_the_post_thumbnail_url(get_the_ID(),'large'):($editorial_cover?mojarrad_asset('images/'.basename($editorial_cover)):($source?mojarrad_asset('images/'.$source):''));
  $cats=get_the_category();
?>
<article <?php post_class('editorial-article'); ?>>
  <header class="article-intro container">
    <nav class="crumbs" aria-label="مسیر صفحه"><a href="<?php echo esc_url(home_url('/')); ?>">خانه</a><span>/</span><a href="<?php echo esc_url($back); ?>"><?php echo esc_html($back_label); ?></a></nav>
    <div class="article-meta"><span class="section-label"><?php echo esc_html($cats?$cats[0]->name:($is_news?'یادداشت':'دانش ساخت')); ?></span><span><?php echo esc_html(get_the_date('Y/m/d')); ?></span></div>
    <h1><?php the_title(); ?></h1>
    <?php if(has_excerpt()): ?><p class="article-deck"><?php echo esc_html(get_the_excerpt()); ?></p><?php endif; ?>
  </header>
  <?php if($cover): ?><div class="container article-cover"><img src="<?php echo esc_url($cover); ?>" alt="<?php echo esc_attr(get_the_title()); ?>" decoding="async" fetchpriority="high"></div><?php endif; ?>
  <div class="container article-reading-layout">
    <aside class="article-sidebar"><div class="editorial-signature"><span class="brand-symbol" aria-hidden="true"></span><strong>نیکابنا</strong></div><span class="section-label">مجله نیکابنا</span><div class="story-rule"></div><p>تجربه، جزئیات و نگاه اجرایی به ساختمان</p><a href="<?php echo esc_url($back); ?>">← بازگشت به <?php echo esc_html($back_label); ?></a></aside>
    <div class="prose article-prose"><?php the_content(); ?></div>
  </div>
  <?php
    $related_args=array('post_type'=>$is_news?'moj_news':'post','post_status'=>'publish','post__not_in'=>array(get_the_ID()),'posts_per_page'=>3);
    if ($cats) $related_args['category__in']=array_map(static fn($term)=>(int)$term->term_id,$cats);
    $related=new WP_Query($related_args);
    if($related->have_posts()):
  ?>
  <section class="container section related-reading"><div class="section-head"><div><span class="section-label">در ادامه بخوانید</span><h2 class="title-line">مطالب مرتبط</h2></div><a class="text-link" href="<?php echo esc_url($back); ?>">همه مطالب ←</a></div><div class="card-grid"><?php while($related->have_posts()):$related->the_post();mojarrad_render_editorial_card();endwhile; ?></div></section>
  <?php endif;wp_reset_postdata(); ?>
</article>
