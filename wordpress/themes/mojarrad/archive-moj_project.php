<?php get_header(); ?>
<section class="editorial-page-heading container projects-heading">
  <div><span class="editorial-index">NIKA BANA / PORTFOLIO</span><span class="section-label">نمونه‌کارها</span><h1>فضاهایی برای <em>زندگی.</em></h1></div>
  <p>منتخبی از پروژه‌های مسکونی و ویلایی معرفی‌شده در سایت؛ از معماری شهری تا ویلاهای دامنه بینالود، با تصاویر و جزئیات هر مجموعه.</p>
</section>
<?php
$groups=array('in-progress'=>array(),'completed'=>array(),'future'=>array(),'other'=>array());
while(have_posts()){the_post();$id=get_the_ID();$key=mojarrad_project_status($id);if(!isset($groups[$key]))$key='other';$groups[$key][]=$id;}
$groups_labels=array('completed'=>array('پروژه‌های اجراشده','تصویر یک ایده پس از ساخت'),'in-progress'=>array('در دست اقدام','پروژه‌هایی در مسیر اجرا'),'future'=>array('در مرحله طراحی','نگاهی به برنامه‌های آینده'),'other'=>array('سایر پروژه‌ها','پروژه‌های بیشتر'));
?>
<?php foreach($groups_labels as $key=>$labels):if(empty($groups[$key]))continue; ?>
<section class="container portfolio-group">
  <div class="section-head"><div><span class="section-label"><?php echo esc_html(sprintf('%02d',array_search($key,array_keys($groups_labels),true)+1)); ?> / مجموعه</span><h2 class="title-line"><?php echo esc_html($labels[0]); ?></h2><p class="muted"><?php echo esc_html($labels[1]); ?></p></div><span class="archive-counter"><?php echo esc_html(count($groups[$key])); ?> پروژه</span></div>
  <div class="card-grid portfolio-grid"><?php foreach($groups[$key] as $id)mojarrad_render_project_card($id); ?></div>
</section>
<?php endforeach; ?>
<?php if(!array_filter($groups)): ?><section class="container section"><div class="archive-empty"><h2>آرشیو پروژه‌ها در حال تکمیل است.</h2><a class="text-link" href="<?php echo esc_url(mojarrad_link('consulting')); ?>">ارتباط با دفتر ↖</a></div></section><?php endif; ?>
<div class="container archive-pagination"><?php the_posts_pagination(); ?></div>
<section class="container editorial-contact"><div><span class="section-label">مشارکت در ساخت</span><h2>به یک ایده <em>شکل واقعی</em> بدهیم.</h2></div><a href="<?php echo esc_url(mojarrad_link('consulting')); ?>" class="btn-gold btn-large">شروع گفت‌وگو ↖</a></section>
<?php get_footer(); ?>