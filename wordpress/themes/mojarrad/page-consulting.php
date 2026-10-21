<?php /* Template Name: Investment consulting */ get_header(); ?>
<section class="editorial-hero consulting-hero">
  <div class="editorial-hero-image"><img src="<?php echo esc_url(mojarrad_asset('images/apt-2.jpg')); ?>" alt="طراحی فضای مسکونی" fetchpriority="high"></div><div class="editorial-wash"></div>
  <div class="container editorial-hero-content"><span class="editorial-index">NIKA BANA / CONSULTING</span><span class="section-label">مشاوره پروژه</span><h1>پیش از ساخت، <em>دقیق‌تر ببینیم.</em></h1><p>هر زمین و هر پروژه پرسش‌های خودش را دارد. از بررسی گزینه‌های اولیه تا تعیین مسیر اجرا، تصمیم بهتر با اطلاعات روشن آغاز می‌شود.</p><a href="#consulting-form" class="btn-gold btn-large">شرح پروژه شما ↓</a></div>
</section>
<section class="container editorial-process"><div class="section-head"><div><span class="section-label">موضوعات مشاوره</span><h2 class="title-line">از ایده تا تصمیم اجرایی</h2></div></div>
  <div class="process-cards"><article><span>01</span><h3>بررسی اولیه زمین</h3><p>موقعیت، محدودیت‌ها، نیازها و گزینه‌های ممکن برای شروع.</p></article><article><span>02</span><h3>مطالعه فنی و هزینه</h3><p>شناخت دامنه پروژه، مصالح و فرضیات مؤثر بر برآورد.</p></article><article><span>03</span><h3>برنامه‌ریزی اجرا</h3><p>ترتیب مراحل، هماهنگی تخصص‌ها و نقاط کنترل کیفیت.</p></article></div>
</section>
<section class="container form-feature-layout" id="consulting-form">
  <div><span class="section-label">شروع گفت‌وگو</span><h2>مسئله شما چیست؟</h2><p>موضوع پروژه، موقعیت و راه ارتباطی را بنویسید تا درخواست در دفتر مجموعه ثبت شود.</p><div class="form-side-photo"><img loading="lazy" src="<?php echo esc_url(mojarrad_asset('images/facade-2.jpg')); ?>" alt="جزئیات نمای ساختمان"></div></div>
  <div class="card-lux form-card"><?php mojarrad_form_status();get_template_part('template-parts/lead-form',null,array('type'=>'consulting')); ?></div>
</section>
<?php get_footer(); ?>