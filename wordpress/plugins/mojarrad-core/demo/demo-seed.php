<?php
/**
 * WordPress Playground demonstration content for Nika Bana.
 * This file is NOT part of production installation or plugin activation.
 * It must only be explicitly run by the Playground Blueprint.
 */
defined('ABSPATH') || exit;
if (!defined('MOJARRAD_PLAYGROUND_SEED') || MOJARRAD_PLAYGROUND_SEED !== true) {
    return;
}

update_option('blogname', 'گروه ساختمانی نیکا بنا');
update_option('blogdescription', 'پیش‌نمایش آزمایشی سایت گروه ساختمانی نیکا بنا');
update_option('permalink_structure', '/%postname%/');

function moj_demo_post($type, $slug, $title, $excerpt, $body, $meta = array()) {
    $post = get_page_by_path($slug, OBJECT, $type);
    if ($post) {
        return (int) $post->ID;
    }
    $id = wp_insert_post(array(
        'post_type' => $type,
        'post_status' => 'publish',
        'post_name' => $slug,
        'post_title' => $title,
        'post_excerpt' => $excerpt,
        'post_content' => '<p>' . esc_html($body) . '</p><p><em>این داده صرفاً برای نمایش نسخه آزمایشی WordPress Playground است.</em></p>',
        'post_author' => get_current_user_id() ?: 1,
    ), true);
    if (is_wp_error($id)) {
        throw new RuntimeException('Demo content could not be created: ' . $id->get_error_message());
    }
    foreach ($meta as $key => $value) {
        update_post_meta($id, 'moj_' . $key, $value);
    }
    return (int) $id;
}

