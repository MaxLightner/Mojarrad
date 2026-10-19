<?php
defined('ABSPATH') || exit;

/**
 * Project timeline REST API. No timeline data is available anonymously.
 * Category 'payment' remains reserved for the later finance module.
 */
final class Mojarrad_Timeline {
    public static function events_table(): string { global $wpdb; return $wpdb->prefix.'moj_timeline_event'; }
    public static function comments_table(): string { global $wpdb; return $wpdb->prefix.'moj_timeline_comment'; }
    public static function media_table(): string { global $wpdb; return $wpdb->prefix.'moj_timeline_media'; }
    public static function registered_categories(): array {
        return array('execution'=>'اجرای کار','visit'=>'بازدید','supply'=>'تأمین مصالح','decision'=>'تصمیم','delay'=>'تأخیر','reference'=>'رفرنس');
    }
    public static function stage_presets(): array {
        return array(
            'foundation'=>array('label'=>'فنداسیون','group'=>'structure'),
            'skeleton'=>array('label'=>'اسکلت','group'=>'structure'),
            'ceiling'=>array('label'=>'سقف','group'=>'structure'),
            'masonry'=>array('label'=>'دیوارچینی','group'=>'finishing'),
            'mep'=>array('label'=>'تأسیسات برق و مکانیک','group'=>'mep'),
            'plaster'=>array('label'=>'گچکاری','group'=>'finishing'),
            'tiling'=>array('label'=>'کفسازی و سنگ','group'=>'finishing'),
            'paint'=>array('label'=>'نقاشی','group'=>'finishing'),
            'facade'=>array('label'=>'نما','group'=>'exterior'),
            'landscape'=>array('label'=>'محوطه و فضای باز','group'=>'exterior'),
            'cleanup'=>array('label'=>'نظافت و تحویل','group'=>'exterior'),
            'permits'=>array('label'=>'مجوزها','group'=>'admin'),
        );
    }
    public static function register_routes() {
        $logged=array(__CLASS__,'logged_in');
        register_rest_route('mojarrad/v1','/projects/(?P<project_id>\d+)/timeline',array(
            array('methods'=>WP_REST_Server::READABLE,'callback'=>array(__CLASS__,'list_events'),'permission_callback'=>$logged),
            array('methods'=>WP_REST_Server::CREATABLE,'callback'=>array(__CLASS__,'create_event'),'permission_callback'=>$logged),
        ));
        register_rest_route('mojarrad/v1','/timeline/(?P<id>\d+)',array(
            array('methods'=>WP_REST_Server::EDITABLE,'callback'=>array(__CLASS__,'update_event'),'permission_callback'=>$logged),
            array('methods'=>WP_REST_Server::DELETABLE,'callback'=>array(__CLASS__,'delete_event'),'permission_callback'=>$logged),
        ));
        register_rest_route('mojarrad/v1','/timeline/(?P<id>\d+)/comments',array(
            'methods'=>WP_REST_Server::CREATABLE,'callback'=>array(__CLASS__,'create_comment'),'permission_callback'=>$logged,
        ));
        register_rest_route('mojarrad/v1','/comments/(?P<id>\d+)/resolve',array(
            'methods'=>WP_REST_Server::EDITABLE,'callback'=>array(__CLASS__,'resolve_comment'),'permission_callback'=>$logged,
        ));
        register_rest_route('mojarrad/v1','/timeline/(?P<id>\d+)/media',array(
            'methods'=>WP_REST_Server::CREATABLE,'callback'=>array('Mojarrad_Timeline_Media','upload'),'permission_callback'=>$logged,
        ));
        register_rest_route('mojarrad/v1','/media/(?P<id>\d+)/moderate',array(
            'methods'=>WP_REST_Server::EDITABLE,'callback'=>array('Mojarrad_Timeline_Media','moderate'),'permission_callback'=>$logged,
        ));
    }
    public static function logged_in(): bool { return is_user_logged_in(); }
    private static function error(string $code,string $message,int $http): WP_Error {
        return new WP_Error($code,$message,array('status'=>$http));
    }
    public static function event(int $id) {
        if($id<1) return null;
        global $wpdb;
        $table=self::events_table();
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE id=%d AND deleted_at IS NULL",$id));
    }
    private static function project_id(WP_REST_Request $req): int { return absint($req['project_id']); }
    public static function validate_fields(array $input,bool $partial=false) {
        $output=array();$allowed=self::registered_categories();
        if(!$partial || array_key_exists('kind',$input)) {
            $kind=isset($input['kind']) && is_string($input['kind']) ? sanitize_key($input['kind']) : 'point';
            if(!in_array($kind,array('point','stage_start','stage_end'),true)) return self::error('kind','نوع رویداد نامعتبر است.',400);
            $output['kind']=$kind;
        }
        if(!$partial || array_key_exists('category',$input)) {
            $category=isset($input['category']) && is_string($input['category'])?sanitize_key($input['category']):'execution';
            if(!isset($allowed[$category])) return self::error('category','دسته رویداد معتبر نیست؛ رویداد مالی از این فرم ثبت نمی‌شود.',400);
            $output['category']=$category;
        }
        if(!$partial || array_key_exists('title',$input)) {
            $title=isset($input['title']) && is_string($input['title'])?sanitize_text_field($input['title']):'';
            if(strlen($title)>320) return self::error('title','عنوان بیش از حد طولانی است.',400);
            $output['title']=$title;
        }
        if(!$partial || array_key_exists('description',$input)) {
            $description=isset($input['description']) && is_string($input['description'])?sanitize_textarea_field($input['description']):'';
            if(strlen($description)>15000) return self::error('description','شرح رویداد بیش از حد طولانی است.',400);
            $output['description']=$description;
        }
        if(!$partial || array_key_exists('isReport',$input)) {
            $output['is_report']=!empty($input['isReport']) && in_array($input['isReport'],array(true,1,'1','true','on'),true)?1:0;
        }
        if(!$partial || array_key_exists('date',$input)) {
            $raw=isset($input['date']) && is_string($input['date'])?$input['date']:gmdate('Y-m-d');
            $date=DateTimeImmutable::createFromFormat('!Y-m-d',$raw,new DateTimeZone('UTC'));
            if(!$date || $date->format('Y-m-d')!==$raw) return self::error('date','تاریخ باید به صورت YYYY-MM-DD باشد.',400);
            $output['occurred_at']=$date->format('Y-m-d H:i:s');
        }
        if(!$partial || array_key_exists('stageKey',$input)) {
            $key=isset($input['stageKey']) && is_string($input['stageKey'])?sanitize_key($input['stageKey']):'';
            if(strlen($key)>64) return self::error('stageKey','شناسه مرحله معتبر نیست.',400);
            $output['stage_key']=$key!==''?$key:null;
        }
        if(!$partial || array_key_exists('stageGroup',$input)) {
            $group=isset($input['stageGroup']) && is_string($input['stageGroup'])?sanitize_key($input['stageGroup']):'';
            if($group!=='' && !in_array($group,array('structure','mep','finishing','exterior','admin'),true)) {
                return self::error('stageGroup','گروه مرحله معتبر نیست.',400);
            }
            $output['stage_group']=$group!==''?$group:null;
        }
        return $output;
    }
    private static function normalized(array $data) {
        $kind=$data['kind']??'point';
        if($kind!=='point') {
            if(empty($data['stage_key'])) return self::error('stageKey','برای شروع و پایان مرحله، نام مرحله الزامی است.',400);
            $presets=self::stage_presets();
            $stage=$presets[$data['stage_key']]??null;
            if($stage) {
                $data['stage_group']=$stage['group'];
                if(empty($data['title'])) $data['title']=($kind==='stage_start'?'شروع ':'پایان ').$stage['label'];
            } elseif(empty($data['stage_group'])) {
                return self::error('stageGroup','برای مرحله سفارشی، گروه کاری را مشخص کنید.',400);
            }
            $data['category']='execution';
            $data['is_report']=1;
        } else {
            $data['stage_key']=null;$data['stage_group']=null;
        }
        if(!isset($data['title']) || trim($data['title'])==='') return self::error('title','عنوان رویداد الزامی است.',400);
        return $data;
    }
    private static function can_read_project(int $uid,int $project): bool {
        return $project>0 && Mojarrad_Access::can_read($uid,$project);
    }
    public static function list_events(WP_REST_Request $req) {
        $project=self::project_id($req);$uid=get_current_user_id();
        if(!self::can_read_project($uid,$project)) return self::error('forbidden','به این پروژه دسترسی ندارید.',403);
        $role=Mojarrad_Timeline_Access::role($uid);
        $page=max(1,min(10000,absint($req->get_param('page')?:1)));
        $per=min(50,max(1,absint($req->get_param('per_page')?:25)));
        $offset=($page-1)*$per;
        global $wpdb;$table=self::events_table();
        $where='project_id=%d AND deleted_at IS NULL';$params=array($project);
        if(in_array($role,array('owner','supervisor'),true)) $where.=' AND is_report=1';
        if(!in_array($role,array('owner','admin','executor'),true)) $where.=" AND category <> 'payment'";
        $sql="SELECT * FROM {$table} WHERE {$where} ORDER BY occurred_at DESC,id DESC LIMIT %d OFFSET %d";
        $params[]=$per+1;$params[]=$offset;
        $rows=$wpdb->get_results($wpdb->prepare($sql,$params));
        $has_next=count($rows)>$per;
        $rows=array_slice($rows,0,$per);
        $items=array();
        foreach($rows as $row) if(Mojarrad_Timeline_Access::read_event($uid,$row)) $items[]=self::serialize($row,$uid);
        return new WP_REST_Response(array(
            'events'=>$items,'page'=>$page,'hasNext'=>$has_next,
            'viewer'=>array(
                'role'=>$role,
                'canCreate'=>Mojarrad_Timeline_Access::create_event($uid,$project),
                'canComment'=>$role!=='supervisor',
                'canModerate'=>Mojarrad_Timeline_Access::moderate_media($uid,$project),
                'reportOnly'=>in_array($role,array('owner','supervisor'),true),
            ),
            'categories'=>self::registered_categories(),
            'stages'=>self::stage_presets(),
        ),200);
    }
    public static function serialize(object $row,int $uid): array {
        $author=get_userdata((int)$row->actor_id);
        $comments=self::visible_comments((int)$row->id,$uid);
        return array(
            'id'=>(int)$row->id,'projectId'=>(int)$row->project_id,
            'title'=>(string)$row->title,'description'=>(string)$row->description,
            'date'=>(string)$row->occurred_at,'category'=>(string)$row->category,
            'kind'=>(string)$row->kind,'stageKey'=>$row->stage_key,'stageGroup'=>$row->stage_group,
            'isReport'=>(bool)$row->is_report,'authorName'=>$author?$author->display_name:'—',
            'canEdit'=>Mojarrad_Timeline_Access::edit_event($uid,$row),
            'canDelete'=>Mojarrad_Timeline_Access::delete_event($uid,$row),
            'comments'=>$comments,'media'=>Mojarrad_Timeline_Media::list_for_event((int)$row->id,$uid),
        );
    }
    public static function visible_comments(int $event_id,int $uid): array {
        if(!Mojarrad_Timeline_Access::see_comments($uid)) return array();
        global $wpdb;
        $t=self::comments_table();
        $comments=$wpdb->get_results($wpdb->prepare("SELECT * FROM {$t} WHERE event_id=%d ORDER BY created_at ASC,id ASC LIMIT 250",$event_id));
        $output=array();
        foreach($comments as $comment) {
            if(!Mojarrad_Timeline_Access::see_comment($uid,$comment)) continue;
            $author=get_userdata((int)$comment->author_id);
            $output[]=array(
                'id'=>(int)$comment->id,'body'=>$comment->body,
                'visibility'=>$comment->visibility,'needsFollowUp'=>(bool)$comment->needs_follow_up,
                'resolvedAt'=>$comment->resolved_at,'createdAt'=>$comment->created_at,
                'authorName'=>$author?$author->display_name:'—',
                'canResolve'=>Mojarrad_Timeline_Access::resolve_comment($uid,$comment),
            );
        }
        return $output;
    }
    public static function create_event(WP_REST_Request $req) {
        $project=self::project_id($req);$uid=get_current_user_id();
        if(!Mojarrad_Timeline_Access::create_event($uid,$project)) return self::error('forbidden','اجازه ثبت رویداد ندارید.',403);
        $data=self::validate_fields((array)$req->get_params());
        if(is_wp_error($data)) return $data;
        $data=self::normalized($data);
        if(is_wp_error($data)) return $data;
        global $wpdb;
        $data=array_merge($data,array('project_id'=>$project,'actor_id'=>$uid,'created_at'=>current_time('mysql',true)));
        if(!$wpdb->insert(self::events_table(),$data)) return self::error('database','رویداد ثبت نشد.',500);
        $event=self::event((int)$wpdb->insert_id);
        return new WP_REST_Response(array('event'=>self::serialize($event,$uid)),201);
    }
    public static function update_event(WP_REST_Request $req) {
        $event=self::event(absint($req['id']));$uid=get_current_user_id();
        if(!$event) return self::error('not_found','رویداد پیدا نشد.',404);
        if(!Mojarrad_Timeline_Access::edit_event($uid,$event)) return self::error('forbidden','اجازه ویرایش ندارید.',403);
        $input=(array)$req->get_params();
        if(!$input) return self::error('invalid','اطلاعات ویرایش ارائه نشده است.',400);
        $partial=self::validate_fields($input,true);
        if(is_wp_error($partial)) return $partial;
        $old=array(
            'kind'=>$event->kind,'category'=>$event->category,'stage_key'=>$event->stage_key,
            'stage_group'=>$event->stage_group,'title'=>$event->title,'description'=>$event->description,
            'occurred_at'=>$event->occurred_at,'is_report'=>(int)$event->is_report,
        );
        $data=self::normalized(array_merge($old,$partial));
        if(is_wp_error($data)) return $data;
        // Payment records are not edited through the public timeline editor.
        if($event->category==='payment') return self::error('forbidden','رویداد مالی باید در بخش مالی ویرایش شود.',403);
        $data['updated_at']=current_time('mysql',true);
        global $wpdb;
        if($wpdb->update(self::events_table(),$data,array('id'=>(int)$event->id))===false) return self::error('database','ویرایش انجام نشد.',500);
        return new WP_REST_Response(array('event'=>self::serialize(self::event((int)$event->id),$uid)),200);
    }
    public static function delete_event(WP_REST_Request $req) {
        $event=self::event(absint($req['id']));$uid=get_current_user_id();
        if(!$event) return self::error('not_found','رویداد پیدا نشد.',404);
        if(!Mojarrad_Timeline_Access::delete_event($uid,$event)) return self::error('forbidden','فقط مدیر یا مجری اجازه حذف دارد.',403);
        global $wpdb;
        $ok=$wpdb->update(self::events_table(),array(
            'deleted_at'=>current_time('mysql',true),'deleted_by'=>$uid,
        ),array('id'=>(int)$event->id));
        if($ok===false) return self::error('database','حذف انجام نشد.',500);
        return new WP_REST_Response(array('deleted'=>true),200);
    }
    public static function create_comment(WP_REST_Request $req) {
        $event=self::event(absint($req['id']));$uid=get_current_user_id();
        if(!$event) return self::error('not_found','رویداد پیدا نشد.',404);
        if(!Mojarrad_Timeline_Access::write_comment($uid,$event)) return self::error('forbidden','اجازه ارسال پیام ندارید.',403);
        $body=is_string($req->get_param('body'))?sanitize_textarea_field($req->get_param('body')):'';
        if(trim($body)==='' || strlen($body)>8000) return self::error('body','متن پیام الزامی است (حداکثر ۸۰۰۰ بایت).',400);
        $visibility=$req->get_param('visibility');
        $allowed=Mojarrad_Timeline_Access::visibilities($uid);
        if($visibility===null || $visibility==='') $visibility=Mojarrad_Timeline_Access::default_visibility($uid);
        if(!is_string($visibility) || !in_array($visibility,$allowed,true)) return self::error('visibility','مخاطب پیام برای نقش شما مجاز نیست.',403);
        $follow=in_array($req->get_param('needsFollowUp'),array(true,1,'1','true','on'),true);
        global $wpdb;
        $ok=$wpdb->insert(self::comments_table(),array(
            'project_id'=>(int)$event->project_id,'event_id'=>(int)$event->id,
            'author_id'=>$uid,'body'=>$body,'visibility'=>$visibility,
            'needs_follow_up'=>$follow?1:0,'created_at'=>current_time('mysql',true),
        ));
        if(!$ok) return self::error('database','پیام ذخیره نشد.',500);
        return new WP_REST_Response(array('comments'=>self::visible_comments((int)$event->id,$uid)),201);
    }
    public static function resolve_comment(WP_REST_Request $req) {
        global $wpdb;$id=absint($req['id']);$t=self::comments_table();$uid=get_current_user_id();
        $comment=$wpdb->get_row($wpdb->prepare("SELECT * FROM {$t} WHERE id=%d",$id));
        if(!$comment) return self::error('not_found','پیام پیدا نشد.',404);
        $event=self::event((int)$comment->event_id);
        if(!$event || !Mojarrad_Timeline_Access::read_event($uid,$event)
            || !Mojarrad_Timeline_Access::see_comment($uid,$comment)
            || !Mojarrad_Timeline_Access::resolve_comment($uid,$comment)) return self::error('forbidden','اجازه تغییر وضعیت پیگیری ندارید.',403);
        if(!(bool)$comment->needs_follow_up) return self::error('invalid','این پیام پیگیری ندارد.',400);
        $resolved=in_array($req->get_param('resolved'),array(true,1,'1','true','on'),true);
        $date=$resolved?current_time('mysql',true):null;
        if($wpdb->update($t,array('resolved_at'=>$date),array('id'=>$id))===false) return self::error('database','وضعیت تغییر نکرد.',500);
        return new WP_REST_Response(array('resolved'=>$resolved,'resolvedAt'=>$date),200);
    }
}
