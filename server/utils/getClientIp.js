/**
 * Extracts the real client public IP address from the request.
 *
 * Priority order:
 *  1. X-Client-IP  — sent by our frontend (fetched from api.ipify.org).
 *                    This is the only reliable way to get the real internet IP
 *                    when the server and browser run on the same machine (localhost).
 *  2. X-Forwarded-For — set by CDNs / reverse-proxies (Nginx, Cloudflare, etc.)
 *  3. X-Real-IP       — alternative proxy header
 *  4. req.socket / req.ip — direct TCP connection (fallback)
 *
 * @param {import('express').Request} req
 * @returns {string}
 */
const getClientIp = (req) => {
  // 1. Frontend-supplied real public IP (most accurate for localhost dev)
  const clientIpHeader = req.headers['x-client-ip'];
  if (clientIpHeader) return clientIpHeader.trim();

  // 2. Proxy / CDN headers
  let ip =
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    '';

  // x-forwarded-for can be comma-separated; take the first (original client)
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  // Strip IPv6-mapped IPv4 prefix  e.g. "::ffff:192.168.1.1" → "192.168.1.1"
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  // Map IPv6 loopback to IPv4 loopback
  if (ip === '::1') {
    ip = '127.0.0.1';
  }

  return ip || 'Unknown';
};

module.exports = getClientIp;
