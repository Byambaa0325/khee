/**
 * Fixed-window request counters kept in process memory, plus the Hono middleware that uses them.
 *
 * This is the application-level half of abuse protection. The other half is the Cloud Run service
 * configuration (max instances, concurrency, timeout), which is what actually bounds cost. Counters
 * are per instance and vanish when the instance is recycled; that is accepted for a free game.
 */
import type { MiddlewareHandler } from 'hono';

export interface WindowOptions {
  /** Length of a counting window in milliseconds. */
  windowMs: number;
  /** Requests allowed per key per window. */
  max: number;
  /** Upper bound on tracked keys, so a flood of distinct IPs cannot grow memory without limit. */
  maxKeys?: number;
  now?: () => number;
}

export interface Decision {
  allowed: boolean;
  remaining: number;
  /** Whole seconds until the window resets. */
  retryAfterSec: number;
}

interface Slot {
  count: number;
  resetAt: number;
}

export class FixedWindow {
  private readonly slots = new Map<string, Slot>();
  private readonly maxKeys: number;
  private readonly now: () => number;

  constructor(private readonly opts: WindowOptions) {
    this.maxKeys = opts.maxKeys ?? 10_000;
    this.now = opts.now ?? Date.now;
  }

  hit(key: string): Decision {
    const t = this.now();
    let slot = this.slots.get(key);
    if (!slot || slot.resetAt <= t) {
      if (!slot && this.slots.size >= this.maxKeys) this.evict(t);
      slot = { count: 0, resetAt: t + this.opts.windowMs };
      this.slots.set(key, slot);
    }
    slot.count += 1;
    const remaining = Math.max(0, this.opts.max - slot.count);
    return {
      allowed: slot.count <= this.opts.max,
      remaining,
      retryAfterSec: Math.max(1, Math.ceil((slot.resetAt - t) / 1000)),
    };
  }

  get size(): number {
    return this.slots.size;
  }

  /** Drop expired slots; if that is not enough, drop the oldest-inserted ones. */
  private evict(t: number): void {
    for (const [k, s] of this.slots) if (s.resetAt <= t) this.slots.delete(k);
    const excess = this.slots.size - Math.floor(this.maxKeys * 0.9);
    if (excess <= 0) return;
    let n = 0;
    for (const k of this.slots.keys()) {
      if (n++ >= excess) break;
      this.slots.delete(k);
    }
  }
}

/**
 * The client's IP from X-Forwarded-For. Google's frontend appends the direct caller to the header,
 * so the real client sits `trustedProxies` entries from the end. Anything a client prepends itself
 * is further left and ignored.
 */
export function clientIp(forwardedFor: string | undefined, trustedProxies: number): string {
  const hops = (forwardedFor ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (hops.length === 0) return 'unknown';
  const i = hops.length - 1 - trustedProxies;
  return hops[i < 0 ? hops.length - 1 : i]!;
}

export interface RateLimitOptions {
  perIp: FixedWindow;
  perInstance: FixedWindow;
  trustedProxies: number;
  /** Paths that bypass the limiter, e.g. the health check. */
  exempt?: (path: string) => boolean;
}

export function rateLimit(o: RateLimitOptions): MiddlewareHandler {
  return async (c, next) => {
    if (o.exempt?.(c.req.path)) return next();

    const global = o.perInstance.hit('*');
    if (!global.allowed) {
      c.header('Retry-After', String(global.retryAfterSec));
      c.header('Cache-Control', 'no-store');
      return c.text('Busy, please retry shortly.', 503);
    }

    const ip = clientIp(c.req.header('x-forwarded-for'), o.trustedProxies);
    const d = o.perIp.hit(ip);
    c.header('X-RateLimit-Remaining', String(d.remaining));
    if (!d.allowed) {
      c.header('Retry-After', String(d.retryAfterSec));
      c.header('Cache-Control', 'no-store');
      console.warn(JSON.stringify({ severity: 'WARNING', message: 'rate limited', ip, path: c.req.path }));
      return c.text('Too many requests. Please slow down.', 429);
    }
    return next();
  };
}
