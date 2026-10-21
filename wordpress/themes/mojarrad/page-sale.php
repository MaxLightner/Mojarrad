<?php /* Template Name: Property sales */ get_header(); ?>
<section class="editorial-hero sale-hero">
  <div class="editorial-hero-image"><img src="<?php echo esc_url(mojarrad_asset('images/villa-z-3.jpg')); ?>" alt="نمای ویلا در طبیعت" fetchpriority="high"></div><div class="editorial-wash"></div>
  <div class="container editorial-hero-content">
    <span class="editorial-index">NIKA BANA / REAL ESTATE</span>
    <span class="section-label">معرفی املاک و فرصت‌های همکاری</span>
    <h1>فضایی برای <em>زندگی بهتر.</em></h1>
    <p>بررسی فرصت‌های ملکی و همکاری در فروش یا ساخت، با تمرکز بر معماری، موقعیت و نیاز واقعی خریدار.</p>
    <a class="btn-gold btn-large" href="#sale-contact">درخواست اطلاعات و بازدید ↓</a>
  </div>
</section>
<section class="container sale-intro">
  <div><span class="section-label">پیش از انتخاب</span><h2>آنچه یک ملک را ارزشمند می‌کند، <em>فراتر از عکس و قیمت است.</em></h2></div>
  <p>کیفیت طراحی و اجرا، موقعیت، وضعیت حقوقی و نیازهای خریدار باید در کنار هم بررسی شوند. اطلاعات قیمت و موجودی صرفاً پس از تأیید دفتر مجموعه ارائه می‌شود.</p>
</section>
<?php
$q=post_type_exists('moj_project')?new WP_Query(array('post_type'=>'moj_project','post_status'=>'publish','posts_per_page'=>12,'meta_query'=>array(array('key'=>'moj_for_sale','value'=>'1')))):null;
if($q&&$q->have_posts()):
?>
<section class="container section"><div class="section-head"><div><span class="section-label">املاک معرفی‌شده</span><h2 class="title-line">فرصت‌های قابل بررسی</h2></div></div><div class="card-grid"><?php while($q->have_posts()):$q->the_post();mojarrad_render_project_card();endwhile; ?></div></section>
<?php endif; if($q)wp_reset_postdata(); ?>
<section class="sale-benefits-band"><div class="container"><span class="section-label">روش همکاری</span><div class="values-grid"><article><span class="value-number">01</span><h3>شناخت نیاز</h3><p>موقعیت، بودجه و نوع کاربری مطلوب.</p></article><article><span class="value-number">02</span><h3>بررسی گزینه‌ها</h3><p>مقایسه مشخصات معماری و اجرایی.</p></article><article><span class="value-number">03</span><h3>بازدید و پرسش</h3><p>مشاهده حضوری و ارزیابی مستندات.</p></article><article><span class="value-number">04</span><h3>تصمیم آگاهانه</h3><p>بررسی شرایط و توافق مستقل طرفین.</p></article></div></div></section>
<section class="container sale-contact-layout" id="sale-contact"><div><span class="section-label">ارتباط با دفتر</span><h2>ملک مناسبی در ذهن دارید؟</h2><p>برای دریافت اطلاعات گزینه‌های موجود، هماهنگی بازدید یا بررسی فرصت همکاری فرم را تکمیل کنید.</p><img loading="lazy" src="<?php echo esc_url(mojarrad_asset('images/villa-k-2.jpg')); ?>" alt="فضای بیرونی ویلا"></div><div class="card-lux form-card"><?php get_template_part('template-parts/lead-form',null,array('type'=>'sale')); ?></div></section>
<?php get_footer(); ?>