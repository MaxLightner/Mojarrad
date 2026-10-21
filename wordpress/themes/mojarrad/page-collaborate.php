<?php /* Template Name: Collaborate */ get_header(); ?>
<section class="editorial-page-heading container">
  <div><span class="editorial-index">NIKA BANA / PARTNERS</span><span class="section-label">شبکه همکاران</span><h1>یک پروژه خوب، <em>کار یک نفر نیست.</em></h1></div>
  <p>از تأمین مصالح تا اجرای تخصصی، همکاری مؤثر بر شناخت دقیق توانایی‌ها، کیفیت خدمات و ارتباط قابل اعتماد تکیه دارد.</p>
</section>
<section class="container collaboration-lead"><img src="<?php echo esc_url(mojarrad_asset('images/cons-2.jpg')); ?>" alt="فرایند ساخت در کارگاه" loading="eager"><div><span class="section-label">همکاری حرفه‌ای</span><h2>در کنار تیم‌های متخصص، پروژه‌های دقیق‌تر ساخته می‌شوند.</h2><p>اگر تأمین‌کننده، پیمانکار یا متخصص حوزه ساختمان هستید، می‌توانید سابقه فعالیت و زمینه همکاری خود را برای بررسی ارسال کنید.</p></div></section>
<section class="container collaboration-forms">
  <article class="collab-form-panel"><div><span class="value-number">01 / SUPPLY</span><h2>تأمین‌کنندگان</h2><p>برای مصالح، تجهیزات، خدمات تخصصی و تأمین به‌موقع اقلام پروژه.</p></div><div class="card-lux form-card"><?php get_template_part('template-parts/lead-form',null,array('type'=>'supplier')); ?></div></article>
  <article class="collab-form-panel"><div><span class="value-number">02 / EXECUTION</span><h2>پیمانکاران و تیم‌های اجرایی</h2><p>از کارهای سازه‌ای و تأسیساتی تا نازک‌کاری، نما و جزئیات تکمیلی.</p></div><div class="card-lux form-card"><?php get_template_part('template-parts/lead-form',null,array('type'=>'contractor')); ?></div></article>
</section>
<?php get_footer(); ?>