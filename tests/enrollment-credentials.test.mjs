import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { encryptionKey, seal, unseal } from '../lib/enrollment/credentials.ts';
test('credentials require a strong configured key and survive encrypted retries', () => {
  const previous = process.env.ENROLLMENT_CREDENTIAL_KEY;
  try {
    delete process.env.ENROLLMENT_CREDENTIAL_KEY;
    assert.throws(encryptionKey);
    process.env.ENROLLMENT_CREDENTIAL_KEY = randomBytes(32).toString('hex');
    const password = randomBytes(24).toString('base64url');
    const first = seal(password), second = seal(password);
    assert.notEqual(first, second);
    assert.ok(!first.includes(password));
    assert.equal(unseal(first), password);
    assert.equal(unseal(second), password);
    const parts = first.split(':');
    parts[2] = (parts[2].startsWith('00') ? '01' : '00') + parts[2].slice(2);
    assert.throws(() => unseal(parts.join(':')));
    process.env.ENROLLMENT_CREDENTIAL_KEY = randomBytes(32).toString('hex');
    assert.throws(() => unseal(first));
  } finally {
    if (previous === undefined) delete process.env.ENROLLMENT_CREDENTIAL_KEY;
    else process.env.ENROLLMENT_CREDENTIAL_KEY = previous;
  }
});
