<?php
defined('ABSPATH')||exit;
/** WordPress + MySQL: office CRUD, role denial, reference revisions and verified archive. */
if(!defined('MOJARRAD_PLAYGROUND_SEED') || MOJARRAD_PLAYGROUND_SEED!==true)return;
$prior=get_current_user_id();
$admins=get_users(array('role'=>'administrator','number'=>1));
$admin=$admins?(int)$admins[0]->ID:0;
$owner=(int)get_user_by('login','moj_demo_owner')->ID;
$contractor=(int)get_user_by('login','moj_demo_contractor')->ID;
$supervisor=(int)get_user_by('login','moj_demo_supervisor')->ID;
$engineer=(int)get_user_by('login','moj_demo_engineer')->ID;
$pid=(int)get_page_by_path('torghabe-anjiri-1',OBJECT,'moj_project')->ID;
$pid2=(int)get_page_by_path('dahm-sharie-villa',OBJECT,'moj_project')->ID;
function moj_office_test(int $uid,string $method,string $path,array $body=array()) {
    wp_set_current_user($uid);
    $req=new WP_REST_Request($method,'/mojarrad/v1/'.$path);
    if($body)$req->set_body_params($body);
    return rest_do_request($req);
}
function moj_office_assert(bool $value,string $message) {
    if(!$value)throw new RuntimeException('Office test: '.$message);
}
moj_office_assert(Mojarrad_Schema::VERSION==='3','schema version not upgraded');
moj_office_assert((bool)get_page_by_path('office'),'office page missing');
$reference=moj_office_test($owner,'POST',"projects/$pid/office/references",array(
    'title'=>'رفرنس نمای اصلی','description'=>'طرح پیشنهادی مالک','metadata'=>array('category'=>'facade'),
));
moj_office_assert($reference->get_status()===201,'owner reference creation '.wp_json_encode($reference->get_data()));
$refid=(int)$reference->get_data()['item']['id'];
$version=moj_office_test($owner,'POST',"projects/$pid/office/references",array(
    'title'=>'بازنگری نمای اصلی','description'=>'نسخه دوم','supersedesId'=>$refid,'metadata'=>array('category'=>'facade'),
));
moj_office_assert($version->get_status()===201,'reference revision failed');
moj_office_assert((int)$version->get_data()['item']['version']===2,'reference version incorrect');
$old=Mojarrad_Office::record($refid);
moj_office_assert($old->status==='superseded','old reference not superseded');
$refmsg=moj_office_test($contractor,'POST',"office/record/$refid/messages",array('body'=>'پرسش پیمانکار'));
moj_office_assert($refmsg->get_status()===403,'unassigned contractor commented on reference');
$refmsg=moj_office_test($supervisor,'POST',"office/record/$refid/messages",array('body'=>'پرسش ناظر'));
moj_office_assert($refmsg->get_status()===403,'supervisor commented on reference');
$refmsg=moj_office_test($engineer,'POST',"office/record/$refid/messages",array('body'=>'جزئیات نقشه بررسی شود'));
moj_office_assert($refmsg->get_status()===201,'engineer reference message failed');
$ownerDocs=moj_office_test($owner,'GET',"projects/$pid/office/documents");
moj_office_assert($ownerDocs->get_status()===200,'owner cannot read project documents');
$badDoc=moj_office_test($owner,'POST',"projects/$pid/office/documents",array('title'=>'سند غیرمجاز'));
moj_office_assert($badDoc->get_status()===403,'owner wrote a document without permission');
$doc=moj_office_test($engineer,'POST',"projects/$pid/office/documents",array(
    'title'=>'نقشه طبقه همکف','metadata'=>array('category'=>'plan','note'=>'نسخه آزمایشی')
));
moj_office_assert($doc->get_status()===201,'engineer document creation failed');
$docId=(int)$doc->get_data()['item']['id'];
$doc2=moj_office_test($admin,'POST',"projects/$pid/office/documents",array(
    'title'=>'نقشه همکف اصلاح‌شده','supersedesId'=>$docId,'metadata'=>array('category'=>'plan')
));
moj_office_assert($doc2->get_status()===201 && $doc2->get_data()['item']['version']===2,'document revision failed');
$supervisorDocs=moj_office_test($supervisor,'GET',"projects/$pid/office/documents");
moj_office_assert($supervisorDocs->get_status()===200,'supervisor document read denied');
$supervisorPayment=moj_office_test($supervisor,'GET',"projects/$pid/office/payments");
moj_office_assert($supervisorPayment->get_status()===403,'supervisor saw payments');
$engineerPayment=moj_office_test($engineer,'GET',"projects/$pid/office/payments");
moj_office_assert($engineerPayment->get_status()===403,'engineer saw payments');
$payment=moj_office_test($owner,'POST',"projects/$pid/office/payments",array(
    'title'=>'پرداخت بتن','amount'=>'120000000','date'=>'2026-10-17','description'=>'پرداخت تستی'
));
moj_office_assert($payment->get_status()===201,'owner payment create failed '.wp_json_encode($payment->get_data()));
$payId=(int)$payment->get_data()['item']['id'];
moj_office_assert($payment->get_data()['item']['amount']==='120000000','payment amount mismatch');
$changeMoney=moj_office_test($owner,'PATCH',"office/record/$payId",array('amount'=>'9000'));
moj_office_assert($changeMoney->get_status()===409,'immutable payment amount changed');
$invalidAmount=moj_office_test($owner,'POST',"projects/$pid/office/payments",array('title'=>'غلط','amount'=>'-12'));
moj_office_assert($invalidAmount->get_status()===400,'invalid payment accepted');
$ownerEvents=moj_office_test($owner,'GET',"projects/$pid/timeline");
$payIds=array_filter($ownerEvents->get_data()['events'],fn($event)=>$event['category']==='payment');
moj_office_assert(count($payIds)>=1,'payment event missing from owner timeline');
$superEvents=moj_office_test($supervisor,'GET',"projects/$pid/timeline");
$superPays=array_filter($superEvents->get_data()['events'],fn($event)=>$event['category']==='payment');
moj_office_assert(count($superPays)===0,'payment event leaked to supervisor');
$contract=moj_office_test($admin,'POST',"projects/$pid/office/contracts",array(
    'title'=>'قرارداد اصلی','metadata'=>array(
        'contractorName'=>'پیمانکار آزمایشی','startDate'=>'۱۴۰۵/۰۱','endDate'=>'۱۴۰۵/۱۲','financialStatus'=>'balanced',
    ),
));
moj_office_assert($contract->get_status()===201,'contract creation failed');
$ownerContracts=moj_office_test($owner,'GET',"projects/$pid/office/contracts");
moj_office_assert($ownerContracts->get_status()===403,'owner saw restricted contracts');
$worker=moj_office_test($engineer,'POST',"projects/$pid/office/workers",array(
    'title'=>'نیروی آزمایشی','metadata'=>array('job'=>'بنّا','phone'=>'09120000000','active'=>'1'),
));
moj_office_assert($worker->get_status()===201,'engineer could not add project worker');
$workerId=(int)$worker->get_data()['item']['id'];
$disable=moj_office_test($engineer,'PATCH',"office/record/$workerId",array('metadata'=>array('active'=>'0')));
moj_office_assert($disable->get_status()===200,'could not update worker status');
$foreignWorkers=moj_office_test($contractor,'GET',"projects/$pid/office/workers");
moj_office_assert($foreignWorkers->get_status()===403,'contractor viewed foreign project workers');
$contact=moj_office_test($admin,'POST','office/contacts',array(
    'title'=>'کارگر آزمایشی تماس','metadata'=>array('phone'=>'09121111111','type'=>'worker','isTemporary'=>'1'),
));
moj_office_assert($contact->get_status()===201,'admin contacts create failed');
$ownerContact=moj_office_test($owner,'GET','office/contacts');
moj_office_assert($ownerContact->get_status()===403,'owner accessed global contacts');
$archiveDenied=moj_office_test($owner,'POST',"projects/$pid/archives");
moj_office_assert($archiveDenied->get_status()===403,'owner could archive project');
$archive=moj_office_test($admin,'POST',"projects/$pid/archives");
moj_office_assert($archive->get_status()===201,'verified archive failed '.wp_json_encode($archive->get_data()));
$export=$archive->get_data()['archive'];
moj_office_assert(strlen($export['sha256'])===64,'archive sha missing');
moj_office_assert((bool)get_post($pid),'creating archive deleted live project');
$zipPath=Mojarrad_Timeline_Media::vault().DIRECTORY_SEPARATOR.basename(
    $GLOBALS['wpdb']->get_var($GLOBALS['wpdb']->prepare(
        "SELECT stored_name FROM {$GLOBALS['wpdb']->prefix}moj_project_archive WHERE id=%d",(int)$export['id']
    ))
);
$zip=new ZipArchive();
moj_office_assert($zip->open($zipPath)===true,'archive cannot reopen');
$decoded=json_decode($zip->getFromName('project-data.json'),true);
moj_office_assert(is_array($decoded)&&count($decoded['records']['office'])>=5,'office data omitted from archive');
$zip->close();
$archiveList=moj_office_test($admin,'GET',"projects/$pid/archives");
moj_office_assert($archiveList->get_status()===200 && count($archiveList->get_data()['items'])>=1,'archive not discoverable');
wp_set_current_user($prior);
update_option('mojarrad_office_smoke','passed',false);
