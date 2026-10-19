<?php
/* Template Name: Project Office */
if(!is_user_logged_in()){
    wp_safe_redirect(wp_login_url(home_url('/office/')));
    exit;
}
$pid=isset($_GET['project'])?absint($_GET['project']):0;
$capabilities=class_exists('Mojarrad_Office_Access')?
    Mojarrad_Office_Access::capabilities(get_current_user_id(),$pid):array();
if(!$capabilities){
    status_header(403);nocache_headers();get_header();
    echo '<div class="container page-top"><h1>دسترسی مجاز نیست</h1><p>این پروژه به شما اختصاص داده نشده یا مجوز ابزارهای آن را ندارید.</p><a class="btn-gold" href="'.esc_url(home_url('/dashboard/')).'">پنل من</a></div>';
    get_footer();return;
}
$sections=array(
    'references'=>'رفرنس‌ها','documents'=>'مدارک و نقشه‌ها','payments'=>'رسیدهای مالی',
    'contracts'=>'قراردادها','workers'=>'نیروهای اجرایی','contacts'=>'دفترچه تماس','archive'=>'آرشیو ایمن'
);
$requested=isset($_GET['section'])?sanitize_key($_GET['section']):'';
$section=isset($capabilities[$requested])?$requested:array_key_first($capabilities);
get_header();
?>
<div class="container page-top moj-office" id="moj-office-app">
  <div class="moj-office-heading">
    <div>
      <a class="text-link" href="<?php echo esc_url(home_url('/dashboard/')); ?>">← بازگشت به پنل من</a>
      <span class="section-label">دفتر مدیریت پروژه</span>
      <h1 class="page-title"><?php echo $pid?esc_html(get_the_title($pid)):'دفترچه تماس مدیریت'; ?></h1>
      <p class="muted">اطلاعات هر بخش با مجوزهای اختصاصی نقش شما نگهداری می‌شوند.</p>
    </div>
    <?php if($pid): ?>
      <a class="btn-outline" href="<?php echo esc_url(add_query_arg('project',$pid,home_url('/timeline/'))); ?>">تایم‌لاین پروژه</a>
    <?php endif; ?>
  </div>
  <nav class="moj-office-tabs" aria-label="ابزارهای مجاز پروژه">
    <?php foreach($capabilities as $key=>$values): ?>
      <a href="<?php echo esc_url(add_query_arg(array('project'=>$pid,'section'=>$key),home_url('/office/'))); ?>"
         class="<?php echo $section===$key?'is-active':''; ?>"
         <?php if($section===$key): ?>aria-current="page"<?php endif; ?>>
          <?php echo esc_html($sections[$key]??$key); ?>
      </a>
    <?php endforeach; ?>
  </nav>
  <div class="moj-office-toolbar">
    <div><span class="section-label" id="moj-office-section-label"><?php echo esc_html($sections[$section]??$section); ?></span>
      <h2 id="moj-office-title"><?php echo esc_html($sections[$section]??$section); ?></h2></div>
    <button type="button" class="btn-gold" id="moj-office-add"
      <?php if(empty($capabilities[$section]['write'])): ?>hidden<?php endif; ?>>+ ثبت جدید</button>
  </div>
  <p class="notice" id="moj-office-status" role="status" aria-live="polite">در حال دریافت اطلاعات…</p>
  <div class="moj-office-grid" id="moj-office-items"></div>
  <?php if($section==='archive'): ?>
    <p class="muted">آرشیو تأییدشده، یک خروجی ZIP خصوصی و قابل دانلود است؛ پروژه زنده حذف نمی‌شود. بازیابی خودکار روی داده‌های زنده عمداً غیرفعال است.</p>
  <?php endif; ?>
</div>
<dialog class="moj-dialog moj-office-dialog" id="moj-office-dialog">
  <div class="moj-dialog-head"><h2 id="moj-office-dialog-title">ثبت اطلاعات</h2>
    <button class="moj-icon-button" data-office-close type="button" aria-label="بستن">×</button>
  </div>
  <form id="moj-office-form" class="moj-form">
    <label>عنوان / نام
      <input name="title" type="text" maxlength="200" required></label>
    <label id="moj-office-description-label">توضیحات
      <textarea name="description" rows="3" maxlength="7500"></textarea></label>
    <div id="moj-office-fields"></div>
    <label id="moj-office-file-label">تصویر یا PDF (اختیاری، حداکثر ۸ مگابایت)
      <input name="file" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf"></label>
    <div class="moj-form-actions">
      <button class="btn-outline" data-office-close type="button">انصراف</button>
      <button class="btn-gold" id="moj-office-save" type="submit">ذخیره</button>
    </div>
    <p class="moj-alert" id="moj-office-form-error" role="alert" hidden></p>
  </form>
</dialog>
<?php get_footer(); ?>
