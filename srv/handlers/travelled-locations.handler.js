module.exports = (srv) => {
    const { TravelledLocations } = srv.entities;

    srv.before('CREATE', TravelledLocations, async (req) => {
        const { travelFrom, travelTo, traveller_ID } = req.data;

        if (travelFrom && travelTo && travelFrom > travelTo) {
            return req.error(400, 'Travel start date must be before end date');
        }

        if (traveller_ID && travelFrom && travelTo) {
            const existing = await SELECT.from(TravelledLocations).where({ traveller_ID });
            const hasOverlap = existing.some(
                (loc) => travelFrom <= loc.travelTo && travelTo >= loc.travelFrom
            );
            if (hasOverlap) {
                return req.error(409, 'Traveller already has a trip during this date range');
            }
        }
    });
};
