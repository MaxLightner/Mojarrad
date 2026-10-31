<?php get_header(); ?>
<?php while(have_posts()): the_post();
  $id=get_the_ID();
  $gallery=array_values(array_filter(array_map('absint',explode(',',mojarrad_meta('gallery_ids',$id)))));
  $portfolio_gallery=json_decode(mojarrad_meta('portfolio_gallery',$id),true);
  if(!is_array($portfolio_gallery)) $portfolio_gallery=array();
  $subtitle=mojarrad_meta('subtitle',$id);
  $project_code=(string)get_post_meta($id,'_moj_portfolio_external_id',true);
?>
<section class="project-showcase-hero">
  <div class="project-showcase-photo"><?php mojarrad_project_cover($id,'full'); ?></div>
  <div class="project-showcase-shade"></div>
  <div class="container project-showcase-heading">
    <nav class="crumbs" aria-label="مسیر صفحه"><a href="<?php echo esc_url(home_url('/')); ?>">خانه</a><span>/</span><a href="<?php echo esc_url(mojarrad_link('projects')); ?>">پروژه‌ها</a><span>/</span><span><?php the_title(); ?></span></nav>
    <span class="eyebrow glass"><?php echo esc_html(mojarrad_meta('kind',$id)?:'پروژه نیکابنا'); ?></span>
    <h1><?php the_title(); ?></h1>
    <?php if($subtitle): ?><p><?php echo esc_html($subtitle); ?></p><?php endif; ?>
  </div>
  <div class="container project-showcase-bottom">
    <span><?php echo esc_html(mojarrad_meta('location',$id)); ?></span>
    <a href="#project-overview">شناسنامه پروژه <span aria-hidden="true">↓</span></a>
  </div>
</section>
<section class="container project-overview" id="project-overview">
  <div class="project-details-heading">
    <div><span class="section-label">۰۱ — اطلاعات پروژه</span><h2>شناسنامه <em>پروژه</em></h2></div>
    <?php if($project_code): ?><span class="project-watermark"><?php echo esc_html(strtoupper($project_code)); ?></span><?php endif; ?>
  </div>
  <div class="project-overview-grid">
    <div class="project-prose prose"><?php the_content(); ?></div>
    <aside class="project-facts" aria-label="مشخصات پروژه">
      <?php
      $facts=array(
        'location'=>array('موقعیت',''),
        'kind'=>array('نوع پروژه',''),
        'land_area'=>array('مساحت زمین',' مترمربع'),
        'area'=>array('زیربنا',''),
        'units'=>array('تعداد واحد',' واحد'),
        'unit_area'=>array('متراژ هر واحد',' مترمربع'),
        'floors_above_ground'=>array('طبقات روی همکف',' طبقه'),
        'roof_count'=>array('تعداد سقف بنا',' سقف'),
        'year'=>array('سال',''),
        'owner'=>array('مالک / کارفرما',''),
        'designer'=>array('طراح',''),
        'supervisor'=>array('ناظر',''),
      );
      foreach($facts as $key=>$config):
        $value=mojarrad_meta($key,$id);
        if($value==='') continue;
      ?>
      <div class="project-fact"><span><?php echo esc_html($config[0]); ?></span><strong><?php echo esc_html($value.$config[1]); ?></strong></div>
      <?php endforeach; ?>
      <?php if(is_user_logged_in() && class_exists('Mojarrad_Access') && Mojarrad_Access::can_read(get_current_user_id(),$id)): ?>
      <a class="btn-gold" href="<?php echo esc_url(add_query_arg('project',$id,home_url('/timeline/'))); ?>">تایم‌لاین اختصاصی پروژه ←</a>
      <?php endif; ?>
    </aside>
  </div>
</section>
<?php if($gallery || $portfolio_gallery): ?>
<section class="project-gallery-section" id="gallery">
 <div class="container"><div class="section-head"><div><span class="section-label">۰۲ — گالری</span><h2 class="title-line">تصاویر پروژه</h2></div></div>
  <div class="project-photo-grid">
  <?php foreach($portfolio_gallery as $relative):
    if(!is_string($relative) || !preg_match('#^projects/nb-\d{4}/[\w-]+\.avif$#',$relative)) continue;
    if(!is_file(get_template_directory().'/assets/'.$relative)) continue;
    $src=mojarrad_asset($relative);
  ?>
   <a href="<?php echo esc_url($src); ?>" target="_blank" rel="noopener noreferrer"><img loading="lazy" src="<?php echo esc_url($src); ?>" alt="<?php echo esc_attr(get_the_title().' — نمای پروژه'); ?>"></a>
  <?php endforeach; ?>
  <?php foreach($gallery as $attachment):
    $url=wp_get_attachment_url($attachment);
    $img=wp_get_attachment_image($attachment,'large',false,array('loading'=>'lazy'));
    if(!$url || !$img)continue;
  ?>
   <a href="<?php echo esc_url($url); ?>" target="_blank" rel="noopener noreferrer"><?php echo wp_kses_post($img); ?></a>
  <?php endforeach; ?>
  </div>
 </div>
</section>
<?php endif; ?>
<?php
$related=new WP_Query(array('post_type'=>'moj_project','post_status'=>'publish','posts_per_page'=>3,'post__not_in'=>array($id),'orderby'=>'rand','meta_query'=>array(array('key'=>'_moj_portfolio_external_id','compare'=>'EXISTS'))));
if($related->have_posts()): ?>
<section class="container section related-projects">
  <div class="section-head"><div><span class="section-label">برای دیدن بیشتر</span><h2 class="title-line">پروژه‌های دیگر</h2></div><a class="text-link" href="<?php echo esc_url(mojarrad_link('projects')); ?>">آرشیو پروژه‌ها ←</a></div>
  <div class="card-grid"><?php while($related->have_posts()):$related->the_post();mojarrad_render_project_card();endwhile; ?></div>
</section>
<?php endif; wp_reset_postdata(); ?>
<section class="container cta-band project-cta"><div><span class="section-label">گفت‌وگو درباره پروژه شما</span><h2>برای ایده بعدی با هم صحبت کنیم.</h2></div><a class="btn-gold btn-large" href="<?php echo esc_url(mojarrad_link('consulting')); ?>">درخواست مشاوره ↖</a></section>
<?php endwhile; get_footer(); ?>