// Variable that displays the static station information
var station_info;

// Variable to store the map
let map;

// List of marker objects
var markerList = [];
var markerCluster;
var markers;

// Variable where the user choices are stored
var userChoices = [];

// Function to display a map of Dublin on the homepage
function initMap() { 
    var currentlyOpenPopup;
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
        station_info = data;

        // Displays the map and zooms in on Dublin city center
        const dublin = { lat: 53.345, lng: -6.266155 }; 
        let mapOptions = {
            center: dublin, 
            zoom: 14,
            styles: myStyles,
        }

        // Puts new map into HTML div
        map = new google.maps.Map(document.getElementById('map'), mapOptions);

        var image = "/static/bike-icon.png";
        // Creates a marker on the map for each station
        markers = station_info.map((position, i) => {

            // Creates new marker on map with position = station coordinates
            const marker = new google.maps.Marker({
                position:  {lat: station_info[i].position_lat, lng: station_info[i].position_lng},
                map : map,
                icon: image,
                title : station_info[i].number.toString(),
            });

            // Creates a pop-up window for each station
            marker.infowindow = new google.maps.InfoWindow({
                content: '<div id="station_popup_' +
                station_info[i].number +
                '" "class="station_popup"><h4>' + 
                station_info[i].address + 
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

                // Sets the currently opened popup to be the recently opened popup
                currentlyOpenPopup = marker;
            }); 
            markerList.push(marker);
            return marker;
        });
        console.log(markers);
        // Cluster markers together
        markerCluster = new markerClusterer.MarkerClusterer({ map, markers }); 
        
        // Launches the autocomplete function for the input boxes
        initAutocomplete();

    })
    .fail(function(){
        console.log("error in the initMap function");
    })        
}

// Function for autocompleting addresses inside input fields
// Reference: https://www.youtube.com/watch?v=c3MjU9E9buQ
// let autocomplete;
// Store variables for the user input
var userStartPlace = "invalid";
var userEndPlace = "invalid";

function initAutocomplete() {
    // Set up the options for the new Autocomplete

    // Centers the map in Dublin
    const center = { lat: 53.345, lng: -6.266155 };

    // Sets a range so that users can only enter Dublin locations
    const defaultBounds = {
        north: center.lat + 0.1,
        south: center.lat - 0.1,
        east: center.lng + 0.1,
        west: center.lng - 0.1,
    };

    // Gets input boxes
    const departing_input = document.getElementById("departing");
    const arriving_input = document.getElementById("destination");

    // Sets options for autocomplete API request
    const options = {
        bounds: defaultBounds,
        componentRestrictions: { country: ["IE"] },
        fields: ["place_id", "geometry", "name"],
        strictBounds: true,
    };

    // Makes API request
    departingAutocomplete = new google.maps.places.Autocomplete(departing_input, options);
    arrivingAutocomplete = new google.maps.places.Autocomplete(arriving_input, options);

    // Add onclick events to store the user's input as a place object
    departingAutocomplete.addListener("place_changed", () => {
        // Extract the place when the user clicks on an item in the dropdown menu
        var place = departingAutocomplete.getPlace();

        if (!place.geometry || !place.geometry.location) {
            // User entered the name of a Place that was not suggested and
            // pressed the Enter key, or the Place Details request failed.
            window.alert("No details available for input: '" + place.name + "'");
            userStartPlace = "invalid";
            console.log(userStartPlace);
            return;
        } else {
            userStartPlace = [departingAutocomplete.getPlace().geometry.location.lat(),
            departingAutocomplete.getPlace().geometry.location.lng()];
        }
    })

    arrivingAutocomplete.addListener("place_changed", () => {
        // Extract the place when the user clicks on an item in the dropdown menu
        var place = arrivingAutocomplete.getPlace();

        if (!place.geometry || !place.geometry.location) {
            // User entered the name of a Place that was not suggested and
            // pressed the Enter key, or the Place Details request failed.
            window.alert("No details available for input: '" + place.name + "'");
            userEndPlace = "invalid";
            console.log(userEndPlace);
            return;
        } else {
            userEndPlace = [arrivingAutocomplete.getPlace().geometry.location.lat(),
            arrivingAutocomplete.getPlace().geometry.location.lng()];
        }
    })
}

