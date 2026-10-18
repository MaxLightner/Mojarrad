<?php
defined( 'ABSPATH' ) || exit;

add_action( 'after_setup_theme', function () {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', array( 'search-form', 'gallery', 'caption', 'style', 'script' ) );
    register_nav_menus( array( 'primary' => __( 'Main navigation', 'mojarrad' ) ) );
} );
add_action( 'wp_enqueue_scripts', function () {
    wp_enqueue_style( 'mojarrad', get_stylesheet_uri(), array(), wp_get_theme()->get( 'Version' ) );
} );
function mojarrad_fallback_menu() {
    echo '<ul><li><a href="' . esc_url( home_url( '/' ) ) . '">خانه</a></li>';
    if ( post_type_exists( 'moj_project' ) ) {
        echo '<li><a href="' . esc_url( get_post_type_archive_link( 'moj_project' ) ) . '">پروژه‌ها</a></li>';
    }
    echo '</ul>';
}
