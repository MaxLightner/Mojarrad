<?php
/* Template Name: Project Dashboard */
if(!is_user_logged_in()) {
    wp_safe_redirect(wp_login_url(home_url('/dashboard/')));
    exit;
}
get_header();
$user=wp_get_current_user();
$role=class_exists('Mojarrad_Access')?Mojarrad_Access::role_for($user):'visitor';
$labels=class_exists('Mojarrad_Access')?Mojarrad_Access::role_label($role):'کاربر';
$is_manager=current_user_can('manage_moj_projects');
$is_global=class_exists('Mojarrad_Access') && Mojarrad_Access::is_global_reader($user->ID);
$project_ids=$is_global?get_posts(array(
    'post_type'=>'moj_project','post_status'=>array('publish','private'),
    'numberposts'=>250,'fields'=>'ids','orderby'=>'date','order'=>'DESC',
)):(class_exists('Mojarrad_Access')?Mojarrad_Access::assigned_ids($user->ID):array());
$active=array();$completed=array();
foreach($project_ids as $project_id) {
    $project_id=(int)$project_id;
    if(!class_exists('Mojarrad_Access') || !Mojarrad_Access::can_read($user->ID,$project_id)) continue;
    if(mojarrad_project_status($project_id)==='completed') $completed[]=$project_id;
    else $active[]=$project_id;
}
?>
<div class="dashboard-layout container page-top">
  <aside class="dashboard-sidebar card-lux">
    <div class="dashboard-avatar" aria-hidden="true"><?php echo esc_html(function_exists('mb_substr')?mb_substr($user->display_name,0,1):substr($user->display_name,0,1)); ?></div>
    <strong><?php echo esc_html($user->display_name); ?></strong>
    <span class="section-label"><?php echo esc_html($labels); ?></span>
    <nav class="dashboard-nav" aria-label="ناوبری حساب">
      <a class="is-current" href="<?php echo esc_url(home_url('/dashboard/')); ?>">نمای کلی</a>
      <a href="#my-projects">پروژه‌های من</a>
      <a href="#my-tools">ابزارهای من</a>
      <?php if($is_manager): ?>
        <a href="<?php echo esc_url(admin_url('edit.php?post_type=moj_project')); ?>">مدیریت پروژه‌ها</a>
        <a href="<?php echo esc_url(admin_url('users.php')); ?>">کاربران و دسترسی‌ها</a>
      <?php endif; ?>
      <a href="<?php echo esc_url(wp_logout_url(home_url('/'))); ?>">خروج از حساب</a>
    </nav>
  </aside>
  <div class="dashboard-content">
    <?php if(get_option('mojarrad_playground_demo')==='1'): ?>
      <p class="notice">محیط آزمایشی — اطلاعات نمایشی و غیرواقعی هستند. <?php if(get_option('mojarrad_playground_smoke')==='passed') echo '<strong>تست سطح دسترسی کاربران: موفق</strong>'; ?></p>
    <?php endif; ?>
    <div class="dashboard-head">
      <div><span class="section-label">پنل من</span><h1 class="page-title">سلام، <?php echo esc_html($user->display_name); ?></h1><p class="muted">پروژه‌ها و دسترسی‌های شما براساس نقش <?php echo esc_html($labels); ?> نمایش داده می‌شوند.</p></div>
    </div>
    <div class="dashboard-summary">
      <div class="card-lux dashboard-metric"><span class="muted">پروژه‌های فعال</span><strong><?php echo esc_html(number_format_i18n(count($active))); ?></strong></div>
      <div class="card-lux dashboard-metric"><span class="muted">پروژه‌های تکمیل‌شده</span><strong><?php echo esc_html(number_format_i18n(count($completed))); ?></strong></div>
      <div class="card-lux dashboard-metric"><span class="muted">سطح دسترسی</span><strong><?php echo esc_html($labels); ?></strong></div>
    </div>
    <section id="my-projects" class="dashboard-section">
      <h2 class="title-line">پروژه‌های من</h2>
      <?php if(!$active && !$completed): ?>
        <p class="notice">فعلاً پروژه‌ای به حساب شما اختصاص داده نشده است. مدیر می‌تواند از صفحه ویرایش پروژه، عضویت شما را فعال کند.</p>
      <?php else: ?>
        <div class="dashboard-project-list">
          <?php foreach(array_merge($active,$completed) as $pid):
            $pstatus=mojarrad_project_status($pid);
            $progress=min(100,max(0,(int)mojarrad_meta('progress',$pid)));
          ?>
          <article class="card-lux dashboard-project">
            <div class="dashboard-project-image"><?php mojarrad_project_cover($pid); ?></div>
            <div class="dashboard-project-body">
              <span class="section-label"><?php echo $pstatus==='completed'?'تکمیل‌شده':($pstatus==='in-progress'?'در حال اجرا':'پروژه آینده'); ?></span>
              <h3><?php echo esc_html(get_the_title($pid)); ?></h3>
              <p class="muted"><?php echo esc_html(mojarrad_meta('location',$pid)); ?></p>
              <div class="demo-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="<?php echo esc_attr((string)$progress); ?>"><span style="width:<?php echo esc_attr((string)$progress); ?>%"></span></div>
              <div class="dashboard-project-actions">
                <small class="muted"><?php echo esc_html(number_format_i18n($progress)); ?>٪ پیشرفت</small>
                <a class="text-link" href="<?php echo esc_url(get_permalink($pid)); ?>">صفحه عمومی پروژه ←</a>
                <?php if($is_manager): ?><a class="text-link" href="<?php echo esc_url(get_edit_post_link($pid)); ?>">ویرایش و تخصیص اعضا</a><?php endif; ?>
              </div>
            </div>
          </article>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </section>
    <section id="my-tools" class="dashboard-section">
      <h2 class="title-line">ابزارهای من</h2>
      <div class="dashboard-tools">
      <?php
      $tool_labels=array(
        'references'=>'رفرنس‌های پروژه','payments'=>'پرداخت‌ها و رسیدها',
        'documents'=>'مدارک و نقشه‌ها','workers'=>'نیروهای اجرایی',
        'contract'=>'قراردادها','contacts'=>'دفترچه تماس','management'=>'مدیریت سیستم',
      );
      $modules=class_exists('Mojarrad_Access')?Mojarrad_Access::modules_for_role($role):array();
      foreach($modules as $m): ?>
        <div class="card-lux tool-card"><strong><?php echo esc_html($tool_labels[$m]??$m); ?></strong><span class="muted">در دست توسعه — هنوز فعال نیست</span></div>
      <?php endforeach; ?>
      <?php if(!$modules): ?><p class="notice">در حال حاضر ابزار اختصاصی دیگری برای این نقش فعال نیست.</p><?php endif; ?>
      </div>
    </section>
  </div>
</div>
<?php get_footer(); ?>
