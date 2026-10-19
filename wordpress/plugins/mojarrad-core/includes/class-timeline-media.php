<?php
defined('ABSPATH') || exit;

/**
 * Private image/PDF evidence with moderated visibility.
 * File bytes are outside the WordPress public document root.
 */
final class Mojarrad_Timeline_Media {
    private static function error(string $code,string $text,int $status): WP_Error {
        return new WP_Error($code,$text,array('status'=>$status));
    }
    private static function vault() {
        $root=realpath(ABSPATH);
        $folder=defined('MOJARRAD_PRIVATE_DIR') ? MOJARRAD_PRIVATE_DIR
            : dirname(untrailingslashit(ABSPATH)).DIRECTORY_SEPARATOR.'mojarrad-private-vault';
        if(!$folder || !wp_mkdir_p($folder)) return self::error('storage','فضای خصوصی فایل‌ها در دسترس نیست.',503);
        $directory=realpath($folder);
        if(!$directory || !$root || $directory===$root || str_starts_with($directory,$root.DIRECTORY_SEPARATOR)) {
            return self::error('unsafe_storage','محل ذخیره فایل خصوصی نباید داخل مسیر عمومی وردپرس باشد.',503);
        }
        @chmod($directory,0700);
        return $directory;
    }
    public static function record(int $id) {
        if($id<=0) return null;
        global $wpdb;
        $t=Mojarrad_Timeline::media_table();
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM {$t} WHERE id=%d",$id));
    }
    private static function can_read(int $uid,object $media): bool {
        $event=Mojarrad_Timeline::event((int)$media->event_id);
        if(!$event || (int)$event->project_id!==(int)$media->project_id
            || !Mojarrad_Timeline_Access::read_event($uid,$event)) return false;
        if($media->status!=='approved'
            && !Mojarrad_Timeline_Access::moderate_media($uid,(int)$media->project_id)
            && (int)$media->author_id!==$uid) return false;
        if(!empty($media->comment_id)) {
            if(!Mojarrad_Timeline_Access::see_comments($uid)) return false;
            global $wpdb;$t=Mojarrad_Timeline::comments_table();
            $comment=$wpdb->get_row($wpdb->prepare("SELECT * FROM {$t} WHERE id=%d AND event_id=%d",(int)$media->comment_id,(int)$media->event_id));
            if(!$comment || !Mojarrad_Timeline_Access::see_comment($uid,$comment)) return false;
        }
        return true;
    }
    public static function serialize(object $row,int $uid): array {
        $url=wp_nonce_url(add_query_arg(array(
            'action'=>'mojarrad_private_media','media_id'=>(int)$row->id,
        ),admin_url('admin-post.php')),'mojarrad_media_'.(int)$row->id);
        return array(
            'id'=>(int)$row->id,
            'name'=>$row->original_name,'mime'=>$row->mime,
            'type'=>$row->media_type,'size'=>(int)$row->file_size,
            'status'=>$row->status,'createdAt'=>$row->created_at,
            'url'=>$url,
            'canModerate'=>Mojarrad_Timeline_Access::moderate_media($uid,(int)$row->project_id),
        );
    }
    public static function list_for_event(int $event_id,int $uid): array {
        global $wpdb;$t=Mojarrad_Timeline::media_table();
        $media=$wpdb->get_results($wpdb->prepare("SELECT * FROM {$t} WHERE event_id=%d AND comment_id IS NULL ORDER BY id DESC LIMIT 80",$event_id));
        $list=array();
        foreach($media as $row) {
            if(self::can_read($uid,$row)) $list[]=self::serialize($row,$uid);
        }
        return $list;
    }
    public static function upload(WP_REST_Request $req) {
        $event=Mojarrad_Timeline::event(absint($req['id']));$uid=get_current_user_id();
        if(!$event) return self::error('not_found','رویداد پیدا نشد.',404);
        if(!Mojarrad_Timeline_Access::read_event($uid,$event)) return self::error('forbidden','به این گزارش دسترسی ندارید.',403);

        $comment_id=absint($req->get_param('commentId'));
        if($comment_id) {
            global $wpdb;$t=Mojarrad_Timeline::comments_table();
            $comment=$wpdb->get_row($wpdb->prepare("SELECT * FROM {$t} WHERE id=%d AND event_id=%d",$comment_id,(int)$event->id));
            if(!$comment || !Mojarrad_Timeline_Access::see_comment($uid,$comment)) {
                return self::error('forbidden','به پیام مقصد دسترسی ندارید.',403);
            }
            if((int)$comment->author_id!==$uid && !Mojarrad_Timeline_Access::moderate_media($uid,(int)$event->project_id)) {
                return self::error('forbidden','پیوست پیام را فقط نویسنده یا مدیر ثبت می‌کند.',403);
            }
        }
        $params=$req->get_file_params();
        $file=$params['file']??null;
        if(!is_array($file) || !isset($file['tmp_name'],$file['name'],$file['size'],$file['error'])
            || (int)$file['error']!==UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
            return self::error('invalid_file','یک فایل معتبر برای بارگذاری انتخاب کنید.',400);
        }
        $size=(int)$file['size'];
        if($size<1 || $size>6*1024*1024) return self::error('size','حداکثر حجم هر فایل ۶ مگابایت است.',413);
        $type=function_exists('finfo_open')?finfo_file(finfo_open(FILEINFO_MIME_TYPE),$file['tmp_name']):false;
        $allowed=array('image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','application/pdf'=>'pdf');
        if(!is_string($type) || !isset($allowed[$type])) {
            return self::error('mime','فقط JPG، PNG، WebP و PDF مجاز است.',415);
        }
        if(str_starts_with($type,'image/') && !@getimagesize($file['tmp_name'])) return self::error('mime','فایل تصویری معتبر نیست.',415);
        if($type==='application/pdf') {
            $fh=@fopen($file['tmp_name'],'rb');
            $signature=$fh?fread($fh,5):'';
            if($fh) fclose($fh);
            if($signature!=='%PDF-') return self::error('mime','ساختار PDF معتبر نیست.',415);
        }
        if(Mojarrad_Timeline_Access::role($uid)==='supervisor' && !str_starts_with($type,'image/')) {
            return self::error('forbidden','ناظر در این مرحله فقط می‌تواند تصویر گزارش ارسال کند.',403);
        }
        $vault=self::vault();
        if(is_wp_error($vault)) return $vault;
        try { $stored=bin2hex(random_bytes(24)).'.'.$allowed[$type]; }
        catch(Throwable $e) { return self::error('random','ساخت شناسه امن فایل ممکن نیست.',503); }
        $target=$vault.DIRECTORY_SEPARATOR.$stored;
        if(!move_uploaded_file($file['tmp_name'],$target)) return self::error('storage','ذخیره فایل انجام نشد.',503);
        @chmod($target,0600);
        $name=sanitize_file_name((string)$file['name']);
        if($name==='') $name='attachment.'.$allowed[$type];
        $status=Mojarrad_Timeline_Access::moderate_media($uid,(int)$event->project_id)?'approved':'pending';
        global $wpdb;
        $ok=$wpdb->insert(Mojarrad_Timeline::media_table(),array(
            'project_id'=>(int)$event->project_id,'event_id'=>(int)$event->id,
            'comment_id'=>$comment_id?:null,'author_id'=>$uid,
            'original_name'=>substr($name,0,240),'stored_name'=>$stored,
            'mime'=>$type,'file_size'=>$size,
            'media_type'=>str_starts_with($type,'image/')?'image':'document',
            'status'=>$status,'created_at'=>current_time('mysql',true),
        ));
        if(!$ok) { @unlink($target); return self::error('database','ثبت اطلاعات فایل انجام نشد.',500); }
        $row=self::record((int)$wpdb->insert_id);
        return new WP_REST_Response(array('media'=>self::serialize($row,$uid)),201);
    }
    public static function moderate(WP_REST_Request $req) {
        $row=self::record(absint($req['id']));$uid=get_current_user_id();
        if(!$row) return self::error('not_found','فایل پیدا نشد.',404);
        if(!Mojarrad_Timeline_Access::moderate_media($uid,(int)$row->project_id)
            || !Mojarrad_Timeline::event((int)$row->event_id)) {
            return self::error('forbidden','تأیید تصویر فقط در اختیار مدیر یا مجری است.',403);
        }
        $status=$req->get_param('status');
        if(!in_array($status,array('approved','rejected','pending'),true)) return self::error('status','وضعیت فایل معتبر نیست.',400);
        global $wpdb;
        if($wpdb->update(Mojarrad_Timeline::media_table(),array('status'=>$status),array('id'=>(int)$row->id))===false) {
            return self::error('database','وضعیت فایل ذخیره نشد.',500);
        }
        return new WP_REST_Response(array('media'=>self::serialize(self::record((int)$row->id),$uid)),200);
    }
    public static function download() {
        $id=isset($_GET['media_id'])?absint($_GET['media_id']):0;
        if(!$id || !is_user_logged_in()) {
            wp_die('ورود و شناسه فایل الزامی است.','',array('response'=>403));
        }
        check_admin_referer('mojarrad_media_'.$id);
        $row=self::record($id);$uid=get_current_user_id();
        if(!$row || !self::can_read($uid,$row)) {
            wp_die('به فایل دسترسی ندارید.','',array('response'=>403));
        }
        $vault=self::vault();
        if(is_wp_error($vault)) wp_die('فضای فایل‌ها در دسترس نیست.','',array('response'=>503));
        $name=basename($row->stored_name);
        $path=$vault.DIRECTORY_SEPARATOR.$name;
        if(!is_file($path) || !is_readable($path)) wp_die('فایل پیدا نشد.','',array('response'=>404));
        $size=filesize($path);
        nocache_headers();
        header('X-Content-Type-Options: nosniff');
        header('X-Robots-Tag: noindex, nofollow');
        header('Cache-Control: private, no-store, max-age=0');
        header('Content-Type: '.$row->mime);
        header('Content-Length: '.$size);
        // Images may render in-browser for authenticated project members.
        $disposition=$row->media_type==='image'?'inline':'attachment';
        header("Content-Disposition: {$disposition}; filename=\"attachment\"; filename*=UTF-8''".rawurlencode($row->original_name));
        readfile($path);
        exit;
    }
}
