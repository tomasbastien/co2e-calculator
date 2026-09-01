// CONST & GLOBAL VARIABLES //




let pluginOptions = {
   cropImageByInnerWH: true, // crop blank opacity from image borders
   hidden: false, // hide screen icon
   preventDownload: false, // prevent download on button click
   domtoimageOptions: {}, // see options for dom-to-image
   position: 'topright', // position of take screen icon
   screenName: "co2e-calculator-map-"+getCurrentDateTime(), // string or function
   hideElementsWithSelectors: ['.leaflet-control-container'], // by default hide map controls All els must be child of _map._container
   mimeType: 'image/png', // used if format == image,
   // caption: "TEST", // string or function, added caption to bottom of screen
   // captionFontSize: 15,
   // captionFont: 'Arial',
   // captionColor: 'black',
   // captionBgColor: 'white',
   // captionOffset: 5,
   // callback for manually edit map if have warn: "May be map size very big on that zoom level, we have error"
   // and screenshot not created
   onPixelDataFail: async function({ node, plugin, error, mapPane, domtoimageOptions }) {
       // Solutions:
       // decrease size of map
       // or decrease zoom level
       // or remove elements with big distanses
       // and after that return image in Promise - plugin._getPixelDataOfNormalMap
       return plugin._getPixelDataOfNormalMap(domtoimageOptions)
   }
}
const map = L.map('map').setView([0,0],5);

var alternate_colors=0;


