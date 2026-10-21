<?php get_header(); ?>
<?php while(have_posts()):the_post();
  $id=get_the_ID(); $kind=mojarrad_project_status($id);
  $status_labels=array('in-progress'=>'در دست اقدام','completed'=>'اجراشده','future'=>'در مرحله طراحی');
  $gallery=array_values(array_filter(array_map('absint',explode(',',mojarrad_meta('gallery_ids',$id)))));
  $legacy=array_values(array_filter(array_map('trim',explode(',',mojarrad_meta('demo_gallery',$id)))));
  $subtitle=mojarrad_meta('subtitle',$id);
?>
<section class="project-showcase-hero">
  <div class="project-showcase-photo"><?php mojarrad_project_cover($id,'full'); ?></div>
  <div class="project-showcase-shade"></div>
  <div class="container project-showcase-heading">
    <nav class="crumbs" aria-label="مسیر صفحه"><a href="<?php echo esc_url(home_url('/')); ?>">خانه</a><span>/</span><a href="<?php echo esc_url(mojarrad_link('projects')); ?>">پروژه‌ها</a><span>/</span><span><?php echo esc_html(get_the_title()); ?></span></nav>
    <span class="eyebrow glass"><?php echo esc_html($status_labels[$kind]??'نمونه پروژه'); ?></span>
    <h1><?php the_title(); ?></h1>
    <?php if($subtitle):?><p><?php echo esc_html($subtitle); ?></p><?php endif; ?>
  </div>
  <div class="container project-showcase-bottom">
    <span><?php echo esc_html(mojarrad_meta('location',$id)); ?></span>
    <a href="#project-overview">جزئیات پروژه <span aria-hidden="true">↓</span></a>
  </div>
</section>
<section class="container project-overview" id="project-overview">
  <div class="project-details-heading">
    <div><span class="section-label">01 — معرفی پروژه</span><h2>معماری، جزئیات و <em>مسیر اجرا</em></h2></div>
    <span class="project-watermark">PROJECT / <?php echo esc_html(sprintf('%02d', $id % 100)); ?></span>
  </div>
  <div class="project-overview-grid">
    <div class="project-prose prose"><?php the_content(); ?></div>
    <aside class="project-facts" aria-label="مشخصات پروژه">
      <?php foreach(array('location'=>'موقعیت','area'=>'زیربنا','year'=>'زمان معرفی','status'=>'وضعیت در نسخه پیشین') as $key=>$label): $v=mojarrad_meta($key,$id);if(!$v)continue; ?>
      <div class="project-fact"><span><?php echo esc_html($label); ?></span><strong><?php echo esc_html($v); ?></strong></div>
      <?php endforeach; ?>
      <?php if(is_user_logged_in() && class_exists('Mojarrad_Access') && Mojarrad_Access::can_read(get_current_user_id(),$id)): ?>
        <a class="btn-gold" href="<?php echo esc_url(add_query_arg('project',$id,home_url('/timeline/'))); ?>">تایم‌لاین اختصاصی پروژه ←</a>
      <?php endif; ?>
    </aside>
  </div>
</section>
<?php if($legacy || $gallery): ?>
<section class="project-gallery-section" id="gallery">
  <div class="container"><div class="section-head"><div><span class="section-label">02 — گالری</span><h2 class="title-line">پروژه در قاب تصویر</h2></div><span class="muted">برای مشاهده در اندازه بزرگ روی تصویر بزنید.</span></div>
    <div class="project-photo-grid">
      <?php foreach($legacy as $index=>$filename):
        $src=mojarrad_asset('images/'.ltrim($filename,'/'));
      ?>
      <a class="<?php echo esc_attr($index===0?'photo-wide':''); ?>" href="<?php echo esc_url($src); ?>" target="_blank" rel="noopener noreferrer" aria-label="نمایش تصویر <?php echo esc_attr($index+1); ?>">
        <img loading="lazy" src="<?php echo esc_url($src); ?>" alt="<?php echo esc_attr(get_the_title().' — تصویر '.($index+1)); ?>">
      </a>
      <?php endforeach; ?>
      <?php foreach($gallery as $index=>$attachment):
        $url=wp_get_attachment_url($attachment); $img=wp_get_attachment_image($attachment,'large',false,array('loading'=>'lazy'));
        if(!$url || !$img)continue;
      ?>
      <a href="<?php echo esc_url($url); ?>" target="_blank" rel="noopener noreferrer"><?php echo wp_kses_post($img); ?></a>
      <?php endforeach; ?>
    </div>
  </div>
</section>
<?php endif; ?>
<?php
$related=new WP_Query(array('post_type'=>'moj_project','post_status'=>'publish','posts_per_page'=>3,'post__not_in'=>array($id),'orderby'=>'rand'));
if($related->have_posts()):
?>
<section class="container section related-projects">
  <div class="section-head"><div><span class="section-label">برای دیدن بیشتر</span><h2 class="title-line">پروژه‌های دیگر</h2></div><a class="text-link" href="<?php echo esc_url(mojarrad_link('projects')); ?>">آرشیو پروژه‌ها ←</a></div>
  <div class="card-grid"><?php while($related->have_posts()):$related->the_post();mojarrad_render_project_card();endwhile; ?></div>
</section>
<?php endif;wp_reset_postdata(); ?>
<section class="container cta-band project-cta">
  <div><span class="section-label">گفت‌وگو درباره پروژه شما</span><h2>برای ایده بعدی با هم صحبت کنیم.</h2><p class="muted">از بررسی اولیه تا تصمیم‌های اجرایی، گفت‌وگو از همین‌جا آغاز می‌شود.</p></div>
  <a class="btn-gold btn-large" href="<?php echo esc_url(mojarrad_link('consulting')); ?>">درخواست مشاوره ↖</a>
</section>
<?php endwhile; get_footer(); ?>