/** Runtime configuration. Everything that differs between local and production lives here. */

/** Path prefix the app is served under on avdar.me, e.g. "/khee". No trailing slash. */
export const BASE_PATH = (process.env.BASE_PATH ?? '/khee').replace(/\/+$/, '');

/** Public origin used for canonical URLs and Open Graph tags. */
export const PUBLIC_ORIGIN = (process.env.PUBLIC_ORIGIN ?? 'https://avdar.me').replace(/\/+$/, '');

export const PUBLIC_URL = PUBLIC_ORIGIN + BASE_PATH;

export const PORT = Number(process.env.PORT ?? 8080);

const envInt = (name: string, fallback: number): number => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/**
 * Abuse limits. These are per Cloud Run instance (the counters live in process memory), so the
 * effective ceiling is roughly `limit × max-instances`. See the avdar repo, docs/DEPLOYMENT.md § Abuse protection.
 */
export const RATE_LIMIT = {
  /** Requests one client IP may make per minute. A visit is a page load, a script and a few image downloads; live previews render in the browser. */
  perIpPerMinute: envInt('RATE_LIMIT_PER_MINUTE', 120),
  /** Requests one instance accepts per second across all clients, before it starts shedding load. */
  perInstancePerSecond: envInt('RATE_LIMIT_INSTANCE_PER_SECOND', 200),
  /**
   * Trusted proxies between the client and this service. Through the avdar.me gateway that is 1:
   * X-Forwarded-For then ends "<client>, <gateway>". Direct run.app traffic has 0, and the limiter
   * falls back to the last entry when the header is shorter than expected.
   */
  trustedProxies: envInt('TRUSTED_PROXIES', 1),
  /** Largest request body accepted, in bytes. The service takes no request bodies. */
  maxBodyBytes: envInt('MAX_BODY_BYTES', 16 * 1024),
} as const;

/** Largest PNG the API renders, in pixels per side, and the largest zoom. */
export const PNG_LIMITS = {
  maxSide: envInt('PNG_MAX_SIDE', 4096),
  maxScale: 4,
} as const;

/** Public source repository, linked from the page. */
export const REPO_URL = 'https://github.com/Byambaa0325/khee';
