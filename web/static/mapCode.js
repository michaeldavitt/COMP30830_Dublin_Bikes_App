// Function to display a map of Dublin on the homepage
var station_info;
var globalResponse;
var originDistances = []
var destinationDistances = []
var addressQuantity;
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

// Function to display the centre popup when the user has submitted their start/end point in the journey planner
function showPopup() {
    // Gets rid of the side bar
    getPanel();

    var startingLocation = document.getElementById("departing").value;
    document.getElementById("departurepopup").classList.toggle("active");
    // document.getElementById("departureText").innerHTML = startingLocation;

    var destinationLocation = document.getElementById("destination").value;

    // Get station coordinates
    const stationCoordinates = Array();
    for (i=0; i<station_info.length; i++) {
        station_lat = station_info[i].position_lat;
        station_long = station_info[i].position_lng;
        stationCoordinates[i] = {lat: station_lat, lng: station_long};
    }

    // Initialize service
    const geocoder = new google.maps.Geocoder();
    const service = new google.maps.DistanceMatrixService();

    // build request
    const origin1 = startingLocation;
    const destination1 = destinationLocation;
    

    const request = {
        origins: [origin1, destination1],
        destinations: [stationCoordinates[0], stationCoordinates[1], stationCoordinates[2], stationCoordinates[3], stationCoordinates[4]],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false,
    };


    // get distance matrix response
  service.getDistanceMatrix(request).then((response) => {
    
    console.log(response);
    globalResponse = response;

    // variables to collect the distance of the stations
    addressQuantity = response.rows[0].elements.length;
    originDistances = []
    destinationDistances = []


    // loop that is getting all the distance, for the departure and destination, in Km and sorting them in a list.
    for (i = 0; i < addressQuantity; i++){
        // getting the distances for the departure locations
        originDistance = response.rows[0].elements[i].distance.text;
        originDistances.push(originDistance);
        
        // getting the distances for destination locations
        destinationDistance = response.rows[1].elements[i].distance.text;
        destinationDistances.push(destinationDistance);
    }

    // Sorting the lists by ascending order
    originDistances.sort();
    destinationDistances.sort();


    // loop to get the nearest 5 stations from the user location, and recommend it in the popup.
    document.getElementById("departureText").innerHTML = "";
    var container = document.getElementById("departureText");
    for (i = 0; i < response.destinationAddresses.length; i++){
        for(j = 0; j < addressQuantity; j++){

            // Checking if the sorted distances matches the addresses and displaying them in order of distance for the user 
            if(originDistances[i] == response.rows[0].elements[j].distance.text){
                

                // Creating the radio buttons for each station
                var radioboxDeparture = document.createElement('input');
                radioboxDeparture.type="radio";
                radioboxDeparture.name="recommendation_stations";
                radioboxDeparture.id= j;
                radioboxDeparture.value= response.destinationAddresses[j];
                container.appendChild(radioboxDeparture) + container.append(response.destinationAddresses[j]);
            }
        }
    }
    });

}

// Function to update the popup recommendation data. 
function updatePopup(){
    
    // Setting the innerHTML of the popup to empty
    document.getElementById("departureText").innerHTML ="";
    container = document.getElementById("departureText");

    // code that display the recommended stations for the user.
    for (i = 0; i < globalResponse.destinationAddresses.length; i++){
        for(j = 0; j < addressQuantity; j++){         
            if(destinationDistances[i] == globalResponse.rows[1].elements[j].distance.text){
                var radioboxDestination = document.createElement('input');
                radioboxDestination.type="radio";
                radioboxDestination.name="recommendation_stations";
                radioboxDestination.id = j;
                radioboxDestination.value = globalResponse.destinationAddresses[j];

                container.appendChild(radioboxDestination) + container.append(globalResponse.destinationAddresses[j]);
            }
        }
    }
}

