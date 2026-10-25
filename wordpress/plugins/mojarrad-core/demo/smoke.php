<?php
/**
 * In-Playground integration checks (not a production-facing REST or UI endpoint).
 */
defined('ABSPATH') || exit;
if(!defined('MOJARRAD_PLAYGROUND_SEED') || MOJARRAD_PLAYGROUND_SEED!==true) return;

$previous=get_current_user_id();
$required_cpt=array('moj_project','moj_news','moj_official','moj_lead');
foreach($required_cpt as $key) if(!post_type_exists($key)) throw new RuntimeException('Missing CPT: '.$key);
foreach(array('about','sale','consulting','collaborate','blog','login','dashboard') as $slug) {
    if(!get_page_by_path($slug)) throw new RuntimeException('Required page missing: '.$slug);
}
$editorial_draft=get_page_by_path('sakhtan-ya-sabr',OBJECT,'post');
if(!$editorial_draft || $editorial_draft->post_status!=='draft') {
    throw new RuntimeException('First editorial article was not imported as a private draft.');
}
if(!get_post_meta($editorial_draft->ID,'_moj_seo_description',true) ||
   !get_post_meta($editorial_draft->ID,'_moj_editorial_source_id',true)) {
    throw new RuntimeException('Editorial source/SEO metadata missing.');
}
$public_editorial=get_posts(array('post_type'=>'post','post_status'=>'publish','include'=>array($editorial_draft->ID),'numberposts'=>1));
if($public_editorial) throw new RuntimeException('Unapproved editorial article leaked into public posts.');

if(!has_action('admin_post_nopriv_mojarrad_lead') || !has_action('save_post_moj_project',array('Mojarrad_Public_Content','save_project'))) {
    throw new RuntimeException('Lead or editor save handler not wired.');
}
foreach(array('moj_owner','moj_supervisor','moj_engineer','moj_contractor','moj_executor') as $slug) {
    if(!get_role($slug)) throw new RuntimeException('Custom user role missing: '.$slug);
}
$first=get_page_by_path('torghabe-anjiri-1',OBJECT,'moj_project');
$second=get_page_by_path('dahm-sharie-villa',OBJECT,'moj_project');
if(!$first || !$second) throw new RuntimeException('Demo projects unavailable.');
$owner=get_user_by('login','moj_demo_owner');
$contractor=get_user_by('login','moj_demo_contractor');
$supervisor=get_user_by('login','moj_demo_supervisor');
if(!$owner || !$contractor || !$supervisor) throw new RuntimeException('Demo identities unavailable.');
if(!Mojarrad_Access::can_read((int)$owner->ID,(int)$first->ID)) throw new RuntimeException('Owner assignment failed.');
if(Mojarrad_Access::can_read((int)$owner->ID,(int)$second->ID)) throw new RuntimeException('Owner can access unrelated project.');
if(!Mojarrad_Access::can_read((int)$contractor->ID,(int)$second->ID)) throw new RuntimeException('Contractor assignment failed.');
if(Mojarrad_Access::can_read((int)$contractor->ID,(int)$first->ID)) throw new RuntimeException('Contractor can access unrelated project.');
if(in_array('payments',Mojarrad_Access::modules_for_role('supervisor'),true)) throw new RuntimeException('Supervisor finance role leak.');
if(in_array('payments',Mojarrad_Access::modules_for_role('contractor'),true)) throw new RuntimeException('Contractor finance role leak.');

wp_set_current_user((int)$owner->ID);
$req=new WP_REST_Request('GET','/mojarrad/v1/me/projects');
$resp=rest_do_request($req);
if($resp->get_status()!==200) throw new RuntimeException('Authenticated project endpoint failed.');
$data=$resp->get_data();
$ids=array_map('intval',array_column($data['projects'],'id'));
if(!in_array((int)$first->ID,$ids,true) || in_array((int)$second->ID,$ids,true)) {
    throw new RuntimeException('REST endpoint leaked a project across clients.');
}
wp_set_current_user((int)$supervisor->ID);
$resp2=rest_do_request(new WP_REST_Request('GET','/mojarrad/v1/me'));
if($resp2->get_status()!==200 || $resp2->get_data()['role']!=='supervisor') {
    throw new RuntimeException('Role identity endpoint returned incorrect role.');
}
wp_set_current_user(0);
$anonymous=rest_do_request(new WP_REST_Request('GET','/mojarrad/v1/me/projects'));
if($anonymous->get_status()===200) throw new RuntimeException('Anonymous project data unexpectedly visible.');
wp_set_current_user($previous);
update_option('mojarrad_playground_smoke','passed',false);

if (get_option('users_can_register')) throw new RuntimeException('Public member registration is open.');
$project_login=add_query_arg('project',(int)$first->ID,home_url('/timeline/'));
$allowed_login=Mojarrad_User_Admin::login_redirect(home_url('/dashboard/'),$project_login,$owner);
if ($allowed_login!==$project_login) throw new RuntimeException('QR project redirect denied assigned user. requested='.$project_login.' got='.$allowed_login.' validated='.wp_validate_redirect($project_login,''));
$denied_login=Mojarrad_User_Admin::login_redirect(home_url('/dashboard/'),$project_login,$contractor);
if ($denied_login!==home_url('/dashboard/')) throw new RuntimeException('QR redirect leaked unrelated project.');
$external=Mojarrad_User_Admin::login_redirect(home_url('/dashboard/'),'https://example.net/private',$owner);
if ($external!==home_url('/dashboard/')) throw new RuntimeException('External login redirect was allowed.');

require __DIR__.'/timeline-smoke.php';

require __DIR__.'/office-smoke.php';
