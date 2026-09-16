using { anubhav.claude as db } from '../db/schema';

// Public, unauthenticated catalog of destinations.
// `requires: 'any'` means no authentication / authorization is enforced,
// so Fiori apps can consume it without a login. Exposed read-only:
// writes to Destinations must go through an authenticated/admin path.
service PublicService @(
    path     : 'public',
    requires : 'any'
) {

    entity Destinations as projection on db.Destinations;
}
