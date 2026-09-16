using PublicService as service from '../../srv/public-service';

annotate service.Destinations with @(

    // Object-page header shown when a row is drilled into.
    UI.HeaderInfo      : {
        $Type          : 'UI.HeaderInfoType',
        TypeName       : 'Destination',
        TypeNamePlural : 'Destinations',
        Title          : {
            $Type : 'UI.DataField',
            Value : name
        },
        Description    : {
            $Type : 'UI.DataField',
            Value : country
        }
    },

    // Filter bar fields on the list report.
    UI.SelectionFields : [
        country,
        name,
        city
    ],

    // Table columns — every field except the technical ID.
    UI.LineItem        : [
        { $Type : 'UI.DataField', Value : name,        ![@UI.Importance] : #High },
        { $Type : 'UI.DataField', Value : country,     ![@UI.Importance] : #High },
        { $Type : 'UI.DataField', Value : city,        ![@UI.Importance] : #High },
        { $Type : 'UI.DataField', Value : region,      ![@UI.Importance] : #Medium },
        { $Type : 'UI.DataField', Value : description, ![@UI.Importance] : #Low }
    ],

    // Fields grouped on the object page for the drill-down detail.
    UI.FieldGroup #GeneralInfo : {
        $Type : 'UI.FieldGroupType',
        Data  : [
            { $Type : 'UI.DataField', Value : name },
            { $Type : 'UI.DataField', Value : country },
            { $Type : 'UI.DataField', Value : city },
            { $Type : 'UI.DataField', Value : region },
            { $Type : 'UI.DataField', Value : description }
        ]
    },

    UI.Facets          : [{
        $Type  : 'UI.ReferenceFacet',
        ID     : 'GeneralInfoFacet',
        Label  : 'General Information',
        Target : '@UI.FieldGroup#GeneralInfo'
    }]
);
