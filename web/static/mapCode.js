// Global Variables

// Variable to store the map
// use it in initMap, getRoute and toggleDisplaymarkers functions.
let map;

// variable to cluster the markers
// use it in initMap and toggleDisplaymarkers functions.
var markerCluster;

// List of marker objects
// use it in initMap and toggleDisplaymarkers functions.
var markers;

// List where the user choices are stored
// use it in updatePopup, getRoute, addUserChoices functions
var userChoices = [];

// Store variables for the user input
var userStartPlace = "invalid";
var userEndPlace = "invalid";

// Variable that displays the route on the map
// Needs to be global in order to reset the route when the user requests a new route
var directionsRenderer;

var isDataAvailable = false;

// Function to display a map of Dublin on the homepage
function initMap() { 

    // variable to keep track of the currently open popup
    var currentlyOpenPopup;

    // variable to store maps styles
    var myStyles =[
        {
            featureType: "poi",
            elementType: "labels",
            stylers: [
                  { visibility: "off" }
            ]
        }
    ];

    // Gets static station information to display on the map
    var jqxhr = $.getJSON("/station_info", function(data){
        console.log("success", data);
        var stationInfo = data;

        // specifies the lat and lng of the city center
        const dublin = { lat: 53.345, lng: -6.266155 }; 

        // specifies map options that will be provided to the Google Maps API
        let mapOptions = {
            center: dublin, 
            zoom: 14,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER,
            },
            streetViewControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER,
            },
            gestureHandling: 'greedy',
            styles: myStyles,
        }

        // Puts new map into HTML div
        map = new google.maps.Map(document.getElementById('map'), mapOptions);

        // variable that stores the location of the bike stations icon
        var image = "/static/bike-icon.png";

        // for loop that creates a marker on the map for each station
        markers = stationInfo.map((position, i) => {

            // Creates new marker on map with position = station coordinates
            const marker = new google.maps.Marker({
                position:  {lat: stationInfo[i].position_lat, lng: stationInfo[i].position_lng},
                map : map,
                icon: image,
                title : stationInfo[i].number.toString(),
            });

            // Creates a pop-up window for each station
            marker.infowindow = new google.maps.InfoWindow({
                content: '<div id="station_popup_' +
                stationInfo[i].number +
                '" "class="station_popup"><h4>' + 
                stationInfo[i].address + 
                '</h4><p class="bike_availability"></p><p class="parking_availability"></p></div>',
            });

            // Add function that displays pop-up window when a marker is clicked for each station marker
            marker.addListener("click", () => {

                // Automatically close any open pop-ups before displaying a new popup
                if (currentlyOpenPopup){
                    currentlyOpenPopup.infowindow.close({
                        anchor: currentlyOpenPopup,
                        map,
                        shouldFocus: false,
                    });
                }

                // Adds realtime data to the popup
                updateInfoWindow(marker.title);

                // Opens the popup
                marker.infowindow.open({
                    anchor: marker,
                    map,
                    shouldFocus: false,
                });

                // Updates the currently opened popup when the user clicks on a station
                currentlyOpenPopup = marker;
            }); 
            // returns the marker object for each station
            return marker;
        });

        // Cluster markers together
        markerCluster = new markerClusterer.MarkerClusterer({ map, markers }); 
        
        // Launches the autocomplete function for the input boxes
        initAutocomplete();

    })
    // Prints an error message when the jQuery requests fails
    .fail(function(){
        console.log("error in the initMap function");
    })        
}

// Function for autocompleting addresses inside input fields
// Reference: https://www.youtube.com/watch?v=c3MjU9E9buQ
function initAutocomplete() {

    // Centers the map in Dublin
    const center = { lat: 53.345, lng: -6.266155 };

    // Sets a range so that users can only enter Dublin locations
    const defaultBounds = {
        north: center.lat + 0.1,
        south: center.lat - 0.1,
        east: center.lng + 0.1,
        west: center.lng - 0.1,
    };

    // Extracts input fields where the user has specified their journey start/end points
    const departing_input = document.getElementById("departing");
    const arriving_input = document.getElementById("destination");

    // Sets options for autocomplete API request
    const options = {
        bounds: defaultBounds,
        componentRestrictions: { country: ["IE"] },
        fields: ["place_id", "geometry", "name"],
        strictBounds: true,
    };

    // Makes request to the autocomplete API
    departingAutocomplete = new google.maps.places.Autocomplete(departing_input, options);
    arrivingAutocomplete = new google.maps.places.Autocomplete(arriving_input, options);

    // Add onclick events to ensure that the user's input is a place object
    departingAutocomplete.addListener("place_changed", () => {
       userStartPlace = userPlaceInputValidation(departingAutocomplete);
    })
    
    arrivingAutocomplete.addListener("place_changed", () => {
        userEndPlace = userPlaceInputValidation(arrivingAutocomplete);
    })
}

