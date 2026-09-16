# View Template

Every new view in TravelHub follows this exact shape. Copy it, then fill in the `<!-- CONTENT -->` region only.

## File: `webapp/view/<Name>.view.xml`

```xml
<mvc:View
    controllerName="travelhub.controller.<Name>"
    xmlns:mvc="sap.ui.core.mvc"
    xmlns:core="sap.ui.core"
    xmlns="sap.m"
    xmlns:l="sap.ui.layout"
    displayBlock="true">

    <Page id="page<Name>" showHeader="false">
        <content>

            <!-- Anubhav Trainings branding header — reused across every page. -->
            <core:Fragment fragmentName="travelhub.fragment.Header" type="XML"/>

            <!-- CONTENT: place the screen's controls below. -->
            <!-- Rules:                                                       -->
            <!--   - sap.m / sap.ui.layout / sap.ui.table / sap.viz only      -->
            <!--   - NO sap.ui.webc.* controls                                -->
            <!--   - NO custom Control.extend(...) controls                   -->
            <!--   - Any region > ~30 lines should be a fragment             -->
            <VBox class="sapUiMediumMargin">

                <Title text="<Screen Title>" level="H2" class="sapUiSmallMarginBottom"/>

                <!-- Example: a fragment for the main content region. -->
                <core:Fragment fragmentName="travelhub.fragment.<Name>Main" type="XML"/>

                <!-- Example: single Save button if the screen is editable. -->
                <HBox justifyContent="End" class="sapUiSmallMarginTop">
                    <Button
                        id="btnSave<Name>"
                        text="Save"
                        type="Emphasized"
                        press=".onSave"/>
                </HBox>

            </VBox>

        </content>
    </Page>

</mvc:View>
```

## Notes

- **The Header fragment is mandatory.** It carries the Anubhav Trainings logo + title + logout button. Do not inline a `Bar` or `Toolbar` to replicate it.
- **`controllerName` must be exactly `travelhub.controller.<Name>`** — matches the file under `webapp/controller/`.
- **`displayBlock="true"`** is set so the view fills the shell properly.
- **Margins:** use `sapUiMediumMargin` on the outer `VBox` and `sapUiSmallMarginTop` / `sapUiSmallMarginBottom` between sections. Don't invent CSS.
- **No inline formatters** beyond trivial expression binding like `visible="{= ${userModel>/role} === 'ADMIN' }"`. Anything more complex goes into the controller.
