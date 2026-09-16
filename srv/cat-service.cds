using { anubhav.claude as db }     from '../db/schema';
using { anubhav.claude as common } from '../db/common';
using { sap }                      from '@sap/cds/common';

service CatalogService @(
    path     : 'catalog',
    requires : 'authenticated-user'
) {

    @restrict: [
        { grant: '*',                                 to: 'ADMIN' },
        { grant: ['READ','CREATE','UPDATE','DELETE'], to: 'authenticated-user', where: 'userID = $user.email' }
    ]
    entity Travellers         as projection on db.Travellers;

    @readonly
    entity TravellerTypes     as projection on common.TravellerTypes;

    @restrict: [
        { grant: '*',                                 to: 'ADMIN' },
        { grant: ['READ','CREATE','UPDATE','DELETE'], to: 'authenticated-user', where: 'traveller.userID = $user.email' }
    ]
    entity TravelledLocations as projection on db.TravelledLocations;

    @restrict: [
        { grant: '*',                                 to: 'ADMIN' },
        { grant: ['READ','CREATE','UPDATE','DELETE'], to: 'authenticated-user', where: 'traveller.userID = $user.email' }
    ]
    entity Addresses          as projection on db.Addresses;

    @readonly
    entity TravellerStatus    as projection on common.TravellerStatus;

    @readonly
    entity AddressTypes       as projection on common.AddressTypes;

    @readonly
    entity Currencies         as projection on sap.common.Currencies;

    @restrict: [
        { grant: '*',    to: 'ADMIN' },
        { grant: 'READ', to: 'authenticated-user' }
    ]
    entity Destinations       as projection on db.Destinations;
}
