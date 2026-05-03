import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isSafeUrl } from '../../utils/security.js';
import dns from 'dns/promises';

describe('SSRF Protection (isSafeUrl)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows valid public HTTP/HTTPS URLs', async () => {
    vi.spyOn(dns, 'lookup').mockResolvedValue([{ address: '93.184.216.34' }]);
    
    expect(await isSafeUrl('https://example.com/webhook')).toBe(true);
    expect(await isSafeUrl('http://mysaas.com/api/events')).toBe(true);
  });

  it('rejects non-HTTP schemes (file, ftp, gopher, etc.)', async () => {
    expect(await isSafeUrl('file:///etc/passwd')).toBe(false);
    expect(await isSafeUrl('ftp://example.com/')).toBe(false);
    expect(await isSafeUrl('gopher://example.com/')).toBe(false);
    expect(await isSafeUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects direct private/reserved IP addresses in the hostname', async () => {
    // Loopback
    expect(await isSafeUrl('http://127.0.0.1/admin')).toBe(false);
    expect(await isSafeUrl('http://[::1]/')).toBe(false);
    
    // Any IP starting with 0
    expect(await isSafeUrl('http://0.0.0.0/')).toBe(false);
    
    // AWS Metadata
    expect(await isSafeUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    
    // Local subnets
    expect(await isSafeUrl('http://10.0.0.1/')).toBe(false);
    expect(await isSafeUrl('http://172.16.0.1/')).toBe(false);
    expect(await isSafeUrl('http://192.168.1.254/')).toBe(false);
  });

  it('rejects domains that resolve to private IPs via DNS (DNS rebinding simulation)', async () => {
    // Simulate a user providing 'malicious.com' which resolves to internal metadata IP
    vi.spyOn(dns, 'lookup').mockResolvedValue([{ address: '169.254.169.254' }]);
    expect(await isSafeUrl('http://malicious.com/')).toBe(false);

    vi.spyOn(dns, 'lookup').mockResolvedValue([{ address: '10.0.5.10' }]);
    expect(await isSafeUrl('https://my-internal-domain.com/')).toBe(false);

    vi.spyOn(dns, 'lookup').mockResolvedValue([{ address: '127.0.0.1' }]);
    expect(await isSafeUrl('https://localhost.tv/')).toBe(false);
  });

  it('fails safely if URL parsing crashes', async () => {
    expect(await isSafeUrl('not-a-valid-url-at-all')).toBe(false);
  });

  it('considers unresolvable domains as safe from SSRF (fetch will just fail later)', async () => {
    vi.spyOn(dns, 'lookup').mockRejectedValue(new Error('ENOTFOUND'));
    expect(await isSafeUrl('http://this-domain-does-not-exist.com')).toBe(true);
  });
});
