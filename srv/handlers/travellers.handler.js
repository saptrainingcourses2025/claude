module.exports = (srv) => {
    const { Travellers } = srv.entities;

    // ─── Validate and enrich on CREATE ────────────────────────────────────────
    srv.before('CREATE', Travellers, async (req) => {
        const { firstName, lastName, email } = req.data;

        if (!firstName?.trim() || !lastName?.trim()) {
            return req.error(400, 'First name and last name are required');
        }

        if (email) {
            const duplicate = await SELECT.one.from(Travellers).where({ email });
            if (duplicate) return req.error(409, 'Email already registered');
        }

        if (!req.data.userID && req.user?.attr?.email) {
            req.data.userID = req.user.attr.email;
        }
    });

    // ─── Validate non-empty name fields on UPDATE ─────────────────────────────
    srv.before('UPDATE', Travellers, async (req) => {
        const { firstName, lastName } = req.data;

        if (firstName !== undefined && !firstName?.trim()) {
            return req.error(400, 'First name must not be empty');
        }
        if (lastName !== undefined && !lastName?.trim()) {
            return req.error(400, 'Last name must not be empty');
        }
    });

    // ─── Compute fullName on READ ─────────────────────────────────────────────
    srv.after('READ', Travellers, (data) => {
        if (Array.isArray(data)) data.forEach(enrichFullName);
        else enrichFullName(data);
    });
};

const enrichFullName = (d) => {
    if (d) d.fullName = `${d.firstName || ''} ${d.lastName || ''}`.trim();
};
