<?php /* Template Name: Collaborate */ get_header(); ?>
<section class="container page-top">
  <span class="section-label">شبکه همکاران</span>
  <h1 class="page-title">همکاری با نیکا بنا</h1>
  <p class="page-intro muted">تأمین‌کنندگان مصالح و تیم‌های پیمانکاری می‌توانند اطلاعات خود را برای بررسی ارسال کنند.</p>
  <div class="facts">
    <div class="fact"><h2>تأمین‌کنندگان</h2><p class="muted">مصالح، تجهیزات و خدمات ساختمانی</p></div>
    <div class="fact"><h2>پیمانکاران</h2><p class="muted">نیروها و تیم‌های متخصص اجرا</p></div>
  </div>
  <section class="section"><h2>ثبت درخواست تأمین‌کننده</h2><?php get_template_part('template-parts/lead-form',null,array('type'=>'supplier')); ?></section>
  <section class="section"><h2>ثبت درخواست پیمانکار</h2><?php get_template_part('template-parts/lead-form',null,array('type'=>'contractor')); ?></section>
</section>
<?php get_footer(); ?>
