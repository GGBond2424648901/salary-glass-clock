'use strict';
exports.applyCompactSize=function(window,compact){
  if(compact){window.setMinimumSize(280,106);window.setMaximumSize(580,180);}
  else{window.setMaximumSize(580,440);window.setMinimumSize(280,220);}
  window.setSize(compact?320:340,compact?110:252);
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
