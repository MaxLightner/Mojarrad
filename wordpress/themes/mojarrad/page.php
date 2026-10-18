<?php get_header(); ?>
<div class="container"><?php while(have_posts()):the_post(); ?>
<article <?php post_class('article'); ?>>
  <h1><?php the_title(); ?></h1>
  <div class="prose"><?php the_content(); ?></div>
</article>
<?php endwhile; ?></div>
<?php get_footer(); ?>
