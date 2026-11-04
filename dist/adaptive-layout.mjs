export function fitViewportBox({viewportWidth,viewportHeight,contentWidth,contentHeight,margin=12}){
  const scale=Math.min(1,Math.max(1,viewportWidth-margin*2)/Math.max(1,contentWidth),Math.max(1,viewportHeight-margin*2)/Math.max(1,contentHeight));
  return {scale,width:contentWidth*scale,height:contentHeight*scale};
}
export function installAdaptiveLayout(shell,stage){
  let pending=0,disposed=false;
  function fit(){
    pending=0;if(disposed)return;
    const width=window.innerWidth,height=window.innerHeight;
    const margin=Math.max(8,Math.min(24,width*.022,height*.022));
    const preferred=height>1000&&width>600?524:width<=600?430:454;
    const baseWidth=Math.max(200,Math.min(preferred,width-margin*2));
    if(shell.style.width!==`${baseWidth}px`)shell.style.width=`${baseWidth}px`;
    const box=fitViewportBox({viewportWidth:width,viewportHeight:height,contentWidth:baseWidth,contentHeight:shell.offsetHeight,margin});
    stage.style.width=`${box.width}px`;stage.style.height=`${box.height}px`;
    shell.style.setProperty('--adaptive-scale',box.scale);
    stage.dataset.scale=box.scale.toFixed(3);
  }
  function schedule(){if(!pending&&!disposed)pending=requestAnimationFrame(fit);}
  const observer=new ResizeObserver(schedule);observer.observe(shell);
  window.addEventListener('resize',schedule);fit();
  return {refresh:schedule,dispose(){disposed=true;cancelAnimationFrame(pending);observer.disconnect();window.removeEventListener('resize',schedule);}};
}
