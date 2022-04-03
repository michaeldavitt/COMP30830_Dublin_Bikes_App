// Generates a list of bike stations for stations.html
function createStationList(){
    // getting a list of the stations from flask
    var jqxhr = $.getJSON("/station_info", function(data){

        // Isolate the station list
        stationList = document.getElementById("station_list");

        console.log("success", data);
        var stations = data;

        // Loop through each station
        for (station_num in stations){
            // Create a new list item
            const listItem = document.createElement("li");

            // Creates a link to the specific station page
            const linkItem = document.createElement("a");
            linkItem.href = "station/" + stations[station_num].number;

            // sets text for each list item equal to station name
            const stationInfo = document.createTextNode(stations[station_num].address);
            
            // adds clickable station lists to page
            listItem.appendChild(stationInfo);
            linkItem.appendChild(listItem);
            stationList.appendChild(linkItem);
        }
    })
    .fail(function(){
        console.log("error");
    })
}

// Filter the stations list in stations.html - reference: https://www.w3schools.com/howto/howto_js_filter_lists.asp
function filterStationList() {
    // Declare variables
    var input, filter, ul, li, a, i, txtValue;
    input = document.getElementById('myInput');
    filter = input.value.toUpperCase();
    ul = document.getElementById("station_list");
    a = ul.getElementsByTagName('a');

    // Loop through all list items, and hide those who don't match the search query
    for (i = 0; i < a.length; i++) {
        li = a[i].getElementsByTagName("li")[0];
        txtValue = li.textContent || li.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            a[i].style.display = "";
        } else {
            a[i].style.display = "none";
        }
    }
}

// displays realtime information for a specific station
function displayStationInfo() {
    // getting the name of the station
    var jqxhr = $.getJSON("/station_info/" + station_id, function(data){
        console.log("success", data);
        var stationInfo = data;
        
        // Display header = name of the station
        const stationHeader = document.createTextNode(stationInfo[0]["address"])
        document.getElementById("station_title").appendChild(stationHeader);
        
        // extracts container for real time station information
        const stationInfoList = document.getElementById("station_info");

        // Display real time availability information
        var jqxhr = $.getJSON("/availability/" + station_id, function(data){
            console.log("success", data);
            var availability = []
            availability = data;
            
            // Display currently available bikes
            populateCurrentAvailability("Currently Available Bikes", "available_bikes", availability, stationInfoList);

            // Display currently available stations
            populateCurrentAvailability("Currently Available Parking Spaces", "available_stands", availability, stationInfoList);           

        })
        .fail(function(){
            console.log("error");
        })
    })
    .fail(function(){
        console.log("error");
    })
}

// inserts availability data onto the page 
function populateCurrentAvailability(header, key, availability, stationInfoList){
    // creates container for availability data
    var availabilityContainer = document.createElement("div");
    availabilityContainer.className = "col-sm-6 availability_data";
    
    //creates header for availability data 
    var availabilityHeader = document.createElement("p");
    availabilityHeader.innerHTML = header;

    //inserts quantity into availability data
    var availabilityCount = document.createElement("p");
    availabilityCount.innerHTML = availability[0][key];

    // displays elements on the page
    availabilityContainer.appendChild(availabilityHeader);
    availabilityContainer.appendChild(availabilityCount);
    stationInfoList.appendChild(availabilityContainer);

}

// Function to create the bike availability chart
function displayBikeAvailabilityChart(day){
    var day = day;

    // gets hourly bike availability for each day of the week 
    var jqxhr = $.getJSON("/hourly_availability/available_bikes/" + station_id + "/" + day, function(data){
        var availabilityData = data;
        
        // Create the data table.
        var chart_data = new google.visualization.DataTable();
        chart_data.addColumn("string", "Hour");
        chart_data.addColumn("number", "# Bikes");
        chart_data.addRows(availabilityData["data"]);


        // Set chart options.
        var options = {
                title : "Average Available Bikes on " + day,
                width : 1000,
                height : 500};

        // Instantiate and draw a chart, passing in some options.
        var chart = new google.visualization.ColumnChart(document.getElementById("chartDivBikes"));
        chart.draw(chart_data, options);

        if(availabilityData.length!=0){
            document.getElementById("loader").style.display = "none";
            document.getElementById("information").style.display = "block";
        }
    })
    .fail(function(){
        console.log("Error");
    });    
}

// Function to create the parking space availability chart
function displayStationAvailabilityChart(day){
    var day = day;

    // gets hourly parking space availability for each day of the week 
    var jqxhr = $.getJSON("/hourly_availability/available_stands/" + station_id + "/" + day, function(data){
        var availabilityData = data;

        // Create the data table.
        var chart_data = new google.visualization.DataTable();
        chart_data.addColumn("string", "Hour");
        chart_data.addColumn("number", "# Spaces");
        chart_data.addRows(availabilityData["data"]);


        // Set chart options.
        var options = {
                title : "Average Available Parking Spaces on " + day,
                width : 1000,
                height : 500};

        // Instantiate and draw a chart, passing in some options.
        var chart = new google.visualization.ColumnChart(document.getElementById("chartDivStations"));
        chart.draw(chart_data, options);
    })
    .fail(function(){
        console.log("Error");
    });    
}