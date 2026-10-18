<?php get_header(); ?>
<section class="hero hero-home" aria-label="معرفی گروه">
  <img class="hero-photo" src="<?php echo esc_url( mojarrad_asset( 'images/villa-z-1.jpg' ) ); ?>" alt="" />
  <div class="hero-gradient"></div>
  <div class="container hero-inner">
    <div class="hero-copy">
      <span class="eyebrow glass">گروه ساختمانی نیکا بنا — مشهد</span>
      <h1>می‌سازیم تا <span class="gold-text">ماندگار</span> بماند</h1>
      <p>گروه ساختمانی نیکا بنا به مدیریت مهندس حسین مجرد، با تکیه بر تجربه ساخت در مشهد، پروژه‌های معماری را با شفافیت برای مالکان اجرا می‌کند؛ از تحلیل زمین و برآورد هزینه تا تحویل پایان‌کار.</p>
      <div class="button-row">
        <a class="btn-gold btn-large" href="<?php echo esc_url( mojarrad_link( 'projects' ) ); ?>">مشاهده پروژه‌ها</a>
        <a class="btn-outline btn-large glass" href="<?php echo esc_url( mojarrad_link( 'sale' ) ); ?>">املاک در فروش</a>
      </div>
    </div>
  </div>
  <a class="hero-scroll" href="#quick-access" aria-label="بخش بعدی">⌄</a>
</section>
<section class="container section-small" id="quick-access" aria-label="دسترسی سریع">
  <div class="quick-grid">
    <?php foreach ( array(
        array('projects','پروژه‌ها','تکمیل‌شده، در دست اقدام و آینده','▥'),
        array('sale','فروش املاک','فرصت‌های فروش و سرمایه‌گذاری','⌂'),
        array('blog','وبلاگ فنی','دانش و فناوری‌های ساخت','▤'),
        array('news','اخبار','بازار مصالح، قوانین و اخبار','◈'),
    ) as $quick ) : ?>
      <a class="card-lux quick-card" href="<?php echo esc_url( mojarrad_link( $quick[0] ) ); ?>">
        <span class="quick-icon" aria-hidden="true"><?php echo esc_html( $quick[3] ); ?></span>
        <strong><?php echo esc_html( $quick[1] ); ?></strong>
        <span class="muted"><?php echo esc_html( $quick[2] ); ?></span>
      </a>
    <?php endforeach; ?>
  </div>
</section>
<section class="container section" aria-label="پروژه‌های شاخص">
  <div class="section-head">
    <div><span class="section-label">نمونه‌کارها</span><h2 class="title-line">پروژه‌های شاخص</h2></div>
    <a class="text-link" href="<?php echo esc_url( mojarrad_link( 'projects' ) ); ?>">همه پروژه‌ها ←</a>
  </div>
  <?php if ( post_type_exists( 'moj_project' ) ) :
      $projects = new WP_Query( array(
          'post_type'=>'moj_project', 'post_status'=>'publish', 'posts_per_page'=>3, 'orderby'=>'date','order'=>'DESC',
      ) );
  ?>
    <?php if ( $projects->have_posts() ) : ?>
      <div class="card-grid">
        <?php while ( $projects->have_posts() ) : $projects->the_post(); mojarrad_render_project_card(); endwhile; ?>
      </div>
    <?php else : ?><p class="notice">هنوز پروژه‌ای منتشر نشده است.</p><?php endif; ?>
    <?php wp_reset_postdata(); ?>
  <?php else : ?><p class="notice">برای نمایش پروژه‌ها افزونه Mojarrad Core را فعال کنید.</p><?php endif; ?>
</section>
<?php
$for_sale = post_type_exists('moj_project') ? new WP_Query( array(
    'post_type'=>'moj_project','post_status'=>'publish','posts_per_page'=>3,
    'meta_query'=>array( array('key'=>'moj_for_sale','value'=>'1') ),
) ) : null;
?>
<?php if ( $for_sale && $for_sale->have_posts() ) : ?>
<section class="band section" aria-label="املاک در فروش">
  <div class="container">
    <div class="section-head">
      <div><span class="section-label">فرصت سرمایه‌گذاری</span><h2 class="title-line">املاک در فروش</h2></div>
      <a class="text-link" href="<?php echo esc_url( mojarrad_link('sale') ); ?>">بخش فروش ←</a>
    </div>
    <div class="card-grid"><?php while ( $for_sale->have_posts() ) : $for_sale->the_post(); mojarrad_render_project_card(); endwhile; ?></div>
  </div>
</section>
<?php endif; if ( $for_sale ) { wp_reset_postdata(); } ?>
<?php
$news = post_type_exists('moj_news') ? new WP_Query(array('post_type'=>'moj_news','posts_per_page'=>3,'post_status'=>'publish')) : null;
?>
<section class="container section">
  <div class="section-head"><div><span class="section-label">بازار و سیاست</span><h2 class="title-line">آخرین اخبار</h2></div><a class="text-link" href="<?php echo esc_url( mojarrad_link('news') ); ?>">همه اخبار ←</a></div>
  <?php if ( $news && $news->have_posts() ) : ?><div class="card-grid">
    <?php while ( $news->have_posts() ) : $news->the_post(); mojarrad_render_editorial_card(); endwhile; ?>
  </div><?php else : ?><p class="notice">هنوز خبری منتشر نشده است.</p><?php endif; ?>
  <?php if ( $news ) { wp_reset_postdata(); } ?>
</section>
<?php $articles = new WP_Query(array('post_type'=>'post','post_status'=>'publish','posts_per_page'=>3)); ?>
<section class="container section">
  <div class="section-head"><div><span class="section-label">دانش ساخت</span><h2 class="title-line">از وبلاگ فنی</h2></div><a class="text-link" href="<?php echo esc_url( mojarrad_link('blog') ); ?>">وبلاگ ←</a></div>
  <?php if ( $articles->have_posts() ) : ?><div class="card-grid">
    <?php while ( $articles->have_posts() ) : $articles->the_post(); mojarrad_render_editorial_card(); endwhile; ?>
  </div><?php else : ?><p class="notice">هنوز مقاله‌ای منتشر نشده است.</p><?php endif; ?>
  <?php wp_reset_postdata(); ?>
</section>
<section class="container cta-band">
  <div><span class="section-label">همکاری با ما</span><h2>برای پروژه بعدی برنامه‌ریزی می‌کنید؟</h2><p class="muted">از مشاوره سرمایه‌گذاری تا اجرای پروژه، همراه شما هستیم.</p></div>
  <a class="btn-gold" href="<?php echo esc_url( mojarrad_link('consulting') ); ?>">درخواست مشاوره</a>
</section>
<?php get_footer(); ?>
