import {miniSnapshot} from './mini-state.mjs';
import {getLocalStorage,createSettingsSession,SETTINGS_KEY} from './settings.mjs';
import {icon} from './icons.mjs';
export function mountMini(doc,options={}){
  const win=doc.defaultView,storage=getLocalStorage(win),session=createSettingsSession({storage,initialSettings:options.initialSettings||options.getSettings?.()});
  let compact=false,pinned=true,disposed=false,lastAmount='',lastState='';
  doc.body.classList.add('mini-body');
  doc.body.innerHTML=`<main class="mini-card" aria-label="攒钱钟置顶小窗">
    <header class="mini-header"><span class="mini-status"><i></i><span>上班中</span></span><div class="mini-actions">
      <button class="mini-icon" data-action="compact" title="紧凑模式" aria-label="紧凑模式" aria-pressed="false">${icon('compact')}</button>
      <button class="mini-icon" data-action="pin" title="置顶" aria-label="置顶" aria-pressed="true" ${options.onPin?'':'hidden'}>${icon('pin')}</button>
      <button class="mini-icon" data-action="expand" title="返回主界面" aria-label="返回主界面">${icon('expand')}</button>
      <button class="mini-icon" data-action="close" title="关闭小窗" aria-label="关闭小窗">${icon('close')}</button>
    </div></header>
    <div class="mini-content"><div class="mini-income-block"><span class="mini-label">今日已赚</span><button class="mini-income" data-action="unit" title="点击切换元、毛、分" aria-label="切换金额单位"><span class="mini-symbol">¥</span><span class="mini-amount">0.00</span></button></div>
    <div class="mini-time-block"><span class="mini-label mini-count-label">距离下班</span><span class="mini-countdown">00:00:00</span></div></div>
    <div class="mini-progress" role="progressbar" aria-label="今日工作进度" aria-valuemin="0" aria-valuemax="100"><span></span></div>
    <footer class="mini-footer"><span class="mini-hours">0 / 7.5 小时</span><div class="mini-units" role="group" aria-label="小窗金额单位"><button data-unit="yuan">元</button><button data-unit="mao">毛</button><button data-unit="fen">分</button></div></footer><span class="mini-notice" role="status" hidden></span>
  </main>`;
  const q=s=>doc.querySelector(s);
  function setText(selector,value){const el=q(selector);if(el.textContent!==String(value))el.textContent=value;}
  function render(){
    if(disposed)return;
    const state=miniSnapshot(options.getSettings?.()||session.get());
    setText('.mini-status span',state.status);q('.mini-status').dataset.state=state.active?'active':state.pause?'pause':'rest';
    setText('.mini-symbol',state.symbol);setText('.mini-amount',state.amount);setText('.mini-count-label',state.label);setText('.mini-countdown',state.countdown);setText('.mini-hours',`${state.hours} / ${state.dailyHours} 小时`);
    q('.mini-income').classList.toggle('non-yuan',state.unit!=='yuan');q('.mini-income').classList.toggle('long',state.amount.length>8);
    q('.mini-income').setAttribute('aria-label',`今日已赚 ${state.amount} ${state.unit==='yuan'?'元':state.symbol}，点击切换单位`);
    q('.mini-progress span').style.width=`${state.progress*100}%`;q('.mini-progress').setAttribute('aria-valuenow',Math.floor(state.progress*100));
    doc.querySelectorAll('[data-unit]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.unit===state.unit)));
    if(state.amount!==lastAmount&&lastAmount&& !win.matchMedia('(prefers-reduced-motion:reduce)').matches)q('.mini-amount').animate([{opacity:.85},{opacity:1}],{duration:180});
    if(lastState!==state.status){doc.title=`${state.status} · 攒钱钟`;lastState=state.status;}
    lastAmount=state.amount;
  }
  function setUnit(unit){const next={...(options.getSettings?.()||session.get()),unit},saved=session.set(next);options.onSettingsChange?.(next,saved);if(!saved){setText('.mini-notice','设置仅本次生效');q('.mini-notice').hidden=false;win.setTimeout(()=>{q('.mini-notice').hidden=true;},2500);}render();}
  doc.body.addEventListener('click',async event=>{
    const button=event.target.closest('button');if(!button)return;
    try{
      if(button.dataset.unit){setUnit(button.dataset.unit);return;}
      if(button.dataset.action==='unit'){const values=['yuan','mao','fen'],current=(options.getSettings?.()||session.get()).unit;setUnit(values[(values.indexOf(current)+1)%3]);}
      if(button.dataset.action==='close')options.onClose?.();
      if(button.dataset.action==='expand')options.onExpand?.();
      if(button.dataset.action==='compact'){
        const next=!compact;await options.onCompact?.(next);compact=next;doc.body.dataset.compact=String(compact);button.setAttribute('aria-pressed',String(compact));button.setAttribute('aria-label',compact?'展开小窗':'紧凑模式');button.title=compact?'展开小窗':'紧凑模式';
      }
      if(button.dataset.action==='pin'){const next=await options.onPin?.(!pinned);setPinned(typeof next==='boolean'?next:!pinned);}
    }catch{doc.title='小窗操作未完成 · 攒钱钟';}
  });
  function setPinned(value){pinned=value;q('[data-action="pin"]').setAttribute('aria-pressed',String(value));q('[data-action="pin"]').title=value?'取消置顶':'置顶';}
  const storageListener=event=>{if(event.key===SETTINGS_KEY){session.reload();render();}};
  win.addEventListener('storage',storageListener);render();const timer=win.setInterval(render,500);
  return {render,setPinned,dispose(){disposed=true;win.clearInterval(timer);win.removeEventListener('storage',storageListener);}};
}
