const dns = require('dns').promises;
const { isIP } = require('net');

async function isSafeUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    const hostname = u.hostname;

    // Reject non-http/https schemes
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return false;
    }

    // Block direct IP private ranges
    const cleanHostname = hostname.replace(/\[|\]/g, '');
    if (isIP(cleanHostname)) {
      if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.|0\.|::1|fc|fd)/i.test(cleanHostname)) {
        return false;
      }
    }

    // Resolve DNS and check resolved IPs
    const addresses = await dns.lookup(hostname, { all: true }).catch(() => []);
    return !addresses.some(({ address }) =>
      /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.|0\.)/.test(address)
    );
  } catch {
    return false;
  }
}

module.exports = {
  isSafeUrl,
};
