<?php
defined('ABSPATH') || exit;

/** All decisions are made on the server, after project membership is checked. */
final class Mojarrad_Timeline_Access {
    public static function role(int $uid): string {
        $user=get_userdata($uid);
        return $user?Mojarrad_Access::role_for($user):'visitor';
    }
    public static function read_event(int $uid,object $event): bool {
        if(!Mojarrad_Access::can_read($uid,(int)$event->project_id)) return false;
        $role=self::role($uid);
        if($role==='supervisor') return (bool)$event->is_report && $event->category!=='payment';
        if($role==='owner') return (bool)$event->is_report;
        if($event->category==='payment') return in_array($role,array('admin','executor'),true);
        return in_array($role,array('admin','executor','engineer','foreman','contractor'),true);
    }
    public static function create_event(int $uid,int $project_id): bool {
        return Mojarrad_Access::can_read($uid,$project_id)
            && in_array(self::role($uid),array('admin','executor','engineer','foreman'),true);
    }
    public static function edit_event(int $uid,object $event): bool {
        if(!self::create_event($uid,(int)$event->project_id)) return false;
        $role=self::role($uid);
        return in_array($role,array('admin','executor'),true)
            || ($event->category!=='payment' && (int)$event->actor_id===$uid);
    }
    public static function delete_event(int $uid,object $event): bool {
        return Mojarrad_Access::can_read($uid,(int)$event->project_id)
            && in_array(self::role($uid),array('admin','executor'),true);
    }
    public static function see_comments(int $uid): bool {
        return self::role($uid)!=='supervisor' && $uid>0;
    }
    public static function write_comment(int $uid,object $event): bool {
        return self::see_comments($uid) && self::read_event($uid,$event);
    }
    public static function visibilities(int $uid): array {
        switch(self::role($uid)) {
            case 'admin': case 'executor': return array('management','team','owner','contractor');
            case 'owner': return array('owner','team');
            case 'contractor': return array('contractor','management');
            case 'engineer': case 'foreman': return array('team','management');
            default: return array();
        }
    }
    public static function default_visibility(int $uid): string {
        switch(self::role($uid)) {
            case 'owner': return 'owner';
            case 'contractor': return 'contractor';
            case 'engineer': case 'foreman': return 'team';
            default: return 'management';
        }
    }
    public static function see_comment(int $uid,object $comment): bool {
        $role=self::role($uid);
        if($role==='supervisor'||$uid<=0) return false;
        if(in_array($role,array('admin','executor'),true)) return true;
        if((int)$comment->author_id===$uid) return true;
        return $role===(string)$comment->visibility
            || ($comment->visibility==='team' && in_array($role,array('engineer','foreman'),true));
    }
    public static function resolve_comment(int $uid,object $comment): bool {
        if(!Mojarrad_Access::can_read($uid,(int)$comment->project_id)) return false;
        return (int)$comment->author_id===$uid
            || in_array(self::role($uid),array('admin','executor'),true);
    }
    public static function moderate_media(int $uid,int $project_id): bool {
        return Mojarrad_Access::can_read($uid,$project_id)
            && in_array(self::role($uid),array('admin','executor'),true);
    }
}
