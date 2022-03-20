// Variable that displays the static station information
var station_info;

// Variable where the user choices are stored
var userChoices = [];

// Function to display a map of Dublin on the homepage
function initMap() { 
    var currentlyOpenPopup;

    // Gets static station information to display on the map
    var jqxhr = $.getJSON("/station_info", function(data){
        console.log("success", data);
        station_info = data;

        // Displays the map and zooms in on Dublin city center
        const dublin = { lat: 53.345, lng: -6.266155 }; 
        let mapOptions = {
            center: dublin, 
            zoom: 14,
        }

        // Puts new map into HTML div
        let map = new google.maps.Map(document.getElementById('map'), mapOptions);


        // Creates a marker on the map for each station
        const markers = station_info.map((position, i) => {

            // Creates new marker on map with position = station coordinates
            const marker = new google.maps.Marker({
                position:  {lat: station_info[i].position_lat, lng: station_info[i].position_lng},
                map : map,
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
            
            return marker;
        });
            

        // Cluster markers together
        const markerCluster = new markerClusterer.MarkerClusterer({ map, markers }); 
        
        // Launches the autocomplete function for the input boxes
        initAutocomplete();

    })
    .fail(function(){
        console.log("error");
    })        
}

// Function for autocompleting addresses inside input fields
// Reference: https://www.youtube.com/watch?v=c3MjU9E9buQ
let autocomplete;
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
}


// Function which sends station information to the info window popup
function updateInfoWindow(station_id) {
    var jqxhr = $.getJSON("/availability/" + station_id, function(data){
        var availabilityData = data;

        // Adds number of available bikes for the given station

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
        console.log("error");
    })
}

// Function to display the side bar where the user will input their start/end location
function getPanel(){
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

    // Add a progress bar
    progressBar = document.createElement("progress");
    progressBar.id = "progressBar";
    progressBar.max = station_info.length;
    progressBar.value = 0;
    progressBarLabel = document.createElement("label");
    progressBarLabel.for = "progressBar";
    progressBarLabel.innerHTML = "Obtaining optimal stations:";
    container.appendChild(progressBarLabel);
    container.appendChild(document.createElement("br"));
    container.appendChild(progressBar);

    // Gets rid of the side bar
    getPanel();

    // Reset global start and end arrays
    startToStationsArray = [];
    endToStationsArray = [];
    console.log(startToStationsArray)

    // Display pop up
    document.getElementById("departurepopup").classList.toggle("active");

    // Get user input values
    var startingLocation = document.getElementById("departing").value;
    var destinationLocation = document.getElementById("destination").value;
    console.log(startingLocation)

    // Initialize distance matrix service
    // const geocoder = new google.maps.Geocoder();
    const service = new google.maps.DistanceMatrixService();


    // Make a distance request for each station
    for (i=0; i<station_info.length; i++) {
        station_lat = station_info[i].position_lat;
        station_long = station_info[i].position_lng;

        // Set up request
        var request = {
            origins: [startingLocation, destinationLocation],
            destinations: [{lat: station_lat, lng: station_long}],
            travelMode: google.maps.TravelMode.WALKING,
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false,
        };

        // Get distance
        getDistances(request, service, i)

        // Sleep so that our requests don't trigger a query_limit_exceeded error
        await sleep(120);

        progressBar.value = i+1;
    }

    startToStationsArray.sort((a, b) => {
        return a[1] - b[1];
    });
    endToStationsArray.sort((a, b) => {
        return a[1] - b[1];
    })

    container.innerHTML = "";
    // Create checkboxes for the popups
    for (i=0; i<5; i++) {

        // Create input element using Bootstrap
        var radioboxDeparture = document.createElement('input');
        radioboxDeparture.type = "radio";
        radioboxDeparture.className = "btn-check";
        radioboxDeparture.name = "options";
        radioboxDeparture.autocomplete = "off";
        radioboxDeparture.id = startToStationsArray[i][0];
        radioboxDeparture.value = startToStationsArray[i][0];

        // Create label using Bootstrap
        var departureLabel = document.createElement("label");
        departureLabel.className = "btn btn-outline-primary";
        departureLabel.for = startToStationsArray[i][0];
        departureLabel.innerHTML = startToStationsArray[i][0];

        // Add the new elements to the popup
        container.appendChild(radioboxDeparture);
        container.appendChild(departureLabel);
        container.appendChild(document.createElement("br"));
    }

    // Create the confirm button
    confirmButton = document.createElement("button");
    confirmButton.id = "popupButton";
    confirmButton.setAttribute("onclick", "updatePopup();")
    confirmButton.innerHTML = "Confirm";

    // Isolate the container and put the confirm button in the container
    popupContainer = document.getElementById("departurepopup").getElementsByClassName("content")[0];
    popupContainer.appendChild(confirmButton);
}

function getDistances(request, service, i) {
    service.getDistanceMatrix(request).then((response) => {
        startToStationsArray.push([station_info[i].address, response.rows[0].elements[0].duration.value]);
        endToStationsArray.push([station_info[i].address, response.rows[1].elements[0].duration.value]);
    });
}


// Function to update the popup recommendation data. 
function updatePopup(){

    // updating the popup header
    document.getElementById("popupHeader").innerHTML = "Choose a station for destination";

    // getting the value of the user choice.
    var radios = document.getElementsByName('startLocationSelection');
    for(i = 0; i < radios.length; i++){
        if(radios[i].checked){
            userChoices.push(radios[i].value);
        }
    }
    
    console.log(userChoices);

    // Setting the innerHTML of the popup to empty.
    document.getElementById("departureText").innerHTML ="";
    container = document.getElementById("departureText");

    // Create checkboxes for the popups
    for (i=0; i<5; i++) {

        // Create input element using Bootstrap
        var radioboxDeparture = document.createElement('input');
        radioboxDeparture.type = "radio";
        radioboxDeparture.className = "btn-check";
        radioboxDeparture.name = "options";
        radioboxDeparture.autocomplete = "off";
        radioboxDeparture.id = endToStationsArray[i][0];
        radioboxDeparture.value = endToStationsArray[i][0];

        // Create label using Bootstrap
        var departureLabel = document.createElement("label");
        departureLabel.className = "btn btn-outline-primary";
        departureLabel.for = endToStationsArray[i][0];
        departureLabel.innerHTML = endToStationsArray[i][0];

        // Add the new elements to the popup
        container.appendChild(radioboxDeparture);
        container.appendChild(departureLabel);
        container.appendChild(document.createElement("br"));

        // Change the onclick event for the confirm button to hidePopup function
        confirmButton = document.getElementById("popupButton");
        confirmButton.setAttribute("onclick", "hidePopup();");
    }
}

function hidePopup(){
    popup = document.getElementById("departurepopup");
    popup.style.display = "none";
}