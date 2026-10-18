<!doctype html>
<html <?php language_attributes(); ?> dir="rtl">
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="screen-reader-text" href="#main">رفتن به محتوا</a>
<header class="site-header">
  <div class="container head-inner">
    <a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></a>
    <nav class="menu" aria-label="ناوبری اصلی">
      <?php wp_nav_menu( array( 'theme_location' => 'primary', 'container' => false, 'fallback_cb' => 'mojarrad_fallback_menu' ) ); ?>
    </nav>
  </div>
</header>
<main id="main">
