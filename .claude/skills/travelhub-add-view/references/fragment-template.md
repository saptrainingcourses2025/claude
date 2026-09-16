# Fragment Template

Use fragments for any view region that:
- Could be reused elsewhere (tables, address forms, branding header)
- Is a popup/dialog (registration, edit dialog, confirmation)
- Exceeds ~30 lines of XML inside a view (extract it for readability)

## File location & naming

- Place under `webapp/fragment/`.
- Name in PascalCase + `.fragment.xml`, e.g. `RegisterDialog.fragment.xml`, `AddressesTab.fragment.xml`.
- Fragment `id`-prefix child controls so two fragments on the same view don't collide.

## Inline (content) fragment

For a region embedded in a view:

```xml
<core:FragmentDefinition
    xmlns="sap.m"
    xmlns:core="sap.ui.core"
    xmlns:l="sap.ui.layout">

    <!-- Example: a simple table fragment. The list binding path -->
    <!-- must reference an entity set from cat-service.cds.       -->
    <Table id="tblExample" items="{/<EntitySetName>}">
        <columns>
            <Column><Text text="Column A"/></Column>
            <Column><Text text="Column B"/></Column>
        </columns>
        <items>
            <ColumnListItem>
                <cells>
                    <Text text="{fieldA}"/>
                    <Text text="{fieldB}"/>
                </cells>
            </ColumnListItem>
        </items>
    </Table>

</core:FragmentDefinition>
```

Include from a view with:

```xml
<core:Fragment fragmentName="travelhub.fragment.<Name>" type="XML"/>
```

## Dialog fragment

For popups (Register dialog, edit/create row, confirmation):

```xml
<core:FragmentDefinition
    xmlns="sap.m"
    xmlns:core="sap.ui.core">

    <Dialog
        id="dlgExample"
        title="<Dialog Title>"
        contentWidth="420px">

        <content>
            <VBox class="sapUiSmallMargin">
                <Label text="Field A"/>
                <Input value="{view>/draft/fieldA}"/>
                <Label text="Field B"/>
                <Input value="{view>/draft/fieldB}"/>
            </VBox>
        </content>

        <beginButton>
            <Button text="Submit" type="Emphasized" press=".onDialogSubmit"/>
        </beginButton>
        <endButton>
            <Button text="Cancel" press=".onDialogCancel"/>
        </endButton>

    </Dialog>

</core:FragmentDefinition>
```

Open/close from the controller:

```javascript
// Cache fragment instance so we don't reload XML on every open.
_openDialog: function (sFragmentName) {
    var that = this;
    if (!this._oDialogs) { this._oDialogs = {}; }
    if (this._oDialogs[sFragmentName]) {
        this._oDialogs[sFragmentName].open();
        return;
    }
    sap.ui.core.Fragment.load({
        name: "travelhub.fragment." + sFragmentName,
        controller: this
    }).then(function (oDialog) {
        that._oDialogs[sFragmentName] = oDialog;
        that.getView().addDependent(oDialog);
        oDialog.open();
    });
},

onDialogSubmit: function () {
    // OData V4: POST /catalog/<EntitySet> — create from dialog inputs.
    // ... use list binding's create() so it joins the batch group ...
    this._oDialogs["<Name>"].close();
},

onDialogCancel: function () {
    this._oDialogs["<Name>"].close();
}
```

## The mandatory Header fragment

`webapp/fragment/Header.fragment.xml` already exists in the project. Every new view MUST include it. Do not edit it casually — it's reused by every page.

For reference, this is roughly what it contains:

```xml
<core:FragmentDefinition xmlns="sap.m" xmlns:core="sap.ui.core">
    <Bar design="Header">
        <contentLeft>
            <Image
                src="https://s2.coinmarketcap.com/static/img/coins/200x200/37581.png"
                width="2.5rem"
                height="2.5rem"/>
            <Title text="Anubhav Trainings — TravelHub" level="H2"/>
        </contentLeft>
        <contentRight>
            <Button
                icon="sap-icon://log"
                text="Logout"
                press=".onLogout"
                visible="{= ${userModel>/loginName} !== undefined }"/>
        </contentRight>
    </Bar>
</core:FragmentDefinition>
```

`onLogout` lives on `BaseController` — every controller inherits it, so the button works on every page automatically.
