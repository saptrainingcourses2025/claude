// ─────────────────────────────────────────────────────────────────────────────
// common.cds — Reusable code lists and type definitions
// Namespace: anubhav.claude
// Single source of truth for shared artifacts used across the data model.
// ─────────────────────────────────────────────────────────────────────────────

namespace anubhav.claude;

using { sap } from '@sap/cds/common';

// ─── Code List Entities ───────────────────────────────────────────────────────

entity AddressTypes : sap.common.CodeList {
    @title: '{i18n>AddressTypeCode}'
    key code : String(1); // H=Home, O=Office, P=Permanent, T=Temporary
}

entity TravellerStatus : sap.common.CodeList {
    @title: '{i18n>TravellerStatusCode}'
    key code : String(1); // A=Active, I=Inactive, S=Suspended
}

entity Roles : sap.common.CodeList {
    @title: '{i18n>RoleCode}'
    key code : String(10); // ADMIN, TRAVELLER, AGENT
}

entity TravellerTypes : sap.common.CodeList {
    @title: '{i18n>TravellerTypeCode}'
    key code : String(10); // FF=Frequent Flyer, EX=Executive, ST=Standard
}

// ─── Type Definitions ─────────────────────────────────────────────────────────

type AddressType   : Association to AddressTypes;
type Status        : Association to TravellerStatus;
type Role          : Association to Roles;
type TravellerType : Association to TravellerTypes;
