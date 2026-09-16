const cds = require('@sap/cds');
const jwtHelper = require('./jwt');

module.exports = async function jwtAuth(req, res, next) {
    const authHeader = req.headers && req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = new cds.User.Anonymous();
        return next();
    }

    const token = authHeader.slice(7).trim();

    let payload;
    try {
        payload = jwtHelper.verify(token, 'access');
    } catch (err) {
        return res.status(401).json({ error: 'invalid_token', message: err.message });
    }

    try {
        const [user, rows] = await Promise.all([
            SELECT.one.from('anubhav.claude.Users').columns('ID', 'loginName', 'isLocked').where({ ID: payload.sub }),
            SELECT.from('anubhav.claude.UserRoles').where({ user_ID: payload.sub }),
        ]);

        if (!user) return res.status(401).json({ error: 'invalid_token', message: 'User not found' });
        if (user.isLocked) return res.status(403).json({ error: 'user_locked', message: 'User is locked' });

        const roles = {};
        for (const r of rows) roles[r.role_code] = true;

        req.user = new cds.User({
            id: payload.sub,
            roles,
            attr: { email: user.loginName },
        });
        return next();
    } catch (err) {
        return res.status(500).json({ error: 'auth_lookup_failed', message: err.message });
    }
};
