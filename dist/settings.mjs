import {DEFAULT_SETTINGS,validateSettings} from './engine.mjs';
export const SETTINGS_KEY='salary-glass-clock-v1';
export function getLocalStorage(scope=globalThis){try{return scope.localStorage;}catch{return {getItem:()=>null,setItem(){throw Error('Storage unavailable');}};}}
export function loadSettings(storage){
  try{const value=JSON.parse((storage||globalThis.localStorage).getItem(SETTINGS_KEY));const next={...DEFAULT_SETTINGS,...value};return validateSettings(next)?{...DEFAULT_SETTINGS,days:[...DEFAULT_SETTINGS.days]}:next;}
  catch{return {...DEFAULT_SETTINGS,days:[...DEFAULT_SETTINGS.days]};}
}
export function saveSettings(settings,storage){
  if(validateSettings(settings))return false;
  try{(storage||globalThis.localStorage).setItem(SETTINGS_KEY,JSON.stringify(settings));return true;}catch{return false;}
}
export function createSettingsSession({storage,initialSettings}={}){
  let current=initialSettings&&!validateSettings(initialSettings)?{...initialSettings,days:[...initialSettings.days]}:loadSettings(storage);
  return {get:()=>current,set(next){if(validateSettings(next))return false;current={...next,days:[...next.days]};return saveSettings(current,storage);},reload(){current=loadSettings(storage);}};
}
