<?php get_header(); ?>
<section class="editorial-page-heading container">
 <div><span class="editorial-index">NIKA BANA / PEOPLE</span><span class="section-label">افراد و مسئولیت‌ها</span><h1>پشت هر پروژه، <em>انسان‌ها هستند.</em></h1></div>
 <p>معرفی مدیریت مجموعه و افرادی که اطلاعاتشان برای انتشار در وب‌سایت ثبت شده است.</p>
</section>
<section class="container section people-section">
  <?php if(have_posts()): ?><div class="card-grid people-grid"><?php while(have_posts()):the_post(); ?>
    <article class="card-lux people-card"><div class="people-avatar"><?php if(has_post_thumbnail()){the_post_thumbnail('medium');}else{echo '<span aria-hidden="true">NB</span>';} ?></div><span class="section-label"><?php echo esc_html(mojarrad_meta('official_role')); ?></span><h2><?php the_title(); ?></h2><p class="muted"><?php echo esc_html(wp_trim_words(get_the_content(),42)); ?></p></article>
  <?php endwhile; ?></div><?php the_posts_pagination(); ?>
  <?php else: ?><div class="people-intro"><div class="people-monogram" aria-hidden="true">HM</div><div><span class="section-label">مدیریت مجموعه</span><h2>مهندس حسین مجرد</h2><p>مدیریت گروه ساختمانی نیکا بنا. هماهنگی، کنترل کیفیت و ارتباط روشن با عوامل پروژه در محور شیوه کار مجموعه قرار دارد.</p><a class="text-link" href="<?php echo esc_url(mojarrad_link('about')); ?>">بیشتر درباره مجموعه ←</a></div></div><?php endif; ?>
</section>
<section class="container editorial-contact"><div><span class="section-label">همکاری</span><h2>به شبکه همکاران ما <em>بپیوندید.</em></h2></div><a class="btn-gold" href="<?php echo esc_url(mojarrad_link('collaborate')); ?>">معرفی تخصص ↖</a></section>
<?php get_footer(); ?>