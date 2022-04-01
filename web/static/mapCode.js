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
       userPlaceInputValidation(departingAutocomplete);
    })
    
    arrivingAutocomplete.addListener("place_changed", () => {
        userPlaceInputValidation(arrivingAutocomplete);
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
        userEndPlace = "invalid";
        return;
    } else {
        userEndPlace = [autocompleteObject.getPlace().geometry.location.lat(),
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
    var jqxhr = $.getJSON("/availability/" + station_id, function(data){
        var availabilityData = data;

        // Isolates the popup for the specific station and stores in a variable
        infoWindowDiv = document.getElementById("station_popup_" + station_id);
        bikeAvailabilityElement = infoWindowDiv.getElementsByClassName("bike_availability")[0];

        // Input the realtime information
        bikeAvailability = "Available Bikes: " + availabilityData[0]["available_bikes"];
        bikeAvailabilityElement.innerHTML = bikeAvailability;
        infoWindowDiv.appendChild(bikeAvailabilityElement);

        // Adds number of available parking spaces for the given station
        parkingAvailabilityElement = infoWindowDiv.getElementsByClassName("parking_availability")[0];
        parkingAvailability = "Available Parking Spaces: " + availabilityData[0]["available_stands"];
        parkingAvailabilityElement.innerHTML = parkingAvailability;
        infoWindowDiv.appendChild(parkingAvailabilityElement);
    })
    .fail(function(){
        console.log("error in the updateInfoWindow function");
    })
}
var panel = document.getElementById("sideBar");
panel.style.display = "block";


// Function to display the side bar where the user will input their start/end location
function getPanel(){
    // Opens the side bar
    if(panel.style.display === "none") {
        panel.style.display = "block";
    }

    // Closes the side bar
    else {
        panel.style.display = "none";
    }
}

// Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var startToStationsArray;
var endToStationsArray;

// Function to display the centre popup when the user has submitted their start/end point in the journey planner
async function showPopup() {

    // Get the element where we will store the popup info
    var container = document.getElementById("departureText");
    container.innerHTML = "";

    // Gets rid of the side bar
    getPanel();

    // Reset global start and end arrays
    startToStationsArray = [];
    endToStationsArray = [];

    // Display pop up
    document.getElementById("departurepopup").classList.toggle("active");

    var jqxhr = $.getJSON("/distances/" + userStartPlace[0] + "/" + userStartPlace[1], function(data){

        startToStationsArray = Object.entries(data);

        startToStationsArray.sort((a, b) => {
            return a[1][0] - b[1][0];
        });
    
        container.innerHTML = "";

        userDay = document.getElementById("daySelect").value;
        userHour = document.getElementById("hourSelect").value;
        var jqxhr = $.getJSON("prediction/bike/" + userDay + "/" + userHour + "/" + startToStationsArray[1][1][2] + "/" +  startToStationsArray[2][1][2] + "/" + startToStationsArray[3][1][2] + "/" + startToStationsArray[4][1][2] + "/" + startToStationsArray[5][1][2], function(data){
            var predictions = data;
            
            // Create checkboxes for the popups
            for (i=0; i<5; i++) {
        
                // Create input element using Bootstrap
                var radioboxDeparture = document.createElement('input');
                radioboxDeparture.type = "radio";
                radioboxDeparture.className = "form-check-input";
                radioboxDeparture.name = "startLocationSelection";
                radioboxDeparture.autocomplete = "off";
                radioboxDeparture.id = startToStationsArray[i][0];
                radioboxDeparture.value = startToStationsArray[i][1][1];
        
                // Create label using Bootstrap
                var departureLabel = document.createElement("label");
                departureLabel.className = "form-check-label";   
                departureLabel.for = startToStationsArray[i][0];
                
                // Create availability
                stationID = startToStationsArray[i][1][2];
                departureLabel.innerHTML = startToStationsArray[i][0] + " - Estimated available bikes: " + predictions[i];
        
                // Create a div using Bootstrap
                var departureHolder = document.createElement("div");
                departureHolder.className = "form-check";
        
                // Add the new elements to the popup
                departureLabel.appendChild(radioboxDeparture);
                departureHolder.appendChild(departureLabel);
                container.appendChild(departureHolder);
            }
        
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

    // updating the popup header
    document.getElementById("popupHeader").innerHTML = "Recommended Parking Stations:";

    userChoices = [];

    // getting the value of the user choice.
    var radios = document.getElementsByName('startLocationSelection');
    addUserChoices(radios);
    // for(i = 0; i < radios.length; i++){
    //     if(radios[i].checked){
    //         userChoices.push(radios[i].value);
    //     }
    // }

    // Setting the innerHTML of the popup to empty.
    document.getElementById("departureText").innerHTML ="";
    container = document.getElementById("departureText");

    var jqxhr = $.getJSON("/distances/" + userEndPlace[0] + "/" + userEndPlace[1], function(data){

        endToStationsArray = Object.entries(data);

        endToStationsArray.sort((a, b) => {
            return a[1][0] - b[1][0];
        });

        userDay = document.getElementById("daySelect").value;
        userHour = document.getElementById("hourSelect").value;
        var jqxhr = $.getJSON("prediction/station/" + userDay + "/" + userHour + "/" + endToStationsArray[1][1][2] + "/" +  endToStationsArray[2][1][2] + "/" + endToStationsArray[3][1][2] + "/" + endToStationsArray[4][1][2] + "/" + endToStationsArray[5][1][2], function(data){
            var predictions = data;
            
            // Create checkboxes for the popups
            for (i=0; i<5; i++) {

                // Create input element using Bootstrap
                var radioboxDeparture = document.createElement('input');
                radioboxDeparture.type = "radio";
                radioboxDeparture.className = "form-check-input";
                radioboxDeparture.name = "endLocationSelection";
                radioboxDeparture.autocomplete = "off";
                radioboxDeparture.id = endToStationsArray[i][0];
                radioboxDeparture.value = endToStationsArray[i][1][1];

                // Create label using Bootstrap
                var departureLabel = document.createElement("label");
                departureLabel.className = "form-check-label";
                departureLabel.for = endToStationsArray[i][0];
                departureLabel.innerHTML = endToStationsArray[i][0] + " - Estimated available parking spaces: " + predictions[i];

                // Create a div using Bootstrap
                var departureHolder = document.createElement("div");
                departureHolder.className = "form-check";

                // Add the new elements to the popup
                departureLabel.appendChild(radioboxDeparture);
                departureHolder.appendChild(departureLabel);
                container.appendChild(departureHolder);

                // Change the onclick event for the confirm button to hidePopup function
                confirmButton = document.getElementById("popupButton");
                confirmButton.setAttribute("onclick", "getRoute();");
            }
        });
    });
}

function hidePopup(){
    popup = document.getElementById("departurepopup");
    popup.classList.toggle("active");
    
    // gets rid of the button
    document.getElementById("popupButton").remove();

    getPanel();
}

function addUserChoices(radios){
    // Adds user selected station to a global list
    for(i = 0; i < radios.length; i++){
        if(radios[i].checked){
            userChoices.push(radios[i].value);
        }
    }
}

var directionsRenderer;
function getRoute(){
    // directionsRenderer.setMap(null);

    if (directionsRenderer != null) {
        directionsRenderer.setMap(null);
    }

    // Initialise services
    var directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        polylineOptions: {
          strokeColor: "red"
        }
      });
    directionsRenderer.setMap(map);

    // Get the user's desired endpoint
    var radios = document.getElementsByName('endLocationSelection');
    addUserChoices(radios);

    hidePopup();


    var start = userChoices[0];
    var end = userChoices[1];
    var request = {
        origin: start,
        destination: end,
        travelMode: 'BICYCLING'
    };
    directionsService.route(request, function(result, status) {
        if (status == 'OK') {
        directionsRenderer.setDirections(result);
        }
    });
}

function toggleDisplayMarkers(){
    displayMarkers = document.getElementById("displayMarkers");
    if(displayMarkers.innerHTML == "Hide Stations"){
        displayMarkers.innerHTML = "Show Stations";
        for (marker in markers){
            markers[marker].setVisible(false);
        }
        markerCluster.clearMarkers();
    }else{
        displayMarkers.innerHTML = "Hide Stations";
        for (marker in markers){
            markers[marker].setVisible(true);
        }
        // Cluster markers together
        markerCluster = new markerClusterer.MarkerClusterer({ map, markers });
    }    
}

function populateDaySelectOptions(){
    // Function to add options to the day select option menu
    var now = new Date();
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    daySelect = document.getElementById("daySelect");
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

function populateHourSelectOptions(){
    // Function to add options to the hour select option menu
    var now = new Date();
    hourNow = now.getHours();
    hourSelect = document.getElementById("hourSelect");
    for (hour = hourNow; hour < 24; hour++) {
        var newOption = document.createElement("option");
        newOption.innerHTML = hour + ":00";
        newOption.value = hour;
        hourSelect.appendChild(newOption);
    }
}