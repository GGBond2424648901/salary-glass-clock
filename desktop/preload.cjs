'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktopClock',Object.freeze({
  platform:process.platform,
  openMini:settings=>ipcRenderer.invoke('clock:open-mini',settings),
  readSettings:()=>ipcRenderer.invoke('clock:read-settings'),
  updateSettings:(settings,persisted)=>ipcRenderer.invoke('clock:update-settings',settings,persisted),
  onSettingsChanged:callback=>{const handler=(_,state)=>callback(state);ipcRenderer.on('clock:settings-changed',handler);return ()=>ipcRenderer.removeListener('clock:settings-changed',handler);},
  restoreMain:()=>ipcRenderer.invoke('clock:restore-main'),
  closeMini:()=>ipcRenderer.invoke('clock:close-mini'),
  setPinned:pinned=>ipcRenderer.invoke('clock:set-pinned',pinned),
  setCompact:compact=>ipcRenderer.invoke('clock:set-compact',compact)
}));
