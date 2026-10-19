<?php
defined('ABSPATH') || exit;

final class Mojarrad_REST {
    public static function register_routes() {
        register_rest_route('mojarrad/v1','/me',array(
            'methods'=>WP_REST_Server::READABLE,
            'callback'=>array(__CLASS__,'me'),
            'permission_callback'=>array(__CLASS__,'require_login'),
        ));
        register_rest_route('mojarrad/v1','/me/projects',array(
            'methods'=>WP_REST_Server::READABLE,
            'callback'=>array(__CLASS__,'my_projects'),
            'permission_callback'=>array(__CLASS__,'require_login'),
        ));
    }
    public static function require_login(): bool {return is_user_logged_in();}

    public static function me(WP_REST_Request $request): WP_REST_Response {
        $user=wp_get_current_user();
        $role=Mojarrad_Access::role_for($user);
        return new WP_REST_Response(array(
            'id'=>$user->ID,
            'name'=>$user->display_name,
            'role'=>$role,
            'roleLabel'=>Mojarrad_Access::role_label($role),
            'modules'=>Mojarrad_Access::modules_for_role($role),
        ),200);
    }
    public static function my_projects(WP_REST_Request $request): WP_REST_Response {
        $uid=get_current_user_id();
        $all=Mojarrad_Access::is_global_reader($uid);
        $ids=$all
            ? get_posts(array(
                'post_type'=>'moj_project','post_status'=>array('publish','private'),
                'posts_per_page'=>250,'fields'=>'ids',
            ))
            : Mojarrad_Access::assigned_ids($uid);
        $rows=array();
        foreach($ids as $id) {
            $id=(int)$id;
            if(!Mojarrad_Access::can_read($uid,$id)) continue;
            $terms=get_the_terms($id,'moj_project_status');
            $status=($terms && !is_wp_error($terms)) ? $terms[0]->slug : 'other';
            $rows[]=array(
                'id'=>$id,
                'slug'=>get_post_field('post_name',$id),
                'title'=>get_the_title($id),
                'status'=>$status,
                'location'=>(string)get_post_meta($id,'moj_location',true),
                'progress'=>min(100,max(0,(int)get_post_meta($id,'moj_progress',true))),
                'url'=>get_permalink($id),
                // Only public project metadata. Private records are intentionally absent.
            );
        }
        return new WP_REST_Response(array('projects'=>$rows),200);
    }
}
