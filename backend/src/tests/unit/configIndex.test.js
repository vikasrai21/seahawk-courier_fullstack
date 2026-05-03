import { beforeEach, describe, expect, it, vi } from 'vitest';

async function loadConfig(env = {}) {
  vi.resetModules();

  const nextEnv = {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/seahawk',
    JWT_SECRET: 'super-secret-token-with-32-chars!!',
    ...env,
  };

  for (const key of Object.keys(process.env)) {
    if (
      key.startsWith('JWT_')
      || key.startsWith('SMTP_')
      || key.startsWith('WHATSAPP_')
      || key.startsWith('BACKUP_')
      || key.startsWith('WEBHOOK_')
      || key === 'DATABASE_URL'
      || key === 'CORS_ORIGIN'
      || key === 'PORT'
      || key === 'NODE_ENV'
      || key === 'ALLOW_MOCK_WALLET_RECHARGE'
      || key === 'API_DOCS_ENABLED'
      || key === 'API_DOCS_PUBLIC'
    ) {
      delete process.env[key];
    }
  }

  for (const [key, value] of Object.entries(nextEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  return import('../../config/index.js');
}

describe('config/index', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds validated config with defaults and parsed values', async () => {
    const config = (await loadConfig({
      NODE_ENV: 'production',
      PORT: '4002',
      CORS_ORIGIN: 'https://a.example.com, https://b.example.com',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '465',
      SMTP_USER: 'mailer',
      SMTP_PASS: 'secret',
      WHATSAPP_TOKEN: 'wa-token',
      WHATSAPP_PHONE_ID: 'wa-phone',
      BACKUP_S3_BUCKET: 'backup-bucket',
      WEBHOOK_REPLAY_WINDOW_SECONDS: '600',
      WEBHOOK_IDEMPOTENCY_TTL_SECONDS: '3600',
      ALLOW_MOCK_WALLET_RECHARGE: 'false',
      API_DOCS_ENABLED: 'false',
      API_DOCS_PUBLIC: 'false',
      OWNER_EMAILS: 'you@yourdomain.com',
    })).default;

    expect(config.env).toBe('production');
    expect(config.isProd).toBe(true);
    expect(config.port).toBe(4002);
    expect(config.db.url).toContain('postgres://');
    expect(config.jwt.refreshSecret).toBe('super-secret-token-with-32-chars!!_refresh');
    expect(config.cors.origin).toEqual(['https://a.example.com', 'https://b.example.com']);
    expect(config.cookie).toEqual(expect.objectContaining({ secure: true, sameSite: 'none' }));
    expect(config.email).toEqual(expect.objectContaining({ host: 'smtp.example.com', port: 465, user: 'mailer' }));
    expect(config.whatsapp).toEqual({ token: 'wa-token', phoneId: 'wa-phone' });
    expect(config.backups.s3Bucket).toBe('backup-bucket');
    expect(config.payments.allowMockRecharge).toBe(false);
    expect(config.docs).toEqual({ enabled: false, public: false });
    expect(config.webhooks).toEqual(expect.objectContaining({
      replayWindowSeconds: 600,
      idempotencyTtlSeconds: 3600,
    }));
  });

  it('uses development-friendly defaults when optional env vars are absent', async () => {
    const config = (await loadConfig({ NODE_ENV: 'development' })).default;

    expect(config.isDev).toBe(true);
    expect(config.cors.origin).toBe(true);
    expect(config.cookie.sameSite).toBe('lax');
    expect(config.payments.allowMockRecharge).toBe(true);
    expect(config.docs).toEqual({ enabled: true, public: true });
    expect(config.rateLimits.login.max).toBe(5);
    expect(config.rateLimits.global.max).toBe(300);
    expect(config.email.from).toContain('Sea Hawk Courier');
  });

  it('throws when required env vars are missing or invalid', async () => {
    await expect(loadConfig({ JWT_SECRET: 'short' })).rejects.toThrow('[CONFIG] JWT_SECRET must be at least 32 chars');
  });
});
