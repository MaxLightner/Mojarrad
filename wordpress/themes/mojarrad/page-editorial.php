<?php
/* Template Name: Editorial Review */
defined('ABSPATH') || exit;
$review_id = class_exists('Mojarrad_Editorial_Review') ? Mojarrad_Editorial_Review::requested_review_id() : 0;

// The link identifies the article, but grants no access without the assigned account.
if (!is_user_logged_in()) {
    wp_safe_redirect(add_query_arg('editorial', $review_id, mojarrad_link('login')));
    exit;
}
nocache_headers();
if (!class_exists('Mojarrad_Editorial_Review') || !Mojarrad_Editorial_Review::can_approve()) {
    status_header(403);
    get_header();
    echo '<section class="container page-top review-access"><h1>این صفحه فقط برای تأییدکننده مشخص‌شده توسط مدیر است.</h1><p>دسترسی به مقاله‌های تأییدنشده مجاز نیست.</p></section>';
    get_footer();
    return;
}
if ($review_id) {
    $review_post = get_post($review_id);
    if (!$review_post || !Mojarrad_Editorial_Review::is_managed($review_post)) {
        status_header(404);
        get_header();
        echo '<section class="container page-top review-access"><h1>مقاله‌ای برای بررسی پیدا نشد.</h1></section>';
        get_footer();
        return;
    }
}
get_header();
$review_result = isset($_GET['result']) && is_string($_GET['result']) ? sanitize_key(wp_unslash($_GET['result'])) : '';
$review_messages = array(
    'scheduled' => 'مقاله تأیید شد و در صف انتشار خودکار قرار گرفت.',
    'published' => 'همین نسخه مقاله اکنون منتشر شده است.',
    'returned' => 'مقاله برای اصلاح به پیش‌نویس برگشت؛ دلیل بازگشت ذخیره شد.',
    'note_required' => 'برای بازگشت مقاله، دلیل اصلاح را حداقل در چند کلمه بنویسید.',
    'bad_date' => 'زمان انتخابی نامعتبر یا کمتر از پنج دقیقه با اکنون فاصله دارد.',
    'invalid' => 'عملیات انتخاب‌شده معتبر نیست.',
    'error' => 'تغییر وضعیت ثبت نشد؛ لطفاً مجدداً بررسی کنید.',
    'stale' => 'مقاله پس از باز شدن پیش‌نمایش تغییر کرده است. صفحه را بازخوانی و نسخه جدید را بررسی کنید.',
);
?>
<?php if (!$review_id): ?>
<section class="container editorial-review-list page-top">
  <span class="section-label">اتاق بررسی نیکابنا</span>
  <h1>مقاله‌های آماده بررسی</h1>
  <p>این صفحه فقط برای حسابی قابل مشاهده است که مدیر برای تأیید مقالات تعیین کرده است.</p>
  <?php
    $articles = get_posts(array(
        'post_type'=>'post', 'post_status'=>array('draft','pending','future','publish'),
        'posts_per_page'=>50, 'orderby'=>'modified', 'order'=>'DESC',
        'meta_query'=>array('relation'=>'OR',
            array('key'=>'_moj_editorial_source_id','compare'=>'EXISTS'),
            array('key'=>'_moj_editorial_managed','value'=>'1'),
            array('key'=>'_moj_editorial_review_required','value'=>'1')),
    ));
  ?>
  <?php if ($articles): ?><div class="review-list-cards">
  <?php foreach ($articles as $item): ?>
    <a href="<?php echo esc_url(Mojarrad_Editorial_Review::review_url($item->ID)); ?>" class="review-list-card">
      <span class="review-status"><?php echo esc_html(array('draft'=>'پیش‌نویس','pending'=>'در انتظار تأیید','future'=>'زمان‌بندی‌شده','publish'=>'منتشرشده')[$item->post_status] ?? $item->post_status); ?></span>
      <strong><?php echo esc_html(get_the_title($item)); ?></strong>
      <small>باز کردن و بررسی متن در قالب واقعی سایت ←</small>
    </a>
  <?php endforeach; ?></div>
  <?php else: ?><p>مقاله‌ای در صف بررسی نیست.</p><?php endif; ?>
