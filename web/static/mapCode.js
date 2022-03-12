// Function to display a map of Dublin on the homepage
function initMap() { 
            
    // Displays the map and zooms in on Dublin city center
    const dublin = { lat: 53.353510834205224, lng: -6.267703651900617}; 
    let mapOptions = {
        center: dublin, 
        zoom: 13.5,
    }

    // Puts new map into HTML div
    let map = new google.maps.Map(document.getElementById('map'), mapOptions);


        // Creates a marker on the map for each station
        const markers = coordinates.map((position, i) => {
            const marker = new google.maps.Marker({
            position:  {lat: coordinates[i].position_lat, lng: coordinates[i].position_lng},
            map : map,
            title : coordinates[i].address,
            });



            // Creates a pop-up window for each station
            const infowindow = new google.maps.InfoWindow({
                content: '<div id="content"><h4>' + coordinates[i].address + '<h4></div>',
            });

            // Add function that displays pop-up window when a marker is clicked for each station marker
            marker.addListener("click", () => {
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
}