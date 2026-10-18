<?php get_header(); ?>
<section class="hero"><div class="container">
  <h1><?php echo esc_html( get_bloginfo( 'name' ) ); ?></h1>
  <p><?php echo esc_html( get_bloginfo( 'description' ) ); ?></p>
  <?php if ( post_type_exists( 'moj_project' ) ) : ?>
    <a class="link" href="<?php echo esc_url( get_post_type_archive_link( 'moj_project' ) ); ?>">مشاهده پروژه‌ها ←</a>
  <?php endif; ?>
</div></section>
<section class="section"><div class="container">
  <h2>پروژه‌ها</h2>
  <?php if ( post_type_exists( 'moj_project' ) ) : ?>
    <?php $projects = new WP_Query( array( 'post_type' => 'moj_project', 'post_status' => 'publish', 'posts_per_page' => 6 ) ); ?>
    <?php if ( $projects->have_posts() ) : ?>
      <div class="grid">
      <?php while ( $projects->have_posts() ) : $projects->the_post(); ?>
        <article class="card">
          <a href="<?php the_permalink(); ?>"><?php if ( has_post_thumbnail() ) { the_post_thumbnail( 'large' ); } ?></a>
          <div class="card-body">
            <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
            <p class="muted"><?php echo esc_html( wp_trim_words( get_the_excerpt(), 24 ) ); ?></p>
            <a class="link" href="<?php the_permalink(); ?>">جزئیات پروژه ←</a>
          </div>
        </article>
      <?php endwhile; ?>
      </div>
    <?php else : ?>
      <p class="notice">هنوز پروژه‌ای منتشر نشده است.</p>
    <?php endif; ?>
    <?php wp_reset_postdata(); ?>
  <?php else : ?>
    <p class="notice">افزونه Mojarrad Core را فعال کنید.</p>
  <?php endif; ?>
</div></section>
<?php get_footer(); ?>
