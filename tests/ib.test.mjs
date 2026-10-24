import test from 'node:test';
import assert from 'node:assert/strict';
import { IB_PASS_SCORE, canAccessGrade, externalActivityLink, hasChapterTests, validGrade, parseCurriculum, curriculumWithPlaceholders, curriculumView, applyActivity, validateCriteria, passesTest } from '../lib/ib/curriculum.ts';

const exercise = id => ({ id, title: id, children: [] });
const chapter = id => ({ id, title: id, children: [exercise('e1'), exercise('e2')] });
const modules = parseCurriculum([{ id:'m1', title:'Module 1', children:[chapter('c1'), chapter('c2')] }, { id:'m2', title:'Module 2', children:[chapter('c1')] }]);
const cp = ['m1','c1'], ep = [...cp,'e1'];
const revision = { chapterTests: true }, current = { chapterTests: false };
const apply = (p, path, activity, passed, options = current) => applyActivity(modules, path, p, activity, passed, options);
const practice = (p, path = ep, options = current) => { for(let i=1;i<=10;i++) p = apply(p,path,`worksheet-${i}`,true,options); return p; };

test('Chapter 8 exposes the mapped Wayground assessment links', () => {
  const links = [
    [['algebra', 'chapter-8'], 'chapter-pre-test', '53130749'],
    [['algebra', 'chapter-8'], 'chapter-post-test', '59356669'],
    [['algebra', 'chapter-8', 'operations-and-sequences'], 'pre-test', '40654925'],
    [['algebra', 'chapter-8', 'operations-and-sequences'], 'post-test', '41539661'],
    [['algebra', 'chapter-8', 'multiplication-tables-and-rules'], 'pre-test', '00132685'],
    [['algebra', 'chapter-8', 'multiplication-tables-and-rules'], 'post-test', '39368781'],
    [['algebra', 'chapter-8', 'expressions-and-equations'], 'pre-test', '45201485'],
    [['algebra', 'chapter-8', 'expressions-and-equations'], 'post-test', '48216141'],
  ];
  for (const [path, activity, code] of links) assert.equal(externalActivityLink(6, path, activity), `https://wayground.com/join?gc=${code}`);
  assert.equal(externalActivityLink(7, ['algebra', 'chapter-8'], 'chapter-pre-test'), null);
});

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

test('Grade 6 uses the configured Algebra labels when no curriculum document exists', () => {
  const gradeSix = curriculumWithPlaceholders(undefined, 6);
  assert.deepEqual(gradeSix.map(node => node.title), ['Algebra']);
  assert.deepEqual(gradeSix[0].children.map(node => node.title), ['Chapter 8: Operations, Sequences & Equations']);
  assert.deepEqual(gradeSix[0].children[0].children.map(node => node.title), [
    'Operations & Sequences', 'Multiplication Tables & Rules', 'Expressions & Equations',
  ]);
  assert.equal(gradeSix[0].children[0].children.some(node => /6A08|EX0|WS\d|Exercise \d/.test(node.title)), false);
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

test('revision grade starts with a chapter pre-test and ends with a chapter post-test', () => {
  let view=curriculumView(modules,cp,{},revision);
  assert.ok(view.activities.find(a=>a.id==='chapter-pre-test').available);
  assert.equal(view.activities.find(a=>a.id==='chapter-post-test').available,false);
  assert.ok(view.children.every(n=>!n.unlocked));
  assert.throws(()=>curriculumView(modules,ep,{},revision),/chapter pre-test/);
  let p=apply({},cp,'chapter-pre-test',false,revision);
  assert.equal(curriculumView(modules,cp,p,revision).children[0].unlocked,true);
  p=apply(p,ep,'pre-test',true,revision);
  p=apply(p,[...cp,'e2'],'pre-test',true,revision);
  view=curriculumView(modules,cp,p,revision);
  assert.equal(view.activities.find(a=>a.id==='chapter-post-test').available,true);
  p=apply(p,cp,'chapter-post-test',true,revision);
  assert.ok(curriculumView(modules,['m1'],p,revision).children[1].unlocked);
});

test('chapter post-test stays locked until every exercise is complete', () => {
  let p=apply({},cp,'chapter-pre-test',true,revision);
  assert.equal(curriculumView(modules,cp,p,revision).activities.find(a=>a.id==='chapter-post-test').available,false);
  p=apply(p,ep,'pre-test',true,revision);
  assert.equal(curriculumView(modules,cp,p,revision).children[1].unlocked,true);
  assert.equal(curriculumView(modules,cp,p,revision).activities.find(a=>a.id==='chapter-post-test').available,false);
  p=apply(p,[...cp,'e2'],'pre-test',true,revision);
  assert.equal(curriculumView(modules,cp,p,revision).activities.find(a=>a.id==='chapter-post-test').available,true);
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

test('a failed chapter post-test keeps exercise progress and allows another attempt', () => {
  let p=apply({},cp,'chapter-pre-test',true,revision);
  p=apply(p,ep,'pre-test',true,revision);
  p=apply(p,[...cp,'e2'],'pre-test',true,revision);
  p=apply(p,cp,'chapter-post-test',false,revision);
  assert.ok(p[ep.join('/')]);
  assert.equal(curriculumView(modules,cp,p,revision).activities.find(a=>a.id==='chapter-post-test').available,true);
  p=apply(p,cp,'chapter-post-test',true,revision);
  assert.ok(curriculumView(modules,['m1'],p,revision).children[1].unlocked);
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
