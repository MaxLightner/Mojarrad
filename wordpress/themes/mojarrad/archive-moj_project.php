<?php get_header(); ?>
<section class="container page-top">
  <span class="section-label">نمونه‌کارها</span><h1 class="page-title">پروژه‌های ساختمانی</h1>
  <p class="page-description">پروژه‌های انجام‌شده، در حال اجرا و برنامه‌های آینده گروه نیکا بنا.</p>
  <?php if ( have_posts() ) : ?>
    <?php
    $groups = array('in-progress'=>array(),'completed'=>array(),'future'=>array(),'other'=>array());
    while ( have_posts() ) { the_post(); $id=get_the_ID(); $key=mojarrad_project_status($id); if(!isset($groups[$key])){$key='other';} $groups[$key][]=$id; }
    $labels = array('in-progress'=>'در دست اقدام','completed'=>'پروژه‌های انجام‌شده','future'=>'پروژه‌های آینده','other'=>'سایر پروژه‌ها');
    foreach($groups as $key=>$ids) :
        if(!$ids) continue;
    ?>
    <section class="section project-group">
      <span class="section-label">پروژه‌ها</span><h2 class="title-line"><?php echo esc_html($labels[$key]); ?></h2>
      <div class="card-grid"><?php foreach($ids as $id){mojarrad_render_project_card($id);} ?></div>
    </section>
    <?php endforeach; ?>
    <?php the_posts_pagination(); ?>
  <?php else : ?><p class="notice">هنوز پروژه‌ای منتشر نشده است.</p><?php endif; ?>
</section>
<?php get_footer(); ?>
