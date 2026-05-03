import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { signPayload } from '../../services/webhook-dispatch.service.js';

describe('Webhook HMAC Signature (signPayload)', () => {
  it('generates a consistent sha256 HMAC for a given payload and timestamp', () => {
    const secret = 'super-secret-key';
    const timestamp = 1714400000;
    const body = { awb: 'TEST1234', status: 'Delivered' };

    const signature1 = signPayload(secret, timestamp, body);
    const signature2 = signPayload(secret, timestamp, body);

    expect(signature1).toBe(signature2);
    expect(signature1).toHaveLength(64); // hex encoded sha256
    expect(signature1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generates the correct exact signature according to Node crypto', () => {
    const secret = 'test-secret';
    const timestamp = 1234567890;
    const bodyStr = JSON.stringify({ hello: 'world' });

    const expectedData = `${timestamp}.${bodyStr}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(expectedData).digest('hex');

    const actualSig = signPayload(secret, timestamp, { hello: 'world' });

    expect(actualSig).toBe(expectedSig);
  });

  it('produces different signatures for different timestamps', () => {
    const secret = 'key';
    const body = { id: 1 };
    
    const sig1 = signPayload(secret, 1000, body);
    const sig2 = signPayload(secret, 1001, body);

    expect(sig1).not.toBe(sig2);
  });

  it('produces different signatures for different payloads', () => {
    const secret = 'key';
    const timestamp = 1000;
    
    const sig1 = signPayload(secret, timestamp, { amount: 100 });
    const sig2 = signPayload(secret, timestamp, { amount: 101 });

    expect(sig1).not.toBe(sig2);
  });

  it('handles string payloads directly without stringifying twice', () => {
    const secret = 'key';
    const timestamp = 1000;
    const jsonStr = '{"a":1}';

    const sigStr = signPayload(secret, timestamp, jsonStr);
    const sigObj = signPayload(secret, timestamp, { a: 1 });

    expect(sigStr).toBe(sigObj);
  });
});