// Function to validade that the user had input valid places
function userPlaceInputValidation(autocompleteObject){
    // Extract the place when the user clicks on an item in the dropdown menu
    var place = autocompleteObject.getPlace();

    if (!place.geometry || !place.geometry.location) {
        // User entered the name of a Place that was not suggested and
        // pressed the Enter key, or the Place Details request failed.
        window.alert("No details available for input: '" + place.name + "'");
        // userPlaceCoordinates = "invalid";
        return "invalid";
    } else {
        return [autocompleteObject.getPlace().geometry.location.lat(),
        autocompleteObject.getPlace().geometry.location.lng()];
    }
}

// Check user inputs and display popup if they are valid
// If the user inputs are invalid, display an error message
function userInputValidation(){

    // Extracts error message from Index.html
    errorMessage = document.getElementById("errorMessage");

    // Checks if the user start and end places are valid
    if (userStartPlace == "invalid" || userEndPlace == "invalid"){
        errorMessage.style.visibility = "visible";
    } else {
        errorMessage.style.visibility = "hidden";
        showPopup();
    }

}

// Function that displays current weather information in the page header
function displayWeather(){

    // Makes jQuery request to get current weather data
    var jqxhr = $.getJSON("/weather_info", function(data){
        var weatherInfo = data;

        // Display the current temperature
        var weatherTemp = document.getElementById("weatherTemp");
        weatherTemp.innerHTML = (weatherInfo[0].temperature - 273.15).toFixed(0) + "°C";

        // Display an icon representing the current weather status
        var weatherImg = document.getElementById("weatherImg");
        weatherImg.src = "static/icons/" + weatherInfo[0].icon + ".png";
        weatherImg.width="50";
        weatherImg.height="50";

        // Display the current weather description
        var weatherDesc = document.getElementById("weatherDesc");
        weatherDesc.innerHTML = weatherInfo[0].description;
    })
}


// Function which sends station information to the info window popup
function updateInfoWindow(station_id) {

    // Sends a jQuery request to current bike and parking space availability information
    var jqxhr = $.getJSON("/availability/" + station_id, function(data){
        var availabilityData = data;

        // Isolates the popup for the specific station and stores in a variable
        infoWindowDiv = document.getElementById("station_popup_" + station_id);
        bikeAvailabilityElement = infoWindowDiv.getElementsByClassName("bike_availability")[0];
        parkingAvailabilityElement = infoWindowDiv.getElementsByClassName("parking_availability")[0];

        // Adds number of available bikes for the given station
        bikeAvailability = "Available Bikes: " + availabilityData[0]["available_bikes"];
        bikeAvailabilityElement.innerHTML = bikeAvailability;
        infoWindowDiv.appendChild(bikeAvailabilityElement);

        // Adds number of available parking spaces for the given station
        parkingAvailability = "Available Parking Spaces: " + availabilityData[0]["available_stands"];
        parkingAvailabilityElement.innerHTML = parkingAvailability;
        infoWindowDiv.appendChild(parkingAvailabilityElement);
    })
    .fail(function(){
        console.log("error in the updateInfoWindow function");
    })
}


// Function to display the side bar where the user will input their start/end location
function getPanel(){

    // Extracts the side bar and assigns it to a variable
    var panel = document.getElementById("sideBar");

    // Opens the side bar
    if(panel.style.display === "none") {
        panel.style.display = "block";
    }

    // Closes the side bar
    else {
        panel.style.display = "none";
    }
}

