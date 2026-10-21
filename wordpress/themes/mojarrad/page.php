<?php get_header(); ?>
<?php while(have_posts()):the_post(); ?>
<section class="editorial-page-heading container generic-page-heading">
  <div><span class="editorial-index">NIKA BANA / PAGE</span><span class="section-label">نیکا بنا</span><h1><?php the_title(); ?></h1></div>
  <?php if(has_excerpt()): ?><p><?php echo esc_html(get_the_excerpt()); ?></p><?php endif; ?>
</section>
<div class="container generic-page-body"><article <?php post_class('prose'); ?>><?php if(has_post_thumbnail()): ?><div class="generic-featured"><?php the_post_thumbnail('full'); ?></div><?php endif; ?><?php the_content(); ?></article></div>
<?php endwhile; get_footer(); ?>