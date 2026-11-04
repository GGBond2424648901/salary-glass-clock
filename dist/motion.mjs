const ease='cubic-bezier(.22,.8,.25,1)';
const animations=new WeakMap();
const regions=new WeakMap();
export function cancelRegionMotion(element){
  const state=regions.get(element);if(!state)return;
  state.cancelled=true;if(!state.updated){state.updated=true;state.update();}
  state.effects.forEach(effect=>effect.cancel());element.style.height='';element.style.overflow='';regions.delete(element);
}
export async function swapViews(host,chrome,previous,next,update,{enabled=true,direction=1}={}){
  cancelRegionMotion(previous);cancelRegionMotion(next);
  if(!enabled){previous.hidden=true;next.hidden=false;update();return;}
  const oldHeight=host.offsetHeight,oldChromeHeight=chrome.offsetHeight;
  previous.style.position='absolute';previous.style.inset='0 auto auto 0';previous.style.width='100%';previous.style.pointerEvents='none';
  host.style.position='relative';host.style.overflow='hidden';
  next.hidden=false;update();
  const newHeight=next.offsetHeight,newChromeHeight=chrome.offsetHeight;
  host.style.height=`${oldHeight}px`;chrome.style.height=`${oldChromeHeight}px`;chrome.style.overflow='hidden';
  const effects=[
    previous.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:`translateX(${-direction*18}px)`}],{duration:240,easing:ease,fill:'both'}),
    next.animate([{opacity:0,transform:`translateX(${direction*18}px)`},{opacity:1,transform:'translateX(0)'}],{duration:340,easing:ease,fill:'both'}),
    host.animate([{height:`${oldHeight}px`},{height:`${newHeight}px`}],{duration:360,easing:ease,fill:'both'}),
    chrome.animate([{height:`${oldChromeHeight}px`},{height:`${newChromeHeight}px`}],{duration:360,easing:ease,fill:'both'})
  ];
  try{await Promise.all(effects.map(effect=>effect.finished));}catch{}
  previous.hidden=true;previous.style.position='';previous.style.inset='';previous.style.width='';previous.style.pointerEvents='';
  host.style.height='';host.style.overflow='';chrome.style.height='';chrome.style.overflow='';
  effects.forEach(effect=>effect.cancel());
}
export async function setDisclosure(element,open,enabled=true){
  animations.get(element)?.cancel();
  if(!enabled){element.hidden=!open;return;}
  const start=element.hidden?0:element.offsetHeight;
  element.hidden=false;element.style.height='';const end=open?element.offsetHeight:0;
  element.style.overflow='hidden';
  const effect=element.animate([{height:`${start}px`,opacity:open?0:1},{height:`${end}px`,opacity:open?1:0}],{duration:260,easing:ease,fill:'both'});
  animations.set(element,effect);
  try{await effect.finished;}catch{}
  if(animations.get(element)!==effect)return;
  element.hidden=!open;element.style.height='';element.style.overflow='';effect.cancel();animations.delete(element);
}
export async function swapRegion(element,update,{enabled=true,direction=1}={}){
  cancelRegionMotion(element);
  if(!enabled){update();return;}
  const state={cancelled:false,updated:false,update,effects:[]};regions.set(element,state);
  const oldHeight=element.offsetHeight;
  const out=element.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:`translateX(${-direction*10}px)`}],{duration:120,easing:ease,fill:'both'});
  state.effects.push(out);
  try{await out.finished;}catch{}
  if(state.cancelled)return;
  state.updated=true;update();const newHeight=element.offsetHeight;
  element.style.height=`${oldHeight}px`;element.style.overflow='hidden';
  const size=element.animate([{height:`${oldHeight}px`},{height:`${newHeight}px`}],{duration:280,easing:ease,fill:'both'});
  const enter=element.animate([{opacity:0,transform:`translateX(${direction*10}px)`},{opacity:1,transform:'translateX(0)'}],{duration:260,easing:ease,fill:'both'});state.effects.push(size,enter);out.cancel();
  try{await Promise.all([size.finished,enter.finished]);}catch{}
  if(state.cancelled)return;
  element.style.height='';element.style.overflow='';size.cancel();enter.cancel();
  regions.delete(element);
}