function userInputValidation(){
    // Check user inputs and display popup if they are valid
    // If the user inputs are invalid, display an error message
    errorMessage = document.getElementById("errorMessage");
    if (userStartPlace == "invalid" || userEndPlace == "invalid"){
        errorMessage.style.display = "block";
    } else {
        errorMessage.style.display = "none";
        showPopup();
    }

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
panel.style.display = "none";


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
    console.log(userStartPlace, userEndPlace);

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
            console.log(predictions);
            
            // Create checkboxes for the popups
            for (i=0; i<5; i++) {
        
                // Create input element using Bootstrap
                var radioboxDeparture = document.createElement('input');
                radioboxDeparture.type = "radio";
                radioboxDeparture.className = "btn-check";
                radioboxDeparture.name = "startLocationSelection";
                radioboxDeparture.autocomplete = "off";
                radioboxDeparture.id = startToStationsArray[i][0];
                radioboxDeparture.value = startToStationsArray[i][1][1];
        
                // Create label using Bootstrap
                var departureLabel = document.createElement("label");
                departureLabel.className = "btn btn-outline-primary";
                departureLabel.for = startToStationsArray[i][0];
                
                // Create availability
                stationID = startToStationsArray[i][1][2];
                departureLabel.innerHTML = startToStationsArray[i][0] + " - " + predictions[i] + " bikes available";
        
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
    document.getElementById("popupHeader").innerHTML = "Choose a station for destination";

    userChoices = [];

    // getting the value of the user choice.
    var radios = document.getElementsByName('startLocationSelection');
    for(i = 0; i < radios.length; i++){
        if(radios[i].checked){
            userChoices.push(radios[i].value);
        }
    }

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
                radioboxDeparture.className = "btn-check";
                radioboxDeparture.name = "endLocationSelection";
                radioboxDeparture.autocomplete = "off";
                radioboxDeparture.id = endToStationsArray[i][0];
                radioboxDeparture.value = endToStationsArray[i][1][1];

                // Create label using Bootstrap
                var departureLabel = document.createElement("label");
                departureLabel.className = "btn btn-outline-primary";
                departureLabel.for = endToStationsArray[i][0];
                departureLabel.innerHTML = endToStationsArray[i][0] + " - " + predictions[i] + " bikes available";

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
}

function getRoute(){
    // Get rid of popup button
    document.getElementById("popupButton").remove();

    // Get rid of stations
    toggleDisplayMarkers();

    // Initialise services
    var directionsService = new google.maps.DirectionsService();
    var directionsRenderer = new google.maps.DirectionsRenderer({
        polylineOptions: {
          strokeColor: "red"
        }
      });
    directionsRenderer.setMap(map);

    // Get the user's desired endpoint
    var radios = document.getElementsByName('endLocationSelection');
    for(i = 0; i < radios.length; i++){
        if(radios[i].checked){
            userChoices.push(radios[i].value);
        }
    }

    hidePopup();

    console.log(userChoices);

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
        for (marker in markerList){
            markerList[marker].setVisible(false);
        }
        markerCluster.clearMarkers();
    }else{
        displayMarkers.innerHTML = "Hide Stations";
        for (marker in markerList){
            markerList[marker].setVisible(true);
        }
        // Cluster markers together
        markerCluster = new markerClusterer.MarkerClusterer({ map, markers });
    }    
}

function populateDaySelectOptions(){
    // Function to add options to the day select option menu
    var now = new Date();
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    // var today = days[now.getDay()];
    daySelect = document.getElementById("daySelect");
    for (i=0; i<4; i++){
        var newOption = document.createElement("option");
        newOption.innerHTML = days[now.getDay() + i];
        newOption.value = days[now.getDay() + i];
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