import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_SETTINGS,validateSettings} from '../dist/engine.mjs';
import {glassTokens} from '../dist/appearance.mjs';
import {loadSettings} from '../dist/settings.mjs';
test('glass transparency can reach fully clear surfaces without fading content',()=>{
  const clear=glassTokens(100),frosted=glassTokens(0);
  assert.equal(clear.outerTop,0);assert.equal(clear.surfaceTop,0);assert.equal(clear.miniArt,0);assert.equal(clear.miniSurface,0);assert.equal(clear.blur,0);
  assert.equal(frosted.outerTop,1);assert.equal(frosted.surfaceTop,1);assert.ok(frosted.blur>20);
});
test('invalid transparency is rejected while old saved salaries migrate unchanged',()=>{
  for(const value of [-1,101,NaN])assert.ok(validateSettings({...DEFAULT_SETTINGS,glassTransparency:value}));
  const {glassTransparency,...old}=DEFAULT_SETTINGS;
  const restored=loadSettings({getItem:()=>JSON.stringify({...old,salary:6300})});
  assert.equal(restored.salary,6300);assert.equal(restored.glassTransparency,40);
});
