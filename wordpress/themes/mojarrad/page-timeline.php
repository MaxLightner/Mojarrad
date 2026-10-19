<?php
/* Template Name: Construction Project Timeline */
if(!is_user_logged_in()){
    wp_safe_redirect(wp_login_url(home_url('/timeline/?project='.absint($_GET['project']??0))));
    exit;
}
$pid=isset($_GET['project'])?absint($_GET['project']):0;
if(!$pid || !class_exists('Mojarrad_Access') || !Mojarrad_Access::can_read(get_current_user_id(),$pid)){
    status_header(403);nocache_headers();
    get_header();
    echo '<div class="container page-top"><h1>دسترسی به پروژه مجاز نیست</h1><p>اگر این پروژه متعلق به شماست، از مدیر درخواست فعال‌سازی دسترسی کنید.</p><a class="btn-outline" href="'.esc_url(home_url('/dashboard/')).'">بازگشت به پنل</a></div>';
    get_footer();return;
}
get_header();
?>
<div class="container page-top moj-timeline-layout" id="moj-timeline-app">
    <div class="timeline-heading">
      <div>
        <a class="text-link" href="<?php echo esc_url(home_url('/dashboard/')); ?>">← بازگشت به پنل من</a>
        <span class="section-label">گزارش‌های پروژه</span>
        <h1 class="page-title"><?php echo esc_html(get_the_title($pid)); ?></h1>
        <p class="muted">رویدادها، مراحل اجرا، گزارش‌ها، تصاویر و گفتگوهای پروژه</p>
      </div>
      <button class="btn-gold timeline-create-btn" type="button" id="moj-open-create" hidden>+ ثبت رویداد</button>
    </div>
    <div class="notice" id="moj-timeline-status" role="status" aria-live="polite">در حال دریافت رویدادهای پروژه…</div>
    <div class="timeline-filter-row">
      <label>فیلتر نمایش
        <select id="moj-filter">
          <option value="all">همه رویدادها</option>
          <option value="report">گزارش‌های رسمی</option>
          <option value="stage">شروع و پایان مراحل</option>
          <option value="followup">پیگیری‌های باز</option>
        </select>
      </label>
      <span class="muted" id="moj-timeline-counter"></span>
    </div>
    <section class="moj-stage-summary" id="moj-stage-summary" aria-label="مراحل فعال"></section>
    <section class="moj-spine" id="moj-events" aria-label="تایم‌لاین رویدادها"></section>
    <button class="btn-outline moj-more" type="button" id="moj-load-more" hidden>رویدادهای قدیمی‌تر</button>
</div>
<dialog id="moj-event-dialog" class="moj-dialog">
  <div class="moj-dialog-head">
    <h2 id="moj-event-form-title">رویداد جدید</h2>
    <button type="button" class="moj-icon-button" data-close-dialog aria-label="بستن">×</button>
  </div>
  <form id="moj-event-form" class="moj-form">
    <input type="hidden" name="editingId" value="">
    <label>نوع رویداد
      <select name="kind" required>
        <option value="point">رویداد عادی</option>
        <option value="stage_start">شروع مرحله اجرایی</option>
        <option value="stage_end">پایان مرحله اجرایی</option>
      </select>
    </label>
    <div class="moj-stage-inputs" id="moj-stage-inputs" hidden>
      <label>مرحله
        <select name="stageKey" id="moj-stage-key"></select>
      </label>
      <label>گروه
        <select name="stageGroup">
          <option value="structure">سازه</option><option value="mep">تأسیسات</option>
          <option value="finishing">نازک‌کاری</option><option value="exterior">نما و محوطه</option>
          <option value="admin">اداری</option>
        </select>
      </label>
    </div>
    <label>دسته
      <select name="category">
        <option value="execution">اجرای کار</option>
        <option value="visit">بازدید</option>
        <option value="supply">تأمین مصالح</option>
        <option value="decision">تصمیم</option>
        <option value="delay">تأخیر</option>
        <option value="reference">رفرنس</option>
      </select>
    </label>
    <label>تاریخ
      <input name="date" type="date" required>
      <small class="muted">در این نسخه تاریخ در فرم به میلادی ثبت می‌شود؛ نمایش تاریخ در کارت‌ها شمسی است.</small>
    </label>
    <label>عنوان
      <input name="title" type="text" maxlength="160" placeholder="مثلاً بتن‌ریزی سقف سوم">
    </label>
    <label>شرح
      <textarea name="description" maxlength="7500" rows="4"></textarea>
    </label>
    <label class="moj-check"><input name="isReport" type="checkbox" value="true"> گزارش رسمی برای مالک و ناظر</label>
    <p class="muted" id="moj-stage-report-hint" hidden>شروع و پایان هر مرحله، به‌صورت خودکار گزارش رسمی محسوب می‌شود.</p>
    <p role="alert" id="moj-form-error" class="moj-alert" hidden></p>
    <div class="moj-form-actions">
      <button type="button" class="btn-outline" data-close-dialog>انصراف</button>
      <button type="submit" class="btn-gold" id="moj-save-event">ذخیره رویداد</button>
    </div>
  </form>
</dialog>
<?php get_footer(); ?>
