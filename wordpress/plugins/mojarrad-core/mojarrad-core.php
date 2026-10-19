<?php
/**
 * Plugin Name: Mojarrad Core
 * Description: WordPress content, memberships and role-aware dashboard backend for Nika Bana.
 * Version: 0.4.0
 * Requires at least: 6.5
 * Requires PHP: 8.1
 * Text Domain: mojarrad-core
 */
defined('ABSPATH') || exit;

define('MOJARRAD_CORE_VERSION', '0.4.0');
define('MOJARRAD_CORE_PATH', plugin_dir_path(__FILE__));

require_once MOJARRAD_CORE_PATH . 'includes/class-schema.php';
require_once MOJARRAD_CORE_PATH . 'includes/class-access.php';
require_once MOJARRAD_CORE_PATH . 'includes/class-rest.php';
require_once MOJARRAD_CORE_PATH . 'includes/class-public-content.php';
require_once MOJARRAD_CORE_PATH . 'includes/class-leads.php';
require_once MOJARRAD_CORE_PATH . 'includes/class-membership.php';
require_once MOJARRAD_CORE_PATH . 'includes/class-timeline-access.php';
require_once MOJARRAD_CORE_PATH . 'includes/class-timeline.php';
require_once MOJARRAD_CORE_PATH . 'includes/class-timeline-media.php';

function mojarrad_register_content_types() {
    register_post_type('moj_project', array(
        'labels'=>array('name'=>'پروژه‌ها','singular_name'=>'پروژه','add_new_item'=>'پروژه جدید','edit_item'=>'ویرایش پروژه'),
        'public'=>true, 'show_in_rest'=>true, 'has_archive'=>true,
        'rewrite'=>array('slug'=>'projects'),'menu_icon'=>'dashicons-building',
        'supports'=>array('title','editor','excerpt','thumbnail','revisions'),
        'capability_type'=>array('moj_project','moj_projects'),'map_meta_cap'=>true,
    ));
    register_taxonomy('moj_project_status','moj_project',array(
        'labels'=>array('name'=>'وضعیت پروژه'), 'hierarchical'=>true, 'public'=>true,
        'show_in_rest'=>true, 'show_admin_column'=>true, 'rewrite'=>array('slug'=>'project-status'),
        'capabilities'=>array(
            'manage_terms'=>'manage_moj_projects','edit_terms'=>'manage_moj_projects',
            'delete_terms'=>'manage_moj_projects','assign_terms'=>'edit_moj_projects',
        ),
    ));
    register_post_type('moj_news',array(
        'labels'=>array('name'=>'اخبار','singular_name'=>'خبر','add_new_item'=>'خبر جدید'),
        'public'=>true,'show_in_rest'=>true,'has_archive'=>true,'rewrite'=>array('slug'=>'news'),
        'menu_icon'=>'dashicons-megaphone',
        'supports'=>array('title','editor','excerpt','thumbnail','revisions'),'taxonomies'=>array('category'),
    ));
    register_post_type('moj_official',array(
        'labels'=>array('name'=>'مسئولین','singular_name'=>'مسئول','add_new_item'=>'عضو جدید'),
        'public'=>true,'show_in_rest'=>true,'has_archive'=>true,'rewrite'=>array('slug'=>'officials'),
        'menu_icon'=>'dashicons-groups','supports'=>array('title','editor','thumbnail','revisions'),
    ));
    register_post_type('moj_lead',array(
        'labels'=>array('name'=>'درخواست‌های دریافتی','singular_name'=>'درخواست'),
        'public'=>false,'publicly_queryable'=>false,'exclude_from_search'=>true,
        'show_ui'=>true,'show_in_rest'=>false,'menu_icon'=>'dashicons-email-alt',
        'supports'=>array('title'),
        'capability_type'=>array('moj_lead','moj_leads'),'map_meta_cap'=>true,
        'capabilities'=>array('create_posts'=>'do_not_allow'),
    ));
}
add_action('init','mojarrad_register_content_types');

