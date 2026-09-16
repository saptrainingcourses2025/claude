const travellersHandler       = require('./handlers/travellers.handler');
const travelledLocationsHandler = require('./handlers/travelled-locations.handler');

module.exports = (srv) => {
    travellersHandler(srv);
    travelledLocationsHandler(srv);
};
