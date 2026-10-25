<?php
/* Template Name: Member Login */
$project_id = isset($_GET['project']) && is_scalar($_GET['project']) ? absint($_GET['project']) : 0;
// A QR code is only a deep link; it never contains credentials or grants access.
if ($project_id && get_post_type($project_id) !== 'moj_project') $project_id = 0;
$destination = $project_id
    ? add_query_arg('project', $project_id, home_url('/timeline/'))
    : home_url('/dashboard/');
if (is_user_logged_in()) {
    $allowed = !$project_id || (
        class_exists('Mojarrad_Access')
        && Mojarrad_Access::can_read(get_current_user_id(), $project_id)
    );
    wp_safe_redirect($allowed ? $destination : home_url('/dashboard/'));
    exit;
}
get_header();
?>
<section class="container page-top">
  <div class="auth-card card-lux">
    <div class="auth-brand" aria-label="نیکابنا">
      <span class="brand-symbol" aria-hidden="true"></span>
      <strong>نیکابنا</strong><small lang="en">NIKABANA</small>
    </div>
    <span class="section-label">ورود اعضای تأییدشده</span>
    <h1 class="page-title"><?php echo $project_id ? 'ورود به پروژه' : 'ورود به پنل من'; ?></h1>
    <p class="muted">نام کاربری و رمز عبور را از مدیر سیستم دریافت کنید. ایجاد حساب و تعیین دسترسی پروژه فقط توسط مدیر انجام می‌شود.</p>
    <?php if ($project_id): ?>
      <p class="notice" role="status">لینک پروژه شناسایی شد. پس از ورود، در صورت داشتن مجوز به تایم‌لاین پروژه منتقل می‌شوید.</p>
    <?php endif; ?>
    <?php wp_login_form(array(
        'redirect'=>$destination,
        'label_username'=>'نام کاربری',
        'label_password'=>'رمز عبور',
        'label_remember'=>'مرا به خاطر بسپار',
        'label_log_in'=>'ورود به حساب',
        'remember'=>true,
        'required_username'=>true,
        'required_password'=>true
    )); ?>
    <p class="muted auth-help">حساب یا رمز عبور ندارید؟ با مدیر نیکابنا تماس بگیرید.</p>
  </div>
</section>
<?php get_footer(); ?>
