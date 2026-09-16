/**
 * AuthStub.js
 *
 * Intercepts the auth endpoints and OData endpoints used during the
 * TravelledLocations OPA5 journey so the tests run without a live backend.
 *
 * Endpoints stubbed:
 *   POST /odata/v4/auth/login  → returns dummy access + refresh tokens
 *   GET  /odata/v4/auth/me     → returns a traveller user object
 *   POST /odata/v4/auth/refresh → returns new tokens
 *   GET  /odata/v4/catalog/$metadata → returns minimal OData metadata XML
 *   GET  /odata/v4/user-management/$metadata → returns minimal metadata XML
 *   GET  /odata/v4/catalog/Travellers... → returns one traveller row
 *   GET  /odata/v4/catalog/TravelledLocations... → returns location list
 *   GET  /odata/v4/catalog/TravelledLocations(id)... → returns single location
 *   GET  /odata/v4/catalog/Destinations → returns destination list
 *   GET  /odata/v4/catalog/Currencies → returns currency list
 *
 * Strategy: sinon.useFakeXMLHttpRequest() with useFilters + addFilter
 * ─────────────────────────────────────────────────────────────────────
 * Unlike sinon.fakeServer (which intercepts ALL XHR indiscriminately),
 * this approach uses sinon's filter API to ONLY intercept requests to our
 * API namespaces (/odata/v4/auth, /odata/v4/catalog, /odata/v4/user-management).
 * All other requests (SAPUI5 resources, manifest.json, i18n, CSS, views) are
 * allowed through to the real network, which is our localhost static server.
 *
 * Usage:
 *   AuthStub.init();   // called before OPA5 tests start
 *   AuthStub.restore(); // called after all tests finish (QUnit.done)
 */
