import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccessGrade, validGrade, parseCurriculum, curriculumView, applyActivity, validateCriteria, passesTest } from '../lib/ib/curriculum.ts';
const topic = id => ({ id, title: id, children: [] });
const exercise = id => ({ id, title: id, children: [topic('t1'), topic('t2')] });
const chapter = id => ({ id, title: id, children: [exercise('e1'), exercise('e2')] });
const modules = parseCurriculum([{ id:'m1', title:'Module 1', children:[chapter('c1'), chapter('c2')] }, { id:'m2', title:'Module 2', children:[chapter('c1')] }]);
const cp = ['m1','c1'], ep = [...cp,'e1'], tp = [...ep,'t1'];
const apply = (p, path, activity, passed) => applyActivity(modules, path, p, activity, passed);
const drillDown = () => apply(apply({}, cp, 'chapter-test', false), ep, 'exercise-test', false);
const practice = (p, path = tp) => { for(let i=1;i<=10;i++) p = apply(p,path,`worksheet-${i}`,true); return p; };
test('grade access requires own grade or explicit approval for grades 3–12', () => {
  assert.equal(canAccessGrade(6,6),true);
  for(const status of [undefined,'pending','rejected']) assert.equal(canAccessGrade(6,7,status),false);
  assert.equal(canAccessGrade(6,7,'approved'),true);
  assert.equal(canAccessGrade(6,2,'approved'),false); assert.equal(validGrade('6'),false);
});
test('all modules open independently; chapter test must precede exercises', () => {
  assert.ok(curriculumView(modules,[],{}).children.every(n=>n.unlocked));
  assert.ok(curriculumView(modules,['m2'],{}).children[0].unlocked);
  assert.ok(curriculumView(modules,cp,{}).activities[0].available);
  assert.ok(curriculumView(modules,cp,{}).children.every(n=>!n.unlocked));
  assert.throws(()=>curriculumView(modules,ep,{}),/parent test/);
  assert.throws(()=>curriculumView(modules,['m1','c2'],{}),/previous/);
});
test('chapter pass unlocks next chapter and all optional practice underneath', () => {
  let p=apply({},cp,'chapter-test',true);
  assert.ok(curriculumView(modules,['m1'],p).children[1].unlocked);
  assert.ok(curriculumView(modules,cp,p).children.every(n=>n.unlocked));
  const view=curriculumView(modules,[...cp,'e2','t2'],p);
  assert.ok(view.topic.completed);
  assert.ok(view.activities.find(a=>a.id==='worksheet-1').available);
  p=apply(p,[...cp,'e2','t2'],'worksheet-1',true);
  assert.ok(curriculumView(modules,['m1'],p).children[1].unlocked);
});
test('failed chapter opens exercise 1; failed exercise opens topic 1 only', () => {
  const failed=apply({},cp,'chapter-test',false);
  assert.ok(curriculumView(modules,cp,failed).children[0].unlocked);
  assert.equal(curriculumView(modules,cp,failed).children[1].unlocked,false);
  assert.throws(()=>apply(failed,cp,'chapter-test',true),/locked/);
  assert.throws(()=>curriculumView(modules,tp,failed),/parent test/);
  const p=drillDown();
  assert.ok(curriculumView(modules,ep,p).children[0].unlocked);
  assert.equal(curriculumView(modules,ep,p).children[1].unlocked,false);
});
test('exercise pass skips topics and unlocks next exercise but not next chapter', () => {
  const p=apply(apply({},cp,'chapter-test',false),ep,'exercise-test',true);
  assert.ok(curriculumView(modules,cp,p).children[1].unlocked);
  assert.equal(curriculumView(modules,['m1'],p).children[1].unlocked,false);
});
test('topic pre-test pass skips required worksheets and keeps optional practice', () => {
  let p=apply(drillDown(),tp,'pre-test',true);
  assert.ok(curriculumView(modules,ep,p).children[1].unlocked);
  assert.ok(curriculumView(modules,tp,p).activities.find(a=>a.id==='worksheet-10').available);
  p=apply(p,tp,'worksheet-1',true);
  assert.ok(curriculumView(modules,tp,p).topic.completed);
});
test('failed pre-test requires all 10 distinct worksheets, no pre-test shortcut', () => {
  let p=apply(drillDown(),tp,'pre-test',false);
  assert.throws(()=>apply(p,tp,'pre-test',true),/locked/);
  for(let i=0;i<10;i++) p=apply(p,tp,'worksheet-1',true);
  assert.throws(()=>apply(p,tp,'post-test',true),/locked/);
  p=practice(p); p=apply(p,tp,'post-test',false);
  assert.equal(p[tp.join('/')].worksheets.length,0);
  assert.throws(()=>apply(p,tp,'post-test',true),/locked/);
  p=practice(p); p=apply(p,tp,'post-test',true);
  assert.ok(curriculumView(modules,tp,p).topic.completed);
});
test('all topics require an exercise test; all exercises require a chapter test', () => {
  let p=drillDown();
  for(const t of ['t1','t2']) p=apply(p,[...ep,t],'pre-test',true);
  assert.equal(curriculumView(modules,cp,p).children[1].unlocked,false);
  assert.ok(curriculumView(modules,ep,p).activities[0].available);
  p=apply(p,ep,'exercise-test',true);
  p=apply(p,[...cp,'e2'],'exercise-test',true);
  assert.equal(curriculumView(modules,['m1'],p).children[1].unlocked,false);
  assert.ok(curriculumView(modules,cp,p).activities[0].available);
  p=apply(p,cp,'chapter-test',true);
  assert.ok(curriculumView(modules,['m1'],p).children[1].unlocked);
});
test('repeated exercise/chapter failures invalidate descendant completion for a fresh round', () => {
  let p=drillDown();
  for(const t of ['t1','t2']) p=apply(p,[...ep,t],'pre-test',true);
  p=apply(p,ep,'exercise-test',false);
  assert.equal(p[tp.join('/')],undefined);
  assert.throws(()=>apply(p,ep,'exercise-test',true),/locked/);
  for(const t of ['t1','t2']) p=apply(p,[...ep,t],'pre-test',true);
  p=apply(p,ep,'exercise-test',true); p=apply(p,[...cp,'e2'],'exercise-test',true);
  p=apply(p,cp,'chapter-test',false);
  assert.equal(p[ep.join('/')],undefined);
  assert.throws(()=>apply(p,cp,'chapter-test',true),/locked/);
});
test('each test has independent score, accuracy and timing gates with exact boundaries', () => {
  const c=validateCriteria({ minScore:95,minAccuracy:90,maxSeconds:120 });
  assert.ok(passesTest(c,95,90,120));
  for(const metrics of [[94.99,100,60],[100,89.99,60],[100,100,120.01],[NaN,100,60]]) assert.equal(passesTest(c,...metrics),false);
  assert.ok(passesTest(validateCriteria({minScore:80,minAccuracy:75,maxSeconds:300}),85,80,250));
  for(const input of [undefined,{}, {minScore:101,minAccuracy:90,maxSeconds:120},{minScore:95,minAccuracy:90,maxSeconds:0}]) assert.throws(()=>validateCriteria(input));
});
test('invalid curriculum is rejected; empty chapters do not auto-complete', () => {
  assert.deepEqual(parseCurriculum([]),[]);
  assert.throws(()=>parseCurriculum([modules[0],modules[0]]));
  assert.throws(()=>parseCurriculum([{id:'bad/path',title:'Bad',children:[]}]));
  assert.throws(()=>curriculumView(modules,['missing'],{}));
});
