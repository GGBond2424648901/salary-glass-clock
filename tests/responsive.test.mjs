import test from 'node:test';
import assert from 'node:assert/strict';
import {fitViewportBox} from '../dist/adaptive-layout.mjs';
test('entire interface fits both dimensions at small and large window sizes',()=>{
  for(const [width,height] of [[300,380],[360,500],[440,720],[700,900],[1488,1058]]){
    const box=fitViewportBox({viewportWidth:width,viewportHeight:height,contentWidth:Math.min(430,width-16),contentHeight:800,margin:8});
    assert.ok(box.width<=width-16+.01);assert.ok(box.height<=height-16+.01);assert.ok(box.scale>0&&box.scale<=1);
    assert.equal(box.width/box.height,Math.min(430,width-16)/800);
  }
});
test('larger windows preserve original size without stretching the design',()=>{
  const box=fitViewportBox({viewportWidth:1488,viewportHeight:1058,contentWidth:524,contentHeight:974,margin:16});
  assert.equal(box.scale,1);assert.equal(box.width,524);assert.equal(box.height,974);
});
