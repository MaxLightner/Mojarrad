<?php get_header(); ?>
<div class="container">
<?php while ( have_posts() ) : the_post(); ?>
  <article <?php post_class( 'article' ); ?>>
    <h1><?php the_title(); ?></h1>
    <?php if ( has_post_thumbnail() ) : ?><?php the_post_thumbnail( 'full' ); ?><?php endif; ?>
    <div><?php the_content(); ?></div>
    <a class="link" href="<?php echo esc_url( get_post_type_archive_link( 'moj_project' ) ); ?>">بازگشت به پروژه‌ها ←</a>
  </article>
<?php endwhile; ?>
</div>
<?php get_footer(); ?>
