import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, validateSettings, shiftMinutes, workDaysInMonth, metrics, amountParts, monthData } from '../dist/engine.mjs';
const s = { ...DEFAULT_SETTINGS, salary: 6300 };
const dt = (day, time='00:00') => new Date(`2026-11-${String(day).padStart(2,'0')}T${time}:00`);
test('November 2026 double rest has 21 days, single rest 25', () => {
  assert.equal(workDaysInMonth(2026, 10, s),21);
  assert.equal(workDaysInMonth(2026, 10, {...s, mode:'single'}),25);
  assert.equal(workDaysInMonth(2026, 10, {...s, mode:'custom', days:[1]}),5);
});
test('7.5 hours excluding 90 minute lunch, and no earning during lunch', () => {
  assert.equal(shiftMinutes(s),450);
  assert.equal(metrics(s,dt(4,'12:00')).earned,120);
  assert.equal(metrics(s,dt(4,'13:30')).earned,120);
  assert.equal(metrics(s,dt(4,'12:45')).status,'午休中');
});
test('start, end, weekend and monthly accumulations remain bounded', () => {
  assert.equal(metrics(s,dt(4,'08:59')).earned,0);
  assert.equal(metrics(s,dt(4,'18:00')).earned,300);
  assert.equal(metrics(s,dt(4,'23:59')).earned,300);
  assert.equal(metrics(s,dt(7,'15:00')).earned,0);
  assert.equal(metrics(s,dt(4,'18:00')).monthEarned,900);
  assert.equal(metrics(s,dt(30,'23:59')).monthEarned,6300);
});
test('night shifts remain active across midnight, with assigned start day', () => {
  const night={...s,start:'22:00',end:'06:00',breakEnabled:false};
  const m=metrics(night,dt(7,'02:00'));
  assert.equal(shiftMinutes(night),480);
  assert.equal(m.status,'上班中');
  assert.equal(m.earned,150);
});
test('invalid salary, zero workdays, zero duration, and out-of-shift lunch are rejected', () => {
  for(const v of [{salary:NaN},{salary:-1},{mode:'custom',days:[]},{start:'09:00',end:'09:00'},{breakStart:'18:30',breakEnd:'19:00'}]) assert.ok(validateSettings({...s,...v}));
  assert.equal(validateSettings(s),'');
});
test('unit conversion and cent, dime, yuan quantization never overstate earned pay', () => {
  assert.deepEqual(amountParts(128.649,'yuan',.01),{integer:'128',decimal:'64',symbol:'¥'});
  assert.deepEqual(amountParts(128.649,'mao',.1),{integer:'1,286',decimal:'',symbol:'毛'});
  assert.deepEqual(amountParts(128.649,'fen',1),{integer:'12,800',decimal:'',symbol:'分'});
});
test('monthly chart ends at earned amount and future days never accrue', () => {
  const m=monthData(s,2026,10,dt(4,'12:00'));
  assert.equal(m.total,720);
  assert.equal(m.points.at(-1).value,720);
  assert.equal(m.days[6].earned,0);
  assert.equal(m.days[0].weekday,0);
});
test('disabled lunch does not require unused break time fields', () => {
  const noBreak={...s,breakEnabled:false,breakStart:'',breakEnd:''};
  assert.equal(validateSettings(noBreak),'');
  assert.equal(shiftMinutes(noBreak),540);
  assert.equal(metrics(noBreak,dt(4,'18:00')).earned,300);
});
