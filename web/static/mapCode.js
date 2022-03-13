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
                title : station_info[i].address,
                });



                // Creates a pop-up window for each station
                const infowindow = new google.maps.InfoWindow({
                    content: '<div id="content"><h4>' + station_info[i].address + '<h4></div>',
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