// Function to display the bike recommendations popup when the user has submitted their start/end point in the journey planner
function showPopup() {

    // Gets rid of the side bar
    getPanel();

    // Resets start station recommendation array
    var startToStationsArray = [];

    // Displays pop up
    document.getElementById("departurepopup").classList.toggle("active");



    // Gets the distances from each station to the user start point
    var jqxhr = $.getJSON("/distances/" + userStartPlace[0] + "/" + userStartPlace[1], function(data){

        startToStationsArray = Object.entries(data);

        // sorts the stations by distance to the users start point (closest to farthest)
        startToStationsArray.sort((a, b) => {
            return a[1][0] - b[1][0];
        });

        // Get the users day an hour of travel values
        userDay = document.getElementById("daySelect").value;
        userHour = document.getElementById("hourSelect").value;

        // Gets estimated number of bikes at each station
        var jqxhr = $.getJSON("prediction/bike/" + userDay + "/" + userHour + "/" + startToStationsArray[1][1][2] + "/" +  startToStationsArray[2][1][2] + "/" + startToStationsArray[3][1][2] + "/" + startToStationsArray[4][1][2] + "/" + startToStationsArray[5][1][2], function(data){
            var predictions=[];
            console.log(isDataAvailable);
            predictions = data;
            console.log(predictions);
            if(predictions.length!=0){
                isDataAvailable=true;
            }
            console.log(isDataAvailable);

            if(isDataAvailable){
                document.getElementById("loader").style.display = "none";
                document.getElementById("stationRecommendations").style.display = "block";
            } 
            
            console.log(predictions);
            // Displays bike stations recommendations to the user
            createPopupCheckboxes(startToStationsArray, "startLocationSelection", " - Estimated available bikes: ", predictions);
            
            // Create the confirm button
            confirmButton = document.createElement("button");
            confirmButton.id = "popupButton";
            confirmButton.setAttribute("onclick", "updatePopup();")
            confirmButton.innerHTML = "Confirm";
        
            // Isolate the container and put the confirm button in the container
            popupContainer = document.getElementById("departurepopup").getElementsByClassName("content")[0];
            popupContainer.appendChild(confirmButton);
        });  
    });
}


// Function to update the popup recommendation data. 
function updatePopup(){

    // resets the userChoices array
    userChoices = [];

    // resets the array that stores parking space recommendations
    var endToStationsArray = [];
    
    // updating the popup header
    document.getElementById("popupHeader").innerHTML = "Recommended Parking Stations:";

    // getting the value of the user choice.
    var radios = document.getElementsByName('startLocationSelection');
    addUserChoices(radios);

    // Setting the innerHTML of the popup to empty.
    document.getElementById("stationRecommendations").innerHTML ="";
    container = document.getElementById("stationRecommendations");
    
    // Get distance from each station to the user end point
    var jqxhr = $.getJSON("/distances/" + userEndPlace[0] + "/" + userEndPlace[1], function(data){

        endToStationsArray = Object.entries(data);

        // sort the stations by distances form the user endpoint
        endToStationsArray.sort((a, b) => {
            return a[1][0] - b[1][0];
        });

        // get the hour and day that the user wants to travel
        userDay = document.getElementById("daySelect").value;
        userHour = document.getElementById("hourSelect").value;

        // Get availability estimates for the parking spaces at each station
        var jqxhr = $.getJSON("prediction/station/" + userDay + "/" + userHour + "/" + endToStationsArray[1][1][2] + "/" +  endToStationsArray[2][1][2] + "/" + endToStationsArray[3][1][2] + "/" + endToStationsArray[4][1][2] + "/" + endToStationsArray[5][1][2], function(data){
            var predictions = data;
            
            // Displays parking spaces recommendations to the user
            createPopupCheckboxes(endToStationsArray, "endLocationSelection", " - Estimated available parking spaces: ", predictions);

             // Change the onclick event for the confirm button to hidePopup function
             confirmButton = document.getElementById("popupButton");
             confirmButton.setAttribute("onclick", "getRoute();");
        });
    });
}

// Creates station recommendation checkboxes and displays them in the popup
function createPopupCheckboxes(stationsArray, checkboxName, predictionText, predictions){

    // Gets the element where we will store the popup info
    var container = document.getElementById("stationRecommendations");
    container.innerHTML = "";

     // Create checkboxes for the popups
     for (i=0; i<5; i++) {

        // Create input element using Bootstrap
        var radioboxDeparture = document.createElement('input');
        radioboxDeparture.type = "radio";
        radioboxDeparture.className = "form-check-input";
        radioboxDeparture.name = checkboxName;
        radioboxDeparture.autocomplete = "off";
        radioboxDeparture.id = stationsArray[i][0];
        radioboxDeparture.value = stationsArray[i][1][1];

        // Create label using Bootstrap
        var departureLabel = document.createElement("label");
        departureLabel.className = "form-check-label";
        departureLabel.for = stationsArray[i][0];
        departureLabel.innerHTML = stationsArray[i][0] + predictionText + predictions[i];

        // Create a div using Bootstrap
        var departureHolder = document.createElement("div");
        departureHolder.className = "form-check";

        // Add the new elements to the popup
        departureLabel.appendChild(radioboxDeparture);
        departureHolder.appendChild(departureLabel);
        container.appendChild(departureHolder);
    }
}
function myFunction() {
    myVar = setTimeout(showPage, 3000);
}

