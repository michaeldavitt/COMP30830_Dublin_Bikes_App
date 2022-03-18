// Function to display a map of Dublin on the homepage
var station_info;
function initMap() { 
    var currentlyOpenPopup;

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
                if (currentlyOpenPopup){
                    console.log(currentlyOpenPopup);
                    currentlyOpenPopup.infowindow.close({
                        anchor: currentlyOpenPopup,
                        map,
                        shouldFocus: false,
                    });
                }
                updateInfoWindow(marker.title);
                marker.infowindow.open({
                    anchor: marker,
                    map,
                    shouldFocus: false,
                });
                currentlyOpenPopup = marker;
            });
            return marker;
        });
            

        // Cluster markers together
        const markerCluster = new markerClusterer.MarkerClusterer({ map, markers }); 
        
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
    const center = { lat: 53.345, lng: -6.266155 };
    const defaultBounds = {
        north: center.lat + 0.1,
        south: center.lat - 0.1,
        east: center.lng + 0.1,
        west: center.lng - 0.1,
    };
    const departing_input = document.getElementById("departing");
    const arriving_input = document.getElementById("destination");
    const options = {
        bounds: defaultBounds,
        componentRestrictions: { country: ["IE"] },
        fields: ["place_id", "geometry", "name"],
        strictBounds: true,
    };

    departingAutocomplete = new google.maps.places.Autocomplete(departing_input, options);
    arrivingAutocomplete = new google.maps.places.Autocomplete(arriving_input, options);
}

// Function which sends station information to the info window popup
function updateInfoWindow(station_id){
    var jqxhr = $.getJSON("/availability/" + station_id, function(data){
        var availabilityData = data;
        // Adds number of available bikes for the given station
        infoWindowDiv = document.getElementById("station_popup_" + station_id);
        bikeAvailabilityElement = infoWindowDiv.getElementsByClassName("bike_availability")[0];
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
    if(panel.style.display === "none"){
        panel.style.display = "block";
    }
    else{
        panel.style.display = "none";
    }
}

// Function to display the centre popup when the user has submitted their start/end point in the journey planner
function showPopup(){
    // Gets rid of the side bar
    getPanel();

    var startingLocation = document.getElementById("departing").value;
    document.getElementById("departurepopup").classList.toggle("active");
    document.getElementById("departureText").innerHTML = startingLocation;

    // Get station coordinates
    const stationCoordinates = [];
    for (i=0; i<station_info.length; i++) {
        station_lat = station_info[i].position_lat;
        station_long = station_info[i].position_lng;
        stationCoordinates.push([station_lat, station_long]);
    }

    console.log(stationCoordinates);
}