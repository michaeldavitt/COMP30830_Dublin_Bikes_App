// Function to display a map of Dublin on the homepage
function initMap() { 
    var currentlyOpenPopup;

    var jqxhr = $.getJSON("/station_info", function(data){
        console.log("success", data);
        var station_info = data;

        // Displays the map and zooms in on Dublin city center
        const dublin = { lat: 53.353510834205224, lng: -6.267703651900617}; 
        let mapOptions = {
            center: dublin, 
            zoom: 13.5,
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

    })
    .fail(function(){
        console.log("error");
    })        
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