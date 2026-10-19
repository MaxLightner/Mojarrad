<?php
defined('ABSPATH') || exit;

/** Reuses the secure, outside-web-root vault established for timeline evidence. */
final class Mojarrad_Office_Files {
    public static function signed_url(int $id): string {
        return add_query_arg(array(
            'action'=>'mojarrad_office_file','id'=>$id,
            '_wpnonce'=>wp_create_nonce('moj_office_file_'.$id),
        ),admin_url('admin-post.php'));
    }
    private static function error(string $name,string $detail,int $http): WP_Error {
        return new WP_Error($name,$detail,array('status'=>$http));
    }
    public static function upload(WP_REST_Request $req) {
        $uid=get_current_user_id();$row=Mojarrad_Office::record(absint($req['id']));
        if(!$row)return self::error('not_found','سند موردنظر پیدا نشد.',404);
        if(!in_array($row->section,array('references','documents','payments','contracts'),true)
            || !Mojarrad_Office_Access::permitted($uid,(int)$row->project_id,$row->section,'write')){
            return self::error('forbidden','اجازه بارگذاری این فایل را ندارید.',403);
        }
        $params=$req->get_file_params();$file=$params['file']??null;
        if(!is_array($file)||!isset($file['error'],$file['tmp_name'],$file['size'],$file['name'])
            ||(int)$file['error']!==UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])){
            return self::error('invalid_file','فایل معتبر انتخاب کنید.',400);
        }
        $size=(int)$file['size'];
        if($size<1||$size>8*1024*1024)return self::error('size','حداکثر حجم فایل ۸ مگابایت است.',413);
        $type=false;
        if(function_exists('finfo_open')){
            $info=finfo_open(FILEINFO_MIME_TYPE);
            if($info){$type=finfo_file($info,$file['tmp_name']);finfo_close($info);}
        }
        $allowed=array('image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','application/pdf'=>'pdf');
        if(!is_string($type)||!isset($allowed[$type]))return self::error('mime','فقط عکس یا PDF معتبر است.',415);
        if(str_starts_with($type,'image/') && !@getimagesize($file['tmp_name']))
            return self::error('mime','ساختار تصویر معتبر نیست.',415);
        if($type==='application/pdf'){
            $handle=@fopen($file['tmp_name'],'rb');
            $signature=$handle?fread($handle,5):'';
            if($handle)fclose($handle);
            if($signature!=='%PDF-')return self::error('mime','فایل PDF معتبر نیست.',415);
        }
        $vault=Mojarrad_Timeline_Media::vault();
        if(is_wp_error($vault))return $vault;
        try{$stored='off-'.bin2hex(random_bytes(20)).'.'.$allowed[$type];}
        catch(Throwable $e){return self::error('storage','نام‌گذاری فایل ممکن نیست.',503);}
        $dest=$vault.DIRECTORY_SEPARATOR.$stored;
        if(!move_uploaded_file($file['tmp_name'],$dest))return self::error('storage','ذخیره فایل موفق نبود.',503);
        @chmod($dest,0600);
        $name=sanitize_file_name((string)$file['name']);
        if(!$name)$name='attachment.'.$allowed[$type];
        global $wpdb;
        $old=$row->stored_name;
        $ok=$wpdb->update(Mojarrad_Office::table(),array(
            'stored_name'=>$stored,'original_name'=>substr($name,0,240),
            'mime'=>$type,'file_size'=>$size,'updated_at'=>current_time('mysql',true),
        ),array('id'=>(int)$row->id));
        if($ok===false){@unlink($dest);return self::error('database','ثبت مشخصات فایل انجام نشد.',500);}
        // Old files are deliberately retained for audit/backup; never silently destroy evidence.
        Mojarrad_Office::audit((int)$row->project_id,'upload_file',$row->section,(int)$row->id,
            array('name'=>$name,'size'=>$size,'replaced'=>$old!==null));
        return new WP_REST_Response(array('item'=>Mojarrad_Office::serialize(Mojarrad_Office::record((int)$row->id),$uid)),201);
    }
    public static function download(): void {
        $id=isset($_GET['id'])?absint($_GET['id']):0;
        if(!$id||!is_user_logged_in())wp_die('برای دریافت فایل باید وارد شوید.','',array('response'=>403));
        check_admin_referer('moj_office_file_'.$id);
        $row=Mojarrad_Office::record($id);
        if(!$row||!$row->stored_name||
            !Mojarrad_Office_Access::permitted(get_current_user_id(),(int)$row->project_id,$row->section,'read')){
            wp_die('به این فایل دسترسی ندارید.','',array('response'=>403));
        }
        $vault=Mojarrad_Timeline_Media::vault();
        if(is_wp_error($vault))wp_die('محل نگهداری خصوصی در دسترس نیست.','',array('response'=>503));
        $path=$vault.DIRECTORY_SEPARATOR.basename($row->stored_name);
        if(!is_file($path)||!is_readable($path))wp_die('فایل پیدا نشد.','',array('response'=>404));
        nocache_headers();
        header('X-Content-Type-Options: nosniff');
        header('X-Robots-Tag: noindex, nofollow');
        header('Cache-Control: private, no-store, max-age=0');
        header('Content-Type: '.$row->mime);
        header('Content-Length: '.(string)filesize($path));
        $disposition=str_starts_with((string)$row->mime,'image/')?'inline':'attachment';
        header("Content-Disposition: {$disposition}; filename=\"attachment\"; filename*=UTF-8''".rawurlencode($row->original_name));
        readfile($path);exit;
    }
}
