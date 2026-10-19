<?php
defined('ABSPATH') || exit;

/** CRUD for scoped project-office records (no unauthenticated data routes). */
final class Mojarrad_Office {
    public static function table(): string { global $wpdb;return $wpdb->prefix.'moj_office_record'; }
    public static function messages_table(): string { global $wpdb;return $wpdb->prefix.'moj_reference_message'; }
    public static function audit(int $pid,string $action,string $section,int $rid,array $details=array()): void {
        global $wpdb;
        $wpdb->insert($wpdb->prefix.'moj_audit_event',array(
            'actor_id'=>get_current_user_id(),'project_id'=>$pid,'action'=>$action,
            'resource_type'=>$section,'resource_id'=>$rid,
            'details'=>wp_json_encode($details),'created_at'=>current_time('mysql',true),
        ));
    }
    private static function error(string $id,string $message,int $status): WP_Error {
        return new WP_Error($id,$message,array('status'=>$status));
    }
    public static function register_routes(): void {
        $auth=function(){return is_user_logged_in();};
        register_rest_route('mojarrad/v1','/projects/(?P<project_id>\d+)/office/(?P<section>references|documents|payments|contracts|workers)',array(
            array('methods'=>WP_REST_Server::READABLE,'callback'=>array(__CLASS__,'listing'),'permission_callback'=>$auth),
            array('methods'=>WP_REST_Server::CREATABLE,'callback'=>array(__CLASS__,'create'),'permission_callback'=>$auth),
        ));
        register_rest_route('mojarrad/v1','/office/contacts',array(
            array('methods'=>WP_REST_Server::READABLE,'callback'=>array(__CLASS__,'contacts'),'permission_callback'=>$auth),
            array('methods'=>WP_REST_Server::CREATABLE,'callback'=>array(__CLASS__,'create_contact'),'permission_callback'=>$auth),
        ));
        register_rest_route('mojarrad/v1','/office/record/(?P<id>\d+)',array(
            array('methods'=>WP_REST_Server::EDITABLE,'callback'=>array(__CLASS__,'update'),'permission_callback'=>$auth),
            array('methods'=>WP_REST_Server::DELETABLE,'callback'=>array(__CLASS__,'remove'),'permission_callback'=>$auth),
        ));
        register_rest_route('mojarrad/v1','/office/record/(?P<id>\d+)/messages',array(
            'methods'=>WP_REST_Server::CREATABLE,'callback'=>array(__CLASS__,'message'),'permission_callback'=>$auth,
        ));
        register_rest_route('mojarrad/v1','/office/record/(?P<id>\d+)/file',array(
            'methods'=>WP_REST_Server::CREATABLE,'callback'=>array('Mojarrad_Office_Files','upload'),'permission_callback'=>$auth,
        ));
    }
    public static function record(int $id) {
        if($id<=0)return null;
        global $wpdb;$t=self::table();
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM {$t} WHERE id=%d AND deleted_at IS NULL",$id));
    }
    public static function capabilities(int $uid,int $pid): array {return Mojarrad_Office_Access::capabilities($uid,$pid);}
    public static function serialize(object $record,int $uid): array {
        $meta=json_decode((string)$record->metadata,true);
        $meta=is_array($meta)?$meta:array();
        $file=$record->stored_name?array(
            'name'=>$record->original_name,'size'=>(int)$record->file_size,'mime'=>$record->mime,
            'url'=>Mojarrad_Office_Files::signed_url((int)$record->id),
        ):null;
        return array(
            'id'=>(int)$record->id,'projectId'=>(int)$record->project_id,
            'section'=>$record->section,'title'=>$record->title,'description'=>$record->description,
            'metadata'=>$meta,'amount'=>$record->amount,'date'=>$record->record_date,
            'version'=>(int)$record->version,'parentId'=>$record->parent_id?(int)$record->parent_id:null,
            'status'=>$record->status,'createdAt'=>$record->created_at,'file'=>$file,
            'canEdit'=>Mojarrad_Office_Access::permitted($uid,(int)$record->project_id,$record->section,'write'),
            'canDelete'=>Mojarrad_Office_Access::delete($uid,(int)$record->project_id,$record->section),
            'messages'=>$record->section==='references'?self::reference_messages((int)$record->id):array(),
        );
    }
    public static function reference_messages(int $id): array {
        global $wpdb;$t=self::messages_table();
        $rows=$wpdb->get_results($wpdb->prepare("SELECT * FROM {$t} WHERE reference_id=%d ORDER BY created_at ASC,id ASC LIMIT 200",$id));
        $out=array();
        foreach($rows as $row){
            $user=get_userdata((int)$row->author_id);
            $out[]=array('id'=>(int)$row->id,'body'=>$row->body,'createdAt'=>$row->created_at,
                'authorName'=>$user?$user->display_name:'—');
        }
        return $out;
    }
    private static function list_section(int $pid,string $section,int $uid) {
        if(!Mojarrad_Office_Access::permitted($uid,$pid,$section))return self::error('forbidden','اجازه مشاهده این بخش را ندارید.',403);
        global $wpdb;$t=self::table();
        $rows=$wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$t} WHERE project_id=%d AND section=%s AND deleted_at IS NULL ORDER BY id DESC LIMIT 150",
            $pid,$section
        ));
        return new WP_REST_Response(array('items'=>array_map(function($row)use($uid){return self::serialize($row,$uid);},$rows),
            'permissions'=>self::capabilities($uid,$pid)),200);
    }
    public static function listing(WP_REST_Request $req) {
        return self::list_section(absint($req['project_id']),sanitize_key($req['section']),get_current_user_id());
    }
    public static function contacts(WP_REST_Request $req) {return self::list_section(0,'contacts',get_current_user_id());}
    public static function create_contact(WP_REST_Request $req) {return self::insert(0,'contacts',$req);}
    public static function create(WP_REST_Request $req) {
        return self::insert(absint($req['project_id']),sanitize_key($req['section']),$req);
    }
    private static function clean(int $pid,string $section,WP_REST_Request $req,bool $partial=false) {
        $params=$req->get_params();
        $title=array_key_exists('title',$params)?$params['title']:null;
        if(!$partial || $title!==null){
            if(!is_string($title) || !trim($title) || strlen($title)>240)return self::error('title','عنوان الزامی است (حداکثر ۲۴۰ بایت).',400);
        }
        $description=array_key_exists('description',$params)?$params['description']:null;
        if($description!==null && (!is_string($description)||strlen($description)>16000))return self::error('description','شرح نامعتبر است.',400);
        $meta=$req->get_param('metadata');
        if($meta!==null && !is_array($meta))return self::error('metadata','اطلاعات تکمیلی نامعتبر است.',400);
        $allowed=array(
            'references'=>array('category','note'),
            'documents'=>array('category','note'),
            'payments'=>array('method','referenceNumber','note','timelineId'),
            'contracts'=>array('contractorName','startDate','endDate','financialStatus','totalPaid','note'),
            'workers'=>array('job','phone','active'),
            'contacts'=>array('phone','type','note','isTemporary','lastCheckedAt'),
        );
        if(!isset($allowed[$section]))return self::error('section','بخش ناشناخته است.',400);
        $sanitized=array();
        if($meta!==null){
            foreach($allowed[$section] as $key){
                if(!array_key_exists($key,$meta))continue;
                $value=$meta[$key];
                if(is_bool($value))$value=$value?'1':'0';
                if(!is_string($value)&&!is_numeric($value))return self::error('metadata','داده تکمیلی باید متن یا عدد باشد.',400);
                $value=(string)$value;
                if(strlen($value)>2000)return self::error('metadata','یکی از فیلدها طولانی است.',400);
                $sanitized[$key]=sanitize_text_field($value);
            }
        }
        if($section==='contracts' && isset($sanitized['financialStatus']) &&
            !in_array($sanitized['financialStatus'],array('balanced','debtor','creditor'),true)){
            return self::error('financialStatus','وضعیت حساب معتبر نیست.',400);
        }
        $amount=$req->get_param('amount');
        if($section==='payments' && (!$partial || $amount!==null)){
            $amount=is_scalar($amount)?(string)$amount:'';
            $amount=preg_replace('/[\s,٬،]/u','',$amount);
            if(!ctype_digit($amount)||strlen($amount)>18||!preg_match('/[1-9]/',$amount))return self::error('amount','مبلغ باید عدد صحیح مثبت باشد.',400);
        }
        $date=$req->get_param('date');
        if($date!==null && $date!==''){
            if(!is_string($date))return self::error('date','تاریخ نامعتبر است.',400);
            $dt=DateTimeImmutable::createFromFormat('!Y-m-d',$date,new DateTimeZone('UTC'));
            if(!$dt||$dt->format('Y-m-d')!==$date)return self::error('date','تاریخ باید YYYY-MM-DD باشد.',400);
        }
        if($section==='payments'&&!$partial && !$date)$date=gmdate('Y-m-d');
        return array(
            'title'=>$title===null?null:sanitize_text_field($title),
            'description'=>$description===null?null:sanitize_textarea_field($description),
            'metadata'=>$meta===null?null:$sanitized,
            'amount'=>$section==='payments'&&$amount!==null?$amount:null,
            'record_date'=>$date?:null,
        );
    }
    private static function insert(int $pid,string $section,WP_REST_Request $req) {
        $uid=get_current_user_id();
        if(!Mojarrad_Office_Access::permitted($uid,$pid,$section,'write'))return self::error('forbidden','اجازه ثبت در این بخش را ندارید.',403);
        $data=self::clean($pid,$section,$req);
        if(is_wp_error($data))return $data;
        $parent=absint($req->get_param('supersedesId'));
        if($parent && !in_array($section,array('references','documents','contracts'),true))return self::error('version','این بخش نسخه‌بندی ندارد.',400);
        $old=null;
        if($parent){
            $old=self::record($parent);
            if(!$old||(int)$old->project_id!==$pid||$old->section!==$section||$old->status!=='active'){
                return self::error('version','نسخه قبلی معتبر یا فعال نیست.',400);
            }
        }
        $meta=$data['metadata']??array();
        if($section==='contacts'){
            if(empty($meta['phone']))return self::error('phone','شماره تماس الزامی است.',400);
            $meta['lastCheckedAt']=gmdate('Y-m-d');
        }
        if($section==='workers'&&empty($meta['job']))return self::error('job','حرفه نیرو را مشخص کنید.',400);
        if($section==='contracts'){
            $status=$meta['financialStatus']??'balanced';
            if(!in_array($status,array('balanced','debtor','creditor'),true))return self::error('financialStatus','وضعیت قرارداد نامعتبر است.',400);
            $meta['financialStatus']=$status;
        }
        global $wpdb;$t=self::table();
        $values=array(
            'project_id'=>$pid,'section'=>$section,'author_id'=>$uid,
            'title'=>$data['title'],'description'=>$data['description']??'',
            'metadata'=>wp_json_encode($meta),
            'amount'=>$section==='payments'?$data['amount']:null,
            'record_date'=>$data['record_date'],
            'version'=>$old?((int)$old->version+1):1,
            'parent_id'=>$old?(int)$old->id:null,
            'status'=>'active','created_at'=>current_time('mysql',true),
        );
        $wpdb->query('START TRANSACTION');
        if($old && $wpdb->update($t,array('status'=>'superseded','updated_at'=>current_time('mysql',true)),array('id'=>(int)$old->id))===false){
            $wpdb->query('ROLLBACK');return self::error('database','به‌روزرسانی نسخه قبلی ناموفق بود.',500);
        }
        if(!$wpdb->insert($t,$values)){
            $wpdb->query('ROLLBACK');return self::error('database','ذخیره اطلاعات انجام نشد.',500);
        }
        $rid=(int)$wpdb->insert_id;
        if($section==='payments'){
            $evt=Mojarrad_Timeline::events_table();
            if(!$wpdb->insert($evt,array(
                'project_id'=>$pid,'actor_id'=>$uid,'occurred_at'=>($values['record_date']?:gmdate('Y-m-d')).' 00:00:00',
                'category'=>'payment','kind'=>'point','is_report'=>1,'title'=>'رسید پرداخت ثبت شد',
                'description'=>$values['title'],'created_at'=>current_time('mysql',true),
            ))){
                $wpdb->query('ROLLBACK');return self::error('database','ثبت رویداد مالی ناموفق بود.',500);
            }
            $event_id=(int)$wpdb->insert_id;
            $meta['timelineId']=(string)$event_id;
            if($wpdb->update($t,array('metadata'=>wp_json_encode($meta)),array('id'=>$rid))===false){
                $wpdb->query('ROLLBACK');return self::error('database','اتصال پرداخت به تایم‌لاین ناموفق بود.',500);
            }
        }
        $wpdb->query('COMMIT');
        self::audit($pid,'create',$section,$rid,array('version'=>$values['version']));
        return new WP_REST_Response(array('item'=>self::serialize(self::record($rid),$uid)),201);
    }
    public static function update(WP_REST_Request $req) {
        $uid=get_current_user_id();$row=self::record(absint($req['id']));
        if(!$row)return self::error('not_found','رکورد پیدا نشد.',404);
        $pid=(int)$row->project_id;$section=$row->section;
        if(!Mojarrad_Office_Access::permitted($uid,$pid,$section,'write'))return self::error('forbidden','اجازه ویرایش ندارید.',403);
        if($row->status==='superseded')return self::error('superseded','نسخه قدیمی فقط خواندنی است.',409);
        $v=self::clean($pid,$section,$req,true);
        if(is_wp_error($v))return $v;
        $changes=array('updated_at'=>current_time('mysql',true));
        foreach(array('title','description','amount','record_date') as $key)if($v[$key]!==null)$changes[$key]=$v[$key];
        if($v['metadata']!==null){
            $old=json_decode($row->metadata,true)?:array();
            $changes['metadata']=wp_json_encode(array_merge($old,$v['metadata']));
        }
        // For payment amounts, financial history is immutable: correction is a separate entry.
        if($section==='payments' && ($v['amount']!==null||$v['record_date']!==null)){
            return self::error('immutable','مبلغ و تاریخ پرداخت ثبت‌شده قابل ویرایش نیست؛ اصلاحات باید با سند جدید انجام شوند.',409);
        }
        global $wpdb;
        if($wpdb->update(self::table(),$changes,array('id'=>(int)$row->id))===false)return self::error('database','ویرایش انجام نشد.',500);
        self::audit($pid,'update',$section,(int)$row->id,array('fields'=>array_keys($changes)));
        return new WP_REST_Response(array('item'=>self::serialize(self::record((int)$row->id),$uid)),200);
    }
    public static function remove(WP_REST_Request $req) {
        $uid=get_current_user_id();$row=self::record(absint($req['id']));
        if(!$row)return self::error('not_found','رکورد پیدا نشد.',404);
        if(!Mojarrad_Office_Access::delete($uid,(int)$row->project_id,$row->section))return self::error('forbidden','فقط مدیر و مجری اجازه بایگانی رکورد دارند.',403);
        global $wpdb;
        if($wpdb->update(self::table(),array('deleted_at'=>current_time('mysql',true)),array('id'=>(int)$row->id))===false){
            return self::error('database','بایگانی انجام نشد.',500);
        }
        self::audit((int)$row->project_id,'archive_record',$row->section,(int)$row->id);
        return new WP_REST_Response(array('archived'=>true),200);
    }
    public static function message(WP_REST_Request $req) {
        $uid=get_current_user_id();$row=self::record(absint($req['id']));
        if(!$row || $row->section!=='references')return self::error('not_found','رفرنس پیدا نشد.',404);
        if(!Mojarrad_Office_Access::permitted($uid,(int)$row->project_id,'references','message')){
            return self::error('forbidden','گفتگو برای نقش شما مجاز نیست.',403);
        }
        $body=$req->get_param('body');
        if(!is_string($body)||!trim($body)||strlen($body)>6000)return self::error('body','متن پیام معتبر نیست.',400);
        global $wpdb;
        if(!$wpdb->insert(self::messages_table(),array(
            'reference_id'=>(int)$row->id,'project_id'=>(int)$row->project_id,
            'author_id'=>$uid,'body'=>sanitize_textarea_field($body),'created_at'=>current_time('mysql',true),
        )))return self::error('database','پیام ثبت نشد.',500);
        $id=(int)$wpdb->insert_id;
        self::audit((int)$row->project_id,'reference_comment','references',(int)$row->id,array('messageId'=>$id));
        return new WP_REST_Response(array('messages'=>self::reference_messages((int)$row->id)),201);
    }
}