function mojarrad_setup_roles() {
    foreach(array(
        'moj_executor'=>'مجری','moj_engineer'=>'مهندس','moj_foreman'=>'سرپرست کارگاه',
        'moj_supervisor'=>'ناظر','moj_owner'=>'مالک','moj_contractor'=>'پیمانکار',
    ) as $slug=>$name) {
        if(!get_role($slug)) add_role($slug,$name,array('read'=>true));
    }
    $admin=get_role('administrator');
    if($admin) foreach(array(
        'manage_moj_projects','edit_moj_project','read_moj_project','delete_moj_project',
        'edit_moj_projects','edit_others_moj_projects','publish_moj_projects',
        'read_private_moj_projects','delete_moj_projects','delete_private_moj_projects',
        'delete_published_moj_projects','delete_others_moj_projects',
        'edit_private_moj_projects','edit_published_moj_projects','create_moj_projects',
        'edit_moj_lead','read_moj_lead','delete_moj_lead',
        'edit_moj_leads','edit_others_moj_leads','read_private_moj_leads',
        'delete_moj_leads','delete_private_moj_leads','delete_others_moj_leads',
    ) as $cap) $admin->add_cap($cap);
}
function mojarrad_seed_status_terms() {
    foreach(array('in-progress'=>'در دست اقدام','completed'=>'انجام‌شده','future'=>'پروژه‌های آینده') as $slug=>$name) {
        if(!term_exists($slug,'moj_project_status')) wp_insert_term($name,'moj_project_status',array('slug'=>$slug));
    }
}
function mojarrad_create_public_pages() {
    $pages=array(
        'about'=>array('درباره ما','page-about.php'),
        'sale'=>array('فروش املاک','page-sale.php'),
        'consulting'=>array('مشاوره','page-consulting.php'),
        'collaborate'=>array('همکاری','page-collaborate.php'),
        'blog'=>array('وبلاگ','page-blog.php'),
        'login'=>array('ورود اعضا','page-login.php'),
        'dashboard'=>array('پنل من','page-dashboard.php'),
        'timeline'=>array('تایم‌لاین پروژه','page-timeline.php'),
    );
    foreach($pages as $slug=>$details) {
        $existing=get_page_by_path($slug);
        if($existing) {
            if(!get_post_meta($existing->ID,'_wp_page_template',true) || get_post_meta($existing->ID,'_wp_page_template',true)==='default') {
                update_post_meta($existing->ID,'_wp_page_template',$details[1]);
            }
            continue;
        }
        $id=wp_insert_post(array(
            'post_type'=>'page','post_status'=>'publish','post_name'=>$slug,
            'post_title'=>$details[0],'post_content'=>'',
        ),true);
        if(!is_wp_error($id) && $id) update_post_meta($id,'_wp_page_template',$details[1]);
    }
}
function mojarrad_core_activate() {
    mojarrad_register_content_types();
    mojarrad_setup_roles();
    Mojarrad_Schema::install();
    mojarrad_seed_status_terms();
    mojarrad_create_public_pages();
    update_option('mojarrad_core_version',MOJARRAD_CORE_VERSION,false);
    flush_rewrite_rules();
}
register_activation_hook(__FILE__,'mojarrad_core_activate');
register_deactivation_hook(__FILE__,'flush_rewrite_rules');

/** Upgrade older v0.1 instances without plugin reactivation or destructive seeding. */
function mojarrad_core_upgrade() {
    if(get_option('mojarrad_core_version')===MOJARRAD_CORE_VERSION) return;
    mojarrad_setup_roles();
    if(get_option('mojarrad_schema_version')!==Mojarrad_Schema::VERSION) Mojarrad_Schema::install();
    mojarrad_seed_status_terms();
    mojarrad_create_public_pages();
    update_option('mojarrad_core_version',MOJARRAD_CORE_VERSION,false);
    flush_rewrite_rules(false);
}
add_action('init','mojarrad_core_upgrade',20);

add_action('rest_api_init',array('Mojarrad_REST','register_routes'));
add_action('rest_api_init',array('Mojarrad_Timeline','register_routes'));
add_action('admin_post_mojarrad_private_media',array('Mojarrad_Timeline_Media','download'));
add_action('add_meta_boxes_moj_project',array('Mojarrad_Public_Content','project_box'));
add_action('add_meta_boxes_moj_official',array('Mojarrad_Public_Content','official_box'));
add_action('save_post_moj_project',array('Mojarrad_Public_Content','save_project'));
add_action('save_post_moj_official',array('Mojarrad_Public_Content','save_official'));
add_action('admin_enqueue_scripts',array('Mojarrad_Public_Content','enqueue_admin'));
add_action('add_meta_boxes_moj_lead',array('Mojarrad_Leads','details_box'));
add_action('admin_post_nopriv_mojarrad_lead',array('Mojarrad_Leads','handle'));
add_action('admin_post_mojarrad_lead',array('Mojarrad_Leads','handle'));
add_action('add_meta_boxes_moj_project',array('Mojarrad_Membership','register_box'));
add_action('save_post_moj_project',array('Mojarrad_Membership','save_project_members'));

add_filter('login_redirect',function($redirect,$requested,$user) {
    if($user instanceof WP_User && !user_can($user,'manage_moj_projects')) {
        return home_url('/dashboard/');
    }
    return $redirect;
},10,3);
