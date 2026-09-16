const jwt = require('jsonwebtoken');
const crypto = require('crypto');

let secret = process.env.AUTH_JWT_SECRET;
if (!secret) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('AUTH_JWT_SECRET must be set in production');
    }
    secret = crypto.randomBytes(32).toString('hex');
    console.warn('[auth] AUTH_JWT_SECRET not set — generated a random secret for this process');
}

const ACCESS_TTL  = process.env.AUTH_ACCESS_TTL  || '15m';
const REFRESH_TTL = process.env.AUTH_REFRESH_TTL || '7d';

const ttlToSeconds = (ttl) => {
    const m = /^(\d+)([smhd])$/.exec(ttl);
    if (!m) return 900;
    const n = parseInt(m[1], 10);
    return { s: n, m: n * 60, h: n * 3600, d: n * 86400 }[m[2]];
};

const sign = (payload, kind) => {
    const ttl = kind === 'refresh' ? REFRESH_TTL : ACCESS_TTL;
    return jwt.sign({ ...payload }, secret, { expiresIn: ttl, audience: kind });
};

const verify = (token, kind) => jwt.verify(token, secret, { audience: kind });

module.exports = {
    sign,
    verify,
    accessTtlSeconds: ttlToSeconds(ACCESS_TTL),
};
