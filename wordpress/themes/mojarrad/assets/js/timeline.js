(function () {
  "use strict";
  const cfg=window.mojTimeline;
  const app=document.getElementById('moj-timeline-app');
  if(!cfg || !app) return;
  const $=id=>document.getElementById(id);
  const eventsEl=$('moj-events'),statusEl=$('moj-timeline-status'),more=$('moj-load-more');
  const create=$('moj-open-create'),dialog=$('moj-event-dialog'),form=$('moj-event-form');
  const state={events:[],page:0,hasNext:false,busy:false,viewer:null,stages:{}};
  const visibility={management:'داخلی (مدیر و مجری)',team:'تیم اجرا',owner:'مالک',contractor:'پیمانکار'};
  const stageGroups={structure:'سازه',mep:'تأسیسات',finishing:'نازک‌کاری',exterior:'نما و محوطه',admin:'اداری'};
  const categories={execution:'اجرای کار',visit:'بازدید',supply:'مصالح',decision:'تصمیم',delay:'تأخیر',reference:'رفرنس',payment:'پرداخت'};
  const visAllowed={
    admin:['management','team','owner','contractor'],executor:['management','team','owner','contractor'],
    engineer:['team','management'],foreman:['team','management'],
    owner:['owner','team'],contractor:['contractor','management'],
  };
  const label=(x,items)=>items[x]||x||'—';
  const node=(tag,cls,text)=>{
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(text!==undefined)el.textContent=String(text);
    return el;
  };
  function button(text,handler,cls='moj-small-button') {
    const el=node('button',cls,text);el.type='button';el.addEventListener('click',handler);return el;
  }
  function fmtDate(value) {
    const date=new Date(String(value).replace(' ','T')+'Z');
    return Number.isNaN(date.getTime())?String(value):new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'long',day:'numeric'}).format(date);
  }
  function setStatus(text,isError=false) {
    statusEl.hidden=!text;statusEl.textContent=text||'';statusEl.classList.toggle('moj-alert',isError);
  }
  async function call(path,options={}) {
    const headers={'X-WP-Nonce':cfg.nonce};
    if(options.body && !(options.body instanceof FormData)) headers['Content-Type']='application/json';
    const response=await fetch(cfg.rest+path,{
      method:options.method||'GET',headers,body:options.body,
      credentials:'same-origin',cache:'no-store'
    });
    const contentType=response.headers.get('content-type')||'';
    const result=contentType.includes('json')?await response.json():null;
    if(!response.ok)throw new Error(result?.message||'ارتباط با سرور با خطا مواجه شد ('+response.status+')');
    return result;
  }
  function dateAsISO(){
    const d=new Date(),p=n=>String(n).padStart(2,'0');
    return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());
  }
  function toggleStage(){
    const kind=form.elements.namedItem('kind').value,stage=kind!=='point';
    $('moj-stage-inputs').hidden=!stage;$('moj-stage-report-hint').hidden=!stage;
    form.elements.namedItem('category').disabled=stage;
    form.elements.namedItem('isReport').disabled=stage;
  }
  function populateStages(stages) {
    state.stages=stages||{};
    const sel=$('moj-stage-key');
    sel.replaceChildren(node('option',null,'انتخاب مرحله'));
    sel.firstChild.value='';
    Object.entries(state.stages).forEach(([key,value])=>{
      const opt=node('option',null,value.label);opt.value=key;sel.append(opt);
    });
  }
  function openForm(event) {
    form.reset();form.elements.namedItem('editingId').value=event?.id||'';
    form.elements.namedItem('date').value=event?.date?.slice(0,10)||dateAsISO();
    form.elements.namedItem('kind').value=event?.kind||'point';
    form.elements.namedItem('category').value=event?.category||'execution';
    form.elements.namedItem('stageKey').value=event?.stageKey||'';
    form.elements.namedItem('stageGroup').value=event?.stageGroup||'structure';
    form.elements.namedItem('title').value=event?.title||'';
    form.elements.namedItem('description').value=event?.description||'';
    form.elements.namedItem('isReport').checked=!!event?.isReport;
    $('moj-event-form-title').textContent=event?'ویرایش رویداد':'ثبت رویداد جدید';
    $('moj-form-error').hidden=true;
    toggleStage();dialog.showModal();
  }
  async function saveForm(e) {
    e.preventDefault();
    if(state.busy)return;
    const id=Number(form.elements.namedItem('editingId').value);
    const kind=form.elements.namedItem('kind').value;
    const payload={
      title:form.elements.namedItem('title').value.trim(),
      description:form.elements.namedItem('description').value,
      date:form.elements.namedItem('date').value,
      kind,category:kind==='point'?form.elements.namedItem('category').value:'execution',
      isReport:kind!=='point'||form.elements.namedItem('isReport').checked,
      stageKey:kind==='point'?'':form.elements.namedItem('stageKey').value,
      stageGroup:kind==='point'?'':form.elements.namedItem('stageGroup').value
    };
    const error=$('moj-form-error'),save=$('moj-save-event');
    error.hidden=true;save.disabled=true;state.busy=true;
    try {
      await call(id?'timeline/'+id:'projects/'+cfg.project+'/timeline',{
        method:id?'PATCH':'POST',body:JSON.stringify(payload)
      });
      dialog.close();await load(true);
    }catch(ex){error.hidden=false;error.textContent=ex.message;}
    finally{save.disabled=false;state.busy=false;}
  }
  function mediaItem(media) {
    const wrap=node('div','moj-media-item');
    const a=node('a',null,media.name||'پیوست');
    a.href=media.url;a.target='_blank';a.rel='noopener noreferrer';
    if(media.type==='image'){
      const image=node('img');image.loading='lazy';image.alt=media.name||'عکس گزارش';image.src=media.url;
      a.prepend(image);
    }
    wrap.append(a,node('span','moj-media-status',media.status==='approved'?'تأییدشده':media.status==='rejected'?'ردشده':'در انتظار تأیید'));
    if(media.canModerate && media.status!=='approved'){
      wrap.append(button('تأیید',()=>moderate(media.id,'approved')));
    }
    if(media.canModerate && media.status!=='rejected'){
      wrap.append(button('رد تصویر',()=>moderate(media.id,'rejected'),'moj-small-button danger'));
    }
    return wrap;
  }
  function commentItem(comment) {
    const el=node('div','moj-comment');
    el.append(node('div','moj-comment-meta',comment.authorName+' — '+label(comment.visibility,visibility)+' — '+fmtDate(comment.createdAt)));
    el.append(node('p',null,comment.body));
    if(comment.needsFollowUp) {
      el.append(node('div','moj-comment-followup',comment.resolvedAt?'پیگیری انجام‌شده':'نیازمند پیگیری'));
      if(comment.canResolve) {
        el.append(button(comment.resolvedAt?'باز کردن مجدد':'اعلام انجام',async()=>{
          try{await call('comments/'+comment.id+'/resolve',{
            method:'PATCH',body:JSON.stringify({resolved:!comment.resolvedAt})
          });await load(true);}catch(e){setStatus(e.message,true);}
        }));
      }
    }
    return el;
  }
  function commentForm(event) {
    const allowed=visAllowed[state.viewer.role]||[];
    const f=node('form','moj-comment-form');
    const text=node('textarea');text.required=true;text.maxLength=4000;text.placeholder='پیام یا پیگیری خود را بنویسید…';
    const row=node('div','moj-comment-row');
    const select=node('select');
    allowed.forEach(value=>{const option=node('option',null,label(value,visibility));option.value=value;select.append(option);});
    const visLabel=node('label',null,'مخاطب پیام');visLabel.append(select);
    const follow=node('input');follow.type='checkbox';
    const followLabel=node('label',null,'نیازمند پیگیری');followLabel.prepend(follow);
    const submit=node('button','btn-gold','ارسال پیام');submit.type='submit';
    row.append(visLabel,followLabel,submit);f.append(text,row);
    f.addEventListener('submit',async e=>{
      e.preventDefault();submit.disabled=true;
      try{await call('timeline/'+event.id+'/comments',{
        method:'POST',body:JSON.stringify({
          body:text.value,visibility:select.value,needsFollowUp:follow.checked
        })
      });await load(true);}
      catch(error){setStatus(error.message,true);}
      finally{submit.disabled=false;}
    });
    return f;
  }
  function uploadBlock(event) {
    const section=node('div','moj-inline-upload');
    const caption=node('label',null,'افزودن تصویر یا فایل PDF (هرکدام حداکثر ۶ مگابایت)');
    const input=node('input');input.type='file';input.multiple=true;input.accept='.jpg,.jpeg,.png,.webp,.pdf';
    caption.append(input);
    const submit=button('بارگذاری',async()=>{
      if(!input.files?.length)return;
      submit.disabled=true;
      try{
        for(const file of input.files) {
          const formData=new FormData();formData.append('file',file);
          await call('timeline/'+event.id+'/media',{method:'POST',body:formData});
        }
        await load(true);
      }catch(error){setStatus(error.message,true);}
      finally{submit.disabled=false;}
    });
    section.append(caption,submit);
    return section;
  }
  async function moderate(mediaId,status) {
    try{await call('media/'+mediaId+'/moderate',{method:'PATCH',body:JSON.stringify({status})});await load(true);}
    catch(error){setStatus(error.message,true);}
  }
  function eventCard(event) {
    const root=node('article','moj-event');root.dataset.category=event.category;
    const card=node('div','moj-event-card');
    const top=node('div','moj-event-top');
    const tags=node('div','moj-event-tags');
    tags.append(node('span','moj-tag',label(event.category,categories)));
    if(event.isReport)tags.append(node('span','moj-tag official','گزارش رسمی'));
    if(event.kind!=='point') {
      const labelStage=state.stages[event.stageKey]?.label||event.stageKey||'مرحله';
      tags.append(node('span','moj-tag', (event.kind==='stage_start'?'شروع ':'پایان ')+labelStage));
    }
    const time=node('time',null,fmtDate(event.date));time.dateTime=event.date.slice(0,10);
    top.append(tags,time);
    card.append(top,node('h2','moj-event-title',event.title));
    if(event.description)card.append(node('p','moj-event-description',event.description));
    card.append(node('div','moj-comment-meta','ثبت‌شده توسط '+event.authorName));
    const actions=node('div','moj-event-actions');
    if(event.canEdit) actions.append(button('ویرایش',()=>openForm(event)));
    if(event.canDelete) actions.append(button('حذف',async()=>{
      if(!window.confirm('رویداد از تایم‌لاین پنهان شود؟ قابل بازگردانی توسط مدیر فنی خواهد بود.'))return;
      try{await call('timeline/'+event.id,{method:'DELETE'});await load(true);}
      catch(error){setStatus(error.message,true);}
    },'moj-small-button danger'));
    if(actions.childNodes.length)card.append(actions);
    if(event.media?.length){
      const section=node('div','moj-media');
      event.media.forEach(media=>section.append(mediaItem(media)));
      card.append(section);
    }
    if(state.viewer?.canComment) {
      const comments=node('div','moj-comment-list');
      (event.comments||[]).forEach(comment=>comments.append(commentItem(comment)));
      card.append(comments,commentForm(event));
    }
    if(event.isReport || state.viewer?.canCreate || state.viewer?.role==='supervisor')card.append(uploadBlock(event));
    root.append(card);
    return root;
  }
  function showStages(events) {
    const root=$('moj-stage-summary');root.replaceChildren();
    const chronology=[...events].reverse(),active=new Map();
    chronology.forEach(event=>{
      if(!event.stageKey || event.kind==='point')return;
      if(event.kind==='stage_start')active.set(event.stageKey,{event,closed:false});
      if(event.kind==='stage_end')active.set(event.stageKey,{event,closed:true});
    });
    active.forEach((item,key)=>{
      const badge=node('span','moj-stage-pill'+(item.closed?'':' is-open'),
        (state.stages[key]?.label||key)+' — '+(item.closed?'پایان یافته':'در جریان'));
      root.append(badge);
    });
  }
  function render(){
    const filter=$('moj-filter').value;
    const items=state.events.filter(ev=>{
      if(filter==='report')return ev.isReport;
      if(filter==='stage')return ev.kind!=='point';
      if(filter==='followup')return (ev.comments||[]).some(c=>c.needsFollowUp&&!c.resolvedAt);
      return true;
    });
    eventsEl.replaceChildren();
    if(!items.length)eventsEl.append(node('p','notice','در این بخش رویدادی برای نمایش وجود ندارد.'));
    items.forEach(event=>eventsEl.append(eventCard(event)));
    $('moj-timeline-counter').textContent=String(items.length)+' رویداد بارگذاری‌شده';
    more.hidden=!state.hasNext;
    showStages(state.events);
  }
  async function load(reset=false) {
    if(state.busy)return;
    state.busy=true;more.disabled=true;
    if(reset){state.page=0;state.events=[];}
    setStatus('در حال دریافت گزارش‌ها…');
    try {
      const page=state.page+1;
      const response=await call('projects/'+cfg.project+'/timeline?page='+page+'&per_page=25');
      state.viewer=response.viewer;state.hasNext=!!response.hasNext;
      populateStages(response.stages);
      state.events=state.events.concat(response.events.filter(e=>!state.events.some(old=>old.id===e.id)));
      state.page=page;
      create.hidden=!state.viewer.canCreate;
      setStatus('');
      render();
    }catch(error){setStatus(error.message,true);}
    finally{more.disabled=false;state.busy=false;}
  }
  create.addEventListener('click',()=>openForm(null));
  more.addEventListener('click',()=>load());
  $('moj-filter').addEventListener('change',render);
  form.addEventListener('submit',saveForm);
  form.elements.namedItem('kind').addEventListener('change',toggleStage);
  $('moj-stage-key').addEventListener('change',()=>{
    const preset=state.stages[$('moj-stage-key').value];
    if(preset){
      form.elements.namedItem('stageGroup').value=preset.group;
      if(!form.elements.namedItem('editingId').value)form.elements.namedItem('title').value='';
    }
  });
  dialog.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  form.elements.namedItem('date').value=dateAsISO();
  load(true);
})();
