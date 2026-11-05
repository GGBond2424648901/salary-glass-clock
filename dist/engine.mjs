export const DEFAULT_SETTINGS = Object.freeze({
  salary:5000, mode:'double', days:[1,2,3,4,5], start:'09:00', end:'18:00',
  breakEnabled:true, breakStart:'12:00', breakEnd:'13:30', step:.01, unit:'yuan',glassTransparency:40,miniFontSize:100,miniFontWeight:550
});
const MINUTE=60000;
const timeMinutes=t=>Number(t.split(':')[0])*60+Number(t.split(':')[1]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const workDays=s=>s.mode==='single'?[1,2,3,4,5,6]:s.mode==='custom'?s.days:[1,2,3,4,5];
export const isWorkDay=(date,s)=>workDays(s).includes(date.getDay());
function bounds(s){
  const start=timeMinutes(s.start);
  let end=timeMinutes(s.end);
  if(end<start)end+=1440;
  let bs=s.breakEnabled?timeMinutes(s.breakStart):start,be=s.breakEnabled?timeMinutes(s.breakEnd):start;
  if(bs<start)bs+=1440;
  if(be<=bs)be+=1440;
  return {start,end,bs,be};
}
export function shiftMinutes(s){const {start,end,bs,be}=bounds(s);return end-start-(s.breakEnabled?Math.max(0,Math.min(end,be)-Math.max(start,bs)):0);}
export function validateSettings(s){
  if(!Number.isFinite(s.salary)||s.salary<=0||s.salary>100000000)return '请输入有效月薪（大于 0，至多 1 亿）';
  if(!['single','double','custom'].includes(s.mode))return '请选择工作日';
  if(!Array.isArray(s.days)||!s.days.every(d=>Number.isInteger(d)&&d>=0&&d<=6)||!workDays(s).length)return '请至少选择一个工作日';
  if(typeof s.breakEnabled!=='boolean')return '请选择是否扣除午休';
  for(const field of s.breakEnabled?['start','end','breakStart','breakEnd']:['start','end'])if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(s[field]))return '请填写完整的时间';
  const {start,end,bs,be}=bounds(s);
  if(start===end)return '上下班时间不能相同';
  if(s.breakEnabled&&(bs<start||be>end||be<=bs||be-bs>=end-start))return '午休需在上班时段内，且短于总工时';
  if(![.01,.1,1].includes(s.step))return '请选择金额跳动幅度';
  if(!['yuan','mao','fen'].includes(s.unit))return '请选择显示单位';
  if(!Number.isFinite(s.glassTransparency)||s.glassTransparency<0||s.glassTransparency>100)return '玻璃透明度应为 0–100%';
  if(!Number.isFinite(s.miniFontSize)||s.miniFontSize<80||s.miniFontSize>160)return '小窗字体大小应为 80–160%';
  if(!Number.isFinite(s.miniFontWeight)||s.miniFontWeight<300||s.miniFontWeight>800)return '小窗字体粗细应为 300–800';
  return '';
}
export function workDaysInMonth(year,month,s){
  let count=0;const n=new Date(year,month+1,0).getDate();
  for(let day=1;day<=n;day++)if(isWorkDay(new Date(year,month,day),s))count++;
  return count;
}
function atMinute(date,mins){return new Date(date.getFullYear(),date.getMonth(),date.getDate(),0,mins,0,0);}
function shift(date,s){const {start,end,bs,be}=bounds(s);return {start:atMinute(date,start),end:atMinute(date,end),breakStart:atMinute(date,bs),breakEnd:atMinute(date,be)};}
function elapsed(date,s,now){
  if(!isWorkDay(date,s))return 0;
  const v=shift(date,s);
  const gross=clamp(now-v.start,0,v.end-v.start);
  const pause=s.breakEnabled?clamp(Math.min(+now,+v.end)-v.breakStart,0,v.breakEnd-v.breakStart):0;
  return clamp((gross-pause)/MINUTE,0,shiftMinutes(s));
}
function dailyPay(date,s){return s.salary/workDaysInMonth(date.getFullYear(),date.getMonth(),s);}
function earned(date,s,now){return dailyPay(date,s)*elapsed(date,s,now)/shiftMinutes(s);}
export function monthData(s,year,month,now=new Date()){
  const days=[],points=[{day:0,value:0}];let total=0;
  const n=new Date(year,month+1,0).getDate();
  for(let day=1;day<=n;day++){
    const date=new Date(year,month,day),value=earned(date,s,now);
    total+=value;
    days.push({day,weekday:date.getDay(),working:isWorkDay(date,s),earned:value,today:date.toDateString()===now.toDateString(),future:date>now});
    if(date<=now)points.push({day,value:total});
  }
  return {days,points,total:Math.min(s.salary,total),workDays:workDaysInMonth(year,month,s)};
}
export function metrics(s,now=new Date()){
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const yesterday=new Date(today);yesterday.setDate(yesterday.getDate()-1);
  const previous=shift(yesterday,s);
  const activePrevious=isWorkDay(yesterday,s)&&now>=previous.start&&now<previous.end;
  const date=activePrevious?yesterday:today,v=shift(date,s),working=isWorkDay(date,s);
  let status='休息日',label='距离上班',target;
  if(working&&now>=v.start&&now<v.end){
    status=s.breakEnabled&&now>=v.breakStart&&now<v.breakEnd?'午休中':'上班中';label='距离下班';target=v.end;
  }else if(working&&now<v.start){status='待上班';target=v.start;}
  else if(working){status='已下班';}
  if(!target){for(let i=1;i<=8;i++){let next=new Date(today);next.setDate(next.getDate()+i);if(isWorkDay(next,s)){target=shift(next,s).start;break;}}}
  const minutes=elapsed(date,s,now),pay=dailyPay(date,s),monthly=monthData(s,now.getFullYear(),now.getMonth(),now);
  return {status,label,remaining:Math.max(0,(target-now)/1000),earned:working?earned(date,s,now):0,
    minutes,hours:minutes/60,dailyHours:shiftMinutes(s)/60,progress:minutes/shiftMinutes(s),
    dailyPay:pay,hourlyPay:pay/(shiftMinutes(s)/60),monthEarned:monthly.total,month:monthly,
    workDays:monthly.workDays,shiftDate:date,active:status==='上班中',rest:status==='休息日'};
}
export function amountParts(amount,unit='yuan',step=.01){
  const cents=Math.floor((Math.max(0,amount)*100+1e-7)/(step*100))*(step*100);
  const mult=unit==='fen'?100:unit==='mao'?10:1;
  const digits=unit==='yuan'?2:unit==='mao'&&step===.01?1:0;
  const [integer,decimal='']=(cents/100*mult).toFixed(digits).split('.');
  return {integer:Number(integer).toLocaleString('en-US'),decimal,symbol:unit==='yuan'?'¥':unit==='mao'?'毛':'分'};
}
export function countdown(seconds){const n=Math.max(0,Math.ceil(seconds));return [Math.floor(n/3600),Math.floor(n/60)%60,n%60].map(v=>String(v).padStart(2,'0')).join(':');}
