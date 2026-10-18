<?php get_header(); ?>
<div class="container"><section class="section">
<?php if ( have_posts() ) : ?>
  <?php while ( have_posts() ) : the_post(); ?>
    <article <?php post_class( 'article' ); ?>>
      <h1><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h1>
      <div><?php the_content(); ?></div>
    </article>
  <?php endwhile; ?>
  <?php the_posts_pagination(); ?>
<?php else : ?>
  <p class="notice">محتوایی یافت نشد.</p>
<?php endif; ?>
</section></div>
<?php get_footer(); ?>
