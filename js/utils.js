// CONST & GLOBAL VARIABLES //
const map = L.map('map').setView([45.899182,6.128679],7);
var step_number = 0;
const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var itineraries = [];
var transportations = [
				{
					"name": "Bike",
					"id" : 7,
					"profile" : "cycling-regular",
					"emoji" : "🚲"
				},
				{
					"name" : "City Bus",
					"id" : 9,
					"profile" : "driving-car",
					"emoji" : "🚌"
				},
				{
					"name": "Car",
					"id" : 4,
					"profile" : "driving-car",
					"emoji" : "🚗"
				},
				{
					"name" : "Electric Car",
					"id" : 5,
					"profile" : "driving-car",
					"emoji" : "🚗"
				},
				{
					"name" : "Autobus",
					"id" : 6,
					"profile" : "driving-car",
					"emoji" : "🚐"
				},
				{
					"name" : "Regular train",
					"id" : 15,
					"profile" : "train",
					"emoji" : "🚈",
					"sncf_stop_suffix" : ":Train"
				},
				{
					"name" : "High-speed train",
					"id" : 2,
					"profile" : "train",
					"emoji" : "🚄",
					"sncf_stop_suffix" : ":LongDistanceTrain"
				},
				{
					"name" : "SNCF",
					"id" : 99,
					"profile" : "train-sncf",
					"emoji" : "🚈",
					"sncf_stop_suffix" : ":Train"
				},
				{
					"name" : "Plane",
					"id" : 1,
					"profile" : "plane",
					"emoji" : "✈️"
				},


			];

// FUNCTIONS



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
		const element = document.getElementById('step-'+step_number);
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
	new_step.className = "mb-3";
	var input = document.createElement("input");
	input.type = "text";
	input.placeholder = "Step "+step_number;
	input.id="step-"+step_number;
	input.type="search";
	new_step.appendChild(input);
	input.className = "form-control empty required";
	const currentDiv = document.getElementById("div-manage-step");
	document.getElementById("route-details").insertBefore(new_step, currentDiv);

	var x = document.getElementById("div-delete-step");
	if (x.style.display === "none") {
	  x.style.display = "";
	} 

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

async function create_geojson(locality_array) {
	var geojson_route = [];
	var route_gps = [];
	var undefined_step = false;
	for (item of locality_array) {
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
	    }
	//console.log(geojson_route.join(","));
	if (undefined_step) {
		geojson_route = []; 
	}
	return geojson_route;
}

function clear_fields() {
	location.reload();
	// console.log("Clearing fields");
	// document.getElementById('departure').value = '';
	// document.getElementById('arrival').value = '';
	// for (let step = 1; step <= step_number; step++) {
	// 	element=document.getElementById("step-"+step);
	// 	element.remove();
	// }
	// step_number=0;
	// reset_map(map);
	// route_steps = [];
	// map.setView([45.899182,6.128679],9);
	// document.getElementById("calculation-result").innerHTML = "";
	// passengers=1;
	// document.getElementById('transportation').value = 'Bike';
	// element=document.getElementById("passengers_div");
	// if (element != null){
	// 	element.remove();
	// }

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
			console.log(geojson_route[i]);
			distance += getDistanceFromLatLonInm(geojson_route[i].split(",")[0].replace("[","").replace(/\"/g,""),geojson_route[i].split(",")[1].replace("]","").replace(/\"/g,""),geojson_route[i+1].split(",")[0].replace("[","").replace(/\"/g,""),geojson_route[i+1].split(",")[1].replace("]","").replace(/\"/g,""));
	}
	return(distance);
}

