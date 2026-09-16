sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'managedest/test/integration/FirstJourney',
		'managedest/test/integration/pages/DestinationsList',
		'managedest/test/integration/pages/DestinationsObjectPage'
    ],
    function(JourneyRunner, opaJourney, DestinationsList, DestinationsObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('managedest') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheDestinationsList: DestinationsList,
					onTheDestinationsObjectPage: DestinationsObjectPage
                }
            },
            opaJourney.run
        );
    }
);