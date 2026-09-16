namespace anubhav.claude;

using { cuid, managed, Currency }  from '@sap/cds/common';
using {
    anubhav.claude.AddressTypes,
    anubhav.claude.TravellerStatus,
    anubhav.claude.TravellerTypes,
    anubhav.claude.Roles
} from './common';

// ─── Destinations ─────────────────────────────────────────────────────────────

entity Destinations : cuid {
    @mandatory
    @title: '{i18n>DestinationName}'
    name        : String(200);
    @mandatory
    @title: '{i18n>Country}'
    country     : String(100);
    @mandatory
    @title: '{i18n>City}'
    city        : String(100);
    @title: '{i18n>Region}'
    region      : String(100);
    @title: '{i18n>Description}'
    description : LargeString;
}

// ─── Travellers ───────────────────────────────────────────────────────────────

entity Travellers : cuid, managed {
    @mandatory
    @title: '{i18n>FirstName}'
    firstName   : String(80);
    @mandatory
    @title: '{i18n>LastName}'
    lastName    : String(80);
    @Core.Computed
    @title: '{i18n>FullName}'
    virtual fullName : String(160);
    @mandatory
    @title: '{i18n>Email}'
    email       : String(120);
    @title: '{i18n>Phone}'
    phone       : String(20);
    @title: '{i18n>AddressType}'
    addressType : Association to AddressTypes;
    @mandatory
    @title: '{i18n>TravellerType}'
    type        : Association to TravellerTypes;
    @mandatory
    @title: '{i18n>Status}'
    status      : Association to TravellerStatus default 'A';
    @mandatory
    @title: '{i18n>UserID}'
    userID      : String(100);
    @title: '{i18n>Locations}'
    locations   : Composition of many TravelledLocations on locations.traveller = $self;
    @title: '{i18n>Addresses}'
    addresses   : Composition of many Addresses on addresses.traveller = $self;
}

annotate Travellers with {
    modifiedAt @odata.etag;
}

// ─── TravelledLocations ───────────────────────────────────────────────────────

entity TravelledLocations : cuid {
    @title: '{i18n>Traveller}'
    traveller   : Association to Travellers;
    @title: '{i18n>Destination}'
    destination : Association to Destinations;
    @mandatory
    @title: '{i18n>TravelFrom}'
    travelFrom  : Date;
    @mandatory
    @title: '{i18n>TravelTo}'
    travelTo    : Date;
    @title: '{i18n>Cost}'
    @Measures.ISOCurrency: currency.code
    cost        : Decimal(15, 2);
    @title: '{i18n>Currency}'
    currency    : Currency;
    @title: '{i18n>Notes}'
    notes       : LargeString;
}

// ─── Addresses ────────────────────────────────────────────────────────────────

entity Addresses : cuid {
    @title: '{i18n>Traveller}'
    traveller   : Association to Travellers;
    @title: '{i18n>AddressType}'
    addressType : Association to AddressTypes;
    @mandatory
    @title: '{i18n>Street}'
    street      : String(120);
    @mandatory
    @title: '{i18n>City}'
    city        : String(100);
    @title: '{i18n>PostalCode}'
    postalCode  : String(20);
    @title: '{i18n>Country}'
    country     : String(100);
    @title: '{i18n>IsPrimary}'
    isPrimary   : Boolean default false;
}

// ─── Users ────────────────────────────────────────────────────────────────────

entity Users : cuid {
    @mandatory
    @title: '{i18n>LoginName}'
    loginName : String(120);
    @mandatory
    @title: '{i18n>FirstName}'
    firstName : String(80);
    @mandatory
    @title: '{i18n>LastName}'
    lastName  : String(80);
    @title: '{i18n>IsLocked}'
    isLocked  : Boolean default false;
    @cds.on.insert: $now
    @title: '{i18n>CreatedAt}'
    createdAt : Timestamp;
    @title: '{i18n>UserRoles}'
    roles     : Composition of many UserRoles on roles.user = $self;
}

// ─── UserRoles ────────────────────────────────────────────────────────────────

entity UserRoles : cuid {
    @title: '{i18n>User}'
    user : Association to Users;
    @title: '{i18n>Role}'
    role : Association to Roles;
}