sap.ui.define([
    "sap/ui/thirdparty/sinon"
], function (sinon) {
    "use strict";

    // ── Canned response data ────────────────────────────────────────────────

    // A fake but structurally valid JWT (header.payload.signature, not verified by client)
    // Payload: { "sub": "u1", "exp": 9999999999 }
    var FAKE_ACCESS_TOKEN =
        "eyJhbGciOiJIUzI1NiJ9" +
        ".eyJzdWIiOiJ1MSIsImV4cCI6OTk5OTk5OTk5OX0" +
        ".FAKE_SIGNATURE";

    var FAKE_REFRESH_TOKEN = "fake-refresh-token-value";

    var LOGIN_RESPONSE = {
        access: FAKE_ACCESS_TOKEN,
        refresh: FAKE_REFRESH_TOKEN,
        expiresIn: 900
    };

    var ME_RESPONSE = {
        id: "u1",
        loginName: "raj.sharma@example.com",
        firstName: "Raj",
        lastName: "Sharma",
        roles: ["TRAVELLER"]
    };

    // The single TravelledLocation row that tests will interact with.
    var LOCATION_ID = "loc-1111-2222-3333-4444";

    var LOCATION_ROW = {
        ID: LOCATION_ID,
        destination_ID: "dest-aaaa",
        travelFrom: "2024-03-10",
        travelTo: "2024-03-20",
        notes: "Test trip to Paris",
        cost: "1250.00",
        currency_code: "EUR",
        destination: {
            ID: "dest-aaaa",
            name: "Paris",
            city: "Paris",
            country: "France"
        }
    };

    var TRAVELLERS_RESPONSE = {
        "@odata.context": "$metadata#Travellers",
        value: [
            {
                ID: "trav-9999",
                firstName: "Raj",
                lastName: "Sharma",
                email: "raj.sharma@example.com",
                phone: "+91-9876543210",
                addressType_code: "H",
                addressType: { code: "H", name: "Home" },
                locations: [LOCATION_ROW]
            }
        ]
    };

    var LOCATIONS_LIST_RESPONSE = {
        "@odata.context": "$metadata#TravelledLocations",
        value: [LOCATION_ROW]
    };

    // The @odata.context for a single entity with $select and $expand must list the
    // selected properties and expanded navigations so the OData V4 model (with
    // autoExpandSelect: true) can match the cache entry and hydrate bound controls.
    // Format: $metadata#EntitySet(prop1,prop2,...,navProp(p1,p2,...))/$entity
    var LOCATION_DETAIL_RESPONSE = Object.assign({}, LOCATION_ROW, {
        "@odata.context": "$metadata#TravelledLocations(ID,cost,currency_code,notes,travelFrom,travelTo,destination(ID,city,country,name),currency(code,name))/$entity",
        currency: { code: "EUR", name: "Euro" }
    });

    var DESTINATIONS_RESPONSE = {
        "@odata.context": "$metadata#Destinations",
        value: [
            { ID: "dest-aaaa", name: "Paris", city: "Paris", country: "France" }
        ]
    };

    var CURRENCIES_RESPONSE = {
        "@odata.context": "$metadata#Currencies",
        value: [
            { code: "EUR", name: "Euro" },
            { code: "USD", name: "US Dollar" },
            { code: "INR", name: "Indian Rupee" }
        ]
    };

    var ADDRESS_TYPES_RESPONSE = {
        "@odata.context": "$metadata#AddressTypes",
        value: [
            { code: "H", name: "Home" },
            { code: "W", name: "Work" },
            { code: "P", name: "Permanent" }
        ]
    };

    // Empty addresses list — Traveller has no addresses in the test data
    var ADDRESSES_RESPONSE = {
        "@odata.context": "$metadata#Addresses",
        value: []
    };

    // OData $metadata for the catalog service (minimal — enough for model init)
    var ODATA_METADATA_XML =
        '<?xml version="1.0" encoding="utf-8"?>' +
        '<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">' +
        '  <edmx:DataServices>' +
        '    <Schema Namespace="CatalogService" xmlns="http://docs.oasis-open.org/odata/ns/edm">' +
        '      <EntityType Name="Travellers"><Key><PropertyRef Name="ID"/></Key>' +
        '        <Property Name="ID" Type="Edm.Guid" Nullable="false"/>' +
        '        <Property Name="firstName" Type="Edm.String"/>' +
        '        <Property Name="lastName" Type="Edm.String"/>' +
        '        <Property Name="email" Type="Edm.String"/>' +
        '        <Property Name="phone" Type="Edm.String"/>' +
        '        <Property Name="addressType_code" Type="Edm.String"/>' +
        '        <NavigationProperty Name="addressType" Type="CatalogService.AddressTypes"/>' +
        '        <NavigationProperty Name="locations" Type="Collection(CatalogService.TravelledLocations)"/>' +
        '        <NavigationProperty Name="addresses" Type="Collection(CatalogService.Addresses)"/>' +
        '      </EntityType>' +
        '      <EntityType Name="Addresses"><Key><PropertyRef Name="ID"/></Key>' +
        '        <Property Name="ID" Type="Edm.Guid" Nullable="false"/>' +
        '        <Property Name="addressType_code" Type="Edm.String"/>' +
        '        <Property Name="street" Type="Edm.String"/>' +
        '        <Property Name="city" Type="Edm.String"/>' +
        '        <Property Name="postalCode" Type="Edm.String"/>' +
        '        <Property Name="country" Type="Edm.String"/>' +
        '        <Property Name="isPrimary" Type="Edm.Boolean"/>' +
        '        <NavigationProperty Name="addressType" Type="CatalogService.AddressTypes"/>' +
        '      </EntityType>' +
        '      <EntityType Name="TravelledLocations"><Key><PropertyRef Name="ID"/></Key>' +
        '        <Property Name="ID" Type="Edm.Guid" Nullable="false"/>' +
        '        <Property Name="destination_ID" Type="Edm.Guid"/>' +
        '        <Property Name="travelFrom" Type="Edm.Date"/>' +
        '        <Property Name="travelTo" Type="Edm.Date"/>' +
        '        <Property Name="notes" Type="Edm.String"/>' +
        '        <Property Name="cost" Type="Edm.Decimal"/>' +
        '        <Property Name="currency_code" Type="Edm.String"/>' +
        '        <NavigationProperty Name="destination" Type="CatalogService.Destinations"/>' +
        '        <NavigationProperty Name="currency" Type="CatalogService.Currencies"/>' +
        '      </EntityType>' +
        '      <EntityType Name="Destinations"><Key><PropertyRef Name="ID"/></Key>' +
        '        <Property Name="ID" Type="Edm.Guid" Nullable="false"/>' +
        '        <Property Name="name" Type="Edm.String"/>' +
        '        <Property Name="city" Type="Edm.String"/>' +
        '        <Property Name="country" Type="Edm.String"/>' +
        '      </EntityType>' +
        '      <EntityType Name="Currencies"><Key><PropertyRef Name="code"/></Key>' +
        '        <Property Name="code" Type="Edm.String" Nullable="false"/>' +
        '        <Property Name="name" Type="Edm.String"/>' +
        '      </EntityType>' +
        '      <EntityType Name="AddressTypes"><Key><PropertyRef Name="code"/></Key>' +
        '        <Property Name="code" Type="Edm.String" Nullable="false"/>' +
        '        <Property Name="name" Type="Edm.String"/>' +
        '      </EntityType>' +
        '      <EntityContainer Name="CatalogService">' +
        '        <EntitySet Name="Travellers" EntityType="CatalogService.Travellers"/>' +
        '        <EntitySet Name="TravelledLocations" EntityType="CatalogService.TravelledLocations"/>' +
        '        <EntitySet Name="Destinations" EntityType="CatalogService.Destinations"/>' +
        '        <EntitySet Name="Currencies" EntityType="CatalogService.Currencies"/>' +
        '        <EntitySet Name="AddressTypes" EntityType="CatalogService.AddressTypes"/>' +
        '        <EntitySet Name="Addresses" EntityType="CatalogService.Addresses"/>' +
        '      </EntityContainer>' +
        '    </Schema>' +
        '  </edmx:DataServices>' +
        '</edmx:Edmx>';

    var USERMGMT_METADATA_XML =
        '<?xml version="1.0" encoding="utf-8"?>' +
        '<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">' +
        '  <edmx:DataServices>' +
        '    <Schema Namespace="UserManagementService" xmlns="http://docs.oasis-open.org/odata/ns/edm">' +
        '      <EntityType Name="AppUsers"><Key><PropertyRef Name="ID"/></Key>' +
        '        <Property Name="ID" Type="Edm.Guid" Nullable="false"/>' +
        '        <Property Name="loginName" Type="Edm.String"/>' +
        '      </EntityType>' +
        '      <EntityContainer Name="UserManagementService">' +
        '        <EntitySet Name="AppUsers" EntityType="UserManagementService.AppUsers"/>' +
        '      </EntityContainer>' +
        '    </Schema>' +
        '  </edmx:DataServices>' +
        '</edmx:Edmx>';

    // ── Helpers ────────────────────────────────────────────────────────────

    function respondJson(oReq, oBody) {
        oReq.respond(
            200,
            { "Content-Type": "application/json; charset=utf-8" },
            JSON.stringify(oBody)
        );
    }

    function respondXml(oReq, sXml) {
        oReq.respond(
            200,
            { "Content-Type": "application/xml; charset=utf-8" },
            sXml
        );
    }

    /**
     * Returns true if the URL is one of our API calls that should be intercepted.
     * Returns false for all other URLs (static files, manifest.json, i18n, etc.)
     * which should pass through to the real network.
     */
    function isApiUrl(sUrl) {
        return /\/odata\/v4\/(auth|catalog|user-management)/.test(sUrl);
    }

    /**
     * Given a partial OData path (e.g. "Travellers?$expand=addressType"), returns
     * the canned JSON response body as a string, or null if unrecognised.
     */
    function getResponseBodyForPath(sMethod, sPath) {
        // sPath is the URL after /odata/v4/catalog/ (relative path inside the batch part)
        // Diagnostic: log all dispatched paths
        console.log("[AuthStub:getResponseBodyForPath] " + sMethod + " " + sPath.substring(0, 200));

        // TravelledLocations single entity — check BEFORE list
        if (sMethod === "GET" && sPath.indexOf("TravelledLocations(") > -1) {
            return JSON.stringify(LOCATION_DETAIL_RESPONSE);
        }
        // Travellers navigation property (locations)
        if (sMethod === "GET" && sPath.indexOf("Travellers") > -1 && sPath.indexOf("/locations") > -1) {
            return JSON.stringify(LOCATIONS_LIST_RESPONSE);
        }
        // Travellers list or single entity
        if (sMethod === "GET" && /Travellers/.test(sPath)) {
            return JSON.stringify(TRAVELLERS_RESPONSE);
        }
        // TravelledLocations list
        if (sMethod === "GET" && /TravelledLocations/.test(sPath)) {
            return JSON.stringify(LOCATIONS_LIST_RESPONSE);
        }
        if (sMethod === "GET" && /Destinations/.test(sPath)) {
            return JSON.stringify(DESTINATIONS_RESPONSE);
        }
        if (sMethod === "GET" && /Currencies/.test(sPath)) {
            return JSON.stringify(CURRENCIES_RESPONSE);
        }
        if (sMethod === "GET" && /AddressTypes/.test(sPath)) {
            return JSON.stringify(ADDRESS_TYPES_RESPONSE);
        }
        if (sMethod === "GET" && /Addresses/.test(sPath)) {
            return JSON.stringify(ADDRESSES_RESPONSE);
        }
        return null;
    }

    /**
     * Handles an OData V4 $batch request.
     *
     * OData V4 $batch uses multipart/mixed format. Each part is an HTTP request.
     * We parse each part, dispatch to getResponseBodyForPath, and assemble a
     * multipart batch response.
     *
     * Format of request body:
     *   --<boundary>
     *   Content-Type: application/http
     *   Content-Transfer-Encoding: binary
     *
     *   GET Travellers?$expand=addressType HTTP/1.1
     *   <optional request headers>
     *
     *   --<boundary>
     *   ...
     *   --<boundary>--
     */
    function handleBatchRequest(oReq) {
        // Extract boundary from Content-Type header.
        // sinon stores request headers with the exact case used by the caller.
        // OData V4 model sends: "Content-Type: multipart/mixed;boundary=id-..."
        // We must check all possible casings.
        var sContentType = "";
        var oHeaders = oReq.requestHeaders || {};
        Object.keys(oHeaders).forEach(function(k) {
            if (k.toLowerCase() === "content-type") {
                sContentType = oHeaders[k] || "";
            }
        });

        // Also try the requestBody to find boundary as a fallback
        var sBoundaryMatch = sContentType.match(/boundary=["']?([^\s;"']+)["']?/);
        var sBoundary = sBoundaryMatch ? sBoundaryMatch[1] : null;

        if (!sBoundary) {
            // Try extracting from the body itself (first line should start with --)
            var sBodyStart = (oReq.requestBody || "").substring(0, 200);
            var sBodyBound = sBodyStart.match(/^--([^\r\n]+)/m);
            sBoundary = sBodyBound ? sBodyBound[1] : null;
        }

        if (!sBoundary) {
            oReq.respond(400, { "Content-Type": "application/json" },
                JSON.stringify({ error: { message: "AuthStub: $batch request has no boundary. Content-Type was: " + sContentType } }));
            return;
        }

        var sBody = oReq.requestBody || "";
        // Split on --boundary (each part starts with --boundary)
        var sParts = sBody.split("--" + sBoundary);
        var aResponseParts = [];
        var sResponseBoundary = "batchresponse_" + Date.now();

        // sParts[0] is empty preamble, sParts[last] is "--" (epilogue)
        for (var i = 1; i < sParts.length - 1; i++) {
            var sPart = sParts[i];
            // Skip empty parts
            if (!sPart || sPart.trim() === "--") { continue; }

            // Find the HTTP request line inside this part
            // Part format:
            //   \r\nContent-Type: application/http\r\n...
            //   \r\n
            //   METHOD path HTTP/1.1\r\n
            //   headers...
            //   \r\n
            //   body (for POST/PATCH/PUT)

            // Find the blank line separating part headers from HTTP request
            var iHttpStart = sPart.indexOf("\r\n\r\n");
            if (iHttpStart === -1) {
                iHttpStart = sPart.indexOf("\n\n");
            }
            var sHttpContent = iHttpStart > -1 ? sPart.substring(iHttpStart + 4) : sPart;
            if (sHttpContent.startsWith("\n")) { sHttpContent = sHttpContent.substring(1); }

            // First line of sHttpContent is the request line: "METHOD path HTTP/1.1"
            var sFirstLine = sHttpContent.split(/\r?\n/)[0].trim();
            var aRequestLine = sFirstLine.split(" ");
            var sSubMethod = aRequestLine[0];
            var sSubPath   = aRequestLine[1] || "";

            // sSubPath may be relative (just the path) or absolute
            // OData V4 batch uses relative paths like "Travellers?$expand=..."
            var sResponseBody = getResponseBodyForPath(sSubMethod, sSubPath);
            var sStatus, sStatusText;

            if (sResponseBody !== null) {
                sStatus = "200"; sStatusText = "OK";
            } else {
                sStatus = "404"; sStatusText = "Not Found";
                sResponseBody = JSON.stringify({
                    error: { message: "AuthStub: no batch handler for " + sSubMethod + " " + sSubPath }
                });
            }

            // Build the response part
            aResponseParts.push(
                "--" + sResponseBoundary + "\r\n" +
                "Content-Type: application/http\r\n" +
                "Content-Transfer-Encoding: binary\r\n" +
                "\r\n" +
                "HTTP/1.1 " + sStatus + " " + sStatusText + "\r\n" +
                "Content-Type: application/json; charset=utf-8\r\n" +
                "OData-Version: 4.0\r\n" +
                "\r\n" +
                sResponseBody + "\r\n"
            );
        }

        var sFullResponse = aResponseParts.join("") + "--" + sResponseBoundary + "--\r\n";
        oReq.respond(200,
            {
                "Content-Type": "multipart/mixed; boundary=" + sResponseBoundary,
                "OData-Version": "4.0"
            },
            sFullResponse
        );
    }

    /**
     * Dispatches a fake XHR request to the appropriate handler.
     * Returns true if the request was handled, false otherwise.
     */
    function handleRequest(oReq) {
        var sMethod = oReq.method;
        var sUrl    = oReq.url;

        // ── OData $batch ──────────────────────────────────────────────────
        if (sMethod === "POST" && /\/odata\/v4\/catalog\/\$batch/.test(sUrl)) {
            handleBatchRequest(oReq);
            return true;
        }
        if (sMethod === "POST" && /\/odata\/v4\/user-management\/\$batch/.test(sUrl)) {
            handleBatchRequest(oReq);
            return true;
        }

        // ── OData $metadata ──────────────────────────────────────────────
        if (sMethod === "GET" && /\/odata\/v4\/catalog\/\$metadata/.test(sUrl)) {
            respondXml(oReq, ODATA_METADATA_XML);
            return true;
        }
        if (sMethod === "GET" && /\/odata\/v4\/user-management\/\$metadata/.test(sUrl)) {
            respondXml(oReq, USERMGMT_METADATA_XML);
            return true;
        }

        // ── Auth endpoints ────────────────────────────────────────────────
        if (sMethod === "POST" && /\/odata\/v4\/auth\/login/.test(sUrl)) {
            respondJson(oReq, LOGIN_RESPONSE);
            return true;
        }
        if (sMethod === "GET" && /\/odata\/v4\/auth\/me/.test(sUrl)) {
            respondJson(oReq, ME_RESPONSE);
            return true;
        }
        if (sMethod === "POST" && /\/odata\/v4\/auth\/refresh/.test(sUrl)) {
            respondJson(oReq, LOGIN_RESPONSE);
            return true;
        }

        // ── TravelledLocations single entity (must be checked before list) ──
        if (sMethod === "GET" &&
            (new RegExp("/odata/v4/catalog/TravelledLocations\\('" + LOCATION_ID + "'\\)")).test(sUrl)) {
            respondJson(oReq, LOCATION_DETAIL_RESPONSE);
            return true;
        }
        if (sMethod === "GET" &&
            (new RegExp("/odata/v4/catalog/TravelledLocations\\(" + LOCATION_ID + "\\)")).test(sUrl)) {
            respondJson(oReq, LOCATION_DETAIL_RESPONSE);
            return true;
        }

        // ── Travellers list (also handles /Travellers('id')/locations navigation) ──
        if (sMethod === "GET" && /\/odata\/v4\/catalog\/Travellers/.test(sUrl)) {
            if (sUrl.indexOf("/locations") > -1) {
                respondJson(oReq, LOCATIONS_LIST_RESPONSE);
            } else {
                respondJson(oReq, TRAVELLERS_RESPONSE);
            }
            return true;
        }

        // ── TravelledLocations list ───────────────────────────────────────
        if (sMethod === "GET" && /\/odata\/v4\/catalog\/TravelledLocations/.test(sUrl)) {
            respondJson(oReq, LOCATIONS_LIST_RESPONSE);
            return true;
        }

        // ── Destinations ──────────────────────────────────────────────────
        if (sMethod === "GET" && /\/odata\/v4\/catalog\/Destinations/.test(sUrl)) {
            respondJson(oReq, DESTINATIONS_RESPONSE);
            return true;
        }

        // ── Currencies ────────────────────────────────────────────────────
        if (sMethod === "GET" && /\/odata\/v4\/catalog\/Currencies/.test(sUrl)) {
            respondJson(oReq, CURRENCIES_RESPONSE);
            return true;
        }

        // ── AddressTypes ──────────────────────────────────────────────────
        if (sMethod === "GET" && /\/odata\/v4\/catalog\/AddressTypes/.test(sUrl)) {
            respondJson(oReq, ADDRESS_TYPES_RESPONSE);
            return true;
        }

        // ── Addresses (navigation property) ──────────────────────────────
        if (sMethod === "GET" && /\/odata\/v4\/catalog\/.*\/addresses/.test(sUrl)) {
            respondJson(oReq, ADDRESSES_RESPONSE);
            return true;
        }

        // Unhandled API call — return 404 so the app gets a clear error
        oReq.respond(404, { "Content-Type": "application/json" },
            JSON.stringify({ error: { message: "AuthStub: no handler for " + sMethod + " " + sUrl } }));
        return false;
    }

    // ── State ────────────────────────────────────────────────────────────────

    var _oFakeXhr = null;   // sinon.useFakeXMLHttpRequest() handle
    var _aRequests = [];    // queue of pending fake XHR requests

    return {

        /**
         * Returns the stub location ID so journeys can reference it without
         * knowing this module's internals.
         */
        getLocationId: function () {
            return LOCATION_ID;
        },

        /**
         * Returns a copy of the stub location row for data comparison assertions.
         */
        getLocationRow: function () {
            return Object.assign({}, LOCATION_ROW, {
                destination: Object.assign({}, LOCATION_ROW.destination)
            });
        },

        /**
         * Installs the sinon fake XHR interceptor.
         *
         * Strategy: sinon.useFakeXMLHttpRequest() with useFilters = true
         *   - useFilters = true enables the addFilter mechanism
         *   - addFilter(fn) returns true (don't intercept) for non-API URLs
         *   - The onCreate callback processes each intercepted request
         *   - Requests are responded to immediately (synchronous-style) in onCreate
         *
         * This approach lets manifest.json, i18n files, CSS, and SAPUI5 resources
         * flow through to the real static server unmolested.
         */
        init: function () {
            _aRequests = [];

            // Install the fake XHR
            _oFakeXhr = sinon.useFakeXMLHttpRequest();

            // Enable filter-based pass-through
            _oFakeXhr.useFilters = true;

            // Filter function: return true (pass through) for non-API URLs.
            // sinon calls this BEFORE creating a fake request — if it returns true,
            // the real XHR is used instead of the fake one.
            _oFakeXhr.addFilter(function (sMethod, sUrl) {
                // true = pass through (don't intercept)
                // false = intercept with the fake XHR
                return !isApiUrl(sUrl);
            });

            // Handle intercepted (API) requests immediately when they are created.
            _oFakeXhr.onCreate = function (oReq) {
                _aRequests.push(oReq);
                // Use a short timeout so the request open/send sequence completes
                // before we respond. This matches sinon.fakeServer autoRespondAfter behavior.
                setTimeout(function () {
                    if (oReq.readyState !== 4) { // not already responded
                        handleRequest(oReq);
                    }
                }, 15);
            };
        },

        /**
         * Restores native XHR and removes all stubs.
         * Call this in QUnit.done or after the last test module.
         */
        restore: function () {
            if (_oFakeXhr) {
                _oFakeXhr.restore();
                _oFakeXhr = null;
            }
            _aRequests = [];
        }
    };
});
