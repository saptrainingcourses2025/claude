const authHandler = require('./handlers/auth.handler');

module.exports = (srv) => {
    authHandler(srv);
};
