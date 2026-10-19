<?php
defined('ABSPATH') || exit;

final class Mojarrad_Access {
    public static function role_for(WP_User $user): string {
        if(user_can($user,'manage_moj_projects')) return 'admin';
        foreach(array('moj_executor','moj_engineer','moj_foreman','moj_supervisor','moj_owner','moj_contractor') as $slug) {
            if(in_array($slug,(array)$user->roles,true)) return substr($slug,4);
        }
        return 'visitor';
    }
    public static function role_label(string $role): string {
        $labels=array('admin'=>'مدیر سیستم','executor'=>'مجری','engineer'=>'مهندس','foreman'=>'سرپرست کارگاه','supervisor'=>'ناظر','owner'=>'مالک','contractor'=>'پیمانکار','visitor'=>'کاربر');
        return $labels[$role] ?? 'کاربر';
    }
    public static function is_global_reader(int $uid): bool {
        $user=get_userdata($uid);
        return $user && in_array(self::role_for($user),array('admin','executor'),true);
    }
    public static function assigned_ids(int $uid): array {
        if($uid<=0) return array();
        global $wpdb;
        $t=$wpdb->prefix.'moj_project_access';
        return array_map('intval',(array)$wpdb->get_col($wpdb->prepare(
            "SELECT project_id FROM {$t} WHERE user_id = %d ORDER BY created_at DESC",$uid
        )));
    }
    public static function assigned_users(int $project_id): array {
        if($project_id<=0) return array();
        global $wpdb;
        $t=$wpdb->prefix.'moj_project_access';
        return array_map('intval',(array)$wpdb->get_col($wpdb->prepare(
            "SELECT user_id FROM {$t} WHERE project_id = %d",$project_id
        )));
    }
    public static function can_read(int $uid,int $project_id): bool {
        if($uid<=0 || $project_id<=0) return false;
        $post=get_post($project_id);
        if(!$post || $post->post_type!=='moj_project' || !in_array($post->post_status,array('publish','private'),true)) return false;
        if(self::is_global_reader($uid)) return true;
        global $wpdb;
        $t=$wpdb->prefix.'moj_project_access';
        return (bool)$wpdb->get_var($wpdb->prepare(
            "SELECT 1 FROM {$t} WHERE project_id = %d AND user_id = %d LIMIT 1",$project_id,$uid
        ));
    }
    public static function set_project_users(int $project_id,array $user_ids): bool {
        if(!current_user_can('manage_moj_projects') || get_post_type($project_id)!=='moj_project') return false;
        global $wpdb;
        $t=$wpdb->prefix.'moj_project_access';
        $target=array_values(array_unique(array_map('absint',$user_ids)));
        $current=self::assigned_users($project_id);
        foreach(array_diff($current,$target) as $id) {
            $wpdb->delete($t,array('project_id'=>$project_id,'user_id'=>$id),array('%d','%d'));
        }
        foreach(array_diff($target,$current) as $id) {
            if(!get_userdata($id)) continue;
            $wpdb->insert($t,array(
                'project_id'=>$project_id,'user_id'=>$id,
                'created_at'=>current_time('mysql',true)
            ),array('%d','%d','%s'));
        }
        return true;
    }
    /** Tool permissions for modules not yet implemented: never treated as action authorization. */
    public static function modules_for_role(string $role): array {
        $roles=array(
            'references'=>array('admin','executor','owner'),
            'payments'=>array('admin','executor','owner'),
            'documents'=>array('admin','executor','engineer','foreman','owner','supervisor'),
            'workers'=>array('admin','executor','engineer','foreman'),
            'contract'=>array('admin','executor','owner'),
            'contacts'=>array('admin','executor','engineer','foreman'),
            'management'=>array('admin'),
        );
        $result=array();
        foreach($roles as $key=>$members) if(in_array($role,$members,true)) $result[]=$key;
        return $result;
    }
}
