const cds = require('@sap/cds');
const roleInit = require('./init/role-init');
const userInit = require('./init/user-init');

cds.on('served', async () => {
    const log = cds.log('init');
    try {
        await roleInit();
        await userInit();
        log.info('startup init complete');
    } catch (err) {
        log.error('startup init failed:', err);
    }
});

module.exports = cds.server;
