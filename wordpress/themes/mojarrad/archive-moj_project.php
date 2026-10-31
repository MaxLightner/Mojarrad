<?php get_header(); ?>
<section class="editorial-page-heading container projects-heading">
  <div><span class="editorial-index">NIKA BANA / PROJECTS</span><span class="section-label">آرشیو پروژه‌های واقعی</span><h1>پروژه‌های <em>نیکابنا.</em></h1></div>
  <p>ساختمان‌ها و باغ‌های معرفی‌شده در مجموعه؛ اطلاعات هر پرونده به‌تدریج تکمیل می‌شود.</p>
</section>
<?php
$groups = array('building'=>array(),'garden'=>array());
while (have_posts()) {
  the_post();
  $id=get_the_ID();
  $kind=mojarrad_meta('kind',$id);
  $groups[$kind==='باغ'?'garden':'building'][]=$id;
}
$groups_labels=array(
 'building'=>array('پروژه‌های ساختمانی','پروژه‌های مسکونی و ساختمانی معرفی‌شده'),
 'garden'=>array('باغ‌ها','پروژه‌های باغ در محدوده‌های مختلف'),
);
?>
<?php foreach($groups_labels as $key=>$labels): if(empty($groups[$key])) continue; ?>
<section class="container portfolio-group">
  <div class="section-head"><div><span class="section-label"><?php echo esc_html($key==='building'?'۰۱':'۰۲'); ?> / مجموعه</span><h2 class="title-line"><?php echo esc_html($labels[0]); ?></h2><p class="muted"><?php echo esc_html($labels[1]); ?></p></div><span class="archive-counter"><?php echo esc_html(count($groups[$key])); ?> پروژه</span></div>
  <div class="card-grid portfolio-grid"><?php foreach($groups[$key] as $id) mojarrad_render_project_card($id); ?></div>
</section>
<?php endforeach; ?>
<?php if(!array_filter($groups)): ?><section class="container section"><div class="archive-empty"><h2>آرشیو پروژه‌ها در حال تکمیل است.</h2></div></section><?php endif; ?>
<section class="container editorial-contact"><div><span class="section-label">مشارکت در ساخت</span><h2>برای پروژه جدید <em>گفت‌وگو کنیم.</em></h2></div><a href="<?php echo esc_url(mojarrad_link('consulting')); ?>" class="btn-gold btn-large">شروع گفت‌وگو ↖</a></section>
<?php get_footer(); ?>