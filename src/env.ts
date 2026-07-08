export interface Env {
  USERS: KVNamespace;
  SCHEDULE: KVNamespace;
  LOGOS: R2Bucket;
  RATE_LIMITER: RateLimit;
}
