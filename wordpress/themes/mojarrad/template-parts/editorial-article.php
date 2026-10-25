<?php
$is_news = get_post_type() === 'moj_news';
$back = $is_news ? mojarrad_link('news') : mojarrad_link('blog');
$back_label = $is_news ? 'اخبار و یادداشت‌ها' : 'مجله فنی';
$source = mojarrad_meta('demo_image');
$editorial_cover = (string) get_post_meta(get_the_ID(), '_moj_editorial_cover', true);
$cover = has_post_thumbnail() ? get_the_post_thumbnail_url(get_the_ID(), 'large') :
    ($editorial_cover ? mojarrad_asset('images/' . basename($editorial_cover)) :
    ($source ? mojarrad_asset('images/' . basename($source)) : ''));
$cats = get_the_category();
$category_label = $cats ? $cats[0]->name : ($is_news ? 'یادداشت' : 'دانش ساخت');
$author_label = (string) get_post_meta(get_the_ID(), '_moj_editorial_byline', true);
if (!$author_label) {
    $author_label = (string) get_the_author_meta('display_name', (int) get_post_field('post_author', get_the_ID()));
}
$is_economy_story = (string) get_post_meta(get_the_ID(), '_moj_editorial_source_id', true) === 'nikabana-journal-001';

// Generate chapter anchors from the published-content renderer, preserving all copy.
$content_html = apply_filters('the_content', get_the_content());
$chapters = array();
$content_html = preg_replace_callback('/<h2\b([^>]*)>(.*?)<\/h2>/isu',
    static function ($matches) use (&$chapters) {
        $number = count($chapters) + 1;
        $id = 'article-section-' . $number;
        $title = trim(wp_strip_all_tags($matches[2]));
        $chapters[] = array('id' => $id, 'title' => $title);
        $attrs = preg_replace('/\s+id\s*=\s*(["\']).*?\1/isu', '', $matches[1]);
        return '<h2' . $attrs . ' id="' . esc_attr($id) . '">' . $matches[2] . '</h2>';
    }, $content_html);

