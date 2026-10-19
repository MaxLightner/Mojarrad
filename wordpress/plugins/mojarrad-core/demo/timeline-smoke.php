<?php
/**
 * WordPress integration gate for timeline role policy and life-cycle.
 * Invoked by CI and Playground after demo fixtures. Never run on production.
 */
defined('ABSPATH') || exit;
if(!defined('MOJARRAD_PLAYGROUND_SEED') || MOJARRAD_PLAYGROUND_SEED!==true)return;
$prior=get_current_user_id();
$admins=get_users(array('role'=>'administrator','number'=>1));
$admin=$admins?(int)$admins[0]->ID:0;
if(!$admin)throw new RuntimeException('Timeline smoke: administrator is missing');
$first=get_page_by_path('torghabe-anjiri-1',OBJECT,'moj_project');
$second=get_page_by_path('dahm-sharie-villa',OBJECT,'moj_project');
$owner=get_user_by('login','moj_demo_owner');
$supervisor=get_user_by('login','moj_demo_supervisor');
$engineer=get_user_by('login','moj_demo_engineer');
$contractor=get_user_by('login','moj_demo_contractor');
if(!$first||!$second||!$owner||!$supervisor||!$engineer||!$contractor) throw new RuntimeException('Timeline smoke: demo data missing');
if(get_option('mojarrad_timeline_smoke')==='passed')return;