function showPage() {
    document.getElementById("stationRecommendations").style.display = "none";
    document.getElementById("myDiv").style.display = "block";
}
// Hides the station recommendation popup
function hidePopup(){

    // Hides the popup
    popup = document.getElementById("departurepopup");
    popup.classList.toggle("active");
    
    // Gets rid of the button
    document.getElementById("popupButton").remove();

    // Opens the plan your journey sidebar
    getPanel();
}

// Adds user selected station to a global list
function addUserChoices(radios){

    for(i = 0; i < radios.length; i++){
        if(radios[i].checked){
            userChoices.push(radios[i].value);
        }
    }
}

// Displays a route from the users start point to the users end point
function getRoute(){

    // Resets the route
    if (directionsRenderer != null) {
        directionsRenderer.setMap(null);
    }

    // Initialise routing services
    var directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        polylineOptions: {
          strokeColor: "red",
        },
        suppressMarkers: true
      });

    directionsRenderer.setMap(map);

    // Get the user's desired endpoint
    var radios = document.getElementsByName('endLocationSelection');
    addUserChoices(radios);

    // Hide the recommendations popup
    hidePopup();

    // Creates request to send to Google Direction Service
    var request = {
        origin: userChoices[0],
        destination: userChoices[1],
        travelMode: 'BICYCLING'
    };

    // Sends request to Google Direction Service
    directionsService.route(request, function(result, status) {
        if (status == 'OK') {
            directionsRenderer.setDirections(result);
        }
    });
}

// Function to show and hide station markers
// Makes easier to see the route
function toggleDisplayMarkers(){

    // Extracts the button to toggle marker display
    displayMarkers = document.getElementById("displayMarkers");

    // Condition to hide and display stations
    if(displayMarkers.innerHTML == "Hide Stations"){
        displayMarkers.innerHTML = "Show Stations";
        for (marker in markers){
            markers[marker].setVisible(false);
        }
        markerCluster.clearMarkers();
    }
    else {
        displayMarkers.innerHTML = "Hide Stations";
        for (marker in markers){
            markers[marker].setVisible(true);
        }
        // Cluster markers together
        markerCluster = new markerClusterer.MarkerClusterer({ map, markers });
    }    
}

// Function to add options to the day select option menu
function populateDaySelectOptions(){
    
    // Gets today's date
    var now = new Date();

    // Creates an array of week day names from Sunday to Saturday
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    // Extracts input field where the user selects a day of week to travel
    daySelect = document.getElementById("daySelect");
    
    // Creates a dropdown menu with week days that the user can select
    for (i=0; i<4; i++){
        var newOption = document.createElement("option");
        // Allow for the case where the day index is greater than 6 (last element in our days array)
        if (now.getDay() + i > 6){
            newOption.innerHTML = days[now.getDay() + i - 7];
            newOption.value = days[now.getDay() + i - 7];
        } else {
            newOption.innerHTML = days[now.getDay() + i];
            newOption.value = days[now.getDay() + i];
        }
        daySelect.appendChild(newOption);
    }
}

// Function to add options to the hour select option menu 
function populateHourSelectOptions(){
    
    // Get todays date
    var now = new Date();

    // Gets the hour today
    hourNow = now.getHours();

    // Extracts input field where the user selects the hour they want to travel
    hourSelect = document.getElementById("hourSelect");

    // Creates a dropdown menu with hours that the user can select
    for (hour = hourNow; hour < 24; hour++) {
        var newOption = document.createElement("option");
        newOption.innerHTML = hour + ":00";
        newOption.value = hour;
        hourSelect.appendChild(newOption);
    }
}

// function resetGlobals(){
//
//     userStartPlace = "invalid";
//     userEndPlace = "invalid";
//     // inside updatePopup function
//     userChoices = [];
// }

// We stopped at the updatePopupFunction