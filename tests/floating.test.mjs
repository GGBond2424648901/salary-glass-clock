import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {DEFAULT_SETTINGS} from '../dist/engine.mjs';
import {loadSettings,saveSettings,SETTINGS_KEY,getLocalStorage,createSettingsSession} from '../dist/settings.mjs';
import {miniSnapshot} from '../dist/mini-state.mjs';
import {createWindowController,applyCompactSize} from '../desktop/window-controller.cjs';
const fakeStorage=value=>({getItem:()=>value,setItem(key,next){this.saved=[key,next];}});
test('corrupt or blocked storage recovers to valid settings without crashing',()=>{
  assert.equal(loadSettings(fakeStorage('{')).salary,5000);
  assert.equal(loadSettings({getItem(){throw Error('blocked');}}).salary,5000);
  assert.equal(saveSettings(DEFAULT_SETTINGS,{setItem(){throw Error('blocked');}}),false);
  assert.equal(saveSettings({...DEFAULT_SETTINGS,salary:-1},fakeStorage(null)),false);
});
test('validated changes use one common storage key for full and mini windows',()=>{
  const storage=fakeStorage(null);assert.equal(saveSettings({...DEFAULT_SETTINGS,salary:6300},storage),true);
  assert.equal(storage.saved[0],SETTINGS_KEY);assert.equal(JSON.parse(storage.saved[1]).salary,6300);
});
test('denied storage getter still creates a mini settings session with current unsaved settings',()=>{
  const storage=getLocalStorage({get localStorage(){throw Error('denied');}});
  const session=createSettingsSession({storage,initialSettings:{...DEFAULT_SETTINGS,salary:6300}});
  assert.equal(session.get().salary,6300);
});
test('failed writes keep the chosen unit in session instead of reloading stale storage',()=>{
  const storage={getItem:()=>JSON.stringify(DEFAULT_SETTINGS),setItem(){throw Error('quota');}};
  const session=createSettingsSession({storage});
  assert.equal(session.set({...session.get(),unit:'mao'}),false);
  assert.equal(session.get().unit,'mao');
});
test('mini recomputes real time after backgrounding instead of accumulating timer ticks',()=>{
  const s={...DEFAULT_SETTINGS,salary:6300};
  const a=miniSnapshot(s,new Date('2026-11-04T10:00:00'));
  const b=miniSnapshot(s,new Date('2026-11-04T14:30:00'));
  assert.equal(a.amount,'40.00');assert.equal(b.amount,'160.00');assert.equal(b.countdown,'03:30:00');assert.equal(b.progress,160/300);
});
class FakeWindow extends EventEmitter{
  constructor(){super();this.visible=true;this.destroyed=false;this.pinned=true;}
  isDestroyed(){return this.destroyed;}isVisible(){return this.visible;}
  hide(){this.visible=false;}show(){this.visible=true;}focus(){}
  close(){const event={preventDefault(){this.prevented=true;}};this.emit('close',event);if(!event.prevented){this.destroyed=true;this.visible=false;this.emit('closed');}}
}
function setup(){let quitCount=0;const controller=createWindowController({createMain:()=>new FakeWindow(),createMini:()=>new FakeWindow(),quit:()=>quitCount++});return {controller,quitCount:()=>quitCount};}
test('closing main while floating does not destroy mini or quit',()=>{
  const {controller,quitCount}=setup();const main=controller.openMain(),mini=controller.openMini();main.close();
  assert.equal(main.destroyed,false);assert.equal(main.visible,false);assert.equal(mini.destroyed,false);assert.equal(quitCount(),0);
});
test('return restores main, closes floating window and keeps app alive',()=>{
  const {controller,quitCount}=setup();const main=controller.openMain(),mini=controller.openMini();controller.restoreMain();
  assert.equal(main.visible,true);assert.equal(mini.destroyed,true);assert.equal(quitCount(),0);
});
test('return restores a previously minimized main window',()=>{
  const {controller}=setup();const main=controller.openMain();let minimized=true;
  main.isMinimized=()=>minimized;main.restore=()=>{minimized=false;};
  controller.restoreMain();assert.equal(minimized,false);
});
test('closing last visible window quits cleanly, without leaving a hidden app',()=>{
  const {controller,quitCount}=setup();controller.openMain();controller.openMini().close();assert.equal(quitCount(),1);
});
test('compact mode expands without temporarily violating native window size constraints',()=>{
  const window={min:220,max:440,size:252,setMinimumSize(w,h){assert.ok(h<=this.max);this.min=h;},setMaximumSize(w,h){assert.ok(h>=this.min);this.max=h;},setSize(w,h){assert.ok(h>=this.min&&h<=this.max);this.size=h;}};
  applyCompactSize(window,true);assert.equal(window.size,110);
  applyCompactSize(window,false);assert.equal(window.size,252);
});
test('compact mode returns to custom expanded size even after repeated compact requests',()=>{
  const window={size:[500,320],getSize(){return this.size;},setMinimumSize(){},setMaximumSize(){},setSize(w,h){this.size=[w,h];}};
  applyCompactSize(window,true);applyCompactSize(window,true);applyCompactSize(window,false);
  assert.deepEqual(window.size,[500,320]);
});
