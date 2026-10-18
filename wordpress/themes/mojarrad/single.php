<?php get_header(); ?>
<div class="container">
<?php while(have_posts()):the_post(); ?>
<article <?php post_class('article'); ?>>
  <a class="text-link" href="<?php echo esc_url(home_url('/')); ?>">← صفحه اصلی</a>
  <h1><?php the_title(); ?></h1>
  <p class="muted"><?php echo esc_html(get_the_date('Y/m/d')); ?></p>
  <?php if(has_post_thumbnail())the_post_thumbnail('large'); ?>
  <div class="prose"><?php the_content(); ?></div>
</article>
<?php endwhile; ?>
</div>
<?php get_footer(); ?>
