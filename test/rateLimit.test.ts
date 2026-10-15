import { describe, expect, it } from 'vitest';
import { FixedWindow, clientIp } from '../src/rateLimit.js';

function clock(start = 0) {
  let t = start;
  return { now: () => t, tick: (ms: number) => (t += ms) };
}

describe('FixedWindow', () => {
  it('allows `max` hits per window, then refuses until the window resets', () => {
    const c = clock();
    const w = new FixedWindow({ windowMs: 1000, max: 3, now: c.now });
    expect([w.hit('a').allowed, w.hit('a').allowed, w.hit('a').allowed]).toEqual([true, true, true]);
    const refused = w.hit('a');
    expect(refused.allowed).toBe(false);
    expect(refused.remaining).toBe(0);
    expect(refused.retryAfterSec).toBe(1);
    c.tick(1000);
    expect(w.hit('a').allowed).toBe(true);
  });

  it('counts keys independently', () => {
    const w = new FixedWindow({ windowMs: 1000, max: 1, now: () => 0 });
    expect(w.hit('a').allowed).toBe(true);
    expect(w.hit('b').allowed).toBe(true);
    expect(w.hit('a').allowed).toBe(false);
  });

  it('caps the number of tracked keys', () => {
    const c = clock();
    const w = new FixedWindow({ windowMs: 1000, max: 1, maxKeys: 100, now: c.now });
    for (let i = 0; i < 100; i++) w.hit(`ip-${i}`);
    expect(w.size).toBe(100);
    w.hit('one-more');
    expect(w.size).toBeLessThanOrEqual(100);
    // Expired slots go first: after the window, a new key sweeps everything old.
    c.tick(1000);
    w.hit('fresh');
    expect(w.size).toBeLessThanOrEqual(100);
  });
});

describe('clientIp', () => {
  it('takes the entry `trustedProxies` hops from the end', () => {
    // Via the avdar gateway: Google appended the gateway's IP last.
    expect(clientIp('203.0.113.9, 10.0.0.5', 1)).toBe('203.0.113.9');
    // A client that prepends fake addresses cannot move its real one.
    expect(clientIp('1.1.1.1, 2.2.2.2, 203.0.113.9, 10.0.0.5', 1)).toBe('203.0.113.9');
  });

  it('falls back to the last entry when the header is shorter than expected', () => {
    // Direct run.app traffic with trustedProxies=1.
    expect(clientIp('203.0.113.9', 1)).toBe('203.0.113.9');
  });

  it('handles a missing header', () => {
    expect(clientIp(undefined, 1)).toBe('unknown');
    expect(clientIp('', 0)).toBe('unknown');
  });
});
