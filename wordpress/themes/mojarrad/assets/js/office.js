(function(){
"use strict";
const cfg=window.mojOffice;
const app=document.getElementById('moj-office-app');
if(!app||!cfg)return;
const $=id=>document.getElementById(id);
const list=$('moj-office-items'),msg=$('moj-office-status'),dialog=$('moj-office-dialog'),form=$('moj-office-form');
const section=cfg.section,pid=Number(cfg.project);
const titles={references:'رفرنس‌ها',documents:'مدارک و نقشه‌ها',payments:'رسیدهای مالی',contracts:'قراردادها',workers:'نیروهای اجرایی',contacts:'دفترچه تماس',archive:'آرشیو خصوصی'};
const statusLabels={active:'فعال',superseded:'نسخه قدیمی',archived:'بایگانی‌شده'};
const fields={
  references:[['category','دسته','select',['photo:تصویر','facade:نما','interior:داخلی','plan:نقشه','other:سایر']]],
  documents:[['category','دسته','select',['plan:نقشه','permit:مجوز','drawing:نقشه اجرایی','report:گزارش','other:سایر']],['note','توضیح نسخه','text']],
  payments:[['amount','مبلغ (تومان، فقط رقم)','number'],['date','تاریخ پرداخت (میلادی)','date'],['method','روش پرداخت','text'],['referenceNumber','شماره پیگیری','text']],
  contracts:[['contractorName','طرف قرارداد','text'],['startDate','شروع قرارداد (شمسی متنی)','text'],['endDate','پایان قرارداد (شمسی متنی)','text'],['financialStatus','وضعیت حساب','select',['balanced:تسویه','debtor:بدهکار','creditor:بستانکار']],['totalPaid','جمع پرداختی','text']],
  workers:[['job','حرفه','text'],['phone','شماره تماس','tel'],['active','فعال','select',['1:فعال','0:غیرفعال']]],
  contacts:[['phone','شماره تماس','tel'],['type','دسته تماس','select',['worker:نیرو','contractor:پیمانکار','supplier:تأمین‌کننده','other:سایر']],['note','یادداشت','text'],['isTemporary','شماره موقت','select',['1:موقت','0:دائمی']]],
};
const labels={
  category:'دسته',note:'یادداشت',method:'روش پرداخت',referenceNumber:'شماره پیگیری',
  contractorName:'طرف قرارداد',startDate:'شروع',endDate:'پایان',financialStatus:'وضعیت مالی',
  totalPaid:'جمع پرداختی',job:'حرفه',phone:'شماره تماس',active:'فعال',type:'نوع',
  isTemporary:'موقت',lastCheckedAt:'آخرین بررسی',
};
const E=(tag,cls,value)=>{
  const n=document.createElement(tag);
  if(cls)n.className=cls;
  if(value!==undefined)n.textContent=String(value);
  return n;
};
function btn(label,callback,cls='moj-small-button'){
  const n=E('button',cls,label);n.type='button';n.addEventListener('click',callback);return n;
}
function status(value,err=false){msg.textContent=value;msg.hidden=!value;msg.classList.toggle('moj-alert',err);}
async function api(path,method='GET',body){
  const headers={'X-WP-Nonce':cfg.nonce};
  if(body!==undefined && !(body instanceof FormData))headers['Content-Type']='application/json';
  const response=await fetch(cfg.rest+path,{method,headers,body:body===undefined?undefined:body instanceof FormData?body:JSON.stringify(body),credentials:'same-origin',cache:'no-store'});
  let result=null;
  try{result=await response.json();}catch(e){}
  if(!response.ok)throw new Error(result?.message||'خطا در دریافت یا ذخیره اطلاعات ('+response.status+')');
  return result;
}
function route(){return section==='contacts'?'office/contacts':section==='archive'?'projects/'+pid+'/archives':'projects/'+pid+'/office/'+section;}
function safeDate(value){if(!value)return '—';return String(value).slice(0,10);}
function metadataDisplay(item){
  const root=E('div','metadata');
  Object.entries(item.metadata||{}).forEach(([k,v])=>{
    if(['timelineId'].includes(k)||v===''||v===null)return;
    const key=labels[k]||k;root.append(E('span',null,key+': '+(v==='1'&&['active','isTemporary'].includes(k)?'بله':v==='0'&&['active','isTemporary'].includes(k)?'خیر':v)));
  });
  return root;
}
function archiveCard(a){
  const card=E('article','card-lux moj-office-card');
  card.append(E('h3',null,'نسخه پشتیبان شماره '+a.id));
  const meta=E('div','moj-office-summary');
  meta.append(E('span',null,'تاریخ: '+safeDate(a.createdAt)),E('span',null,'فایل‌ها: '+a.files),E('span',null,'حجم: '+(a.size/1048576).toFixed(2)+' مگابایت'));
  card.append(meta,E('p',null,'SHA-256: '+a.sha256));
  const link=E('a','btn-outline','دریافت ZIP تأییدشده');link.href=a.url;card.append(link);
  return card;
}
function actions(item) {
  const div=E('div','actions');
  if(item.file){const a=E('a','btn-outline','دریافت فایل خصوصی: '+item.file.name);a.href=item.file.url;a.rel='noopener noreferrer';a.target='_blank';div.append(a);}
  if(item.canEdit && item.status==='active') {
    div.append(btn('ویرایش',()=>open(item)));
    if(['references','documents','contracts'].includes(section))div.append(btn('ثبت نسخه جدید',()=>open(null,item)));
    if(['references','documents','payments','contracts'].includes(section))div.append(btn(item.file?'جایگزینی فایل':'افزودن فایل',()=>upload(item)));
    if(section==='contacts')div.append(btn('بررسی شد',async()=>{
      try{await api('office/record/'+item.id,'PATCH',{metadata:{lastCheckedAt:new Date().toISOString().slice(0,10)}});await load();}
      catch(e){status(e.message,true);}
    }));
    if(section==='workers')div.append(btn(item.metadata?.active==='0'?'فعال کردن':'غیرفعال کردن',async()=>{
      try{await api('office/record/'+item.id,'PATCH',{metadata:{active:item.metadata?.active==='0'?'1':'0'}});await load();}
      catch(e){status(e.message,true);}
    }));
  }
  if(item.canDelete)div.append(btn('بایگانی رکورد',async()=>{
    if(!confirm('این رکورد بایگانی شود؟ اطلاعات در دیتابیس باقی می‌مانند.'))return;
    try{await api('office/record/'+item.id,'DELETE');await load();}catch(e){status(e.message,true);}
  },'moj-small-button danger'));
  return div;
}
function card(item){
  const n=E('article','card-lux moj-office-card');
  const head=E('header');head.append(E('span','section-label','نسخه '+item.version),E('span','status',statusLabels[item.status]||item.status));n.append(head);
  n.append(E('h3',null,item.title));
  if(item.description)n.append(E('p',null,item.description));
  const meta=metadataDisplay(item);if(meta.children.length)n.append(meta);
  if(item.amount)n.append(E('p','money',Number(item.amount).toLocaleString('fa-IR')+' تومان'));
  if(item.date)n.append(E('small','muted','تاریخ: '+safeDate(item.date)));
  n.append(actions(item));
  if(section==='references'){
    const discussion=E('div','moj-office-messages');discussion.append(E('strong',null,'گفتگوی رفرنس'));
    (item.messages||[]).forEach(m=>{
      const box=E('div','message',m.body);box.append(E('small',null,m.authorName+' — '+safeDate(m.createdAt)));discussion.append(box);
    });
    if(cfg.permissions[section]?.comment){
      const f=E('form'),t=E('textarea');t.required=true;t.maxLength=6000;t.placeholder='پرسش یا نظر درباره این رفرنس';
      const send=E('button','btn-gold','ارسال');send.type='submit';f.append(t,send);
      f.addEventListener('submit',async e=>{
        e.preventDefault();send.disabled=true;
        try{await api('office/record/'+item.id+'/messages','POST',{body:t.value});await load();}
        catch(ex){status(ex.message,true);}finally{send.disabled=false;}
      });
      discussion.append(f);
    }
    n.append(discussion);
  }
  return n;
}
let busy=false;
async function load(){
  if(busy)return;busy=true;status('در حال دریافت اطلاعات…');
  try{
    const response=await api(route());
    list.replaceChildren();
    const items=response.items||[];
    if(!items.length)list.append(E('p','notice','هنوز اطلاعاتی در این بخش ثبت نشده است.'));
    items.forEach(item=>list.append(section==='archive'?archiveCard(item):card(item)));
    status('');
  }catch(e){status(e.message,true);}
  finally{busy=false;}
}
function open(item=null,old=null){
  form.reset();form.dataset.editId=item?.id||'';form.dataset.supersedesId=old?.id||'';
  $('moj-office-dialog-title').textContent=old?'ثبت نسخه جدید':item?'ویرایش '+(titles[section]||section):'ثبت '+(titles[section]||section);
  form.elements.namedItem('title').value=item?.title||old?.title||'';
  form.elements.namedItem('description').value=item?.description||old?.description||'';
  $('moj-office-file-label').hidden=!['references','documents','payments','contracts'].includes(section)||!!item;
  const container=$('moj-office-fields');container.replaceChildren();
  (fields[section]||[]).forEach(([key,title,type,options])=>{
    if(item && section==='payments' && ['amount','date'].includes(key))return;
    const label=E('label',null,title);
    let input;
    if(type==='select'){
      input=E('select');
      (options||[]).forEach(option=>{
        const [val,name]=option.split(':');const op=E('option',null,name);op.value=val;input.append(op);
      });
    }else{input=E('input');input.type=type;input.maxLength=type==='number'?18:200;}
    input.name=key;
    const value=(key==='amount'?item?.amount||old?.amount:key==='date'?item?.date||old?.date:(item?.metadata||old?.metadata||{})[key]);
    if(value!==undefined&&value!==null)input.value=String(value);
    else if(key==='date')input.value=new Date().toISOString().slice(0,10);
    if(!item && ['amount','phone','job'].includes(key) && (section==='payments'||section==='contacts'||section==='workers'))input.required=true;
    label.append(input);container.append(label);
  });
  $('moj-office-form-error').hidden=true;
  dialog.showModal();
}
async function upload(item){
  const f=document.createElement('input');f.type='file';f.accept='.jpg,.jpeg,.png,.webp,.pdf';
  f.addEventListener('change',async()=>{
    if(!f.files?.length)return;
    const data=new FormData();data.append('file',f.files[0]);
    try{status('در حال بارگذاری فایل…');await api('office/record/'+item.id+'/file','POST',data);await load();}
    catch(e){status(e.message,true);}
  },{once:true});f.click();
}
form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(busy)return;
  busy=true;const save=$('moj-office-save');save.disabled=true;
  const id=Number(form.dataset.editId||0),body={
    title:form.elements.namedItem('title').value,
    description:form.elements.namedItem('description').value,
    metadata:{},
  };
  (fields[section]||[]).forEach(([key])=>{
    const input=form.elements.namedItem(key);
    if(!input)return;
    if(key==='amount'||key==='date')body[key]=input.value;
    else body.metadata[key]=input.value;
  });
  if(form.dataset.supersedesId)body.supersedesId=Number(form.dataset.supersedesId);
  const file=form.elements.namedItem('file')?.files?.[0];
  const error=$('moj-office-form-error');error.hidden=true;
  try{
    const response=await api(id?'office/record/'+id:route(),id?'PATCH':'POST',body);
    const rid=response.item?.id||id;
    dialog.close();busy=false;
    if(file&&rid){
      try{const data=new FormData();data.append('file',file);await api('office/record/'+rid+'/file','POST',data);}
      catch(ex){status('رکورد ثبت شد اما بارگذاری فایل ناموفق بود: '+ex.message,true);}
    }
    await load();
  }catch(ex){error.textContent=ex.message;error.hidden=false;}
  finally{busy=false;save.disabled=false;}
});
const add=$('moj-office-add');
add?.addEventListener('click',async()=>{
  if(section==='archive'){
    if(!confirm('یک ZIP خصوصی و قابل‌دریافت از سوابق فعلی پروژه ساخته شود؟ پروژه حذف نخواهد شد.'))return;
    add.disabled=true;
    try{status('در حال تهیه و راستی‌آزمایی آرشیو…');await api(route(),'POST',{});await load();}
    catch(ex){status(ex.message,true);}finally{add.disabled=false;}
  } else open();
});
dialog.querySelectorAll('[data-office-close]').forEach(b=>b.addEventListener('click',()=>dialog.close()));
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
load();
})();
