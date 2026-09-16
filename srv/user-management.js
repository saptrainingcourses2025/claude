const userManagementHandler = require('./handlers/user-management.handler');

module.exports = (srv) => {
    userManagementHandler(srv);
};
