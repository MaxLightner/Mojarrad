<?php get_header(); ?>
<section class="section"><div class="container">
  <h1><?php post_type_archive_title(); ?></h1>
  <?php if ( have_posts() ) : ?>
    <div class="grid">
    <?php while ( have_posts() ) : the_post(); ?>
      <article class="card">
        <a href="<?php the_permalink(); ?>"><?php if ( has_post_thumbnail() ) { the_post_thumbnail( 'large' ); } ?></a>
        <div class="card-body">
          <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
          <p class="muted"><?php echo esc_html( wp_trim_words( get_the_excerpt(), 24 ) ); ?></p>
        </div>
      </article>
    <?php endwhile; ?>
    </div>
    <?php the_posts_pagination(); ?>
  <?php else : ?>
    <p class="notice">هنوز پروژه‌ای منتشر نشده است.</p>
  <?php endif; ?>
</div></section>
<?php get_footer(); ?>
