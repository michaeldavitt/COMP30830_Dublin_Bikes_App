// Function to display a map of Dublin on the homepage
function initMap() { 
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
                const infowindow = new google.maps.InfoWindow({
                    content: '<div id="station_popup_' +
                    station_info[i].number +
                    '" "class="station_popup"><h4>' + 
                    station_info[i].address + 
                    '</h4></div>',
                });

                // Add function that displays pop-up window when a marker is clicked for each station marker
                marker.addListener("click", () => {
                    updateInfoWindow(marker.title);
                    infowindow.open({
                        anchor: marker,
                        map,
                        shouldFocus: false,
                    });
                });
                return marker;
            });
            

        // Cluster markers together
        const markerCluster = new markerClusterer.MarkerClusterer({ map, markers });   

    })
    .done(function(){
        console.log("second success");
    })
    .fail(function(){
        console.log("error");
    })
    .always(function(){
        console.log("complete")
    })         
}

// Function which sends station information to the info window popup
function updateInfoWindow(station_id){
    var jqxhr = $.getJSON("/availability/" + station_id, function(data){
        var availabilityData = data;

        // Adds number of available bikes for the given station
        infoWindowDiv = document.getElementById("station_popup_" + station_id);
        bikeAvailabilityElement = document.createElement("p");
        bikeAvailability = document.createTextNode("Available Bikes: " + availabilityData[0]["available_bikes"]);
        bikeAvailabilityElement.appendChild(bikeAvailability);
        infoWindowDiv.appendChild(bikeAvailabilityElement);

        // Adds number of available parking spaces for the given station
        parkingAvailabilityElement = document.createElement("p");
        parkingAvailability = document.createTextNode("Available Parking Spaces: " + availabilityData[0]["available_stands"]);
        parkingAvailabilityElement.appendChild(parkingAvailability);
        infoWindowDiv.appendChild(parkingAvailabilityElement);
    })
    .done(function(){
        console.log("second success");
    })
    .fail(function(){
        console.log("error");
    })
    .always(function(){
        console.log("complete");
    })
}