if ($is_economy_story && is_string($content_html)) {
    // A schematic visual interlude only for the matching article, not new factual data.
    $flow_visual = <<<'HTML'
<figure class="article-flow-figure" aria-label="نمای شماتیک جریان تعهدات مالی در مراحل ساخت">
  <div class="article-flow-top"><span class="article-figure-index">FIELD NOTE / 01</span><strong>زمانِ هزینه، به اندازهٔ مبلغ آن مهم است.</strong></div>
  <div class="article-flow-lanes" aria-hidden="true">
    <div class="article-flow-lane"><span class="article-flow-number">01</span><i></i><strong>شروع</strong><small>تعهدهای اولیه</small></div>
    <div class="article-flow-lane"><span class="article-flow-number">02</span><i></i><strong>میانهٔ اجرا</strong><small>پرداخت‌های مرحله‌ای</small></div>
    <div class="article-flow-lane"><span class="article-flow-number">03</span><i></i><strong>تکمیل</strong><small>منابع باقی‌مانده</small></div>
  </div>
  <figcaption>تصویر مفهومی است؛ نمودار جریان نقدی واقعی باید با ارقام و زمان‌بندی همان پروژه تهیه شود.</figcaption>
</figure>
HTML;
    $heading_number = 0;
    $content_html = preg_replace_callback('/<h2\b[^>]*>.*?<\/h2>/isu',
        static function ($matches) use (&$heading_number, $flow_visual) {
            ++$heading_number;
            return ($heading_number === 4 ? $flow_visual : '') . $matches[0];
        }, $content_html);
}
?>
<article <?php post_class('editorial-article article-experience' . ($is_economy_story ? ' article-economy-story' : '')); ?>>
  <div class="article-reading-progress" aria-hidden="true"><span></span></div>
  <section class="article-opening" aria-label="معرفی مقاله">
    <div class="container article-opening-grid">
      <header class="article-intro">
        <nav class="crumbs" aria-label="مسیر صفحه"><a href="<?php echo esc_url(home_url('/')); ?>">خانه</a><span>/</span><a href="<?php echo esc_url($back); ?>"><?php echo esc_html($back_label); ?></a></nav>
        <div class="article-edition" aria-hidden="true"><span>NIKABANA</span><span>JOURNAL / FIELD NOTES</span></div>
        <div class="article-meta"><span class="section-label"><?php echo esc_html($category_label); ?></span><span class="article-meta-divider" aria-hidden="true"></span><time datetime="<?php echo esc_attr(get_the_date('c')); ?>"><?php echo esc_html(get_the_date('Y/m/d')); ?></time></div>
        <h1><?php the_title(); ?></h1>
        <?php if (has_excerpt()): ?><p class="article-deck"><?php echo esc_html(get_the_excerpt()); ?></p><?php endif; ?>
        <div class="article-author-line"><span class="article-author-emblem" aria-hidden="true">ن</span><span><small>نگارش و بررسی</small><strong><?php echo esc_html($author_label); ?></strong></span><span class="article-author-rule" aria-hidden="true"></span><span class="article-longform-label">تحلیل / تجربه / ساخت</span></div>
      </header>
      <figure class="article-cover-panel">
        <?php if ($cover): ?><img src="<?php echo esc_url($cover); ?>" alt="<?php echo esc_attr(get_the_title()); ?>" decoding="async" fetchpriority="high"><?php endif; ?>
        <figcaption><span>ARCHITECTURE &amp; THE REAL WORLD</span><span>نیکابنا / مجلهٔ معماری و ساخت</span></figcaption>
      </figure>
    </div>
    <div class="article-opening-baseline" aria-hidden="true"><span>FORM</span><i></i><span>CONTEXT</span><i></i><span>DECISION</span></div>
  </section>

  <?php if ($is_economy_story): ?>
  <section class="article-thesis" aria-label="سه محور اصلی این مقاله">
    <div class="container article-thesis-inner">
      <div class="article-thesis-title"><span>THE QUESTION / 001</span><strong>مسئله فقط «شروع کردن» نیست.</strong><p>سه موضوع در کنار هم مسیر تصمیم را روشن می‌کنند:</p></div>
      <div class="article-thesis-axes">
        <div><span>۰۱</span><strong>سرمایهٔ در دسترس</strong><small>فراتر از هزینهٔ شروع</small></div>
        <div><span>۰۲</span><strong>زمان‌بندی تعهدات</strong><small>هماهنگی پرداخت و اجرا</small></div>
        <div><span>۰۳</span><strong>امکان ادامهٔ کار</strong><small>مدیریت ریسک توقف</small></div>
      </div>
    </div>
  </section>
  <?php endif; ?>

  <div class="container article-reading-layout">
    <aside class="article-sidebar" aria-label="فهرست مقاله">
      <div class="article-sidebar-head"><span class="article-sidebar-mark" aria-hidden="true">N /</span><span>مسیر مطالعه</span></div>
      <?php if ($chapters): ?>
      <nav class="article-chapter-nav" aria-label="بخش‌های مقاله">
        <ol>
          <?php foreach ($chapters as $index => $chapter): ?>
          <li><a href="#<?php echo esc_attr($chapter['id']); ?>"><span><?php echo esc_html(str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT)); ?></span><?php echo esc_html($chapter['title']); ?></a></li>
          <?php endforeach; ?>
        </ol>
      </nav>
      <?php endif; ?>
      <a class="article-sidebar-back" href="<?php echo esc_url($back); ?>">بازگشت به <?php echo esc_html($back_label); ?> ←</a>
    </aside>
    <div class="article-content-column">
      <?php if ($chapters): ?>
      <details class="article-mobile-index"><summary>فهرست بخش‌های مقاله <span><?php echo esc_html(count($chapters)); ?> بخش</span></summary><ol><?php foreach ($chapters as $index => $chapter): ?><li><a href="#<?php echo esc_attr($chapter['id']); ?>"><?php echo esc_html($chapter['title']); ?></a></li><?php endforeach; ?></ol></details>
      <?php endif; ?>
      <div class="article-body-heading"><span>THE LONG READ</span><span class="article-body-rule"></span><span>متن کامل مقاله</span></div>
      <div class="prose article-prose">
        <?php echo $content_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- same filtered output as the_content(). ?>
      </div>
      <div class="article-ending"><span aria-hidden="true">✳</span><p>پایان مقاله</p><a href="<?php echo esc_url($back); ?>">مطالب بیشتر از مجله نیکابنا ←</a></div>
    </div>
  </div>
  <?php
    $related_args = array('post_type' => $is_news ? 'moj_news' : 'post', 'post_status' => 'publish',
        'post__not_in' => array(get_the_ID()), 'posts_per_page' => 3);
    if ($cats) $related_args['category__in'] = array_map(static fn($term) => (int) $term->term_id, $cats);
    $related = new WP_Query($related_args);
    if ($related->have_posts()):
  ?>
  <section class="container section related-reading"><div class="section-head"><div><span class="section-label">در ادامه بخوانید</span><h2 class="title-line">مطالب مرتبط</h2></div><a class="text-link" href="<?php echo esc_url($back); ?>">همه مطالب ←</a></div><div class="card-grid"><?php while ($related->have_posts()): $related->the_post(); mojarrad_render_editorial_card(); endwhile; ?></div></section>
  <?php endif; wp_reset_postdata(); ?>
</article>
