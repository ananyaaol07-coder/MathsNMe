import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommitment, completePractice, settleMissedDays, scheduledAt, validateCommitment, WINDOW_MS } from '../lib/practice/commitment.ts';
import { readWorksheet, gradeWorksheet } from '../lib/practice/worksheet.ts';
const zone = 'Asia/Kolkata';
const date = '2026-10-23';
const at = (day = date, time = '18:00') => scheduledAt(day, time, zone);
const initial = (time = '18:00') => createCommitment(time, zone, at('2026-10-22', '12:00'));
test('commitment starts tomorrow, rejects invalid time and timezone', () => {
  assert.equal(initial().startDate, date);
  for (const time of ['24:00', '9:00', '', null]) assert.throws(() => validateCommitment(time, zone));
  assert.throws(() => validateCommitment('18:00', 'not-a-zone'));
});
test('completion window includes both boundaries but excludes one millisecond outside', () => {
  for (const offset of [-WINDOW_MS, 0, WINDOW_MS]) {
    const result = completePractice(initial(), at() + offset);
    assert.equal(result.bonus, 70); assert.equal(result.state.streak, 1); assert.equal(result.state.coins, 70);
  }
  for (const offset of [-WINDOW_MS - 1, WINDOW_MS + 1]) assert.equal(completePractice(initial(), at() + offset).bonus, 0);
});
test('each completed worksheet records earned XP and rounded practice minutes', () => {
  const first = completePractice(initial(), at(), 121).state;
  assert.equal(first.xp, 10); assert.equal(first.minutesCompleted, 3); assert.equal(first.weeklyMinutes, 3);
  const second = completePractice(first, at() + 3600000, 1).state;
  assert.equal(second.xp, 20); assert.equal(second.minutesCompleted, 4); assert.equal(second.weeklyMinutes, 4);
});
test('opening day and early practice never earn a bonus or immediately penalize', () => {
  const result = completePractice(initial(), at('2026-10-22'));
  assert.equal(result.bonus, 0); assert.equal(result.state.missedDays, 0);
  const early = completePractice(initial(), at() - WINDOW_MS - 1);
  assert.equal(early.state.missedDays, 0);
  assert.equal(completePractice(early.state, at()).bonus, 70);
});
test('daily success pays once; extra late practice does not erase earned streak', () => {
  const first = completePractice(initial(), at()).state;
  const again = completePractice(first, at() + 1);
  assert.equal(again.bonus, 0); assert.equal(again.state.coins, 70); assert.equal(again.state.streak, 1);
  assert.equal(completePractice(again.state, at() + 3600000).state.streak, 1);
  const tomorrow = completePractice(again.state, at('2026-10-24'));
  assert.equal(tomorrow.state.streak, 2); assert.equal(tomorrow.state.coins, 140);
});
test('missed days reset streak, cost 20 each, reconcile once and clamp at zero', () => {
  const first = completePractice(initial(), at()).state;
  const missed = settleMissedDays(first, at('2026-10-25') + WINDOW_MS + 1);
  assert.equal(missed.coins, 30); assert.equal(missed.streak, 0); assert.equal(missed.missedDays, 2);
  assert.deepEqual(settleMissedDays(missed, at('2026-10-25') + WINDOW_MS + 1), missed);
  assert.equal(settleMissedDays(missed, at('2026-11-25')).coins, 0);
  const recovery = completePractice(missed, at('2026-10-26'));
  assert.equal(recovery.state.streak, 1); assert.equal(recovery.state.coins, 100);
});
test('late submission stays recorded, earns no streak and applies the missed-day deduction', () => {
  const state = { ...initial(), coins: 100, streak: 4 };
  const result = completePractice(state, at() + WINDOW_MS + 1);
  assert.equal(result.state.worksheetsDone, 1); assert.equal(result.state.coins, 80); assert.equal(result.state.streak, 0);
});
test('windows straddling midnight are attributed to the scheduled date', () => {
  const early = completePractice(initial('00:05'), at('2026-10-22', '23:58'));
  assert.equal(early.state.lastSuccessDate, date); assert.equal(early.bonus, 70);
  const late = completePractice(initial('23:55'), at('2026-10-24', '00:03'));
  assert.equal(late.state.lastSuccessDate, date); assert.equal(late.bonus, 70);
  assert.equal(late.state.missedDays, 0);
});
test('time zone resolution handles fractional offsets, DST overlaps and gaps', () => {
  assert.equal(scheduledAt(date, '18:00', zone), Date.parse('2026-10-23T12:30:00Z'));
  assert.equal(scheduledAt(date, '18:00', 'Asia/Kathmandu'), Date.parse('2026-10-23T12:15:00Z'));
  assert.equal(scheduledAt('2026-11-01', '01:30', 'America/New_York'), Date.parse('2026-11-01T05:30:00Z'));
  assert.equal(scheduledAt('2026-03-08', '02:30', 'America/New_York'), Date.parse('2026-03-08T07:30:00Z'));
});
test('worksheets must be published and every question must be answered', () => {
  const worksheet = { title: 'Addition', topicId: 'vedic-maths', levelId: 1, published: true, questions: [{ id: 'q1', prompt: '2 + 2', answer: '4' }, { id: 'q2', prompt: '3 + 3', answer: '6' }] };
  assert.throws(() => readWorksheet({ ...worksheet, published: false }));
  assert.throws(() => readWorksheet({ ...worksheet, questions: [worksheet.questions[0], worksheet.questions[0]] }));
  assert.throws(() => gradeWorksheet(worksheet.questions, { q1: '4' }));
  assert.throws(() => gradeWorksheet(worksheet.questions, { q1: '4', q2: ' ' }));
  assert.throws(() => gradeWorksheet(worksheet.questions, { q1: '4', q2: '6', fake: '7' }));
  assert.equal(gradeWorksheet(worksheet.questions, { q1: '4.0', q2: '6' }).accuracy, 100);
  assert.equal(gradeWorksheet(worksheet.questions, { q1: '5', q2: '6' }).accuracy, 50);
});
