'use strict';
const {app,BrowserWindow,ipcMain,protocol,net,screen,shell,Menu}=require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {createWindowController,applyCompactSize,applyEditorSize}=require('./window-controller.cjs');
const ROOT=path.join(__dirname,'..','dist');
const ORIGIN='salary-clock://app';
protocol.registerSchemesAsPrivileged([{scheme:'salary-clock',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
let controller;
function guardWindow(window){
  window.webContents.setWindowOpenHandler(({url})=>{if(url.startsWith('https://github.com/GGBond2424648901/salary-glass-clock/')||url==='https://ggbond2424648901.github.io/salary-glass-clock/')shell.openExternal(url);return {action:'deny'};});
  window.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(ORIGIN+'/'))event.preventDefault();});
  window.webContents.on('will-attach-webview',event=>event.preventDefault());
  return window;
}
function preferences(backgroundThrottling=true){return {preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,backgroundThrottling};}
function createMain(){
  const area=screen.getPrimaryDisplay().workAreaSize;
  const window=guardWindow(new BrowserWindow({width:Math.min(460,area.width),height:Math.min(800,area.height-24),minWidth:300,minHeight:420,title:'上班攒钱钟',backgroundColor:'#f5e6e8',autoHideMenuBar:true,icon:path.join(ROOT,'assets','icon.png'),webPreferences:preferences()}));
  window.loadURL(ORIGIN+'/index.html');return window;
}
function createMini(){
  const area=screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
  const window=guardWindow(new BrowserWindow({width:340,height:252,minWidth:220,minHeight:180,maxWidth:720,maxHeight:560,x:area.x+area.width-364,y:area.y+36,title:'攒钱钟 · 置顶小窗',frame:false,transparent:true,backgroundColor:'#00000000',alwaysOnTop:true,skipTaskbar:true,resizable:true,hasShadow:true,roundedCorners:true,webPreferences:preferences(false)}));
  window.loadURL(ORIGIN+'/mini.html');return window;
}
function assertSender(event,file){
  const url=new URL(event.senderFrame?.url||'about:blank');
  if(url.protocol!=='salary-clock:'||url.host!=='app'||(file&&url.pathname!==file))throw Error('Invalid app frame');
}
if(!app.requestSingleInstanceLock())app.quit();else{
  app.on('second-instance',()=>controller?.restoreMain());
  app.on('before-quit',()=>controller?.beforeQuit());
  app.whenReady().then(async()=>{
    const {validateSettings,DEFAULT_SETTINGS}=await import(pathToFileURL(path.join(ROOT,'engine.mjs')).toString());
    let sessionSettings={...DEFAULT_SETTINGS};
    function copySettings(next){if(!next||typeof next!=='object'||validateSettings(next))throw Error('Invalid settings');return {...next,days:[...next.days]};}
    Menu.setApplicationMenu(null);
    protocol.handle('salary-clock',async request=>{
      try{
        const url=new URL(request.url);if(url.host!=='app'||!['GET','HEAD'].includes(request.method))return new Response('Not found',{status:404});
        const file=path.resolve(ROOT,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
        const relative=path.relative(ROOT,file);if(!relative||relative.startsWith('..')||path.isAbsolute(relative))return new Response('Not found',{status:404});
        const response=await net.fetch(pathToFileURL(file).toString());const headers=new Headers(response.headers);
        headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'");
        return new Response(response.body,{status:response.status,headers});
      }catch{return new Response('Not found',{status:404});}
    });
    controller=createWindowController({createMain,createMini,quit:()=>app.quit()});
    ipcMain.handle('clock:open-mini',(event,settings)=>{assertSender(event,'/index.html');sessionSettings=copySettings(settings);controller.openMini();return true;});
    ipcMain.handle('clock:read-settings',event=>{assertSender(event,'/mini.html');return sessionSettings;});
    ipcMain.handle('clock:update-settings',(event,settings,persisted)=>{assertSender(event,'/mini.html');if(typeof persisted!=='boolean')throw Error('Invalid persistence state');sessionSettings=copySettings(settings);controller.getMain()?.webContents.send('clock:settings-changed',{settings:sessionSettings,persisted});return true;});
    ipcMain.handle('clock:restore-main',event=>{assertSender(event,'/mini.html');controller.restoreMain();return true;});
    ipcMain.handle('clock:close-mini',event=>{assertSender(event,'/mini.html');controller.closeMini();return true;});
    ipcMain.handle('clock:set-pinned',(event,pinned)=>{assertSender(event,'/mini.html');if(typeof pinned!=='boolean')throw Error('Invalid pinned state');controller.getMini()?.setAlwaysOnTop(pinned);return pinned;});
    ipcMain.handle('clock:set-compact',(event,compact)=>{assertSender(event,'/mini.html');if(typeof compact!=='boolean')throw Error('Invalid compact state');const window=controller.getMini();if(window)applyCompactSize(window,compact);return compact;});
    ipcMain.handle('clock:set-editor',(event,open)=>{assertSender(event,'/mini.html');if(typeof open!=='boolean')throw Error('Invalid editor state');const window=controller.getMini();if(window)applyEditorSize(window,open);return open;});
    controller.openMain();
    app.on('activate',()=>controller.restoreMain());
  });
  app.on('window-all-closed',()=>app.quit());
}
