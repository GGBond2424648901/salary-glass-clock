'use strict';
const expandedSizes=new WeakMap();
const editorSizes=new WeakMap();
exports.applyEditorSize=function(window,open){
  if(open){
    if(editorSizes.has(window))return;
    const state={size:window.getSize(),min:window.getMinimumSize(),max:window.getMaximumSize()};editorSizes.set(window,state);
    window.setMaximumSize(state.max[0],Math.max(state.max[1],240));
    window.setMinimumSize(state.min[0],Math.max(state.min[1],240));
    window.setSize(state.size[0],Math.max(state.size[1],240));
  }else{
    const state=editorSizes.get(window);if(!state)return;editorSizes.delete(window);
    window.setMinimumSize(...state.min);window.setSize(...state.size);window.setMaximumSize(...state.max);
  }
};
exports.applyCompactSize=function(window,compact){
  if(compact){const size=window.getSize?.()||[340,252];if(size[1]>=180||!expandedSizes.has(window))expandedSizes.set(window,size);window.setMinimumSize(220,100);window.setMaximumSize(720,200);window.setSize(320,110);}
  else{window.setMaximumSize(720,560);window.setMinimumSize(220,180);window.setSize(...(expandedSizes.get(window)||[340,252]));}
};
exports.createWindowController=function({createMain,createMini,quit}){
  let main=null,mini=null,quitting=false;
  function alive(window){return window&&!window.isDestroyed();}
  function stop(){if(quitting)return;quitting=true;quit();}
  function openMain(){
    if(!alive(main)){
      main=createMain();main.on('close',event=>{if(quitting)return;if(alive(mini)){event.preventDefault();main.hide();}else stop();});main.on('closed',()=>{main=null;});
    }
    if(main.isMinimized?.())main.restore();main.show();main.focus();return main;
  }
  function openMini(){
    if(!alive(mini)){
      mini=createMini();mini.on('closed',()=>{mini=null;if(!alive(main)||!main.isVisible())stop();});
    }
    if(mini.isMinimized?.())mini.restore();mini.show();if(alive(main))main.hide();return mini;
  }
  function restoreMain(){const window=openMain();if(alive(mini))mini.close();return window;}
  return {openMain,openMini,restoreMain,closeMini(){if(alive(mini))mini.close();},getMini:()=>alive(mini)?mini:null,getMain:()=>alive(main)?main:null,beforeQuit(){quitting=true;}};
};
