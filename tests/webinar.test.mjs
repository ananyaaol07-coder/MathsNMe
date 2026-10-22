import test from 'node:test';
import assert from 'node:assert/strict';
import { indiaDate, slotStart, validateRegistration, validDate, SLOTS } from '../lib/webinar/schedule.ts';
const now = Date.parse('2026-10-19T20:00:00Z');
const form = { parentName: 'Parent', parentPhone: '+91 9876543210', parentEmail: 'parent@example.com', studentName: 'Student', samePhone: true, sameEmail: true, grade: 6, board: 'CBSE', country: 'India', state: 'Telangana', date: '2026-10-20', time: '06:00', consent: true };
test('uses the India calendar date across UTC midnight boundaries', () => {
  assert.equal(indiaDate(new Date('2026-10-19T18:29:59Z')), '2026-10-19');
  assert.equal(indiaDate(new Date('2026-10-19T18:30:00Z')), '2026-10-20');
  assert.equal(slotStart('2026-10-20', '06:00'), Date.parse('2026-10-20T00:30:00Z'));
});
test('copies parent contacts independently and normalizes phone numbers', () => {
  const result = validateRegistration(form, now);
  assert.equal(result.studentPhone, '+919876543210');
  assert.equal(result.studentEmail, form.parentEmail);
  const separate = validateRegistration({ ...form, sameEmail: false, studentEmail: 'child@example.com' }, now);
  assert.equal(separate.studentEmail, 'child@example.com');
  assert.equal(separate.studentPhone, result.parentPhone);
});
test('rejects invalid dates, past slots, malformed contacts and unsupported fields', () => {
  assert.equal(validDate('2026-02-30'), false);
  for (const patch of [{ date: '2026-02-30' }, { date: '2026-10-19' }, { time: '08:00' }, { grade: 13 }, { board: 'Other' }, { consent: false }, { parentPhone: '9876543210' }, { parentEmail: 'invalid' }, { samePhone: false }, { sameEmail: false }]) assert.throws(() => validateRegistration({ ...form, ...patch }, now));
  assert.throws(() => validateRegistration(form, slotStart(form.date, form.time)));
});
test('each allowed time is distinct and future dates remain bookable', () => {
  assert.deepEqual(SLOTS, ['06:00', '07:00', '18:00', '19:00', '20:00']);
  assert.equal(new Set(SLOTS.map(time => slotStart(form.date, time))).size, 5);
  assert.equal(validateRegistration({ ...form, date: '2026-10-21' }, now).date, '2026-10-21');
});