$projects = array(
    array('anvari-8','آپارتمان مسکونی خیابان انوری','برج مسکونی ۸ واحدی با طراحی شهری و جزئیات اجرایی دقیق.','completed','مشهد، خیابان انوری','۴٬۲۰۰ متر مربع','۱۴۰۱–۱۴۰۲',100,'tower-1.jpg','tower-2.jpg,tower-3.jpg',''),
    array('namjou-6','آپارتمان مسکونی خیابان نامجو','مجموعه مسکونی با نور طبیعی، پلان باز و نمای معاصر.','completed','مشهد، خیابان نامجو','۲٬۸۰۰ متر مربع','۱۴۰۲–۱۴۰۳',100,'apt-3.jpg','apt-4.jpg,facade-2.jpg',''),
    array('koohsangi-5','آپارتمان مسکونی خیابان کوهسنگی','پروژه آپارتمانی با نمای ترکیبی و تراس‌های سبز.','completed','مشهد، کوهسنگی','۲٬۱۰۰ متر مربع','۱۴۰۲–۱۴۰۳',100,'apt-1.jpg','apt-2.jpg,facade-1.jpg',''),
    array('zeshk-villa-12','ویلای کوهستانی زشک ۱۲','ویلای کوهستانی با چشم‌انداز دره، نمای سنگ و شیشه.','completed','مشهد، زشک','۷۵۰ متر مربع','۱۴۰۳',100,'villa-z-1.jpg','villa-z-2.jpg,terr-1.jpg,terr-2.jpg','۱۸٫۵ میلیارد تومان'),
    array('zeshk-villa-14','ویلای کوهستانی زشک ۱۴','معماری مدرن هماهنگ با شیب طبیعی زمین.','completed','مشهد، زشک','۵۵۰ متر مربع','۱۴۰۳',100,'villa-z-3.jpg','villa-z-4.jpg,terr-3.jpg','۱۳٫۲ میلیارد تومان'),
    array('kahou-villa','ویلای جاده روستای کاهو','ویلای باغی با حیاط مرکزی و طراحی آرام و مینیمال.','completed','مشهد، کاهو','۴۰۰ متر مربع','۱۴۰۳',100,'villa-k-1.jpg','villa-k-2.jpg,villa-k-3.jpg','۸٫۹ میلیارد تومان'),
    array('torghabe-anjiri-1','ویلای مسکونی طرقبه انجیری ۱','پروژه ویلایی چندواحدی در مرحله تأسیسات.','in-progress','مشهد، طرقبه','۵۰۰ متر مربع','۱۴۰۴',64,'cons-n-1.jpg','cons-n-2.jpg,cons-n-3.jpg',''),
    array('dahm-sharie-villa','ویلای دوبلکس دهم شریع','پروژه مسکونی دوبلکس در مرحله اسکلت و ساخت.','in-progress','مشهد، دهم شریع','۴۰۰ متر مربع','۱۴۰۴',32,'villa-1.jpg','villa-2.jpg,cons-2.jpg',''),
    array('preview-future-design','طرح مفهومی ویلای آینده — آزمایشی','نمونه کاملاً آزمایشی برای تست بخش پروژه‌های آینده.','future','مشهد — نمونه نمایشی','—','۱۴۰۶',0,'facade-2.jpg','facade-1.jpg',''),
);
foreach ($projects as $p) {
    $id = moj_demo_post('moj_project',$p[0],$p[1],$p[2],$p[2],array(
        'subtitle'=>'نمونه داده نسخه اصلی؛ صرفاً پیش‌نمایش',
        'location'=>$p[4], 'area'=>$p[5], 'year'=>$p[6],
        'progress'=>(string) $p[7], 'status'=>$p[3]==='completed'?'تکمیل‌شده':($p[3]==='in-progress'?'در حال اجرا':'در مرحله طراحی'),
        'demo_cover'=>$p[8], 'demo_gallery'=>$p[9],
        'for_sale'=>$p[10]!==''?'1':'0','sale_price'=>$p[10],
        'sale_description'=>'برای بررسی نحوه نمایش صفحه فروش. قیمت و وضعیت فروش واقعی تأیید نشده است.',
    ));
    if (taxonomy_exists('moj_project_status')) {
        wp_set_object_terms($id,$p[3],'moj_project_status');
    }
}
$news = array(
    array('sample-steel-prices','تحولات بازار میلگرد و فولاد','مرور تغییرات بازار مصالح برای مدیران پروژه.','mat-1.jpg','قیمت مصالح'),
    array('sample-building-regulations','نکات حقوقی پیش از شروع پروژه','چند موضوع کلیدی برای بررسی مدارک و مجوزها.','banners/milestone.jpg','قوانین و سیاست‌ها'),
    array('sample-company-progress','گزارش پیشرفت پروژه‌های ساختمانی','معرفی شیوه ثبت گزارش و مستندات پروژه.','cons-n-2.jpg','خبر شرکت'),
    array('sample-market-materials','انتخاب مصالح مناسب برای دیوارچینی','مقایسه ویژگی‌های عمومی مصالح پرکاربرد.','aac-1.jpg','قیمت مصالح'),
    array('sample-seasonal-note','رویدادهای گروه ساختمانی','بنر نمونه برای بررسی بخش اخبار مناسبتی.','banners/holiday.jpg','خبر شرکت'),
);
foreach($news as $n) {
    $id=moj_demo_post('moj_news',$n[0],$n[1],$n[2],$n[2],array('demo_image'=>$n[3]));
    wp_set_post_categories($id,array(wp_create_category($n[4])),false);
}
$articles=array(
    array('sample-aac-blocks','بلوک هبلکس؛ مزایا و محدودیت‌ها','نکات اجرایی دیوارهای AAC، اتصال و اندود.','aac-2.jpg','مصالح'),
    array('sample-facade','اجرای نمای ترکیبی سنگ و آجر','اصول هماهنگی نما با شرایط اقلیمی و هزینه نگهداری.','facade-2.jpg','نما'),
    array('sample-electrical','اشتباهات رایج تأسیسات برقی','نکات کنترل مسیرها و هماهنگی با سایر تأسیسات.','mep-1.jpg','تأسیسات'),
    array('sample-waterproof','آب‌بندی سرویس‌ها و بام','مراحل کنترل اجرای عایق رطوبتی و تست آب‌بندی.','bp-2.jpg','عایق‌کاری'),
    array('sample-structure','هماهنگی سازه و معماری','چرا تصمیم‌های سازه‌ای بر کیفیت پلان اثر می‌گذارند.','cons-1.jpg','سازه'),
    array('sample-terraces','جزئیات تراس و محوطه ویلایی','توصیه‌هایی برای زهکشی، کف‌سازی و نگهداری تراس.','terr-2.jpg','معماری'),
);
foreach($articles as $a) {
    $id=moj_demo_post('post',$a[0],$a[1],$a[2],$a[2],array('demo_image'=>$a[3]));
    wp_set_post_categories($id,array(wp_create_category($a[4])),false);
}
$officials=array(
    array('demo-hossein-mojarrad','مهندس حسین مجرد','مدیریت گروه ساختمانی','company'),
    array('demo-amir-kazemi','مهندس امیر کاظمی','مدیر فنی و اجرا (نمونه نمایشی)','company'),
    array('demo-mehdi-rostami','مهندس مهدی رستمی','سرپرست دفتر فنی (نمونه نمایشی)','company'),
);
foreach($officials as $o) {
    moj_demo_post('moj_official',$o[0],$o[1],$o[2],$o[2],array('official_role'=>$o[2],'official_group'=>$o[3]));
}
$about=get_page_by_path('about');
if($about && trim(wp_strip_all_tags($about->post_content))==='') {
    wp_update_post(array('ID'=>$about->ID,'post_content'=>'<p>نیکا بنا با تمرکز بر کیفیت اجرا، گزارش‌دهی و شفافیت پروژه‌های ساختمانی فعالیت می‌کند. این متن نمونه صرفاً برای پیش‌نمایش طراحی صفحه است.</p><p>مدیریت پروژه منظم، مستندسازی و اطلاع‌رسانی به مالکان از اصول محوری ساختار طراحی‌شده برای این سایت است.</p>'));
}
flush_rewrite_rules();

// Fail loudly rather than leaving an apparently empty WordPress installation.
if (!post_type_exists('moj_project') ||
    count(get_posts(array('post_type'=>'moj_project','post_status'=>'publish','numberposts'=>-1))) < 9 ||
    !get_page_by_path('sale') ||
    count(get_posts(array('post_type'=>'moj_news','post_status'=>'publish','numberposts'=>-1))) < 5) {
    throw new RuntimeException('WordPress Playground demo verification failed: public content or plugin was not initialized.');
}
