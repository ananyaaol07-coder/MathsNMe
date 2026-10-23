import assert from 'node:assert/strict';
import test from 'node:test';
import { validateContactRequest } from '../lib/profile.ts';
const current = { guardianEmail: 'parent@example.com', phone: '9876543210', dialCode: '+91' };
test('accepts and normalizes an email change without mutating profile', () => {
  const result = validateContactRequest({ field: 'email', value: ' NEW@example.com ', reason: ' New address ' }, current);
  assert.equal(result.requestedValue, 'new@example.com');
  assert.equal(result.reason, 'New address');
  assert.equal(current.guardianEmail, 'parent@example.com');
});
test('normalizes international phone numbers', () => {
  assert.equal(validateContactRequest({ field: 'phone', value: '+44 (7700) 900-123', reason: '' }, current).requestedValue, '+447700900123');
});
test('rejects unchanged details including formatted phone numbers', () => {
  assert.throws(() => validateContactRequest({ field: 'email', value: 'PARENT@example.com', reason: '' }, current), /different/);
  assert.throws(() => validateContactRequest({ field: 'phone', value: '+91 98765 43210', reason: '' }, current), /different/);
});
test('rejects invalid fields, invalid contacts and oversized reasons', () => {
  for (const input of [null, { field: 'role', value: 'admin', reason: '' }, { field: 'email', value: 'bad@', reason: '' }, { field: 'phone', value: '9876543210', reason: '' }, { field: 'phone', value: '+0123456789', reason: '' }, { field: 'email', value: 'valid@example.com', reason: 'a'.repeat(1001) }]) assert.throws(() => validateContactRequest(input, current));
});
