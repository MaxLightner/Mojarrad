<?php
defined('ABSPATH') || exit;

/** Non-destructive, verified private project snapshots. Never deletes the live project. */
final class Mojarrad_Archive {
    private static function table(): string {global $wpdb;return $wpdb->prefix.'moj_project_archive';}
    private static function error(string $code,string $message,int $http): WP_Error {
        return new WP_Error($code,$message,array('status'=>$http));
    }
    public static function register_routes(): void {
        $auth=function(){return is_user_logged_in();};
        register_rest_route('mojarrad/v1','/projects/(?P<project_id>\d+)/archives',array(
            array('methods'=>WP_REST_Server::READABLE,'callback'=>array(__CLASS__,'listing'),'permission_callback'=>$auth),
            array('methods'=>WP_REST_Server::CREATABLE,'callback'=>array(__CLASS__,'create'),'permission_callback'=>$auth),
        ));
    }
    private static function permitted(int $pid): bool {
        return Mojarrad_Office_Access::permitted(get_current_user_id(),$pid,'archive');
    }
    public static function listing(WP_REST_Request $req) {
        $pid=absint($req['project_id']);
        if(!self::permitted($pid))return self::error('forbidden','آرشیو فقط برای مدیر مجاز است.',403);
        global $wpdb;$t=self::table();
        $rows=$wpdb->get_results($wpdb->prepare(
            "SELECT id,file_sha256,file_size,included_files,created_at FROM {$t} WHERE project_id=%d ORDER BY id DESC LIMIT 40",$pid
        ));
        $items=array();
        foreach($rows as $r)$items[]=array(
            'id'=>(int)$r->id,'sha256'=>$r->file_sha256,'size'=>(int)$r->file_size,
            'files'=>(int)$r->included_files,'createdAt'=>$r->created_at,
            'url'=>self::signed_url((int)$r->id),
        );
        return new WP_REST_Response(array('items'=>$items),200);
    }
    private static function signed_url(int $id): string {
        return add_query_arg(array(
            'action'=>'mojarrad_archive','id'=>$id,
            '_wpnonce'=>wp_create_nonce('mojarrad_archive_'.$id),
        ),admin_url('admin-post.php'));
    }
    private static function dump_table(string $name,int $pid,string $field='project_id'): array {
        global $wpdb;
        $allowed=array('moj_timeline_event','moj_timeline_comment','moj_timeline_media',
            'moj_office_record','moj_reference_message');
        if(!in_array($name,$allowed,true)||$field!=='project_id')return array();
        $t=$wpdb->prefix.$name;
        return $wpdb->get_results($wpdb->prepare("SELECT * FROM {$t} WHERE {$field}=%d ORDER BY id ASC",$pid),ARRAY_A);
    }
    public static function create(WP_REST_Request $req) {
        $pid=absint($req['project_id']);
        if(!self::permitted($pid))return self::error('forbidden','تهیه آرشیو فقط برای مدیر سیستم مجاز است.',403);
        if(!class_exists('ZipArchive'))return self::error('zip','افزونه PHP Zip روی سرور فعال نیست.',503);
        $post=get_post($pid,ARRAY_A);
        if(!$post||$post['post_type']!=='moj_project')return self::error('not_found','پروژه پیدا نشد.',404);
        $vault=Mojarrad_Timeline_Media::vault();
        if(is_wp_error($vault))return $vault;
        $tables=array(
            'events'=>self::dump_table('moj_timeline_event',$pid),
            'comments'=>self::dump_table('moj_timeline_comment',$pid),
            'media'=>self::dump_table('moj_timeline_media',$pid),
            'office'=>self::dump_table('moj_office_record',$pid),
            'messages'=>self::dump_table('moj_reference_message',$pid),
        );
        $files=array();
        foreach(array_merge($tables['media'],$tables['office']) as $row){
            $name=$row['stored_name']??'';
            if(!$name)continue;
            if(!preg_match('/^[a-zA-Z0-9_-]{8,98}\.(jpg|png|webp|pdf)$/',$name)) {
                return self::error('unsafe_file','نام فایل داخل آرشیو ایمن نیست.',500);
            }
            $path=$vault.DIRECTORY_SEPARATOR.basename($name);
            if(!is_file($path)||!is_readable($path)) {
                return self::error('missing_file','یک فایل خصوصی وجود ندارد؛ آرشیو ناقص ساخته نمی‌شود.',409);
            }
            $files[$name]=$path;
        }
        if(count($files)>1000)return self::error('limit','تعداد فایل‌ها بیش از سقف ۱۰۰۰ است؛ نیاز به آرشیوسازی دسته‌ای دارد.',413);
        $bytes=0;
        foreach($files as $path){$bytes+=filesize($path);if($bytes>512*1024*1024){
            return self::error('limit','آرشیوهای بزرگ‌تر از ۵۱۲ مگابایت نیازمند پردازش سروری جدا هستند.',413);
        }}
        // Include WP Media Library featured image and project gallery, in addition
        // to the private vault evidence. Do not traverse outside wp_upload_dir.
        $wpAttachments=array();
        $attachmentPaths=array();
        $ids=array_filter(array_unique(array_merge(
            array((int)get_post_thumbnail_id($pid)),
            array_map('absint',explode(',',(string)get_post_meta($pid,'moj_gallery_ids',true)))
        )));
        $uploads=wp_upload_dir();
        $uploadRoot=realpath($uploads['basedir']);
        foreach($ids as $aid){
            if(get_post_type($aid)!=='attachment')continue;
            $path=realpath((string)get_attached_file($aid));
            if(!$path||!$uploadRoot||!str_starts_with($path,$uploadRoot.DIRECTORY_SEPARATOR)||!is_readable($path)) {
                return self::error('missing_media','تصویر عمومی پروژه در کتابخانه رسانه پیدا نشد.',409);
            }
            $bytes+=filesize($path);
            if($bytes>512*1024*1024)return self::error('limit','حجم آرشیو بیش از سقف مجاز است.',413);
            $entry='wp-media/'.$aid.'/'.basename($path);
            $attachmentPaths[$entry]=$path;
            $wpAttachments[]=array(
                'id'=>$aid,'post'=>get_post($aid,ARRAY_A),
                'meta'=>get_post_meta($aid),'entry'=>$entry,'sha256'=>hash_file('sha256',$path)
            );
        }
        $manifestFiles=array();
        foreach($files as $name=>$path)$manifestFiles[$name]=hash_file('sha256',$path);
        $terms=wp_get_object_terms($pid,'moj_project_status',array('fields'=>'slugs'));
        $manifest=array(
            'format'=>'mojarrad-project-backup-v1',
            'createdAt'=>gmdate('c'),
            'project'=>$post,
            'postMeta'=>get_post_meta($pid),
            'terms'=>is_wp_error($terms)?array():$terms,
            'members'=>Mojarrad_Access::assigned_users($pid),
            'wpAttachments'=>$wpAttachments,
            'records'=>$tables,
            'auditEvents'=>$wpdb->get_results($wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}moj_audit_event WHERE project_id=%d ORDER BY id ASC",$pid
            ),ARRAY_A),
            'checksums'=>$manifestFiles,
        );
        try{$name='backup-'.bin2hex(random_bytes(16)).'.zip';}
        catch(Throwable $e){return self::error('random','ساخت نام ایمن آرشیو ممکن نیست.',503);}
        $temp=$vault.DIRECTORY_SEPARATOR.$name.'.tmp';
        $destination=$vault.DIRECTORY_SEPARATOR.$name;
        $zip=new ZipArchive();
        if($zip->open($temp,ZipArchive::CREATE|ZipArchive::EXCL)!==true)
            return self::error('zip','امکان ساخت فایل آرشیو وجود ندارد.',503);
        $json=wp_json_encode($manifest,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
        $zip->addFromString('project-data.json',$json);
        $zip->addFromString('README.txt',"Mojarrad verified non-destructive archive\nThis archive includes private project records and files.\nRestore is a controlled administrative process; do not upload to public media.\n");
        foreach($files as $stored=>$path)$zip->addFile($path,'files/'.$stored);
        foreach($attachmentPaths as $entry=>$path)$zip->addFile($path,$entry);
        if(!$zip->close()||!is_file($temp)){@unlink($temp);return self::error('zip','بستن فایل آرشیو شکست خورد.',500);}
        $check=new ZipArchive();
        if($check->open($temp)!==true){@unlink($temp);return self::error('verify','فایل آرشیو قابل باز شدن نیست.',500);}
        $read=$check->getFromName('project-data.json');
        $decoded=$read?json_decode($read,true):null;
        $verified=is_array($decoded)&&($decoded['format']??'')==='mojarrad-project-backup-v1'&&
            (int)($decoded['project']['ID']??0)===$pid&&count($files)==count($decoded['checksums']??array());
        if($verified){
            foreach($manifestFiles as $stored=>$hash){
                $stream=$check->getStream('files/'.$stored);
                if(!$stream){$verified=false;break;}
                $ctx=hash_init('sha256');
                while(!feof($stream)){hash_update($ctx,fread($stream,65536));}
                fclose($stream);
                if(!hash_equals($hash,hash_final($ctx))){$verified=false;break;}
            }
        }
        if($verified){
            foreach($wpAttachments as $item){
                $stream=$check->getStream($item['entry']);
                if(!$stream){$verified=false;break;}
                $ctx=hash_init('sha256');
                while(!feof($stream))hash_update($ctx,fread($stream,65536));
                fclose($stream);
                if(!hash_equals($item['sha256'],hash_final($ctx))){$verified=false;break;}
            }
        }
        $check->close();
        if(!$verified){@unlink($temp);return self::error('verify','راستی‌آزمایی آرشیو موفق نبود؛ نسخه ناقص نگهداری نشد.',500);}
        if(!rename($temp,$destination)){@unlink($temp);return self::error('storage','انتقال آرشیو به فضای خصوصی ناموفق بود.',500);}
        @chmod($destination,0600);
        global $wpdb;
        $size=filesize($destination);
        $sha=hash_file('sha256',$destination);
        $ok=$wpdb->insert(self::table(),array(
            'project_id'=>$pid,'created_by'=>get_current_user_id(),'stored_name'=>$name,
            'file_sha256'=>$sha,'file_size'=>$size,'included_files'=>count($files)+count($attachmentPaths),
            'created_at'=>current_time('mysql',true),
        ));
        if(!$ok){@unlink($destination);return self::error('database','ثبت آرشیو ناموفق بود.',500);}
        $id=(int)$wpdb->insert_id;
        Mojarrad_Office::audit($pid,'create_archive','archive',$id,array('sha256'=>$sha,'files'=>count($files)+count($attachmentPaths)));
        return new WP_REST_Response(array('archive'=>array(
            'id'=>$id,'sha256'=>$sha,'size'=>$size,'files'=>count($files)+count($attachmentPaths),'url'=>self::signed_url($id),
        )),201);
    }
    public static function download(): void {
        $id=isset($_GET['id'])?absint($_GET['id']):0;
        if(!$id||!is_user_logged_in())wp_die('ورود الزامی است.','',array('response'=>403));
        check_admin_referer('mojarrad_archive_'.$id);
        global $wpdb;$t=self::table();
        $row=$wpdb->get_row($wpdb->prepare("SELECT * FROM {$t} WHERE id=%d",$id));
        if(!$row||!self::permitted((int)$row->project_id))wp_die('دسترسی به آرشیو مجاز نیست.','',array('response'=>403));
        $vault=Mojarrad_Timeline_Media::vault();
        if(is_wp_error($vault))wp_die('ذخیره‌سازی در دسترس نیست.','',array('response'=>503));
        $path=$vault.DIRECTORY_SEPARATOR.basename($row->stored_name);
        if(!is_file($path)||!hash_equals($row->file_sha256,hash_file('sha256',$path)))
            wp_die('فایل آرشیو موجود نیست یا اعتبارسنجی ناموفق بود.','',array('response'=>409));
        nocache_headers();header('X-Content-Type-Options: nosniff');
        header('Cache-Control: no-store, private');
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="mojarrad-project-'.$row->project_id.'.zip"');
        header('Content-Length: '.filesize($path));
        readfile($path);exit;
    }
}
