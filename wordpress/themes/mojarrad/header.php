<!doctype html>
<html <?php language_attributes(); ?> dir="rtl">
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?> data-moj-theme="navy">
<?php wp_body_open(); ?>
<a class="screen-reader-text" href="#main">رفتن به محتوا</a>
<header class="site-header glass" id="site-header">
  <div class="container header-inner">
    <a class="site-brand" href="<?php echo esc_url(home_url('/')); ?>">
      <img src="<?php echo esc_url(mojarrad_asset('logo.svg')); ?>" alt="" width="36" height="36" />
      <span>گروه ساختمانی <strong class="gold-text">نیکا بنا</strong></span>
    </a>
    <nav class="primary-nav" id="primary-nav" aria-label="ناوبری اصلی">
      <?php wp_nav_menu(array('theme_location'=>'primary','container'=>false,'fallback_cb'=>'mojarrad_fallback_menu')); ?>
    </nav>
    <div class="header-actions">
      <label class="screen-reader-text" for="moj-theme">انتخاب تم</label>
      <select id="moj-theme" aria-label="رنگ‌بندی سایت" title="رنگ‌بندی سایت">
        <option value="navy">سرمه‌ای</option><option value="dark">تیره</option><option value="light">روشن</option><option value="pastel">پاستلی</option>
      </select>
      <a class="header-login btn-gold" href="<?php echo esc_url(is_user_logged_in()?mojarrad_link('dashboard'):mojarrad_link('login')); ?>">
        <?php echo is_user_logged_in()?'پنل من':'ورود اعضا'; ?>
      </a>
      <button class="menu-toggle" id="menu-toggle" aria-controls="primary-nav" aria-expanded="false" type="button">☰<span class="screen-reader-text">نمایش منو</span></button>
    </div>
  </div>
</header>
<main id="main" class="site-main">
