<?php
/* Template Name: Member Login */
if(is_user_logged_in()) { wp_safe_redirect(home_url('/dashboard/'));exit; }
get_header();
?>
<section class="container page-top">
  <div class="auth-card card-lux">
    <span class="section-label">ورود امن اعضا</span>
    <h1 class="page-title">ورود به پنل پروژه</h1>
    <p class="muted">برای مشاهده پروژه‌های اختصاص‌یافته از حساب کاربری خود استفاده کنید.</p>
    <?php wp_login_form(array(
        'redirect'=>home_url('/dashboard/'),
        'label_username'=>'نام کاربری یا ایمیل',
        'label_password'=>'رمز عبور',
        'label_remember'=>'مرا به خاطر بسپار',
        'label_log_in'=>'ورود',
        'remember'=>true
    )); ?>
    <p class="muted auth-help"><a href="<?php echo esc_url(wp_lostpassword_url()); ?>">رمز عبور را فراموش کرده‌اید؟</a></p>
  </div>
</section>
<?php get_footer(); ?>
