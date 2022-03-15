// Isolate the station list
stationList = document.getElementById("station_list");

function createStationList(){
    var jqxhr = $.getJSON("/station_info", function(data){
        console.log("success", data);
        var stations = data;

        // Loop through each station
        for (station_num in stations){
            // Create a new list item
            const listItem = document.createElement("li");
            const linkItem = document.createElement("a")
            linkItem.href = "station/" + stations[station_num].number;
            const stationInfo = document.createTextNode(stations[station_num].address);
            listItem.appendChild(stationInfo);
            linkItem.appendChild(listItem);
            stationList.appendChild(linkItem);
        }
    })
    .fail(function(){
        console.log("error");
    })
}

// Filter the stations list - reference: https://www.w3schools.com/howto/howto_js_filter_lists.asp
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

function displayStationInfo(){

    var jqxhr = $.getJSON("/station_info/" + station_id, function(data){
        console.log("success", data);
        var stationInfo = data;

        // Display header
        const stationHeader = document.createTextNode(stationInfo[0]["address"])
        document.getElementById("station_title").appendChild(stationHeader);
        
        const stationInfoList = document.getElementById("station_info");

        // Display real time availability information
        var jqxhr = $.getJSON("/availability/" + station_id, function(data){
            console.log("success", data);
            var availability = data;

            // Display currently available bikes
            var availableBikesElement = document.createElement("div");
            availableBikesElement.className = "col-sm-6 availability_data";
            var availableBikesHeader = document.createElement("p");
            availableBikesHeader.innerHTML = "Currently Available Bikes";
            var availableBikesCount = document.createElement("p");
            availableBikesCount.innerHTML = availability[0]["available_bikes"];
            availableBikesElement.appendChild(availableBikesHeader);
            availableBikesElement.appendChild(availableBikesCount);
            stationInfoList.appendChild(availableBikesElement);

            // Display currently available stations
            var availableStationsElement = document.createElement("div");
            availableStationsElement.className = "col-sm-6 availability_data";
            var availableStationsHeader = document.createElement("p");
            availableStationsHeader.innerHTML = "Currently Available Parking Spaces";
            var availableStationsCount = document.createElement("p");
            availableStationsCount.innerHTML = availability[0]["available_stands"];
            availableStationsElement.appendChild(availableStationsHeader);
            availableStationsElement.appendChild(availableStationsCount);
            stationInfoList.appendChild(availableStationsElement);

        })
        .fail(function(){
            console.log("error");
        })
    })
    .fail(function(){
        console.log("error");
    })
}


// Function to create the bike availability chart
function displayBikeAvailabilityChart(day){
    var day = day;
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
    })
    .fail(function(){
        console.log("Error");
    });    
}

// Function to create the bike availability chart
function displayStationeAvailabilityChart(day){
    var day = day;
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