function get_crowfly_route(geojson_route){
	console.log(geojson_route);
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
		console.log(geojson_route[i].replace("[","").replace("]","").replace(/\"/g,"").split(",")[1])
		result.features[0].geometry.coordinates.push([geojson_route[i].replace("[","").replace("]","").replace(/\"/g,"").split(",")[0],geojson_route[i].replace("[","").replace("]","").replace(/\"/g,"").split(",")[1]]);
		result.features[0].geometry.coordinates.push([geojson_route[i+1].replace("[","").replace("]","").replace(/\"/g,"").split(",")[0],geojson_route[i+1].replace("[","").replace("]","").replace(/\"/g,"").split(",")[1]]);
		// var coord = geojson_route[i].split(",")[0].replace("[","").replace(/\"/g,"");
		// console.log(coord);
	}
	result.features[0].properties.segments.distance=get_crowfly_distance(geojson_route);
	console.log(result);
	return(result);

}

//ADEME API CONVERSION FUNCTION

async function get_ademe_co2(route_distance, transportation_id){

	const result = fetch('https://api.monimpacttransport.fr/beta/getEmissionsPerDistance?km='+route_distance/1000+'&transportations='+transportation_id, {
					    method: 'GET'
					})
					.then(ademe_output => ademe_output.json())
					.then(ademe_output => {
						var co2_emissions = parseFloat(ademe_output[0].emissions.kgco2e);
						//console.log("co2_emissions: "+co2_emissions);
						return(co2_emissions);
					});
	if(result == undefined){
			document.getElementById("loading").innerHTML = "";
			document.getElementById("calculation-result").innerHTML = "<div class='alert alert-danger' role='alert'>An error occured during CO2 conversion, please retry</div>"
		}
	return(result);
}

//OPENROUTESERVICE API ROUTE FUNCTION

async function get_openrouteservice_route(geojson_text, transportation_profile){
	const result = await fetch('https://api.openrouteservice.org/v2/directions/'+transportation_profile+'/geojson', {
		    method: 'POST',
		    headers: {
		        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png',
		        'Authorization' : '5b3ce3597851110001cf62483a8b9711fdbd49c0b11b4087ad9a32ff',
		        "Content-Type": "application/json"
		        },
		    body: geojson_text
		}).then(response => { 
			if (response.status == 200) {
		    return response.json();
		  }
		  throw new Error('Something went wrong');
		})

		if(result == undefined){
			document.getElementById("loading").innerHTML = "";
			document.getElementById("calculation-result").innerHTML = "<div class='alert alert-danger' role='alert'>An error occured during route processing, please retry</div>"
		}
	return(result);

}


//BROUTER API ROUTE FUNCTION

async function get_brouter_route(geojson_route, transportation_profile){
	var error = true;
	var gps_path = geojson_route.join(",").replace(/\],\[/g,"|").replace(/\[/g,"").replace(/\]/g,"").replace(/\"/g,"");
	const result = fetch('https://brouter.de/brouter?lonlats='+gps_path+'&profile='+transportation_profile+'&alternativeidx=0&format=geojson', {
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
							else{
								document.getElementById("calculation-result").innerHTML = "<div class='alert alert-danger' role='alert'>An error occured during route processing, please retry</div>"
							}
							return undefined;
						}
					})
	return result;
}

//SNCF API SEARCH FUNCTIONS

async function search_sncf_train_station(locality, transportation_suffix){
	const response = await fetch('https://api.sncf.com/v1/coverage/sncf/places?q='+locality+'&type%5B%5D=stop_point&', {
			    method: 'GET',
			    headers: {
			        'Authorization' : '6e4ad4ec-86ef-41c7-8636-8df3993f4537'
			        }
			}).then(response => { 
				return(response.json());
			}).then(response => {
				for(item in response["places"]){
					if((response["places"][item]["quality"] >= 50)&&(response["places"][item]["id"].includes(transportation_suffix))){
						//console.log(response["places"][item]);
						return(response["places"][item]);
					}
				}
			});
	if(response == undefined){
		document.getElementById("loading").innerHTML = "";
		document.getElementById("calculation-result").innerHTML = "<div class='alert alert-warning' role='alert'><em>"+locality+"</em> was not found as a railway station in the SNCF database, please be more specific for it or use a nearby location</div>"

	}
	return(response);
}

async function get_sncf_journey(departure_point, arrival_point){
	const response = await fetch('https://api.sncf.com/v1/coverage/sncf/journeys?from='+departure_point+'&to='+arrival_point, {
			    method: 'GET',
			    headers: {
			        'Authorization' : '6e4ad4ec-86ef-41c7-8636-8df3993f4537'
			        }
			}).then(response => { 
				return(response.json());
			});
	//console.log(response);
	if(response["journeys"][0]["tags"].includes("ecologic")){
		return response;
	}else{
		document.getElementById("loading").innerHTML = "";
		document.getElementById("calculation-result").innerHTML = "<div class='alert alert-warning' role='alert'>No train itinerary was found in the SNCF database</div>"
		return undefined;
	}
}

function concatGeoJSON(g1, g2){
    return { 
        "type" : "LineString",
        "coordinates": g1.coordinates.concat(g2.coordinates),
        "properties":[{"length" : g1["properties"][0]["length"]+g2["properties"][0]["length"]}]
    }
}

async function calculate_co2_route() {
	var departure = document.getElementById("departure").value;
	var arrival = document.getElementById("arrival").value;
	var route_steps = [];
	var route =[];
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

		for (var i=0 ; i < transportations.length ; i++)
			{
			    if (transportations[i]["name"] == transportation) {
			        var transportation_id = transportations[i]["id"];
			        var transportation_profile = transportations[i]["profile"];
			        var transportation_emoji = transportations[i]["emoji"];
			        if((transportation_id == "15") || (transportation_id == "2")|| (transportation_id == "99")){
			        	var transportation_suffix = transportations[i]["sncf_stop_suffix"];
			        }
			    }
			}
			element=document.getElementById("passengers_div");
			if (element != null){
				passengers = document.getElementById("passengers").value;
			}

		// if((transportation_id == "15") || (transportation_id == "2")){
		// 	const departure_station=await search_sncf_train_station(departure, transportation_suffix);
		// 	const arrival_station=await search_sncf_train_station(arrival, transportation_suffix);

		// 	if ((departure_station != undefined)&&(arrival_station != undefined)){
		// 		document.getElementById("departure").value=departure_station["stop_point"]["name"];
		// 		document.getElementById("arrival").value=arrival_station["stop_point"]["name"];
		// 		var rail_route = { 
		// 			"type" : "LineString",
	    // 			"coordinates": [],
	    // 			"properties":[{
	    // 				"length" : 0
	    // 			}
	    // 			]
	    // 		};
							
		// 		// L.marker([departure_station["stop_point"]["coord"]["lat"],departure_station["stop_point"]["coord"]["lon"]]).addTo(map);
		// 		// L.marker([arrival_station["stop_point"]["coord"]["lat"],arrival_station["stop_point"]["coord"]["lon"]]).addTo(map);
		// 		const train_journey = await get_sncf_journey(departure_station["id"], arrival_station["id"]);
		// 		for (item in train_journey["journeys"][0]["sections"]){
		// 			if(train_journey["journeys"][0]["sections"][item]["type"] != "waiting"){
		// 				rail_route=concatGeoJSON(rail_route,train_journey["journeys"][0]["sections"][item]["geojson"]);
		// 			}
					
		// 		}
		// 		itineraries.push({"departure": departure_station["stop_point"]["name"],"arrival":arrival_station["stop_point"]["name"],"geojson_route":rail_route,"transportation":transportation,"passengers":passengers, "route":rail_route, "distance":rail_route["properties"][0]["length"],"co2_emissions":train_journey["journeys"][0]["co2_emission"]["value"]/1000});
		// 		// L.geoJSON(rail_route).addTo(map);
		// 		document.getElementById("loading").innerHTML = "";
		// 		render_total(itineraries);
		// 	}
		// }else{

			geojson_route= await create_geojson(route_steps)
			if (geojson_route.length > 0){
				geojson_text='{"coordinates":['+geojson_route.join(',')+']}';
				arrival_pretty_gps_coordonates["lon"] = getDD2DMS(geojson_route.slice(-1)[0].split(",")[0].replace("[","").replace(/\"/g,""),"lon");
				arrival_pretty_gps_coordonates["lat"] = getDD2DMS(geojson_route.slice(-1)[0].split(",")[1].replace("]","").replace(/\"/g,""),"lat");
				//console.log("Geojson "+geojson_text);
				// IF TRANSPORTATION IS A ROAD VEHICULE
				if ((transportation_profile == "driving-car")||(transportation_profile == "cycling-regular")){
					route = await get_openrouteservice_route(geojson_text, transportation_profile);
					route_distance = route.features[0].properties.summary.distance;
				  	co2_emissions = await get_ademe_co2(route_distance, transportation_id);
				}
				// IF TRANSPORTATION IS A SNCF EQUIPEMENT
				if ((transportation_profile == "train-sncf")){
					const departure_station=await search_sncf_train_station(departure, transportation_suffix);
					const arrival_station=await search_sncf_train_station(arrival, transportation_suffix);

					if ((departure_station != undefined)&&(arrival_station != undefined)){
						document.getElementById("departure").value=departure_station["stop_point"]["name"];
						document.getElementById("arrival").value=arrival_station["stop_point"]["name"];
						route = { 
							"type" : "LineString",
			    			"coordinates": [],
			    			"properties":[{
			    				"length" : 0
			    			}
			    			]
			    		};
									
						// L.marker([departure_station["stop_point"]["coord"]["lat"],departure_station["stop_point"]["coord"]["lon"]]).addTo(map);
						// L.marker([arrival_station["stop_point"]["coord"]["lat"],arrival_station["stop_point"]["coord"]["lon"]]).addTo(map);
						const train_journey = await get_sncf_journey(departure_station["id"], arrival_station["id"]);
						for (item in train_journey["journeys"][0]["sections"]){
							if(train_journey["journeys"][0]["sections"][item]["type"] != "waiting"){
								route=concatGeoJSON(route,train_journey["journeys"][0]["sections"][item]["geojson"]);
							}
						}
						route_distance=route["properties"][0]["length"];
						co2_emissions=train_journey["journeys"][0]["co2_emission"]["value"]/1000;
					}
				}
				if(transportation_profile == "plane"){
					route = get_crowfly_route(geojson_route);
					route_distance=get_crowfly_distance(geojson_route);
					co2_emissions=await get_ademe_co2(route_distance, transportation_id);
				}

				if(transportation_profile == "train"){
					route = await get_brouter_route(geojson_route,"rail");
					if (route != undefined){
						route_distance = route.features[0]["properties"]["track-length"];
				  		co2_emissions = await get_ademe_co2(route_distance, transportation_id);
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
	reset_map(map);
	document.getElementById("calculation-result").innerHTML="";
	for (itinerary in itineraries){
		//console.log(itineraries[itinerary]["route"]);
		L.geoJSON(itineraries[itinerary]["route"]).addTo(map);
		map.fitBounds(L.geoJSON(itineraries[itinerary]["route"]).getBounds());
		total["co2_emissions"]=total["co2_emissions"]+itineraries[itinerary]["co2_emissions"];
		total["co2_emissions_individual"]=total["co2_emissions_individual"]+(itineraries[itinerary]["co2_emissions"]/itineraries[itinerary]["passengers"]);
		total["distance"]=total["distance"]+itineraries[itinerary]["distance"];
		for (var i=0 ; i < transportations.length ; i++)
		{
		    if (transportations[i]["name"] == itineraries[itinerary]["transportation"]) {
		        var transportation_emoji = transportations[i]["emoji"];
		    }
		}
		distance_kms=(parseFloat(itineraries[itinerary]["distance"])/1000).toFixed(2);
		var newNode = document.createElement('div');
		newNode.className = "mb-3";
		//var content="<button type='button' class='btn btn-danger btn-sm' onclick='remove_route(itineraries,"+itinerary+")'>Delete</button> <strong>#"+itinerary+"</strong> "+transportation_emoji+" <strong>"+itineraries[itinerary]["departure"]+"</strong> - <strong>"+itineraries[itinerary]["arrival"]+"</strong> ("+itineraries[itinerary]["distance"]+" kms), <strong>"+itineraries[itinerary]["passengers"]+"</strong> 👤 = <strong>"+(itineraries[itinerary]["co2_emissions"]/itineraries[itinerary]["passengers"]).toFixed(2)+" kgCO2e/pers";
		var content="<button type='button' class='btn btn-danger btn-sm' onclick='remove_route(itineraries,"+itinerary+")'><i class='fa fa-times'></i></button> <strong>#"+itinerary+"</strong> "+transportation_emoji+" <strong>"+itineraries[itinerary]["departure"]+"</strong> - <strong>"+itineraries[itinerary]["arrival"]+"</strong> ("+distance_kms+" kms), <strong>"+itineraries[itinerary]["passengers"]+"</strong> 👤 = <strong>"+(itineraries[itinerary]["co2_emissions"]/itineraries[itinerary]["passengers"]).toFixed(2)+" kgCO2e/pers";
		newNode.innerHTML = content;
		document.getElementById("calculation-result").appendChild(newNode);
	}
	total_kms=(parseFloat(total["distance"])/1000).toFixed(2);
	var horizontal_line = document.createElement('hr');
	var total_div = document.createElement('div');
	total_div.className = "mb-3 d-flex align-items-center justify-content-center";
	var content_total = "<h5 align='center'>TOTAL : "+total_kms+" kms"+", "+total["co2_emissions"].toFixed(2)+" kgCO2e 🌍 ("+total["co2_emissions_individual"].toFixed(2)+"kgCO2e/pers)</h5>"
	total_div.innerHTML=content_total;
	document.getElementById("calculation-result").appendChild(horizontal_line);
	document.getElementById("calculation-result").appendChild(total_div);
}

function remove_route(itineraries,id){
	removed=itineraries.splice(id,1);
	//console.log(itineraries);
	render_total(itineraries);
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

// MAIN

var x = document.getElementById("calculation-result");
if (x.style.display === "none") {
  x.style.display = "block";
} 			


//LISTENERS

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