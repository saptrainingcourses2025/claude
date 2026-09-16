const cds = require('@sap/cds');

const Roles = 'anubhav.claude.Roles';

const DEFAULT_ROLES = [
    { code: 'ADMIN',     name: 'Administrator', descr: 'Full system access with user and configuration management' },
    { code: 'AGENT',     name: 'Travel Agent',  descr: 'Agent access for managing travellers and bookings' },
    { code: 'TRAVELLER', name: 'Traveller',     descr: 'Self-service traveller access for bookings and profile' },
];

module.exports = async function roleInit() {
    const db = await cds.connect.to('db');
    const log = cds.log('init:roles');

    const existing = await db.run(SELECT.from(Roles).columns('code'));
    const have = new Set(existing.map((r) => r.code));

    const missing = DEFAULT_ROLES.filter((r) => !have.has(r.code));
    if (missing.length === 0) {
        log.info('roles already present — nothing to do');
        return;
    }

    await db.run(INSERT.into(Roles).entries(missing));
    log.info(`created roles: ${missing.map((r) => r.code).join(', ')}`);
};
