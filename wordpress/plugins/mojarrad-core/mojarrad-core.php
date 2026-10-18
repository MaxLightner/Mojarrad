<?php
/**
 * Plugin Name: Mojarrad Core
 * Description: WordPress backend foundation for Mojarrad projects.
 * Version: 0.1.0
 * Requires at least: 6.5
 * Requires PHP: 8.1
 * Text Domain: mojarrad-core
 */
defined( 'ABSPATH' ) || exit;

define( 'MOJARRAD_CORE_VERSION', '0.1.0' );
define( 'MOJARRAD_CORE_PATH', plugin_dir_path( __FILE__ ) );
require_once MOJARRAD_CORE_PATH . 'includes/class-schema.php';
require_once MOJARRAD_CORE_PATH . 'includes/class-access.php';
require_once MOJARRAD_CORE_PATH . 'includes/class-rest.php';

function mojarrad_register_content_types() {
    register_post_type( 'moj_project', array(
        'labels' => array( 'name' => __( 'Projects', 'mojarrad-core' ), 'singular_name' => __( 'Project', 'mojarrad-core' ) ),
        'public' => true,
        'show_in_rest' => true,
        'has_archive' => true,
        'rewrite' => array( 'slug' => 'projects' ),
        'menu_icon' => 'dashicons-building',
        'supports' => array( 'title', 'editor', 'excerpt', 'thumbnail', 'revisions' ),
        'capability_type' => array( 'moj_project', 'moj_projects' ),
        'map_meta_cap' => true,
    ) );
    register_taxonomy( 'moj_project_status', 'moj_project', array(
        'labels' => array( 'name' => __( 'Project statuses', 'mojarrad-core' ) ),
        'hierarchical' => true, 'public' => true, 'show_in_rest' => true, 'show_admin_column' => true,
        'rewrite' => array( 'slug' => 'project-status' ),
        'capabilities' => array(
            'manage_terms' => 'manage_moj_projects',
            'edit_terms' => 'manage_moj_projects',
            'delete_terms' => 'manage_moj_projects',
            'assign_terms' => 'edit_moj_projects',
        ),
    ) );
}
add_action( 'init', 'mojarrad_register_content_types' );

function mojarrad_setup_roles() {
    $roles = array(
        'moj_executor' => 'مجری', 'moj_engineer' => 'مهندس',
        'moj_foreman' => 'سرپرست کارگاه', 'moj_supervisor' => 'ناظر',
        'moj_owner' => 'مالک', 'moj_contractor' => 'پیمانکار',
    );
    foreach ( $roles as $key => $name ) {
        if ( ! get_role( $key ) ) {
            add_role( $key, $name, array( 'read' => true ) );
        }
    }
    $admin = get_role( 'administrator' );
    if ( $admin ) {
        foreach ( array(
            'manage_moj_projects', 'edit_moj_project', 'read_moj_project', 'delete_moj_project',
            'edit_moj_projects', 'edit_others_moj_projects', 'publish_moj_projects',
            'read_private_moj_projects', 'delete_moj_projects', 'delete_private_moj_projects',
            'delete_published_moj_projects', 'delete_others_moj_projects',
            'edit_private_moj_projects', 'edit_published_moj_projects', 'create_moj_projects',
        ) as $cap ) {
            $admin->add_cap( $cap );
        }
    }
}
function mojarrad_activate() {
    mojarrad_setup_roles();
    mojarrad_register_content_types();
    Mojarrad_Schema::install();
    flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'mojarrad_activate' );
register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );
add_action( 'rest_api_init', array( 'Mojarrad_REST', 'register_routes' ) );


/** Create public route pages only on activation, without overwriting existing content. */
function mojarrad_create_public_pages() {
    $pages = array(
        'about' => array( 'درباره ما', 'page-about.php' ),
        'sale' => array( 'فروش املاک', 'page-sale.php' ),
        'consulting' => array( 'مشاوره', 'page-consulting.php' ),
        'collaborate' => array( 'همکاری', 'page-collaborate.php' ),
        'blog' => array( 'وبلاگ', 'page-blog.php' ),
    );
    foreach ( $pages as $slug => $data ) {
        $existing = get_page_by_path( $slug );
        if ( $existing ) { continue; }
        $id = wp_insert_post( array(
            'post_type' => 'page',
            'post_status' => 'publish',
            'post_name' => $slug,
            'post_title' => $data[0],
            'post_content' => '',
        ), true );
        if ( ! is_wp_error( $id ) && $id ) {
            update_post_meta( $id, '_wp_page_template', $data[1] );
        }
    }
}
