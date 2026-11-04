import {metrics,amountParts,countdown} from './engine.mjs';
export function miniSnapshot(settings,now=new Date()){
  const m=metrics(settings,now),parts=amountParts(m.earned,settings.unit,settings.step);
  return {status:m.status,active:m.active,pause:m.status==='午休中',symbol:parts.symbol,
    amount:parts.integer+(parts.decimal?'.'+parts.decimal:''),unit:settings.unit,
    label:m.label,countdown:countdown(m.remaining),progress:m.progress,
    hours:m.hours.toFixed(2),dailyHours:Number(m.dailyHours.toFixed(2)).toString()};
}