function moj_timeline_test_request(int $uid,string $method,string $path,array $data=array()) {
    wp_set_current_user($uid);
    $req=new WP_REST_Request($method,'/mojarrad/v1/'.$path);
    if($data)$req->set_body_params($data);
    return rest_do_request($req);
}
function moj_timeline_assert(bool $result,string $message): void {
    if(!$result)throw new RuntimeException('Timeline smoke: '.$message);
}
$first_id=(int)$first->ID;$second_id=(int)$second->ID;
$public=moj_timeline_test_request($admin,'POST','projects/'.$first_id.'/timeline',array(
    'date'=>'2026-10-10','category'=>'visit','title'=>'بازدید داخلی کارگاه (نمونه)',
    'description'=>'بررسی جزئیات کارگاهی، فقط برای تیم اجرا.','isReport'=>false,
));
moj_timeline_assert($public->get_status()===201,'admin could not create internal event '.wp_json_encode($public->get_data()));
$private_id=$public->get_data()['event']['id'];
$report=moj_timeline_test_request($admin,'POST','projects/'.$first_id.'/timeline',array(
    'date'=>'2026-10-12','category'=>'execution','title'=>'گزارش رسمی پیشرفت (نمونه)',
    'description'=>'گزارش پیشرفت کار، قابل مشاهده برای مالک و ناظر.','isReport'=>true,
));
moj_timeline_assert($report->get_status()===201,'admin could not create official report');
$report_id=$report->get_data()['event']['id'];
$stage_start=moj_timeline_test_request($admin,'POST','projects/'.$first_id.'/timeline',array(
    'date'=>'2026-10-13','kind'=>'stage_start','stageKey'=>'mep','title'=>'','description'=>'شروع تأسیسات',
));
moj_timeline_assert($stage_start->get_status()===201,'stage start failed');
moj_timeline_assert((bool)$stage_start->get_data()['event']['isReport'],'stage start is not official');
moj_timeline_assert($stage_start->get_data()['event']['stageGroup']==='mep','stage group incorrect');
$stage_end=moj_timeline_test_request($admin,'POST','projects/'.$first_id.'/timeline',array(
    'date'=>'2026-10-17','kind'=>'stage_end','stageKey'=>'mep','title'=>'','description'=>'پایان تأسیسات',
));
moj_timeline_assert($stage_end->get_status()===201,'stage end failed');
$second_event=moj_timeline_test_request($admin,'POST','projects/'.$second_id.'/timeline',array(
    'date'=>'2026-10-15','title'=>'گزارش دومین پروژه','isReport'=>true,
));
moj_timeline_assert($second_event->get_status()===201,'second project event failed');
$invalid=moj_timeline_test_request($admin,'POST','projects/'.$first_id.'/timeline',array(
    'date'=>'2026-10-13','category'=>'payment','title'=>'پرداخت آزمایشی',
));
moj_timeline_assert($invalid->get_status()===400,'finance category creation was not blocked');
$owner_list=moj_timeline_test_request((int)$owner->ID,'GET','projects/'.$first_id.'/timeline');
moj_timeline_assert($owner_list->get_status()===200,'owner cannot read own project');
$owner_ids=array_map('intval',array_column($owner_list->get_data()['events'],'id'));
moj_timeline_assert(!in_array($private_id,$owner_ids,true),'owner leaked internal non-report event');
moj_timeline_assert(in_array($report_id,$owner_ids,true),'owner cannot see official report');
$super_list=moj_timeline_test_request((int)$supervisor->ID,'GET','projects/'.$first_id.'/timeline');
$super_ids=array_map('intval',array_column($super_list->get_data()['events'],'id'));
moj_timeline_assert(!in_array($private_id,$super_ids,true),'supervisor leaked internal non-report event');
moj_timeline_assert(in_array($report_id,$super_ids,true),'supervisor cannot see official report');
$contractor_foreign=moj_timeline_test_request((int)$contractor->ID,'GET','projects/'.$first_id.'/timeline');
moj_timeline_assert($contractor_foreign->get_status()===403,'contractor accessed unrelated client timeline');
$owner_foreign=moj_timeline_test_request((int)$owner->ID,'GET','projects/'.$second_id.'/timeline');
moj_timeline_assert($owner_foreign->get_status()===403,'owner accessed other project');
$contractor_add=moj_timeline_test_request((int)$contractor->ID,'POST','projects/'.$second_id.'/timeline',array(
    'title'=>'تلاش غیرمجاز','date'=>'2026-10-19',
));
moj_timeline_assert($contractor_add->get_status()===403,'contractor created timeline event');
$supervisor_comment=moj_timeline_test_request((int)$supervisor->ID,'POST','timeline/'.$report_id.'/comments',array('body'=>'Not allowed'));
moj_timeline_assert($supervisor_comment->get_status()===403,'supervisor posted comment');
$owner_internal_comment=moj_timeline_test_request((int)$owner->ID,'POST','timeline/'.$private_id.'/comments',array('body'=>'Not allowed'));
moj_timeline_assert($owner_internal_comment->get_status()===403,'owner commented on hidden event');
$owner_comment=moj_timeline_test_request((int)$owner->ID,'POST','timeline/'.$report_id.'/comments',array(
    'body'=>'لطفاً گزارش تکمیلی ارسال شود (نمونه)','visibility'=>'owner','needsFollowUp'=>true,
));
moj_timeline_assert($owner_comment->get_status()===201,'owner could not comment on official report');
$comments=$owner_comment->get_data()['comments'];
moj_timeline_assert(count($comments)===1,'owner new comment missing');
$comment_id=$comments[0]['id'];
$bad_vis=moj_timeline_test_request((int)$owner->ID,'POST','timeline/'.$report_id.'/comments',array(
    'body'=>'Private staff','visibility'=>'management',
));
moj_timeline_assert($bad_vis->get_status()===403,'owner forged internal visibility');
$super_list2=moj_timeline_test_request((int)$supervisor->ID,'GET','projects/'.$first_id.'/timeline');
foreach($super_list2->get_data()['events'] as $row) {
    moj_timeline_assert(empty($row['comments']),'supervisor saw comments');
}
$engineer_comment=moj_timeline_test_request((int)$engineer->ID,'POST','timeline/'.$report_id.'/comments',array(
    'body'=>'یادداشت تیم اجرا (نمونه)','visibility'=>'team',
));
moj_timeline_assert($engineer_comment->get_status()===201,'engineer could not send team comment');
$owner_after=moj_timeline_test_request((int)$owner->ID,'GET','projects/'.$first_id.'/timeline');
foreach($owner_after->get_data()['events'] as $row) {
    if($row['id']===$report_id) moj_timeline_assert(count($row['comments'])===1,'team comment leaked to owner');
}
$resolved=moj_timeline_test_request((int)$owner->ID,'PATCH','comments/'.$comment_id.'/resolve',array('resolved'=>true));
moj_timeline_assert($resolved->get_status()===200 && $resolved->get_data()['resolved']===true,'follow-up resolution failed');
$edit=moj_timeline_test_request((int)$engineer->ID,'PATCH','timeline/'.$report_id,array('title'=>'دستکاری رویداد مدیر'));
moj_timeline_assert($edit->get_status()===403,'engineer edited admin event');
$admin_edit=moj_timeline_test_request($admin,'PATCH','timeline/'.$private_id,array('title'=>'بازدید داخلی اصلاح‌شده'));
moj_timeline_assert($admin_edit->get_status()===200,'admin edit failed');
$anonymous=moj_timeline_test_request(0,'GET','projects/'.$first_id.'/timeline');
moj_timeline_assert($anonymous->get_status()!==200,'anonymous user read timeline');
$admin_delete=moj_timeline_test_request($admin,'DELETE','timeline/'.$stage_end->get_data()['event']['id']);
moj_timeline_assert($admin_delete->get_status()===200,'admin delete failed');
$deleted_read=moj_timeline_test_request($admin,'PATCH','timeline/'.$stage_end->get_data()['event']['id'],array('title'=>'Should stay deleted'));
moj_timeline_assert($deleted_read->get_status()===404,'deleted event still editable');
wp_set_current_user($prior);
update_option('mojarrad_timeline_smoke','passed',false);
