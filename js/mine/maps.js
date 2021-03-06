
var map;
var mycoords = [0, 0];

function initMap() 
{
    getLocation();
}

function getLocation() 
{
    if (navigator.geolocation)
        navigator.geolocation.getCurrentPosition(showPosition);
    else
        console.log("Geolocation is not supported by this browser.");
}

function showPosition(position) 
{
    mapmeremoveloadaddmarker(position);
}

function mapmeremoveloadaddmarker(position)
{
    var lat = position.coords.latitude;
    var long = position.coords.longitude;
    mycoords = [lat, long];

    var mapOptions = {
        center: new google.maps.LatLng(lat, long),
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    
    map = new google.maps.Map(document.getElementById("map"), mapOptions);


    // add me marker
    meSpot = {
        name: "me",
        lat: lat,
        lon: long, 
        loc: "(" + lat + ", " + long + ")"
    };

    // cb(meSpot);
    removeloadaddmarker(meSpot);
}

function removeloadaddmarker (meSpot)
{
    removeload();
    addmemarker(meSpot);
}

function addmemarker (meSpot)
{
    addMarker(meSpot, me);
    addfavmarkers();
}

function addfavmarkers()
{
    var locs = JSON.parse(sessionStorage.getItem('favorites'));

    if(locs)
        for(i = 0; i < locs.length; i++)
        {
            var loc = locs[i];
            var newSpot = {
                name: loc.name,
                lat: loc.lat, 
                lon: loc.long, 
                loc: loc.city + ", " + loc.state
            };
            addMarker(newSpot, starred);
        }
}


var me = "greenfeather.png";
var found = "grayfeather.png";
var selected = "redfeather.png";
var starred = "goldfeather.png";

function addMarker(resturant, type) 
{
    //var image = 'img/flagred.png';

    if(!resturant)
        return;

    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(resturant.lat, resturant.lon),
        // position: neighborhoods[iterator],
        map: map,
        icon: {                             
            url: type                      
        },
        title: resturant.name,
        // title:"Hello World!",
        draggable: false,
        animation: google.maps.Animation.DROP,
        visible: true
    });
    //markers.push(marker);

    google.maps.event.addListener(marker, 'click', function() {
        // your magic goes here
        //alert(marker.title);
        map.setCenter(marker.getPosition());
        // map.setZoom(18);
        smoothZoom(map, 18, map.getZoom()); // call smoothZoom, parameters map, final zoomLevel, and starting zoom level
        document.getElementById("term").value = resturant.name;
        document.getElementById("location").value = resturant.loc;
        // $scope.zoom();
        angular.element(document.getElementById('main')).scope().zoom(type);
    });

    marker.setMap(map);
}

function editMarker(resturant, type) {
    //var image = 'img/flagred.png';
    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(resturant.lat, resturant.lon),
        // position: neighborhoods[iterator],
        map: map,
        icon: {                             
            url: type                      
        },
        title:resturant.name,
        // title:"Hello World!",
        draggable: false,
        // animation: google.maps.Animation.DROP,
        visible: true
    });
    //markers.push(marker);

    google.maps.event.addListener(marker, 'click', function() {
        // your magic goes here
        //alert(marker.title);
        map.setCenter(marker.getPosition());
        // map.setZoom(18);
        smoothZoom(map, 18, map.getZoom()); // call smoothZoom, parameters map, final zoomLevel, and starting zoom level

        document.getElementById("term").value = resturant.name;
        document.getElementById("location").value = resturant.loc;

        // $scope.zoom();
        angular.element(document.getElementById('peace')).scope().zoom(type);
    });

    marker.setMap(map);
}

var circle;
function drawCircle(x, y, r) 
{
    // Add the circle for this city to the map.
    if(circle)
        circle.setMap(null);
    
    circle = new google.maps.Circle({
        strokeColor: 'rgb(204,115,25)',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: 'rgb(255,207,158)',
        fillOpacity: 0.35,
        map: map,
        center: {lat: x, lng: y},
        radius: r
    });
}


// the smooth zoom function
function smoothZoom (map, max, cnt) {
    if (cnt >= max) {
        return;
    }
    else {
        z = google.maps.event.addListener(map, 'zoom_changed', function(event)
        {
            google.maps.event.removeListener(z);
            smoothZoom(map, max, cnt + 1);
        });
        setTimeout(function(){map.setZoom(cnt)}, 80); // 80ms is what I found to work well on my system -- it might not work well on all systems
    }
}  