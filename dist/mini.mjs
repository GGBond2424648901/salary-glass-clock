import {mountMini} from './mini-ui.mjs';
const native=window.desktopClock;
const initialSettings=native?await native.readSettings():undefined;
const mini=mountMini(document,{
  initialSettings,
  onClose:()=>native?native.closeMini():window.close(),
  onExpand:()=>native?native.restoreMain():window.close(),
  onCompact:compact=>native?.setCompact(compact),
  onPin:native?(pinned=>native.setPinned(pinned)):undefined,
  onSettingsChange:native?((settings,persisted)=>native.updateSettings(settings,persisted)):undefined
});
window.addEventListener('pagehide',()=>mini.dispose(),{once:true});
