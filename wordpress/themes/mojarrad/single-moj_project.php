<?php get_header(); ?>
<?php while ( have_posts() ) : the_post();
  $id=get_the_ID(); $kind=mojarrad_project_status($id);
  $status_labels=array('in-progress'=>'در دست اقدام','completed'=>'انجام‌شده','future'=>'پروژه آینده');
  $gallery=array_filter(array_map('absint',explode(',',mojarrad_meta('gallery_ids',$id))));
  $demo_gallery=array_filter(explode(',',mojarrad_meta('demo_gallery',$id)));
?>
<section class="project-hero">
  <div class="project-hero-photo"><?php mojarrad_project_cover($id,'full'); ?></div>
  <div class="hero-gradient"></div>
  <div class="container project-hero-inner">
    <a class="text-link" href="<?php echo esc_url(mojarrad_link('projects')); ?>">← همه پروژه‌ها</a>
    <span class="eyebrow glass"><?php echo esc_html($status_labels[$kind]??'پروژه'); ?></span>
    <h1><?php echo esc_html(get_the_title()); ?></h1>
    <?php if(is_user_logged_in() && class_exists('Mojarrad_Access') && Mojarrad_Access::can_read(get_current_user_id(),$id)): ?>
      <a class="btn-gold" href="<?php echo esc_url(add_query_arg('project',$id,home_url('/timeline/'))); ?>">تایم‌لاین اختصاصی پروژه ←</a>
    <?php endif; ?>
    <p class="muted"><?php echo esc_html(mojarrad_meta('subtitle',$id)); ?></p>
    <?php if('in-progress'===$kind): ?>
      <div class="progress-line"><span style="width:<?php echo esc_attr((string)min(100,max(0,(int)mojarrad_meta('progress',$id)))); ?>%"></span></div>
      <p>پیشرفت: <?php echo esc_html(mojarrad_meta('progress',$id)); ?>٪</p>
    <?php endif; ?>
  </div>
</section>
<div class="container section">
  <div class="facts">
    <?php foreach(array('location'=>'موقعیت','area'=>'زیربنا','year'=>'سال','status'=>'وضعیت اجرا','start_date'=>'شروع','end_date'=>'پایان') as $key=>$label):
      $val=mojarrad_meta($key,$id);if(!$val) continue; ?>
      <div class="fact"><small class="muted"><?php echo esc_html($label); ?></small><strong><?php echo esc_html($val); ?></strong></div>
    <?php endforeach; ?>
  </div>
  <?php if(get_the_content()): ?>
  <section class="project-description"><h2 class="title-line">درباره پروژه</h2><div class="prose"><?php the_content(); ?></div></section>
  <?php endif; ?>
  <?php if('completed'===$kind && ($gallery || $demo_gallery)): ?>
    <section class="section"><h2 class="title-line">گالری پروژه</h2><div class="gallery-grid">
      <?php foreach($demo_gallery as $filename) { echo '<a href="'.esc_url(mojarrad_asset('images/'.basename($filename))).'" target="_blank" rel="noopener noreferrer"><img loading="lazy" src="'.esc_url(mojarrad_asset('images/'.basename($filename))).'" alt=""></a>'; } foreach($gallery as $aid) {
        $image=wp_get_attachment_image($aid,'large',false,array('loading'=>'lazy'));
        $url=wp_get_attachment_url($aid);
        if($image && $url) echo '<a href="'.esc_url($url).'" target="_blank" rel="noopener noreferrer">'.$image.'</a>';
      } ?>
    </div></section>
  <?php endif; ?>
  <?php if('1'===mojarrad_meta('for_sale',$id)): ?>
    <section class="cta-band">
      <div><span class="section-label">در فروش</span><h2><?php echo esc_html(mojarrad_meta('sale_price',$id)); ?></h2><p><?php echo esc_html(mojarrad_meta('sale_description',$id)); ?></p></div>
      <a class="btn-gold" href="<?php echo esc_url(mojarrad_link('sale')); ?>">درخواست بازدید</a>
    </section>
  <?php endif; ?>
</div>
<?php endwhile; get_footer(); ?>
