import test from 'node:test';
import assert from 'node:assert/strict';
import { IB_PASS_SCORE, canAccessGrade, hasChapterTests, validGrade, parseCurriculum, curriculumView, applyActivity, validateCriteria, passesTest } from '../lib/ib/curriculum.ts';

const exercise = id => ({ id, title: id, children: [] });
const chapter = id => ({ id, title: id, children: [exercise('e1'), exercise('e2')] });
const modules = parseCurriculum([{ id:'m1', title:'Module 1', children:[chapter('c1'), chapter('c2')] }, { id:'m2', title:'Module 2', children:[chapter('c1')] }]);
const cp = ['m1','c1'], ep = [...cp,'e1'];
const revision = { chapterTests: true }, current = { chapterTests: false };
const apply = (p, path, activity, passed, options = current) => applyActivity(modules, path, p, activity, passed, options);
const practice = (p, path = ep, options = current) => { for(let i=1;i<=10;i++) p = apply(p,path,`worksheet-${i}`,true,options); return p; };

test('current and immediately previous grades are automatic; all others need approval', () => {
  assert.equal(canAccessGrade(6,6),true);
  assert.equal(canAccessGrade(6,5),true);
  for(const status of [undefined,'pending','rejected']) assert.equal(canAccessGrade(6,7,status),false);
  assert.equal(canAccessGrade(6,7,'approved'),true);
  assert.equal(canAccessGrade(3,2,'approved'),false);
  assert.equal(hasChapterTests(6,5),true);
  assert.equal(hasChapterTests(6,6),false);
  assert.equal(hasChapterTests(6,4),false);
  assert.equal(validGrade('6'),false);
});

test('all modules open and current-grade chapters begin directly with exercises', () => {
  assert.ok(curriculumView(modules,[],{},current).children.every(n=>n.unlocked));
  assert.ok(curriculumView(modules,['m2'],{},current).children[0].unlocked);
  const chapterView = curriculumView(modules,cp,{},current);
  assert.equal(chapterView.activities.length,0);
  assert.equal(chapterView.children[0].unlocked,true);
  assert.equal(chapterView.children[1].unlocked,false);
  assert.ok(curriculumView(modules,ep,{},current).activities.find(a=>a.id==='pre-test').available);
});

test('current grade requires every exercise and has no chapter-test shortcut', () => {
  assert.throws(()=>apply({},cp,'chapter-test',true,current),/locked/);
  let p=apply({},ep,'pre-test',true,current);
  assert.equal(curriculumView(modules,cp,p,current).children[1].unlocked,true);
  assert.equal(curriculumView(modules,['m1'],p,current).children[1].unlocked,false);
  p=apply(p,[...cp,'e2'],'pre-test',true,current);
  assert.equal(curriculumView(modules,['m1'],p,current).children[1].unlocked,true);
});

test('revision grade starts with a chapter test and a pass clears the chapter', () => {
  const view=curriculumView(modules,cp,{},revision);
  assert.ok(view.activities.find(a=>a.id==='chapter-test').available);
  assert.ok(view.children.every(n=>!n.unlocked));
  assert.throws(()=>curriculumView(modules,ep,{},revision),/chapter test/);
  const p=apply({},cp,'chapter-test',true,revision);
  assert.ok(curriculumView(modules,['m1'],p,revision).children[1].unlocked);
  assert.ok(curriculumView(modules,cp,p,revision).children.every(n=>n.unlocked));
  assert.ok(curriculumView(modules,[...cp,'e2'],p,revision).exercise.completed);
});

test('failed revision chapter test opens sequential exercises and requires a retest', () => {
  let p=apply({},cp,'chapter-test',false,revision);
  assert.equal(curriculumView(modules,cp,p,revision).children[0].unlocked,true);
  assert.equal(curriculumView(modules,cp,p,revision).children[1].unlocked,false);
  assert.throws(()=>apply(p,cp,'chapter-test',true,revision),/locked/);
  p=apply(p,ep,'pre-test',true,revision);
  p=apply(p,[...cp,'e2'],'pre-test',true,revision);
  assert.equal(curriculumView(modules,['m1'],p,revision).children[1].unlocked,false);
  assert.ok(curriculumView(modules,cp,p,revision).activities[0].available);
  p=apply(p,cp,'chapter-test',true,revision);
  assert.ok(curriculumView(modules,['m1'],p,revision).children[1].unlocked);
});

test('exercise pre-test pass clears it while keeping worksheets optional', () => {
  let p=apply({},ep,'pre-test',true,current);
  const view=curriculumView(modules,ep,p,current);
  assert.ok(view.exercise.completed);
  assert.ok(view.activities.find(a=>a.id==='worksheet-10').available);
  p=apply(p,ep,'worksheet-1',true,current);
  assert.ok(curriculumView(modules,ep,p,current).exercise.completed);
});

test('failed exercise pre-test requires ten distinct worksheets and a post-test', () => {
  let p=apply({},ep,'pre-test',false,current);
  assert.throws(()=>apply(p,ep,'pre-test',true,current),/locked/);
  for(let i=0;i<10;i++) p=apply(p,ep,'worksheet-1',true,current);
  assert.throws(()=>apply(p,ep,'post-test',true,current),/locked/);
  p=practice(p); p=apply(p,ep,'post-test',false,current);
  assert.equal(p[ep.join('/')].worksheets.length,0);
  assert.throws(()=>apply(p,ep,'post-test',true,current),/locked/);
  p=practice(p); p=apply(p,ep,'post-test',true,current);
  assert.ok(curriculumView(modules,ep,p,current).exercise.completed);
});

test('failed revision chapter retest invalidates descendant progress', () => {
  let p=apply({},cp,'chapter-test',false,revision);
  p=apply(p,ep,'pre-test',true,revision);
  p=apply(p,[...cp,'e2'],'pre-test',true,revision);
  p=apply(p,cp,'chapter-test',false,revision);
  assert.equal(p[ep.join('/')],undefined);
  assert.throws(()=>apply(p,cp,'chapter-test',true,revision),/locked/);
});

test('every test uses a fixed 90% score gate with separately configured accuracy and time', () => {
  assert.equal(IB_PASS_SCORE,90);
  const c=validateCriteria({ minScore:20,minAccuracy:80,maxSeconds:120 });
  assert.equal(c.minScore,90);
  assert.ok(passesTest(c,90,80,120));
  for(const metrics of [[89.99,100,60],[100,79.99,60],[100,100,120.01],[NaN,100,60]]) assert.equal(passesTest(c,...metrics),false);
  assert.ok(passesTest(validateCriteria({minAccuracy:75,maxSeconds:300}),90,80,250));
  for(const input of [undefined,{}, {minAccuracy:101,maxSeconds:120},{minAccuracy:90,maxSeconds:0}]) assert.throws(()=>validateCriteria(input));
});

test('curriculum stops at exercise depth and invalid paths are rejected', () => {
  assert.deepEqual(parseCurriculum([]),[]);
  assert.throws(()=>parseCurriculum([modules[0],modules[0]]));
  assert.throws(()=>parseCurriculum([{id:'bad/path',title:'Bad',children:[]}]));
  assert.throws(()=>parseCurriculum([{id:'m',title:'M',children:[{id:'c',title:'C',children:[{id:'e',title:'E',children:[{id:'t',title:'T',children:[]}]}]}]}]));
  assert.throws(()=>curriculumView(modules,['missing'],{},current));
  assert.throws(()=>curriculumView(modules,[...ep,'topic'],{},current));
});