var departureIcon = L.icon({
	iconUrl: './img/round-icon-green.svg',
	//shadowUrl: 'leaf-shadow.png',

	iconSize:     [75, 75], // size of the icon
	//shadowSize:   [50, 64], // size of the shadow
	//iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
	//shadowAnchor: [4, 62],  // the same for the shadow
	//popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var arrivalIcon = L.icon({
	iconUrl: './img/round-icon-red.svg',
	//shadowUrl: 'leaf-shadow.png',

	iconSize:     [75, 75], // size of the icon
	//shadowSize:   [50, 64], // size of the shadow
	//iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
	//shadowAnchor: [4, 62],  // the same for the shadow
	//popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);


var step_number = 0;


var itineraries = [];

// BASE DATAS TO UPDATE NEXT
var transportations = JSON.parse('{"last_updated" : "29/09/2024 13:19","transportations" : [{"name": "Bike","id" : 7,"profile" : "cycling-regular","emoji" : "🚲","ademe_co2e_per_km_in_g" : 0},{	"name" : "City Bus",	"id" : 9,	"profile" : "driving-car",	"emoji" : "🚌",	"ademe_co2e_per_km_in_g" : 103},{	"name": "Car",	"id" : 4,	"profile" : "driving-car",	"emoji" : "🚗",	"ademe_co2e_per_km_in_g" : 193},{	"name" : "Electric Car",	"id" : 5,	"profile" : "driving-car",	"emoji" : "🚗",	"ademe_co2e_per_km_in_g" : 103.4},{	"name" : "Autobus",	"id" : 6,	"profile" : "driving-car",	"emoji" : "🚐",	"ademe_co2e_per_km_in_g" : 35.2},{	"name" : "Regular train",	"id" : 15,	"profile" : "train",	"emoji" : "🚈",	"sncf_stop_suffix" : ":Train",	"ademe_co2e_per_km_in_g" : 24.8},{	"name" : "High-speed train",	"id" : 2,	"profile" : "train",	"emoji" : "🚄",	"sncf_stop_suffix" : ":LongDistanceTrain",	"ademe_co2e_per_km_in_g" : 1.73},{	"name" : "SNCF",	"id" : 99,	"profile" : "train-sncf",	"emoji" : "🚈",	"sncf_stop_suffix" : ":Train",	"ademe_co2e_per_km_in_g" : 0},{	"name" : "Plane",	"id" : 1,	"profile" : "plane",	"emoji" : "✈️",	"ademe_co2e_per_km_in_g" : 230}]}');

get_ademe_last_data();

// FUNCTIONS


function init_map(map){
	map.setView(map_center,map_zoom);
	if(L.control.watermark != null){
		L.control.watermark({position: 'bottomleft'}).addTo(map);
	}
	simpleMapScreenshoter = L.simpleMapScreenshoter(pluginOptions).addTo(map);
	map.addControl(new L.Control.Fullscreen());
}
function reset_map(map) {
	map.eachLayer(function (layer) {
			        map.removeLayer(layer);
			    });

	const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(map);
}

function show_options_settings(elementValue){
	passengers=document.getElementById("passengers_div");
	if (passengers != null) {
			passengers.remove();
	}

	addstep_button=document.getElementById("div-add-step");

	if ((elementValue.value == "Car") || (elementValue.value == "Electric Car")){
			const passengers_div = document.createElement("div");
			passengers_div.className = "mb-3";
			passengers_div.id="passengers_div";
			var text = document.createTextNode("Passengers : ");
			passengers_div.appendChild(text);
			var input = document.createElement("input");
			input.type = "number";
			input.min = "1";
			input.max="7";
			input.step="1";
			input.value="1";
			input.className="quantity-field border-0 text-center w-25";
			input.id="passengers";
			passengers_div.appendChild(input);
			const currentDiv = document.getElementById("div-set-passengers-number");
			document.getElementById("route-details").insertBefore(passengers_div, currentDiv);
			
	}
	if ((elementValue.value.includes("SNCF")) || (elementValue.value.includes("train"))){
		if (addstep_button != null) {
				addstep_button.style.display="none";
				for (i=0; i<=step_number+1;i++){
					delete_step();
				}
		}
	}else{
		if (addstep_button != null) {
				addstep_button.style.display="";
		}
	}
}

// UI STEP MANAGEMENT

function delete_step(){
	if (step_number > 0)
	{
		var element = document.getElementById('step-'+step_number);
		element.remove();
		element = document.getElementById('div-step-'+step_number);
		element.remove();
		element = document.getElementById('step-'+step_number+"-dropdownList");
		element.remove();
		step_number--;
	}
	if (step_number == 0){
		var x = document.getElementById("div-delete-step");
		if (x.style.display === "") {
	  		x.style.display = "none";
		}
	}
}

function add_step() {
	step_number=step_number+1;
	const new_step = document.createElement("div");
	new_step.className = "mb-3 input-group";
	new_step.id="div-step-"+step_number;
	var input = document.createElement("input");
	input.type = "text";
	input.placeholder = "Step "+step_number;
	input.id="step-"+step_number;
	input.setAttribute('list', "step-"+step_number+"-dropdownList");
	input.className = "form-control empty required";
	var datalist = document.createElement("datalist");
	datalist.id="step-"+step_number+"-dropdownList"
	new_step.appendChild(input);
	const currentDiv = document.getElementById("div-manage-step");
	document.getElementById("route-details").insertBefore(new_step, currentDiv);
	document.getElementById("route-details").insertBefore(datalist, currentDiv);

	var x = document.getElementById("div-delete-step");
	if (x.style.display === "none") {
	  x.style.display = "";
	} 

	input.addEventListener('keyup',debounce(() => {
	    //console.log('idle...')
	    queryGeocodeAPIforDropdown(input.id,input.value);
	  }, 500));

	input.addEventListener('input', function handleInput() {
  		this.classList.remove('invalid');
  		this.classList.remove('empty');
			this.classList.remove('valid');
	     if (this.value != "") {
	     	  this.classList.add('valid') // if validation is true
	     }else{
	     		this.classList.add('invalid') // if validation is false
	     }
	
	});
	input.addEventListener('click', function handleClick() {
  		this.classList.remove('invalid');
  		this.classList.remove('empty');
			this.classList.remove('valid');
	     if (this.value != "") {
	     	  this.classList.add('valid') // if validation is true
	     }else{
	     		this.classList.add('invalid') // if validation is false
	     }
	
	});
}

async function create_geojson_nominatim(locality_array) {
	var geojson_route = [];
	var route_gps = [];
	var undefined_step = false;
	document.getElementById("calculation-result").innerHTML = "";
	document.getElementById("loading").innerHTML = "<div class='text-center'><div class='spinner-border' role='status'><span class='visually-hidden'>Loading...</span></div></div>";
	for (item of locality_array) {
		if (!isValidGPSAny(item)){
			await fetch('https://nominatim.openstreetmap.org/search?q='+item+'&format=json&polygon=1&addressdetails=1', {
		    method: 'GET'
			})
			.then(gps_json => gps_json.json())
			.then(gps_json => {
				if (Object.keys(gps_json).length === 0){
					console.log(item+" was not found in the OSM database");
					document.getElementById("calculation-result").innerHTML = "<div class='alert alert-warning' role='alert'><em>"+item+"</em> was not found in the OSM database, please be more specific for it or use a nearby location</div>"
					undefined_step = true;
					document.getElementById("loading").innerHTML = "";
				}else{
				route_gps.push(gps_json);
				//console.log(gps_json[0].display_name);
				geojson_route.push("["+JSON.stringify(gps_json[0]["lon"])+','+JSON.stringify(gps_json[0]["lat"])+"]");	
				}
			});
		}else{
			if(isValidGPSDMS(item)){
				geojson_route.push("["+swapCoordinates(DMStoDD(item))+"]");
			}else{
				geojson_route.push("["+swapCoordinates(item)+"]");
			}
		}
	}
	//console.log(geojson_route.join(","));
	if (undefined_step) {
		geojson_route = []; 
	}
	return geojson_route;
}

async function create_geojson_openrouteservice(locality_array) {
	var geojson_route = [];
	var route_gps = [];
	var undefined_step = false;
	document.getElementById("calculation-result").innerHTML = "";
	document.getElementById("loading").innerHTML = "<div class='text-center'><div class='spinner-border' role='status'><span class='visually-hidden'>Loading...</span></div></div>";

	for (item of locality_array) {
		if (!isValidGPSAny(item)){
			await fetch('https://api.openrouteservice.org/geocode/search?api_key='+openrouteservice_token+'&text='+item, {
		    method: 'GET'
			})
			.then(gps_json => gps_json.json())
			.then(gps_json => {
				if (Object.keys(gps_json).length === 0){
					console.log(item+" was not found in the Openrouteservice database");
					document.getElementById("calculation-result").innerHTML = "<div class='alert alert-warning' role='alert'><em>"+item+"</em> was not found in the Openrouteservice database, please be more specific for it or use a nearby location</div>"
					undefined_step = true;
					document.getElementById("loading").innerHTML = "";
				}else{
				route_gps.push(gps_json);
				//console.log(gps_json);
				geojson_route.push(JSON.stringify(gps_json["features"][0]["geometry"]["coordinates"]));	
				}
			});
		}else{
			if(isValidGPSDMS(item)){
				geojson_route.push("["+swapCoordinates(DMStoDD(item))+"]");
			}else{
				geojson_route.push("["+swapCoordinates(item)+"]");
			}
		}
	}
	//console.log(geojson_route.join(","));
	if (undefined_step) {
		geojson_route = []; 
	}
	return geojson_route;
}

function clear_fields() {
	location.reload();
}

function revert_geolocation_input_fields() {
	var departure = document.getElementById("departure").value;
	var arrival = document.getElementById("arrival").value;
	var route_steps = [];
	route_steps[0]=departure;
	route_steps[step_number+1]=arrival;
	for (let step = 1; step <= step_number; step++) {
	 	route_steps[step]=document.getElementById("step-"+step).value;
	}
	route_steps=route_steps.reverse();
	document.getElementById("departure").value=route_steps[0];
	document.getElementById("arrival").value=route_steps[step_number+1];
	for (let step = 1; step <= step_number; step++) {
		document.getElementById("step-"+step).value=route_steps[step];
	}


}

function validate(list){
	for (item of list) {
		if (item == ""){
			document.getElementById("calculation-result").innerHTML = "<div class='alert alert-warning' role='alert'>Missing step in form</div>";
			return false;
		}
	}
	return true;
}


function get_crowfly_distance(geojson_route){
	var distance=0;
	for (i=0; i<geojson_route.length-1; i++){
			//console.log(geojson_route[i]);
			distance += getDistanceFromLatLonInm(geojson_route[i].split(",")[0].replace("[","").replace(/\"/g,""),geojson_route[i].split(",")[1].replace("]","").replace(/\"/g,""),geojson_route[i+1].split(",")[0].replace("[","").replace(/\"/g,""),geojson_route[i+1].split(",")[1].replace("]","").replace(/\"/g,""));
	}
	return(distance);
}

function get_crowfly_route(geojson_route){
	//console.log(geojson_route);
	var result = {
		"type" : "FeatureCollection",
		"bbox" : [-0.376976, 39.465088, 6.131541, 45.900415],
		"features" : [{
				"bbox" : [-0.376976, 39.465088, 6.131541, 45.900415],
				"type" : "Feature",
				"properties" : {
					"segments" : [
						{
							"distance" : 0
						}]},
				"geometry" : {
					"type" : "LineString",
					"coordinates" : []
				}
			}]
	};
	for (i=0; i<geojson_route.length-1; i++){
		//console.log(geojson_route[i].replace("[","").replace("]","").replace(/\"/g,"").split(",")[1])
		result.features[0].geometry.coordinates.push([geojson_route[i].replace("[","").replace("]","").replace(/\"/g,"").split(",")[0],geojson_route[i].replace("[","").replace("]","").replace(/\"/g,"").split(",")[1]]);
		result.features[0].geometry.coordinates.push([geojson_route[i+1].replace("[","").replace("]","").replace(/\"/g,"").split(",")[0],geojson_route[i+1].replace("[","").replace("]","").replace(/\"/g,"").split(",")[1]]);
		// var coord = geojson_route[i].split(",")[0].replace("[","").replace(/\"/g,"");
		// console.log(coord);
	}
	result.features[0].properties.segments.distance=get_crowfly_distance(geojson_route);
	//console.log(result);
	return(result);

}

//ADEME API CONVERSION FUNCTION

async function get_ademe_last_data(){
	const fullUrl = window.location.href;
	// console.log('Full URL:', fullUrl);
	await fetch(fullUrl+'/../transportations.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    transportations=data;
  })
  .catch(error => {
    console.error('Error fetching JSON:', error);
  });
}

async function get_ademe_co2(route_distance, transportation_id){

	// const result = fetch('https://impactco2.fr/api/v1/transport?km='+route_distance/1000+'&transports='+transportation_id, {
	// 				    method: 'GET',
	// 						headers: {
	// 						 'Accept': 'application/json',
	// 						 'Authorization' : "Bearer 16611846-3ae2-4ef6-8727-1fdb5ded8f61"
	// 						}
	// 				 })	
	// 				.then(ademe_output => ademe_output.json())
	// 				.then(ademe_output => {
	// 					console.log(ademe_output);
	// 					var co2_emissions = parseFloat(ademe_output.data[0].value);
	// 					//console.log("co2_emissions: "+co2_emissions);
	// 					return(co2_emissions);
	// 				})
	// 				;
	//
	console.log(transportations)
	for (var i=0 ; i < transportations.transportations.length ; i++)
			{
			    if (transportations.transportations[i]["id"] == transportation_id) {
			        var result= (transportations.transportations[i]["ademe_co2e_per_km_in_g"]/1000)*(route_distance/1000);
			    }
			}
	if(result == undefined){
			document.getElementById("loading").innerHTML = "";
			document.getElementById("calculation-result").innerHTML = "<div class='alert alert-danger' role='alert'>An error occured during CO2 conversion, please retry</div>"
		}
	return(result);
}

//OPENROUTESERVICE API ROUTE FUNCTION

async function get_openrouteservice_route(geojson_text, transportation_profile){
	var error = true;
	const result = await fetch('https://api.openrouteservice.org/v2/directions/'+transportation_profile+'/geojson', {
		    method: 'POST',
		    headers: {
		        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png',
		        'Authorization' : openrouteservice_token,
		        "Content-Type": "application/json"
		        },
		    body: geojson_text
		}).then(response => { 
			if (response.status == 200) {
				error = false;	
		  	}
		  	return response.json();
		}).then(content => {
						if (error == false){
							return content;
						}else{
							document.getElementById("loading").innerHTML = "";
							document.getElementById("calculation-result").innerHTML = "<div class='alert alert-danger' role='alert'>"+content.error.message+"</div>"
							return undefined;
						}
					})
	return result;

}


//BROUTER API ROUTE FUNCTION

async function get_brouter_route(geojson_route, transportation_profile){
	var error = true;
	var gps_path = geojson_route.join(",").replace(/\],\[/g,"|").replace(/\[/g,"").replace(/\]/g,"").replace(/\"/g,"");
	

	const result = await fetch('https://brouter.de/brouter?lonlats='+gps_path+'&profile='+transportation_profile+'&alternativeidx=0&format=geojson', {
					    method: 'GET'
					}).then(response => { 
						if (response.status == 200) {
					    	error=false;
					    	return response.json();
					  	}else{
					  		return response.text();
					  	}
					}).then(content => {
						if (error == false){
							return content;
						}else{
							document.getElementById("loading").innerHTML = "";
							if(content.includes("from-position")){
								document.getElementById("calculation-result").innerHTML = "<div class='alert alert-danger' role='alert'>Departure point is not a railway station</div>"
							}else if (content.includes("to-position")){
								document.getElementById("calculation-result").innerHTML = "<div class='alert alert-danger' role='alert'>Arrival point is not a railway station</div>"
							}
							else if (content.includes("no track found")){
								document.getElementById("calculation-result").innerHTML = "<div class='alert alert-danger' role='alert'>A provided location is not on rail tracks</div>"
							}
							else{
								document.getElementById("calculation-result").innerHTML = "<div class='alert alert-danger' role='alert'>An error occured during route processing ("+content+"), please retry</div>"
							}
							return undefined;
						}
					})
	return result;
}

function concatGeoJSON(g1, g2){
    return { 
        "type" : "LineString",
        "coordinates": g1.coordinates.concat(g2.coordinates),
        "properties":[{"length" : g1["properties"][0]["length"]+g2["properties"][0]["length"]}]
    }
}

// async function get_nearby_stations_overpass(lat,lon) {
// 	const boundingBox = calculateBoundingBox(lat, lon, 2);
// 	// console.log(boundingBox);
// 	console.log(boundingBox.bbox[0][1]+","+boundingBox.bbox[0][0]+","+boundingBox.bbox[1][1]+","+boundingBox.bbox[1][0]);

// 	const result = await fetch("https://overpass-api.de/api/interpreter?data=[out%3Ajson][timeout%3A25];%0A%0A%28%0A%20%20node%5B%22public_transport%22%3D%22stop_position%22%5D%5B%22train%22%3D%22yes%22%5D%28" + boundingBox.bbox[0][1] + "%2C" + boundingBox.bbox[0][0] + "%2C" + boundingBox.bbox[1][1] + "%2C" + boundingBox.bbox[1][0] + "%29%3B%0A%20%20way%5B%22public_transport%22%3D%22stop_position%22%5D%5B%22train%22%3D%22yes%22%5D%28" + boundingBox.bbox[0][1] + "%2C" + boundingBox.bbox[0][0] + "%2C" + boundingBox.bbox[1][1] + "%2C" + boundingBox.bbox[1][0] + "%29%3B%0A%20%20relation%5B%22public_transport%22%3D%22stop_position%22%5D%5B%22train%22%3D%22yes%22%5D%28" + boundingBox.bbox[0][0] + "%2C" + boundingBox.bbox[0][1] + "%2C" + boundingBox.bbox[1][0] + "%2C" + boundingBox.bbox[1][1] + "%29%3B%0A%29%3B%0A%0Aout%20body%3B%0A%3E%3B%0Aout%20skel%20qt%3B", {
// 					    method: 'GET'
// 					}).then(response => { 
// 						if (response.status == 200) {
// 					    	error=false;
// 					    	return response.json();
// 					  	}else{
// 					  		return response.text();
// 					  	}
// 					  });
// 	// console.log(result);
// 	return(result.elements);

// }

// async function get_nearby_airports_overpass(lat,lon) {
// 	const boundingBox = calculateBoundingBox(lat, lon, 50);
// 	// console.log(boundingBox);
// 	console.log(boundingBox.bbox[0][1]+","+boundingBox.bbox[0][0]+","+boundingBox.bbox[1][1]+","+boundingBox.bbox[1][0]);

// 	var result = await fetch("https://overpass-api.de/api/interpreter?data=[out%3Ajson][timeout%3A25];%0A%0A%28%0A%20%20way%5B%22aeroway%22%3D%22aerodrome%22%5D%28" + boundingBox.bbox[0][1] + "%2C" + boundingBox.bbox[0][0] + "%2C" + boundingBox.bbox[1][1] + "%2C" + boundingBox.bbox[1][0] + "%29%3B%0A%29%3B%0A%0Aout%20body%3B%0A%3E%3B%0Aout%20skel%20qt%3B", {
// 					method: 'GET'
// 					}).then(response => { 
// 						if (response.status == 200) {
// 					    	error=false;
// 					    	return response.json();
// 					  	}else{
// 					  		return response.text();
// 					  	}
// 					  });
// 	console.log(result.elements);
// 	// results for airports are not nodes but ways (group of node), returns the closest to the bbox center
// 	var points_to_compare = [];
// 	for (element in result.elements){
// 		if (result.elements[element].type == "way"){
// 			result2 = await fetch("https://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3B%0A%28%0A%20%20node%28"+result.elements[element].nodes[0]+"%29%3B%0A%29%3B%0Aout%20body%3B%0A%3E%3B%0Aout%20skel%20qt%3B", {
// 						method: 'GET'
// 						}).then(response => { 
// 							if (response.status == 200) {
// 						    	error=false;
// 						    	return response.json();
// 						  	}else{
// 						  		return response.text();
// 						  	}
// 						  });
// 			console.log(result2);
// 			points_to_compare.push({"lat":result2.elements[0].lat,"lon":result2.elements[0].lon});
// 		}
// 	}
// 	console.log(points_to_compare);
// 	console.log(findClosestCoordinateIndex(points_to_compare,lat,lon));
// 	return(points_to_compare[findClosestCoordinateIndex(points_to_compare,lat,lon)]);

// }

async function get_nearby_stations_openrouteservices(lat,lon) {
	const boundingBox = calculateBoundingBox(lat, lon, 2);
	// console.log(boundingBox)
	const jsonObject = {
	  "request": "pois",
	  "geometry": boundingBox,
	  "filters": {
	    "category_ids": [610]
	  },
	  "limit" : 5
	};
	const station_nearby = await fetch('https://api.openrouteservice.org/pois', {
	    method: 'POST',
	    headers: {
	        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png',
	        'Authorization' : openrouteservice_token,
	        "Content-Type": "application/json"
	        },
	    body: JSON.stringify(jsonObject)
	}).then(response => { 
		if (response.status == 200) {
			error = false;	
	  	}
	  	return response.json();
	}).then(content => {
					if (error == false){
						return content;
					}else{
						// document.getElementById("loading").innerHTML = "";
						// document.getElementById("calculation-result").innerHTML = "<div class='alert alert-danger' role='alert'>"+content.error.message+"</div>"
						return undefined;
					}
				})

	return(station_nearby.features);
}

// async function replace_locality_by_closest_rail_station(geojson_route){
// 	var geojson_stations_route=[];
// 	for (locality in geojson_route){
// 		lat = geojson_route[locality].split(",")[1].replace("]","").replace(/\"/g,"");
// 		lon = geojson_route[locality].split(",")[0].replace("[","").replace(/\"/g,"");
// 		nearby_stations = await get_nearby_stations_overpass(lat,lon);
// 		// console.log(nearby_stations)
// 		geojson_stations_route.push("["+JSON.stringify(nearby_stations[nearby_stations.length-1].lon)+','+JSON.stringify(nearby_stations[nearby_stations.length-1].lat)+"]");
// 	}
// 	return(geojson_stations_route)
// }

async function replace_locality_by_closest_rail_station(geojson_route){
	var geojson_rail_stations_route=[];
	var max_incremental_radius = 10;
	for (locality in geojson_route){
		var incremental_radius = 0;
		var nearby_rail_stations = undefined;
		lat = geojson_route[locality].split(",")[1].replace("]","").replace(/\"/g,"");
		lon = geojson_route[locality].split(",")[0].replace("[","").replace(/\"/g,"");
		// nearby_rail_stations = await get_nearby_rail_stations_overpass(lat,lon);
		while((nearby_rail_stations == undefined) && (incremental_radius <= max_incremental_radius)){
			incremental_radius++;
			console.log(incremental_radius);
			nearby_rail_stations = await searchNearbyRail_station(lat, lon, incremental_radius*1000)
		}
		if((nearby_rail_stations==undefined) && (incremental_radius == max_incremental_radius+1)){
			//means that no airport was found after overpass lookup
			document.getElementById("loading").innerHTML = "";
			document.getElementById("calculation-result").innerHTML = "<div class='alert alert-danger' role='alert'>"+"No train station was found around "+lat+","+lon+"</div>"
			return undefined;
		}
		console.log(nearby_rail_stations)
		geojson_rail_stations_route.push("["+nearby_rail_stations[0].lon+','+nearby_rail_stations[0].lat+"]");
	}
	console.log(geojson_rail_stations_route);
	return(geojson_rail_stations_route)
}

async function replace_locality_by_closest_airport(geojson_route){
	var geojson_airports_route=[];
	var max_incremental_radius = 10;
	for (locality in geojson_route){
		var incremental_radius = 0;
		var nearby_airports = undefined;
		lat = geojson_route[locality].split(",")[1].replace("]","").replace(/\"/g,"");
		lon = geojson_route[locality].split(",")[0].replace("[","").replace(/\"/g,"");
		// nearby_airports = await get_nearby_airports_overpass(lat,lon);
		while((nearby_airports == undefined) && (incremental_radius <= max_incremental_radius)){
			incremental_radius++;
			console.log(incremental_radius);
			nearby_airports = await searchNearbyAirport(lat, lon, incremental_radius*10000)
		}
		if((nearby_airports==undefined) && (incremental_radius == max_incremental_radius+1)){
			//means that no airport was found after overpass lookup
			document.getElementById("loading").innerHTML = "";
			document.getElementById("calculation-result").innerHTML = "<div class='alert alert-danger' role='alert'>"+"No airport was found around "+lat+","+lon+"</div>"
			return undefined;
		}
		console.log(nearby_airports)
		geojson_airports_route.push("["+nearby_airports[0].lon+','+nearby_airports[0].lat+"]");
	}
	console.log(geojson_airports_route);
	return(geojson_airports_route)
}

async function calculate_co2_route() {
	var departure = document.getElementById("departure").value;
	var arrival = document.getElementById("arrival").value;
	var route_steps = [];
	var route =[];
	var co2_emissions = undefined;
	route_steps[0]=departure;
	route_steps[step_number+1]=arrival;

	for (let step = 1; step <= step_number; step++) {
		route_steps[step]=document.getElementById("step-"+step).value;
	}

	document.getElementById("calculation-result").innerHTML = "";

	if(validate(route_steps)){
		document.getElementById("loading").innerHTML = "<div class='text-center'><div class='spinner-border' role='status'><span class='visually-hidden'>Loading...</span></div></div>";
		var arrival_pretty_gps_coordonates = [
				{
					"lon": "",
					"lat" : ""
				}];
		var passengers = 1;
		var transportation = document.getElementById("transportation").value;

		for (var i=0 ; i < transportations.transportations.length ; i++)
			{
			    if (transportations.transportations[i]["name"] == transportation) {
			        var transportation_id = transportations.transportations[i]["id"];
			        var transportation_profile = transportations.transportations[i]["profile"];
			        var transportation_emoji = transportations.transportations[i]["emoji"];
			    }
			}
			element=document.getElementById("passengers_div");
			if (element != null){
				passengers = document.getElementById("passengers").value;
			}

		

			geojson_route= await create_geojson_nominatim(route_steps);
			if (geojson_route.length == 0){
				geojson_route= await create_geojson_openrouteservice(route_steps);
			}
			if (geojson_route.length > 0){
				geojson_text='{"coordinates":['+geojson_route.join(',')+']}';
				arrival_pretty_gps_coordonates["lon"] = getDD2DMS(geojson_route.slice(-1)[0].split(",")[0].replace("[","").replace(/\"/g,""),"lon");
				arrival_pretty_gps_coordonates["lat"] = getDD2DMS(geojson_route.slice(-1)[0].split(",")[1].replace("]","").replace(/\"/g,""),"lat");
				//console.log("Geojson "+geojson_text);

				// IF TRANSPORTATION IS A ROAD VEHICULE
				if ((transportation_profile == "driving-car")||(transportation_profile == "cycling-regular")){
					route = await get_openrouteservice_route(geojson_text, transportation_profile);
					if (route != undefined){
						route_distance = route.features[0].properties.summary.distance;
					  	co2_emissions = await get_ademe_co2(route_distance, transportation_id);
					  }
				}
				
				if(transportation_profile == "plane"){
					geojson_route = await replace_locality_by_closest_airport(geojson_route)
					if(geojson_route != undefined){
						route = get_crowfly_route(geojson_route);
						route_distance=get_crowfly_distance(geojson_route);
						co2_emissions=await get_ademe_co2(route_distance, transportation_id);
					}
				}

				if(transportation_profile == "train"){
					geojson_route = await replace_locality_by_closest_rail_station(geojson_route)
					if(geojson_route != undefined){
						route = await get_brouter_route(geojson_route,"rail");
						//console.log(route);
						if (route != undefined){
							route_distance = route.features[0]["properties"]["track-length"];
					  		co2_emissions = await get_ademe_co2(route_distance, transportation_id);
					  	}
				  	}
				}

				//console.log(route);
				//console.log(route_distance);
				//console.log(co2_emissions);


				if (route != undefined){
				  	if(co2_emissions != undefined){
					  	var co2_emissions_individual = (co2_emissions/passengers).toFixed(2);
						document.getElementById("loading").innerHTML = "";
						itineraries.push({"departure": departure,"arrival":arrival,"geojson_route":geojson_route,"transportation":transportation,"passengers":passengers, "route":route, "distance":route_distance,"co2_emissions":co2_emissions});
						render_total(itineraries);	
					}
				}			
			}
				
		}
	}
// }

function render_total(itineraries){
	var total = {
		"co2_emissions" : 0,
		"co2_emissions_individual" : 0,
		"distance" : 0
	};
	var color_track = "";
	alternate_colors=0;
	reset_map(map);
	var routes_group = L.featureGroup().addTo(map);
	document.getElementById("calculation-result").innerHTML="";
	for (itinerary in itineraries){
		//console.log(itineraries[itinerary]["route"]);
		if (alternate_colors % 2 === 0) {
			color_track=colors[0];
		}
		else{
			color_track=colors[1];
		}
		L.geoJSON(itineraries[itinerary]["route"],{
         color: color_track,
        // weight: 5,
    	}).addTo(routes_group);;

		map.fitBounds(routes_group.getBounds());
		//Markers
		departure_point=itineraries[itinerary]["route"].features[0].geometry.coordinates[0];
		if(departure_point.length == 3){//means that altitude is also included, remove it for marker
			departure_point.pop();
		}
		arrival_point=itineraries[itinerary]["route"].features[0].geometry.coordinates[itineraries[itinerary]["route"].features[0].geometry.coordinates.length - 1];
		if(arrival_point.length == 3){//means that altitude is also included, remove it for marker
			arrival_point.pop();
		}
		L.marker(departure_point.toReversed(), {icon: departureIcon}).addTo(map);
		L.marker(arrival_point.toReversed(), {icon: arrivalIcon}).addTo(map);
		total["co2_emissions"]=parseFloat(total["co2_emissions"])+parseFloat(itineraries[itinerary]["co2_emissions"]);
		total["co2_emissions_individual"]=parseFloat(total["co2_emissions_individual"])+(parseFloat(itineraries[itinerary]["co2_emissions"])/parseFloat(itineraries[itinerary]["passengers"]));
		total["distance"]=parseFloat(total["distance"])+parseFloat(itineraries[itinerary]["distance"]);
		for (var i=0 ; i < transportations.transportations.length ; i++)
		{
		    if (transportations.transportations[i]["name"] == itineraries[itinerary]["transportation"]) {
		        var transportation_emoji = transportations.transportations[i]["emoji"];

		    }
		}
		distance_kms=(parseFloat(itineraries[itinerary]["distance"])/1000).toFixed(2);
		var newNode = document.createElement('div');
		newNode.className = "mb-3";
		//var content="<button type='button' class='btn btn-danger btn-sm' onclick='remove_route(itineraries,"+itinerary+")'>Delete</button> <strong>#"+itinerary+"</strong> "+transportation_emoji+" <strong>"+itineraries[itinerary]["departure"]+"</strong> - <strong>"+itineraries[itinerary]["arrival"]+"</strong> ("+itineraries[itinerary]["distance"]+" kms), <strong>"+itineraries[itinerary]["passengers"]+"</strong> 👤 = <strong>"+(itineraries[itinerary]["co2_emissions"]/itineraries[itinerary]["passengers"]).toFixed(2)+" kgCO2e/pers";
		var content="<button type='button' class='btn btn-danger btn-sm' onclick='remove_route(itineraries,"+itinerary+")'><i class='fa fa-times'></i></button> <strong>#"+itinerary+"</strong> "+transportation_emoji+" <strong>"+itineraries[itinerary]["departure"]+"</strong> - <strong>"+itineraries[itinerary]["arrival"]+"</strong> ("+distance_kms+" kms), <strong>"+itineraries[itinerary]["passengers"]+"</strong> 👤 = <strong>"+(itineraries[itinerary]["co2_emissions"]/itineraries[itinerary]["passengers"]).toFixed(2)+" kgCO2e/pers";
		newNode.innerHTML = content;
		document.getElementById("calculation-result").appendChild(newNode);
		alternate_colors++;
	}
	total_kms=(parseFloat(total["distance"])/1000).toFixed(2);
	var horizontal_line = document.createElement('hr');
	var total_div = document.createElement('div');
	total_div.className = "mb-3 d-flex align-items-center justify-content-center";
	var content_total = "<h5 align='center'id='total_text'>TOTAL : "+total_kms+" kms"+", "+total["co2_emissions"].toFixed(2)+" kgCO2e 🌍 ("+total["co2_emissions_individual"].toFixed(2)+"kgCO2e/pers) <button class='btn btn-secondary btn-sm' id='copyTotalButton' onclick='copyTotalText(this)' title='Copy to clipboard'><i class='fa fa-clone'></i></button></h5>"
	total_div.innerHTML=content_total;
	document.getElementById("calculation-result").appendChild(horizontal_line);
	document.getElementById("calculation-result").appendChild(total_div);
	alternatives_button=document.getElementById("greener-alternatives");	
	if (alternatives_button != null) {
				alternatives_button.style.display="";
				// alternatives_button.onclick = function() {
            // 	window.location.href = 'https://www.tictactrip.eu/search/annecy/valence';
        		// };
		}
}

function remove_route(itineraries,id){
	removed=itineraries.splice(id,1);
	//console.log(itineraries);
	render_total(itineraries);
}


// DROPDOWN FUNCTIONS

function debounce(fn, duration) {
  var timer;
  return function() {
    clearTimeout(timer);
    timer = setTimeout(fn, duration)
  }
}

function populateDropdown(propertyNames, step) {
  var dropdown = document.getElementById(step+"-dropdownList");
  // Clear existing options
  dropdown.innerHTML = "";
  // Create and append new options
  propertyNames.forEach(function (propertyName) {
    var listItem = document.createElement("option");
    listItem.textContent = propertyName;
    listItem.classList="dropdown-item";
    listItem.addEventListener("click", function () {
      inputField.value = propertyName;
      dropdown.parentNode.classList.remove("open");
    });
    dropdown.appendChild(listItem);
  });
}

function queryGeocodeAPIforDropdown(step,inputText) {
  const dropdownList = document.getElementById(step+'-dropdownList');
  dropdownList.innerHTML = ''; // Clear previous results
  // Make an API request
  fetch('https://api.openrouteservice.org/geocode/autocomplete?api_key='+openrouteservice_token+'&text=${encodeURIComponent(inputText)}')
  // fetch(`https://photon.komoot.io/api/?q==${encodeURIComponent(inputText)}`)
    .then(response => response.json())
    .then(data => {
      //console.log(data);
      // Extract property names from the API response
      var propertyNames = [];
      data.features.forEach(function (feature) {
        //console.log(feature);
        propertyName=feature.properties.label;
        if (!propertyNames.includes(propertyName)) {
          propertyNames.push(propertyName);
        }
      });
    // Populate the dropdown with property names
    populateDropdown(propertyNames,step);
  })
  .catch(function (error) {
    console.log(error);
  });
}


// OTHERS FUNCTIONS

function getDistanceFromLatLonInm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c * 1000; // Distance in m
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function popup(text){
	alert(text);
}

function getDD2DMS(dms, type){

    var sign = 1, Abs=0;
    var days, minutes, secounds, direction;

    if(dms < 0)  { sign = -1; }
    Abs = Math.abs( Math.round(dms * 1000000.));
    //Math.round is used to eliminate the small error caused by rounding in the computer:
    //e.g. 0.2 is not the same as 0.20000000000284
    //Error checks
    if(type == "lat" && Abs > (90 * 1000000)){
        //alert(" Degrees Latitude must be in the range of -90. to 90. ");
        return false;
    } else if(type == "lon" && Abs > (180 * 1000000)){
        //alert(" Degrees Longitude must be in the range of -180 to 180. ");
        return false;
    }

    days = Math.floor(Abs / 1000000);
    minutes = Math.floor(((Abs/1000000) - days) * 60);
    secounds = ( Math.floor((( ((Abs/1000000) - days) * 60) - minutes) * 100000) *60/100000 ).toFixed(3);
    days = days * sign;
    if(type == 'lat') direction = days<0 ? 'S' : 'N';
    if(type == 'lon') direction = days<0 ? 'W' : 'E';
    //else return value     
    return (days * sign) + 'º ' + minutes + "' " + secounds + "'' " + direction;
}


//CHATGPT GENERATED FUNCTIONS

async function searchNearbyRail_station(latitude, longitude, radius) {
	console.log(latitude+","+longitude);
  // Step 1: Set up the Overpass API endpoint
  const overpassEndpoint = "https://api-overpass.pikamap.fr/api/interpreter";

  // Step 2: Create a function to query the Overpass API
  const query = `[out:json];(
    node["public_transport"="stop_position"]["train"="yes"](around:${radius}, ${latitude},${longitude});
    way["public_transport"="stop_position"]["train"="yes"](around:${radius}, ${latitude},${longitude});
    relation["public_transport"="stop_position"]["train"="yes"](around:${radius}, ${latitude},${longitude});
  );(._;>;);out meta qt 1;`;

  const url = `${overpassEndpoint}?data=${encodeURIComponent(query)}`;

  try {
  	var rail_stations=[];
    const response = await fetch(url);
    const data = await response.json();

    console.log(data)

    // Step 4: Parse the API response and extract rail_station information
    if(data.elements.length != 0){
    	rail_stations = data.elements;
    }else{
    	return undefined;
    }
    

    return rail_stations.map((rail_station) => ({
      lat: rail_station.lat,
      lon: rail_station.lon,
    }));
  } catch (error) {
    console.error("Error fetching nearby rail_stations:", error);
    return undefined;
  }
}

async function searchNearbyAirport(latitude, longitude, radius) {
	console.log(latitude+","+longitude);
  // Step 1: Set up the Overpass API endpoint
  const overpassEndpoint = "https://overpass-api.de/api/interpreter";

  // Step 2: Create a function to query the Overpass API
  const query = `[out:json];(
    node["aeroway"="aerodrome"](around:${radius}, ${latitude},${longitude});
    way["aeroway"="aerodrome"](around:${radius}, ${latitude},${longitude});
    relation["aeroway"="aerodrome"](around:${radius}, ${latitude},${longitude});
  );(._;>;);out meta qt 1;`;

  const url = `${overpassEndpoint}?data=${encodeURIComponent(query)}`;

  try {
  	var airports=[];
    const response = await fetch(url);
    const data = await response.json();

    console.log(data)

    // Step 4: Parse the API response and extract airport information
    if(data.elements.length != 0){
    	airports = data.elements;
    }else{
    	return undefined;
    }
    

    return airports.map((airport) => ({
      lat: airport.lat,
      lon: airport.lon,
    }));
  } catch (error) {
    console.error("Error fetching nearby airports:", error);
    return undefined;
  }
}


function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371; // Earth's radius in kilometers

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadiusKm * c;

  return distance;
}

function findClosestCoordinateIndex(coordinatesArray, latRef, lonRef) {
  if (!Array.isArray(coordinatesArray) || coordinatesArray.length === 0) {
    throw new Error('Invalid coordinates array or empty.');
  }

  let closestIndex = 0;
  let closestDistance = calculateHaversineDistance(
    latRef,
    lonRef,
    coordinatesArray[0].lat,
    coordinatesArray[0].lon
  );

  for (let i = 1; i < coordinatesArray.length; i++) {
    const currentDistance = calculateHaversineDistance(
      latRef,
      lonRef,
      coordinatesArray[i].lat,
      coordinatesArray[i].lon
    );

    if (currentDistance < closestDistance) {
      closestDistance = currentDistance;
      closestIndex = i;
    }
  }

  return closestIndex;
}


function calculateBoundingBox(latitude, longitude, distance) {
  const earthRadius = 6371; // Earth's radius in kilometers

  // Convert latitude and longitude from degrees to radians
  const latRad = latitude * (Math.PI / 180);
  const lonRad = longitude * (Math.PI / 180);

  // Convert distance from kilometers to radians
  const distanceRad = distance / earthRadius;

  // Calculate minimum and maximum latitudes for the bounding box
  const minLat = latRad - distanceRad;
  const maxLat = latRad + distanceRad;

  // Calculate minimum and maximum longitudes for the bounding box
  const minLon = lonRad - Math.asin(Math.sin(distanceRad) / Math.cos(latRad));
  const maxLon = lonRad + Math.asin(Math.sin(distanceRad) / Math.cos(latRad));

  // Convert back from radians to degrees
  const minLatDeg = minLat * (180 / Math.PI);
  const maxLatDeg = maxLat * (180 / Math.PI);
  const minLonDeg = minLon * (180 / Math.PI);
  const maxLonDeg = maxLon * (180 / Math.PI);

  // Return the bounding box coordinates
  return {
  	bbox: [[minLonDeg,minLatDeg],[maxLonDeg,maxLatDeg]]
  };
}

// // Example usage:
// const latitude = 40.7128; // Replace with your desired latitude
// const longitude = -74.0060; // Replace with your desired longitude
// const distanceInKm = 5; // 5 kilometers

// const boundingBox = calculateBoundingBox(latitude, longitude, distanceInKm);
// console.log(boundingBox);

function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');

  const formattedDateTime = `${year}-${month}-${day}_${hour}-${minute}-${second}`;
  return formattedDateTime;
}

function isValidGPS(str) {
  // Regex pattern to match decimal degrees
  const regex = /^-?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*-?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
  const match = regex.exec(str);
  if (!match) {
    return false;
  }
  // Parse latitude and longitude from match
  const latitude = parseFloat(match[1]);
  const longitude = parseFloat(match[4]);
  // Check that latitude and longitude are within valid range
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return false;
  }
  return true;
}

function isValidGPSDMS(str) {
  // Regex pattern to match DMS format
  const regex = /^([NS])?(\d{1,3})°(\d{1,2})'(\d{1,2}(\.\d+)?)\"\s*([EW])?(\d{1,3})°(\d{1,2})'(\d{1,2}(\.\d+)?)?\"$/;
  const match = regex.exec(str);
  if (!match) {
    return false;
  }
  // Parse latitude and longitude from match
  const latitude = parseFloat(match[2]) + parseFloat(match[3])/60 + parseFloat(match[4])/3600;
  const longitude = parseFloat(match[7]) + parseFloat(match[8])/60 + parseFloat(match[9])/3600;
  // Check that latitude and longitude are within valid range
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return false;
  }
  return true;
}

function isValidGPSAny(str) {
  // Check if string is valid GPS coordinate in decimal degrees format
  if (isValidGPS(str)) {
    return true;
  }
  // Check if string is valid GPS coordinate in DMS format
  if (isValidGPSDMS(str)) {
    return true;
  }
  // If string is not a valid GPS coordinate in either format, return false
  return false;
}

function DMStoDD(dms) {
  // Split DMS string into components
  const parts = dms.split(/[^\d\w\.]+/);
  
  // Extract degrees, minutes, and seconds from components
  const degrees = parseFloat(parts[0]);
  const minutes = parseFloat(parts[1]);
  const seconds = parseFloat(parts[2]);

  // Calculate decimal degrees value
  let dd = degrees + (minutes / 60) + (seconds / 3600);

  // Check if coordinate is in southern or western hemisphere and flip sign
  if (parts[3] === "S" || parts[3] === "W") {
    dd = -dd;
  }

  return dd;
}


function swapCoordinates(str) {
  const dd = str.split(",").map(parseFloat);
  
  if (dd.length !== 2) {
    throw new Error("Invalid coordinate format");
  }
  
  const swapped = [dd[1], dd[0]];
  return swapped.join(",");
}

function copyTotalText(button) {
   var content = document.getElementById("total_text");
   var contentToCopy = content.innerText;

   var tempTextArea = document.createElement("textarea");
   tempTextArea.value = contentToCopy;

   document.body.appendChild(tempTextArea);

   tempTextArea.select();
   document.execCommand("copy");

   document.body.removeChild(tempTextArea);

   //alert("Text copied to clipboard.");
   button.classList.remove("btn-secondary");
   button.classList.add("btn-success");
   button.innerHTML="<i class='fa fa-check'></i>"
   button.title="Copied !"

   setTimeout(function() {
	    document.getElementById("copyTotalButton").classList.remove("btn-success");
	    document.getElementById("copyTotalButton").classList.add("btn-secondary");
	    document.getElementById("copyTotalButton").innerHTML="<i class='fa fa-clone'></i>"
	    document.getElementById("copyTotalButton").title="Copy to clipboard"
	}, 1500);
}


// MAIN

var x = document.getElementById("calculation-result");
if (x.style.display === "none") {
  x.style.display = "block";
} 			



//LISTENERS

var departure = document.getElementById('departure');
departure.addEventListener('keyup',debounce(() => {
    if(departure.value != ""){
    	queryGeocodeAPIforDropdown(departure.id,departure.value);
    }

  }, 500));

var arrival = document.getElementById('arrival');
arrival.addEventListener('keyup',debounce(() => {
    if(arrival.value != ""){
    	queryGeocodeAPIforDropdown(arrival.id,arrival.value);
    }
  }, 500));

document.getElementById('departure').oninput = function(){
		 this.classList.remove('empty');
		 this.classList.remove('invalid');
		 this.classList.remove('valid');
     if (this.value != "") {
     	  this.classList.add('valid') // if validation is true
     }else{
     		this.classList.add('invalid') // if validation is false
     }
}

document.getElementById('arrival').oninput = function(){
		 this.classList.remove('empty');
		 this.classList.remove('invalid');
		 this.classList.remove('valid');
     if (this.value != "") {
     	  this.classList.add('valid') // if validation is true
     }else{
     		this.classList.add('invalid') // if validation is false
     }
}

document.getElementById('departure').onclick = function(){
		 this.classList.remove('empty');
		 this.classList.remove('invalid');
		 this.classList.remove('valid');
     if (this.value != "") {
     	  this.classList.add('valid') // if validation is true
     }else{
     		this.classList.add('invalid') // if validation is false
     }
}

document.getElementById('arrival').onclick = function(){
		 this.classList.remove('empty');
		 this.classList.remove('invalid');
		 this.classList.remove('valid');
     if (this.value != "") {
     	  this.classList.add('valid') // if validation is true
     }else{
     		this.classList.add('invalid') // if validation is false
     }
}

document.getElementById('transportation').oninput = function(){
		 this.classList.remove('empty');
		 this.classList.remove('invalid');
		 this.classList.remove('valid');
     if (this.value != "") {
     	  this.classList.add('valid') // if validation is true
     }else{
     		this.classList.add('invalid') // if validation is false
     }
}

