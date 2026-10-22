import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { feeForCountry, validSignature, matchesCapturedPayment } from '../lib/enrollment/payment.ts';
test('fees are determined in currency subunits from the stored country', () => {
  assert.deepEqual(feeForCountry('India'), { amount: 100000, currency: 'INR', label: '₹1,000' });
  assert.deepEqual(feeForCountry('United States'), { amount: 2500, currency: 'USD', label: 'US$25' });
});
test('payment signatures reject changed payloads and invalid signatures', () => {
  const secret='test-only-secret', payload='order_test|pay_test';
  const signature=createHmac('sha256',secret).update(payload).digest('hex');
  assert.equal(validSignature(payload,signature,secret),true);
  assert.equal(validSignature('order_other|pay_test',signature,secret),false);
  assert.equal(validSignature(payload,'bad',secret),false);
  assert.equal(validSignature(payload,signature,''),false);
});
test('only a captured, unrefunded payment matching the exact order, amount and currency qualifies', () => {
  const payment={status:'captured',order_id:'order_test',amount:100000,currency:'INR',amount_refunded:0};
  assert.equal(matchesCapturedPayment(payment,'order_test','India'),true);
  for(const patch of [{status:'authorized'},{status:'failed'},{order_id:'order_else'},{amount:1000},{currency:'USD'},{amount_refunded:1}]) assert.equal(matchesCapturedPayment({...payment,...patch},'order_test','India'),false);
  assert.equal(matchesCapturedPayment(payment,'order_test','United States'),false);
});
