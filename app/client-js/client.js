var map;
var restaurantMarker = "";
var markers = [];
var markersPumpy = [];
var lines = [];
var popups = [];
var click_marker = "";

var click_lat;
var click_lon;

var my_restaurant;
var my_restaurantLatLon = [];

var deliveries = [];
var deliveriesLatLon = [];

document.addEventListener("DOMContentLoaded", function(event) {
	
		L.mapbox.accessToken = 'pk.eyJ1IjoiZHVza3ltYW4iLCJhIjoiY2l2YjExc2lkMDAzeDJvbGFoMGd5bXE4eCJ9.i4-RBGH5AtH-79WmQ9UJPQ';
		map = L.mapbox.map('map', 'mapbox.streets').setView([48.15, 17.11], 12);
		
		click_lat = 48.15034013159828;
		click_lon = 17.110970020294193;
		
		fetch('query2-url', {
			method: 'POST',
			headers: new Headers({'Content-Type': 'application/json'}),
			body: JSON.stringify({
				click_lat: click_lat,
				click_lon: click_lon
			})
		}).then(successResponse2,errResponse);
		
		
		
		document.getElementById('btn-query1').addEventListener('click', () => {
			
			var street = document.getElementById('addr').value;
			console.log(street);
			console.log(my_restaurantLatLon.click_lat + " " + my_restaurantLatLon.click_lon)
			fetch('query-street-url', {
				method: 'POST',
				headers: new Headers({'Content-Type': 'application/json'}),
				body: JSON.stringify({
					street: street,
					rest_lat: my_restaurantLatLon.click_lat,
					rest_lon: my_restaurantLatLon.click_lon
				})
			}).then(successResponse3,errResponse);
		});
		
		document.getElementById('btn-query2').addEventListener('click', () => {
			console.log("lat: " + click_lat + ", lon: " + click_lon);
			
			fetch('query2-url', {
				method: 'POST',
				headers: new Headers({'Content-Type': 'application/json'}),
				body: JSON.stringify({
					click_lat: click_lat,
					click_lon: click_lon
				})
			}).then(successResponse2,errResponse);
		});
		
		document.getElementById('btn-query3').addEventListener('click', () => {
			console.log("lat: " + click_lat + ", lon: " + click_lon);
			
			deliveriesLatLon.push(JSON.stringify({
				click_lat: click_lat,
				click_lon: click_lon
			}));
			
			fetch('query2-url', {
				method: 'POST',
				headers: new Headers({'Content-Type': 'application/json'}),
				body: JSON.stringify({
					click_lat: click_lat,
					click_lon: click_lon
				})
			}).then(successResponse3,errResponse);
		});
		
		document.getElementById('btn-query4').addEventListener('click', () => {
			console.log("lat: " + click_lat + ", lon: " + click_lon);
			
			console.log(my_restaurantLatLon);
			console.log(deliveriesLatLon);
			
			document.getElementsByTagName('body')[0].classList.add("loading");
			
			fetch('query4-url', {
				method: 'POST',
				headers: new Headers({'Content-Type': 'application/json'}),
				body: JSON.stringify({
					restaurant: my_restaurant,
					deliveries: deliveries,
					restaurantLatLon: my_restaurantLatLon,
					deliveriesLatLon: deliveriesLatLon
				})
			}).then(successResponse4,errResponse);
		});
		
		
		
		document.getElementById('btn-clear').addEventListener('click', () => {
			
			markers.forEach(function(item){
				map.removeLayer(item);
			});
			
			markersPumpy.forEach(function(item){
				map.removeLayer(item);
			});

			lines.forEach(function(item){
				map.removeLayer(item);
			});
			
			popups.forEach(function(item){
				map.removeLayer(item);
			});
			
			markers = [];
			lines = [];
			popups = [];

			click_lat = "";
			click_lon = "";


			deliveries = [];
		});
		
		
		map.on('click',function(e){
			console.log(e.latlng.lat);
			console.log(e.latlng.lng);
			click_lat = e.latlng.lat;
			click_lon = e.latlng.lng;
			
			if(click_marker != "") {
				map.removeLayer(click_marker);
			}
			
			var tmp = L.marker([click_lat, click_lon],{
				icon: L.mapbox.marker.icon({
					'marker-size': 'large',
					'marker-symbol': '',
					'marker-color': '#337ab7'
				}),
			}).addTo(map);
			
			click_marker = tmp;
			
		});

		
 });
 
 
 function successResponse(response) {
	 var dubo;
	 if(response.ok) {
		 console.log(response.json().then((json) => {
			 console.log(json);
			 
			 json.rows.forEach(function(item){
					var geojson = JSON.parse(item.geojson);
					var newcoordinates = geojson.coordinates.map(function(item){
						return [item[1],item[0]];
					});
					var polyline_options = {
						color: 'red'
					};

					// Defining a polygon here instead of a polyline will connect the
					// endpoints and fill the path.
					// http://leafletjs.com/reference.html#polygon
					var polyline = L.polyline(newcoordinates, polyline_options).addTo(map);
					
					lines.push(polyline);
			 });		
			 
			 
		 }));
	 }
 }
 
  function successResponse2(response) {
	 var dubo;
	 if(response.ok) {
		 console.log(response.json().then((json) => {
			 console.log(json);
			 
			 
			 //FOR POINTS>>
			 json.rows.forEach(function(item){
					var geojson = JSON.parse(item.geojson);
					
					if(click_marker != "") {
						map.removeLayer(click_marker);
					}
					
					var tmp = L.marker([geojson.coordinates[1], geojson.coordinates[0]],{
						icon: L.mapbox.marker.icon({
							'marker-size': 'large',
							'marker-symbol': 'restaurant',
							'marker-color': '#008800'
						}),
					}).addTo(map);
					//tmp.bindPopup('<span>'+item.name+'</span>');
					my_restaurant = JSON.parse(item.id);
					console.log(my_restaurant);
					
					if(restaurantMarker != "") {
						map.removeLayer(restaurantMarker);
					}
					
					
					my_restaurantLatLon= {
						click_lat: click_lat,
						click_lon: click_lon
					};
					//console.log(my_restaurantLatLon.click_lat);
					restaurantMarker = tmp;
				});
			 
		 }));
	 }
 }
 
   function successResponse3(response) {
	 var dubo;
	 if(response.ok) {
		 console.log(response.json().then((json) => {
			 console.log(json);
			 
			 
			 //FOR POINTS>>
			 json.rows.forEach(function(item){
					var geojson = JSON.parse(item.geojson);
					
					if(click_marker != "") {
						map.removeLayer(click_marker);
					}
					
					var tmp = L.marker([geojson.coordinates[1], geojson.coordinates[0]],{
						icon: L.mapbox.marker.icon({
							'marker-size': 'large',
							'marker-symbol': 'car',
							'marker-color': '#fa0'
						}),
					}).addTo(map);
					//tmp.bindPopup('<span>'+item.name+'</span>');
					deliveries.push(JSON.parse(item.id));
					console.log(deliveries);
					markers.push(tmp);
			});
			
			
			 
		 }));
	 }
 }
 
 
    function successResponse4(response) {
	 var dubo;
	 if(response.ok) {
		 console.log(response.json().then((json) => {
			 console.log(json);
			 
			 if(click_marker != "") {
				map.removeLayer(click_marker);
			}
			
			lines.forEach(function(item){
				map.removeLayer(item);
			});
			
			popups.forEach(function(item){
				map.removeLayer(item);
			});
			
			markersPumpy.forEach(function(item){
				map.removeLayer(item);
			});
			
			var colors = [
				'#ffffcc',
				'#a1dab4',
				'#41b6c4',
				'#2c7fb8',
				'#253494',
				'#fed976',
				'#feb24c',
				'#fd8d3c',
				'#f03b20',
				'#bd0026'
			];
			 
			 json.routes.forEach(function(objectRow) {
				 
			    rand = getRandomInt(0, 9);
				
				objectRow.rows.forEach(function(item){
					var geojson = JSON.parse(item.geojson);
					var newcoordinates = geojson.coordinates.map(function(item){
						return [item[1],item[0]];
					});
					var polyline_options = {
						color: colors[rand]
					};

					var polyline = L.polyline(newcoordinates, polyline_options).addTo(map);
					
					lines.push(polyline);
				});
			 });

			 
			 json.tsp.rows.forEach(function(tspItem) {
				 
				 var iter = 0;
				 deliveries.forEach(function(deli) {
					 if(deli === tspItem.id2) {
						 
						 markers[iter].bindPopup('<span>' + tspItem.seq + '</span>');
					 
						 var popup = new L.popup({closeOnClick: false,
												offset: new L.Point(0, -20),
												class: "poradie"
												})
							.setLatLng(markers[iter].getLatLng())
							.setContent('<h2><strong>' + tspItem.seq + '</strong></h2>')
							.addTo(map);
							
						popups.push(popup);
					 }
						 
					 iter++;
				 });
				 
				 json.pumpy.forEach(function(pumpa) {
					 
					var geojson = JSON.parse(pumpa.geojson);

					var tmp = L.marker([geojson.coordinates[1], geojson.coordinates[0]],{
						icon: L.mapbox.marker.icon({
							'marker-size': 'large',
							'marker-symbol': 'fuel',
							'marker-color': '#000'
						}),
					}).addTo(map);

					markersPumpy.push(tmp);
				 });
				 
				 var x = document.getElementsByClassName("leaflet-popup-close-button");
				 console.log(x);
				 for (var i = 0; i < x.length; i++) {
					x[i].style.visibility='hidden'; //second console output
				 }
				 
				 
				 json.parkings.rows.forEach(function(parking) {
					 
					var geojson = JSON.parse(parking.st_asgeojson);
					var color;
					
					if(parking.distance > 300)
						color = '#888'
					else
						color = '#00f'
					
					var tmp = L.marker([geojson.coordinates[1], geojson.coordinates[0]],{
						icon: L.mapbox.marker.icon({
							'marker-size': 'large',
							'marker-symbol': 'parking',
							'marker-color': color
						}),
					}).addTo(map);

					markersPumpy.push(tmp);
				 });
				 
				 restaurantMarker.bindPopup('<span>Courier route total length: ' + json.totlength + ' km<br/>Estimated duration of delivery: ' + (json.totlength/40)*60 + ' min</span>');
					 
				 var popup = new L.popup({closeOnClick: false,
										offset: new L.Point(0, -20),
										class: "poradie"
										})
					.setLatLng(restaurantMarker.getLatLng())
					.setContent('<h2>Courier route total length: ' + json.totlength + ' km<br/>Estimated duration of delivery: ' + ((json.totlength/40)*60).toFixed(0) + ' min</h2>')
					.addTo(map);
					
				 popups.push(popup);

			 });

		 }));

		 document.getElementsByTagName('body')[0].classList.remove("loading");
	 }
 }
 
 function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
 
  function errResponse(response) {
	 console.log(response);
 }