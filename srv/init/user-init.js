const cds = require('@sap/cds');
const password = require('../auth/password');

const Users           = 'anubhav.claude.Users';
const UserRoles       = 'anubhav.claude.UserRoles';
const UserCredentials = 'anubhav.claude.UserCredentials';

const ADMIN_LOGIN    = 'anubhav@anubhavtrainings.com';
const ADMIN_PASSWORD = 'Welcome1!';
const ADMIN_FIRST    = 'Anubhav';
const ADMIN_LAST     = 'Trainings';
const ADMIN_ROLE     = 'ADMIN';

module.exports = async function userInit() {
    const db = await cds.connect.to('db');
    const log = cds.log('init:user');

    const existing = await db.run(SELECT.one.from(Users).where({ loginName: ADMIN_LOGIN }));
    if (existing) {
        log.info(`default admin '${ADMIN_LOGIN}' already exists — skipping`);
        return;
    }

    const userId = cds.utils.uuid();
    const credId = cds.utils.uuid();
    const roleId = cds.utils.uuid();
    const passwordHash = await password.hash(ADMIN_PASSWORD);

    await db.run([
        INSERT.into(Users).entries({
            ID:        userId,
            loginName: ADMIN_LOGIN,
            firstName: ADMIN_FIRST,
            lastName:  ADMIN_LAST,
            isLocked:  false,
        }),
        INSERT.into(UserCredentials).entries({
            ID:             credId,
            user_ID:        userId,
            passwordHash,
            failedAttempts: 0,
        }),
        INSERT.into(UserRoles).entries({
            ID:        roleId,
            user_ID:   userId,
            role_code: ADMIN_ROLE,
        }),
    ]);

    log.info(`created default admin '${ADMIN_LOGIN}' with role ${ADMIN_ROLE}`);
};
