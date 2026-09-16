const cds = require('@sap/cds');
const jwt = require('../auth/jwt');
const password = require('../auth/password');

const Users           = 'anubhav.claude.Users';
const UserCredentials = 'anubhav.claude.UserCredentials';
const UserRoles       = 'anubhav.claude.UserRoles';
const Travellers      = 'anubhav.claude.Travellers';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loadRoles = async (userId) => {
    const rows = await SELECT.from(UserRoles).where({ user_ID: userId });
    return rows.map((r) => r.role_code);
};

module.exports = (srv) => {

    // ─── login ────────────────────────────────────────────────────────────────
    srv.on('login', async (req) => {
        const { loginName, password: plain } = req.data;

        if (!loginName || !plain) {
            return req.error(400, 'loginName and password are required');
        }

        const user = await SELECT.one.from(Users).where({ loginName });
        if (!user || user.isLocked) return req.error(401, 'Invalid credentials');

        const creds = await SELECT.one.from(UserCredentials).where({ user_ID: user.ID });
        if (!creds || !creds.passwordHash) return req.error(401, 'Invalid credentials');

        const ok = await password.compare(plain, creds.passwordHash);
        if (!ok) {
            await UPDATE(UserCredentials)
                .set({ failedAttempts: (creds.failedAttempts || 0) + 1 })
                .where({ ID: creds.ID });
            return req.error(401, 'Invalid credentials');
        }

        await UPDATE(UserCredentials)
            .set({ failedAttempts: 0, lastLoginAt: new Date().toISOString() })
            .where({ ID: creds.ID });

        const roles = await loadRoles(user.ID);
        const access  = jwt.sign({ sub: user.ID, roles }, 'access');
        const refresh = jwt.sign({ sub: user.ID },        'refresh');

        return { access, refresh, expiresIn: jwt.accessTtlSeconds };
    });

    // ─── refresh ──────────────────────────────────────────────────────────────
    srv.on('refresh', async (req) => {
        const { refreshToken } = req.data;
        if (!refreshToken) return req.error(400, 'refreshToken is required');

        let payload;
        try {
            payload = jwt.verify(refreshToken, 'refresh');
        } catch (err) {
            return req.error(401, 'Invalid refresh token');
        }

        const user = await SELECT.one.from(Users).where({ ID: payload.sub });
        if (!user) return req.error(404, 'User not found');
        if (user.isLocked) return req.error(403, 'User is locked');

        const roles = await loadRoles(user.ID);
        const access     = jwt.sign({ sub: user.ID, roles }, 'access');
        const newRefresh = jwt.sign({ sub: user.ID },        'refresh');

        return { access, refresh: newRefresh, expiresIn: jwt.accessTtlSeconds };
    });

    // ─── register ──────────────────────────────────────────────────────────────
    // Public self-registration: creates a TRAVELLER login + Travellers profile,
    // locked (isLocked = true) until an admin unlocks the account.
    srv.on('register', async (req) => {
        const { firstName, lastName, email, password: plain, phone, addressType } = req.data;

        if (!firstName?.trim() || !lastName?.trim()) {
            return req.error(400, 'First name and last name are required');
        }
        if (!email || !EMAIL_RE.test(email)) {
            return req.error(400, 'A valid email is required');
        }
        if (!plain || plain.length < 8) {
            return req.error(400, 'Password must be at least 8 characters');
        }

        const loginName = email.trim().toLowerCase();

        const existingUser = await SELECT.one.from(Users).where({ loginName });
        if (existingUser) return req.error(409, 'Email already registered');

        const existingTrav = await SELECT.one.from(Travellers).where({ email: loginName });
        if (existingTrav) return req.error(409, 'Email already registered');

        const userId       = cds.utils.uuid();
        const passwordHash = await password.hash(plain);

        await INSERT.into(Users).entries({
            ID:        userId,
            loginName,
            firstName: firstName.trim(),
            lastName:  lastName.trim(),
            isLocked:  true,            // locked until an admin unlocks
        });
        await INSERT.into(UserCredentials).entries({
            user_ID:        userId,
            passwordHash,
            failedAttempts: 0,
        });
        await INSERT.into(UserRoles).entries({
            user_ID:   userId,
            role_code: 'TRAVELLER',
        });
        await INSERT.into(Travellers).entries({
            firstName:        firstName.trim(),
            lastName:         lastName.trim(),
            email:            loginName,
            userID:           loginName,
            phone:            phone || null,
            type_code:        'ST',
            status_code:      'A',
            addressType_code: addressType || 'H',
        });

        return {
            userID:    userId,
            loginName,
            locked:    true,
            message:   'Registration successful. An admin must unlock your account before first login.',
        };
    });

    // ─── me ───────────────────────────────────────────────────────────────────
    srv.on('me', async (req) => {
        const id = req.user && req.user.id;
        if (!id || id === 'anonymous') return req.error(401, 'Not authenticated');

        const user = await SELECT.one.from(Users).where({ ID: id });
        if (!user) return req.error(404, 'User not found');

        const roles = await loadRoles(user.ID);

        return {
            id:        user.ID,
            loginName: user.loginName,
            firstName: user.firstName,
            lastName:  user.lastName,
            roles,
        };
    });
};
