import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_SETTINGS,validateSettings} from '../dist/engine.mjs';
import {glassTokens} from '../dist/appearance.mjs';
import {loadSettings,saveSettings} from '../dist/settings.mjs';
test('glass transparency can reach fully clear surfaces without fading content',()=>{
  const clear=glassTokens(100),frosted=glassTokens(0);
  assert.equal(clear.outerTop,0);assert.equal(clear.surfaceTop,0);assert.equal(clear.miniArt,0);assert.equal(clear.miniSurface,0);assert.equal(clear.blur,0);
  assert.equal(frosted.outerTop,1);assert.equal(frosted.surfaceTop,1);assert.ok(frosted.blur>20);
});
test('mini font preference survives saving without changing salary or transparency',()=>{
  let stored;
  const storage={getItem:()=>stored,setItem:(_,value)=>{stored=value;}};
  assert.equal(saveSettings({...DEFAULT_SETTINGS,salary:6300,glassTransparency:75,miniFontSize:145,miniFontWeight:700},storage),true);
  const restored=loadSettings(storage);
  assert.equal(restored.miniFontSize,145);assert.equal(restored.miniFontWeight,700);assert.equal(restored.salary,6300);assert.equal(restored.glassTransparency,75);
});
test('old font settings migrate without changing size and invalid weights are rejected',()=>{
  const {miniFontWeight,...old}=DEFAULT_SETTINGS;
  const restored=loadSettings({getItem:()=>JSON.stringify({...old,salary:6300,miniFontSize:125})});
  assert.equal(restored.miniFontWeight,550);assert.equal(restored.miniFontSize,125);assert.equal(restored.salary,6300);
  for(const value of [0,299,801,NaN,Infinity,'700'])assert.ok(validateSettings({...DEFAULT_SETTINGS,miniFontWeight:value}));
});
test('old settings receive a readable mini font default and invalid sizes cannot be saved',()=>{
  const {miniFontSize,...old}=DEFAULT_SETTINGS;
  const restored=loadSettings({getItem:()=>JSON.stringify({...old,salary:6300})});
  assert.equal(restored.miniFontSize,100);assert.equal(restored.salary,6300);
  for(const value of [0,79,161,NaN,Infinity,'120'])assert.ok(validateSettings({...DEFAULT_SETTINGS,miniFontSize:value}));
});
test('invalid transparency is rejected while old saved salaries migrate unchanged',()=>{
  for(const value of [-1,101,NaN])assert.ok(validateSettings({...DEFAULT_SETTINGS,glassTransparency:value}));
  const {glassTransparency,...old}=DEFAULT_SETTINGS;
  const restored=loadSettings({getItem:()=>JSON.stringify({...old,salary:6300})});
  assert.equal(restored.salary,6300);assert.equal(restored.glassTransparency,40);
});
