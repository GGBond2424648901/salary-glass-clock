import {validateSettings, shiftMinutes, workDaysInMonth, metrics, amountParts, monthData, countdown} from './engine.mjs';
import {icon} from './icons.mjs';
import {loadSettings,saveSettings,SETTINGS_KEY as KEY} from './settings.mjs';
import {mountMini} from './mini-ui.mjs';
const $=id=>document.getElementById(id);
const units=[['yuan','元'],['mao','毛'],['fen','分']];
const money=n=>n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const short=n=>Number(n.toFixed(2)).toString();
const weekdays=['日','一','二','三','四','五','六'];
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
let settings=loadSettings(),draft={...settings,days:[...settings.days]},currentView='today',lastView='today';
let selectedMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1),selectedDay=null,lastDate='',lastMonthPaint='',toastTimer;
function setText(id,text){const el=$(id);if(el.textContent!==String(text))el.textContent=text;}
function segment(id,options,value,onChange){
  const root=$(id);root.style.setProperty('--count',options.length);
  root.innerHTML='<span class="segment-thumb" aria-hidden="true"></span>'+options.map(([v,label])=>`<button type="button" data-value="${v}" aria-pressed="${String(value)===String(v)}">${label}</button>`).join('');
  updateSegment(id,value);
  root.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;const val=button.dataset.value;onChange(val);});
}
function updateSegment(id,value){const root=$(id),buttons=[...root.querySelectorAll('button')];let selected=0;buttons.forEach((b,i)=>{const active=b.dataset.value===String(value);b.setAttribute('aria-pressed',active);if(active)selected=i;});root.style.setProperty('--index',selected);}
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2400);}
function persist(){if(saveSettings(settings))return true;toast('浏览器未允许保存，设置仅本次生效');return false;}
function changeUnit(unit){settings={...settings,unit};persist();updateSegment('home-unit',unit);paintClock();}
function setDraft(key,value){draft[key]=value;updateFormPreview();}
segment('home-unit',units,settings.unit,changeUnit);
segment('work-mode',[['double','双休'],['single','单休'],['custom','自定义']],draft.mode,value=>{draft.mode=value;updateSegment('work-mode',value);$('custom-days').hidden=value!=='custom';updateFormPreview();});
segment('step-mode',[[.01,'每1分'],[.1,'每1毛'],[1,'每1元']],draft.step,value=>{draft.step=Number(value);updateSegment('step-mode',value);});
segment('settings-unit',units,draft.unit,value=>{draft.unit=value;updateSegment('settings-unit',value);});
const navButtons=[...document.querySelectorAll('[data-view]')];
navButtons.forEach((button,i)=>{const item=[['clock','今天'],['calendar','本月'],['settings','设置']][i];button.innerHTML=icon(item[0])+`<span>${item[1]}</span>`;button.addEventListener('click',()=>navigate(button.dataset.view));});
$('header-icon').innerHTML=icon('clock');$('header-action').innerHTML=icon('settings');
$('floating-button').innerHTML=icon('float');
let pipWindow=null;
function openFloatingDialog(){
  if(window.desktopClock){window.desktopClock.openMini(settings).catch(()=>toast('小窗未能开启，请重试'));return;}
  if(pipWindow&&!pipWindow.closed){pipWindow.focus();return;}
  const supported='documentPictureInPicture' in window;
  $('browser-float').disabled=!supported;
  $('browser-float').textContent=supported?'开启置顶小窗':'当前浏览器暂不支持';
  $('floating-hint').textContent=supported?'切换应用、最小化浏览器时，小窗仍会显示。':'请使用桌面 Chrome / Edge，或下载独立桌面版。';
  $('floating-dialog').showModal();
}
$('floating-button').addEventListener('click',openFloatingDialog);
$('floating-help').addEventListener('click',openFloatingDialog);
$('close-floating-dialog').innerHTML=icon('close');
$('close-floating-dialog').addEventListener('click',()=>$('floating-dialog').close());
$('floating-dialog').addEventListener('click',event=>{if(event.target===$('floating-dialog'))$('floating-dialog').close();});
$('browser-float').addEventListener('click',async()=>{
  $('floating-dialog').close();
  try{
    pipWindow=await window.documentPictureInPicture.requestWindow({width:340,height:252});
    const doc=pipWindow.document;doc.documentElement.lang='zh-CN';
    const stylesheet=doc.createElement('link');stylesheet.rel='stylesheet';stylesheet.href=new URL('./mini.css',import.meta.url).href;doc.head.append(stylesheet);
    const mini=mountMini(doc,{
      onClose:()=>pipWindow?.close(),
      onExpand:()=>{pipWindow?.close();window.focus();},
      onCompact:compact=>pipWindow?.resizeTo(compact?320:340,compact?140:290),
      getSettings:()=>settings,
      onSettingsChange:(next,saved)=>{settings=next;updateSegment('home-unit',settings.unit);paintClock();if(!saved)toast('设置仅本次生效');}
    });
    pipWindow.addEventListener('pagehide',()=>{mini.dispose();pipWindow=null;},{once:true});
    toast('小窗已开启，可将浏览器最小化');
  }catch{if(pipWindow&&!pipWindow.closed)pipWindow.close();pipWindow=null;toast('小窗未能开启，可改用独立桌面版');}
});
$('prev-month').innerHTML=icon('left');$('next-month').innerHTML=icon('right');
$('month-preview').addEventListener('click',()=>{selectedMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);selectedDay=null;navigate('month');});
$('header-action').addEventListener('click',()=>navigate(currentView==='settings'?lastView:'settings'));
function navigate(view){
  if(view===currentView)return;
  if(view!=='settings')lastView=view;else lastView=currentView;
  currentView=view;document.querySelector('.app-shell').dataset.view=view;
  document.querySelectorAll('.view').forEach(el=>{el.hidden=el.id!==`${view}-view`;});
  navButtons.forEach((button,i)=>{if(button.dataset.view===view){button.setAttribute('aria-current','page');document.querySelector('.bottom-nav').style.setProperty('--index',i);}else button.removeAttribute('aria-current');});
  const heading=view==='today'?'上班攒钱钟':view==='month'?'本月收入':'工资与排班';setText('page-title',heading);
  $('header-icon').innerHTML=icon(view==='month'?'calendar':'clock');
  $('header-action').innerHTML=icon(view==='settings'?'close':'settings');$('header-action').setAttribute('aria-label',view==='settings'?'关闭设置':'打开设置');
  if(view==='settings')populateForm();else if(view==='month')paintMonth();else paintClock();
  window.scrollTo({top:0,behavior:'instant'});
  if(!reduceMotion.matches)$(`${view}-view`).animate([{opacity:0,transform:'translateY(9px)',filter:'blur(2px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0)'}],{duration:300,easing:'cubic-bezier(.2,.85,.25,1)'});
}
function pathFor(points,width,height,domain,maxValue){
  const pad=5, max=maxValue||Math.max(1,...points.map(p=>p.value)),end=domain||Math.max(1,points.at(-1)?.day||1);
  const coords=points.map(p=>({x:pad+p.day/end*(width-pad*2),y:height-pad-p.value/max*(height-pad*2)}));
  let d=`M${coords[0].x},${coords[0].y}`;
  for(let i=1;i<coords.length;i++){const a=coords[i-1],b=coords[i],mid=(a.x+b.x)/2;d+=` C${mid},${a.y} ${mid},${b.y} ${b.x},${b.y}`;}
  return {d,end:coords.at(-1),start:coords[0]};
}
function renderChart(id,points,width,height,domain,projection=[]){
  const max=Math.max(1,...points.map(p=>p.value),...projection.map(p=>p.value));
  const {d,end,start}=pathFor(points,width,height,domain,max),gradient=`${id}-fill`;
  const forecast=projection.length?`<title>实线为已赚收入，虚线为按排班估算</title><path d="${pathFor(projection,width,height,domain,max).d}" stroke="#d78fa8" stroke-opacity=".6" stroke-width="1.6" stroke-dasharray="4 5" fill="none" stroke-linecap="round"/>`:'';
  $(id).innerHTML=`<defs><linearGradient id="${gradient}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#dd90ac" stop-opacity=".28"/><stop offset="100%" stop-color="#dd90ac" stop-opacity=".015"/></linearGradient></defs>${forecast}<path d="${d} L${end.x},${height} L${start.x},${height} Z" fill="url(#${gradient})"/><path d="${d}" stroke="#d78fa8" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="${end.x}" cy="${end.y}" r="4" fill="#d78fa8" stroke="#fff" stroke-width="1.3"/>`;
}
function paintMonthChart(data){
  let total=0;const projection=[{day:0,value:0}];
  data.days.forEach(d=>{if(d.working)total+=settings.salary/data.workDays;projection.push({day:d.day,value:total});});
  renderChart('month-chart',data.points,400,130,data.days.length,data.days.some(d=>d.future)?projection:[]);
}
function paintClock(){
  const now=new Date(),m=metrics(settings,now),parts=amountParts(m.earned,settings.unit,settings.step);
  const currentDate=now.toDateString();
  if(currentDate!==lastDate){setText('date-line',`${now.getMonth()+1}月${now.getDate()}日，星期${weekdays[now.getDay()]}`);lastDate=currentDate;}
  setText('work-status',m.status);$('status-dot').className=`status-dot ${m.active?'active':m.status==='午休中'?'pause':'rest'}`;
  const decimal=parts.decimal?`.${parts.decimal}`:'';
  if($('amount-integer').textContent!==parts.integer||$('amount-decimal').textContent!==decimal){
    setText('amount-integer',parts.integer);setText('amount-decimal',decimal);
    if(!reduceMotion.matches)$('earnings').animate([{opacity:.93,transform:'translateY(.6px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'});
  }
  setText('amount-symbol',parts.symbol);
  $('earnings').classList.toggle('non-yuan',settings.unit!=='yuan');
  $('earnings').classList.toggle('compact',parts.integer.replaceAll(',','').length>(settings.unit==='yuan'?4:6));
  $('earnings').setAttribute('aria-label',`今日已赚 ${parts.integer}${decimal} ${settings.unit==='yuan'?'元':parts.symbol}`);
  setText('countdown-label',m.label);setText('countdown',countdown(m.remaining));
  const progress=Math.floor(m.progress*100);$('progress-fill').style.width=`${m.progress*100}%`;$('progress').setAttribute('aria-valuenow',progress);setText('progress-text',`${progress}%`);
  setText('worked-hours',m.hours.toFixed(2));setText('daily-hours',short(m.dailyHours));
  setText('month-amount',money(m.monthEarned));setText('hourly-pay',m.hourlyPay.toFixed(2));setText('daily-pay',m.dailyPay.toFixed(2));
  const chartKey=`${currentDate}-${Math.floor(m.monthEarned*100)}`;
  if(chartKey!==lastMonthPaint){renderChart('mini-chart',m.month.points,180,76);lastMonthPaint=chartKey;}
}
function paintMonth(){
  const now=new Date(),year=selectedMonth.getFullYear(),month=selectedMonth.getMonth(),data=monthData(settings,year,month,now),label=`${year}年${month+1}月`;
  setText('chart-month',label);setText('calendar-month',label);setText('selected-month-total',money(data.total));setText('selected-workdays',data.workDays);setText('month-estimate',settings.salary.toLocaleString('en-US',{maximumFractionDigits:2}));
  paintMonthChart(data);
  $('chart-axis').innerHTML=`<span>1日</span><span>10日</span><span>20日</span><span>${data.days.length}日</span>`;
  const blanks=(data.days[0].weekday+6)%7;
  $('calendar-grid').innerHTML=Array(blanks).fill('<span aria-hidden="true"></span>').join('')+data.days.map(d=>`<button class="calendar-day${d.working?'':' off'}${d.today?' today':''}${d.earned>0?' earned':''}${selectedDay===d.day?' selected':''}" role="gridcell" type="button" data-day="${d.day}" aria-label="${month+1}月${d.day}日，${d.working?'工作日':'休息日'}，已赚${money(d.earned)}元"${d.today?' aria-current="date"':''}${selectedDay===d.day?' aria-selected="true"':''}>${d.day}</button>`).join('');
  refreshCalendar(data);
}
function refreshCalendar(data){
  const month=selectedMonth.getMonth();
  for(const d of data.days){
    const button=$('calendar-grid').querySelector(`[data-day="${d.day}"]`);if(!button)continue;
    const label=`${month+1}月${d.day}日，${d.working?'工作日':'休息日'}，已赚${money(d.earned)}元`;
    if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
    button.classList.toggle('today',d.today);button.classList.toggle('earned',d.earned>0);button.classList.toggle('selected',selectedDay===d.day);
    if(d.today)button.setAttribute('aria-current','date');else button.removeAttribute('aria-current');
    if(selectedDay===d.day)button.setAttribute('aria-selected','true');else button.removeAttribute('aria-selected');
  }
  const chosen=data.days.find(d=>d.day===selectedDay);
  setText('calendar-selection',chosen?`${month+1}月${chosen.day}日 · ${chosen.working?chosen.future?'工作日 · 尚未开始':`已赚 ¥${money(chosen.earned)}`:'休息日'}`:'');
}
$('calendar-grid').addEventListener('click',event=>{const button=event.target.closest('[data-day]');if(!button)return;selectedDay=Number(button.dataset.day);refreshCalendar(monthData(settings,selectedMonth.getFullYear(),selectedMonth.getMonth(),new Date()));toast($('calendar-selection').textContent);});
function moveMonth(delta){selectedMonth=new Date(selectedMonth.getFullYear(),selectedMonth.getMonth()+delta,1);selectedDay=null;paintMonth();}
$('prev-month').addEventListener('click',()=>moveMonth(-1));$('next-month').addEventListener('click',()=>moveMonth(1));
const fields={salary:'salary',start:'start-time',end:'end-time',breakStart:'break-start',breakEnd:'break-end'};
Object.entries(fields).forEach(([key,id])=>$(id).addEventListener('input',()=>setDraft(key,key==='salary'?Number($(id).value):$(id).value)));
$('break-toggle').addEventListener('click',()=>{draft.breakEnabled=!draft.breakEnabled;setBreakUI();updateFormPreview();});
function setBreakUI(){
  $('break-toggle').setAttribute('aria-checked',String(draft.breakEnabled));$('break-times').classList.toggle('disabled',!draft.breakEnabled);$('break-start').disabled=!draft.breakEnabled;$('break-end').disabled=!draft.breakEnabled;
}
function populateForm(){
  draft={...settings,days:[...settings.days]};Object.entries(fields).forEach(([key,id])=>{$(id).value=draft[key];});
  updateSegment('work-mode',draft.mode);updateSegment('step-mode',draft.step);updateSegment('settings-unit',draft.unit);
  $('custom-days').hidden=draft.mode!=='custom';
  $('custom-days').innerHTML=[1,2,3,4,5,6,0].map(day=>`<button type="button" data-weekday="${day}" aria-label="星期${weekdays[day]}" aria-pressed="${draft.days.includes(day)}">${weekdays[day]}</button>`).join('');
  setBreakUI();$('form-error').hidden=true;updateFormPreview();
}
$('custom-days').addEventListener('click',event=>{const button=event.target.closest('[data-weekday]');if(!button)return;const day=Number(button.dataset.weekday);draft.days=draft.days.includes(day)?draft.days.filter(d=>d!==day):[...draft.days,day];button.setAttribute('aria-pressed',String(draft.days.includes(day)));updateFormPreview();});
function updateFormPreview(){
  const error=validateSettings(draft),now=new Date();
  if(error){setText('schedule-summary',error);$('schedule-summary').style.color='#a65776';}
  else{setText('schedule-summary',`每天 ${short(shiftMinutes(draft)/60)} 小时 · 本月 ${workDaysInMonth(now.getFullYear(),now.getMonth(),draft)} 个工作日`);$('schedule-summary').style.color='';$('form-error').hidden=true;}
}
$('settings-form').addEventListener('submit',event=>{
  event.preventDefault();const error=validateSettings(draft);
  if(error){setText('form-error',error);$('form-error').hidden=false;return;}
  settings={...draft,days:[...draft.days]};const saved=persist();lastMonthPaint='';updateSegment('home-unit',settings.unit);navigate('today');paintClock();if(saved)toast('设置已保存');
});
window.addEventListener('storage',event=>{if(event.key===KEY){settings=loadSettings();updateSegment('home-unit',settings.unit);lastMonthPaint='';if(currentView==='today')paintClock();if(currentView==='month')paintMonth();}});
window.desktopClock?.onSettingsChanged?.(({settings:next,persisted})=>{if(validateSettings(next))return;settings=next;updateSegment('home-unit',settings.unit);lastMonthPaint='';if(currentView==='today')paintClock();if(currentView==='month')paintMonth();if(!persisted)toast('设置仅本次生效');});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){paintClock();if(currentView==='month')paintMonth();}});
document.querySelector('.app-shell').dataset.view='today';paintClock();
let lastMonthSecond=-1;
setInterval(()=>{if(document.hidden)return;if(currentView==='today')paintClock();else if(currentView==='month'){const second=Math.floor(Date.now()/1000);if(second!==lastMonthSecond){const data=monthData(settings,selectedMonth.getFullYear(),selectedMonth.getMonth(),new Date());setText('selected-month-total',money(data.total));paintMonthChart(data);refreshCalendar(data);lastMonthSecond=second;}}},250);
