const applied=new WeakMap();
export function glassTokens(value=40){
  const percentage=Math.max(0,Math.min(100,Number.isFinite(value)?value:40)),t=percentage/100,a=Math.pow(1-t,1.3),cap=value=>Math.min(1,value);
  return {percentage,outerTop:cap(a*1.33),outerMid:cap(a*1.05),outerEnd:cap(a*1.14),surfaceTop:cap(a*1.05),surfaceMid:a*.68,surfaceEnd:a*.95,control:.08+a*.86,input:.02+a*.78,track:a*.1,border:.25+(1-t)*.65,highlight:a*.8,blur:Math.round(28*Math.pow(1-t,.8)),miniSurface:cap(a*1.42),miniArt:1-t};
}
export function applyGlassAppearance(doc,value){
  const tokens=glassTokens(value);if(applied.get(doc)===tokens.percentage)return;
  const root=doc.documentElement;
  for(const key of ['outerTop','outerMid','outerEnd','surfaceTop','surfaceMid','surfaceEnd','control','input','track','border','highlight','miniSurface','miniArt'])root.style.setProperty(`--glass-${key}`,tokens[key].toFixed(3));
  root.style.setProperty('--glass-blur',`${tokens.blur}px`);root.dataset.glassClear=tokens.percentage>=72?'true':'false';applied.set(doc,tokens.percentage);
}