</section>
<?php else: ?>
<section class="container review-ribbon" aria-label="وضعیت پیش‌نمایش">
  <div>
    <span class="section-label">پیش‌نمایش خصوصی | نیکابنا</span>
    <p>متن، تصویر و چیدمان مقاله با همان قالب انتشار نمایش داده می‌شوند. این صفحه برای بازدیدکنندگان عمومی قابل مشاهده نیست.</p>
  </div>
  <a class="review-back" href="<?php echo esc_url(Mojarrad_Editorial_Review::review_url()); ?>">← سایر مقاله‌ها</a>
</section>
<?php if ($review_result && isset($review_messages[$review_result])): ?>
  <div class="container review-result" role="status"><?php echo esc_html($review_messages[$review_result]); ?></div>
<?php endif; ?>
<?php
  // The exact template part is shared with public single.php: no separate preview HTML.
  $GLOBALS['post'] = $review_post;
  setup_postdata($review_post);
  get_template_part('template-parts/editorial-article');
  wp_reset_postdata();
?>
<section class="container review-decision" aria-labelledby="review-decision-title">
  <div class="review-decision-head">
    <span class="section-label">تصمیم نهایی</span>
    <h2 id="review-decision-title">وضعیت این مقاله</h2>
    <p>
      <?php
        $status_text = array('draft'=>'پیش‌نویس؛ منتشر نشده','pending'=>'در انتظار تأیید؛ منتشر نشده',
          'future'=>'تأییدشده و در صف انتشار','publish'=>'منتشرشده');
        echo esc_html($status_text[$review_post->post_status] ?? $review_post->post_status);
      ?>
    </p>
    <?php if ($review_post->post_status === 'future'): ?>
      <p>انتشار برنامه‌ریزی‌شده: <strong><?php echo esc_html(get_post_time('Y/m/d H:i', false, $review_post, true)); ?> (زمان ذخیره‌شده در وردپرس)</strong></p>
    <?php endif; ?>
  </div>
  <?php if (in_array($review_post->post_status, array('draft','pending','future'), true)): ?>
  <form class="review-form" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
    <input type="hidden" name="action" value="moj_editorial_decision">
    <input type="hidden" name="article" value="<?php echo esc_attr($review_post->ID); ?>">
    <input type="hidden" name="review_hash" value="<?php echo esc_attr(Mojarrad_Editorial_Review::reviewed_hash($review_post)); ?>">
    <?php wp_nonce_field('moj_editorial_decision_' . $review_post->ID, 'moj_editorial_nonce'); ?>
    <div class="review-schedule">
      <label for="review-publish-at">زمان انتشار برنامه‌ریزی‌شده (به وقت تهران)</label>
      <input id="review-publish-at" type="datetime-local" name="publish_at" value="<?php echo esc_attr(Mojarrad_Editorial_Review::next_slot()); ?>">
      <button type="submit" class="btn-gold" name="decision" value="schedule">تأیید و زمان‌بندی انتشار</button>
    </div>
    <div class="review-actions">
      <button type="submit" class="btn-outline" name="decision" value="publish" onclick="return confirm('این مقاله همین حالا برای همه منتشر شود؟')">تأیید و انتشار فوری</button>
      <div class="review-changes">
        <label for="review-note">اگر اصلاح لازم است، دلیل آن را بنویسید</label>
        <textarea id="review-note" name="review_note" rows="3" placeholder="بخشی که باید اصلاح شود…"></textarea>
        <button type="submit" class="review-return" name="decision" value="changes">بازگشت برای اصلاح</button>
      </div>
    </div>
  </form>
  <?php elseif ($review_post->post_status === 'publish'): ?>
    <p>مقاله منتشر شده و به همان نشانی عمومی در دسترس است: <a href="<?php echo esc_url(get_permalink($review_post)); ?>">مشاهده مقاله منتشرشده</a></p>
  <?php endif; ?>
  <?php $last_note = (string) get_post_meta($review_post->ID, '_moj_editorial_review_note', true); ?>
  <?php if ($last_note): ?><div class="review-last-note"><strong>یادداشت بازبینی:</strong> <?php echo esc_html($last_note); ?></div><?php endif; ?>
</section>
<?php endif; ?>
<?php get_footer(); ?>
