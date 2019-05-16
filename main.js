"use strict";

/*
 * Created with @iobroker/create-adapter v1.11.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");

// Load your modules here, e.g.:
const http_request = require("request");
// const fs = require("fs");

class Worx extends utils.Adapter {

	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "worx",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {

		this.log.debug( this.name + " startet using API-Key : " + this.config["API-Key"]);

		// read coordinates from system config
		const sys_conf = await this.getForeignObjectAsync("system.config");
		if (!sys_conf) return;

		this.log.debug(JSON.stringify(sys_conf));

		const requestUrl = "http://weerlive.nl/api/json-data-10min.php?key=" + this.config["API-Key"] + "&locatie=" + sys_conf.common.latitude + "," + sys_conf.common.longitude;
		http_request(requestUrl, (error, response, body) => {
	
			if (!error && response.statusCode === 200) {
				// we got a response
				this.log.debug(body);

				try {
					const data = JSON.parse(body);
					// Test-Data
					// const data = JSON.parse('{ "liveweer": [{"plaats": "Amsterdam", "temp": "13.4", "gtemp": "13.4", "samenv": "Geheel bewolkt", "lv": "79", "windr": "Oost", "windms": "1", "winds": "1", "windk": "1.9", "windkmh": "3.6", "luchtd": "1022.9", "ldmmhg": "767", "dauwp": "9", "zicht": "18", "verw": "Wolkenvelden en een enkele lichte bui. Morgen overal zonnig en droog", "sup": "06:36", "sunder": "20:44", "image": "wolkennacht", "d0weer": "halfbewolkt", "d0tmax": "22", "d0tmin": "9", "d0windk": "3", "d0windknp": "10", "d0windms": "5", "d0windkmh": "19", "d0windr": "O", "d0neerslag": "0", "d0zon": "75", "d1weer": "zonnig", "d1tmax": "21", "d1tmin": "8", "d1windk": "3", "d1windknp": "8", "d1windms": "4", "d1windkmh": "15", "d1windr": "O", "d1neerslag": "0", "d1zon": "90", "d2weer": "zonnig", "d2tmax": "21", "d2tmin": "9", "d2windk": "2", "d2windknp": "6", "d2windms": "3", "d2windkmh": "11", "d2windr": "O", "d2neerslag": "10", "d2zon": "80", "alarm": "0"}]}');
					for (const key in data) {
						const arr = data[key];
						for( let i = 0; i < arr.length; i++ ) {
							const obj = arr[ i ];
							for (const prop in obj) {
								if(obj.hasOwnProperty(prop)){
									this.doStatehandling(prop, obj[prop]);
								}
							}
						}
					}	
				} catch (error) {
					this.log.error(body);
				}
			} else { // error or non-200 status code
				this.log.error("Connection_Failed, check your API key and coordinate settings in Admin configuration !");
			}
		});

		this.doRainradar();

		// force terminate after 1min
		// don't know why it does not terminate by itself...
		setTimeout(() => {
			this.log.warn(this.name + " force terminate");
			this.terminate ? this.terminate() : process.exit();
		}, 50000);
		
	}

	async doStatehandling(statename, value){

		const test = {
			"plaats" : {"prefix" : "", "name" : "Ingestelde locatie", "type": "string" , "role" : "weather.location", "unit" : "",},
			"temp" : {"prefix" : "current.", "name" : "actuele temperatuur", "type": "number" , "role" : "weather.temperature", "unit" : "°C",},
			"gtemp" : {"prefix" : "current.", "name" : "gevoelstemperatuur", "type": "number" , "role" : "value.temperature.feelslike", "unit" : "°C",},
			"samenv" : {"prefix" : "current.", "name" : "omschrijving weersgesteldheid", "type": "string" , "role" : "weather.sate", "unit" : "",},
			"lv" : {"prefix" : "current.", "name" : "relatieve luchtvochtigheid", "type": "number" , "role" : "weather.humidity", "unit" : "%",},
			"windr" : {"prefix" : "current.", "name" : "windrichting", "type": "string" , "role" : "weather.direction.wind", "unit" : "",},
			"windms" : {"prefix" : "current.", "name" : "windsnelheid in meter per seconde", "type": "number" , "role" : "weather.speed.wind", "unit" : "m/s",},
			"winds" : {"prefix" : "current.", "name" : "windkracht (Beaufort)", "type": "number" , "role" : "weather.force.wind", "unit" : "bft",},
			"windk" : {"prefix" : "current.", "name" : "Windsnelheid in knopen", "type": "number" , "role" : "weather.speed.wind", "unit" : "kt",},
			"windkmh" : {"prefix" : "current.", "name" : "Windsnelheid in km/h", "type": "number" , "role" : "value.temperature", "unit" : "km/h",},			
			"luchtd" : {"prefix" : "current.", "name" : "luchtdruk", "type": "number" , "role" : "value.temperature", "unit" : "hPa",},
			"ldmmhg" : {"prefix" : "current.", "name" : "luchtdruk in mm-kwikdruk", "type": "number" , "role" : "value.temperature", "unit" : "mbar",},
			"dauwp" : {"prefix" : "current.", "name" : "dauwpunt", "type": "number" , "role" : "weather.dewpoint", "unit" : "°C",},
			"zicht" : {"prefix" : "current.", "name" : "zicht in km", "type": "number" , "role" : "weather.view.distance", "unit" : "km",},
			"verw" : {"prefix" : "current.", "name" : "korte dagverwachting", "type": "string" , "role" : "weather.expectation", "unit" : "",},
			"sup" : {"prefix" : "current.", "name" : "zon op", "type": "string" , "role" : "weather.sunup", "unit" : "",},
			"sunder" : {"prefix" : "current.", "name" : "zon onder", "type": "string" , "role" : "weather.sununder", "unit" : "",},
			"image" : {"prefix" : "current.", "name" : "afbeeldingsnaam", "type": "string" , "role" : "weather.image", "unit" : "",},	
			"d0weer" : {"prefix" : "forecast.d0.", "name" : "Weericoon vandaag", "type": "string" , "role" : "weather.image", "unit" : "",},
			"d0tmax" : {"prefix" : "forecast.d0.", "name" : "Maxtemp vandaag", "type": "number" , "role" : "weather.max.temperature", "unit" : "°C",},
			"d0tmin" : {"prefix" : "forecast.d0.", "name" : "Mintemp vandaag", "type": "number" , "role" : "weather.min.temperature", "unit" : "°C",},
			"d0windk" : {"prefix" : "forecast.d0.", "name" : "Windkracht vandaag", "type": "number" , "role" : "weather.force.wind", "unit" : "bft",},
			"d0windr" : {"prefix" : "forecast.d0.", "name" : "Windrichting vandaag", "type": "number" , "role" : "weather.direction.wind", "unit" : "",},
			"d0neerslag" : {"prefix" : "forecast.d0.", "name" : "Neerslagkans vandaag", "type": "number" , "role" : "value.precipitation", "unit" : "%",},
			"d0zon" : {"prefix" : "forecast.d0.", "name" : "Zonkans vandaag", "type": "number" , "role" : "weather.image", "unit" : "%",},
			"d1weer" : {"prefix" : "forecast.d1.", "name" : "Weericoon morgen", "type": "string" , "role" : "weather.image", "unit" : "",},
			"d1tmax" : {"prefix" : "forecast.d1.", "name" : "Maxtemp morgen", "type": "number" , "role" : "weather.max.temperature", "unit" : "°C",},
			"d1tmin" : {"prefix" : "forecast.d1.", "name" : "Mintemp morgen", "type": "number" , "role" : "weather.min.temperature", "unit" : "°C",},
			"d1windk" : {"prefix" : "forecast.d1.", "name" : "Windkracht morgen", "type": "number" , "role" : "weather.force.wind", "unit" : "bft",},
			"d1windr" : {"prefix" : "forecast.d1.", "name" : "Windrichting morgen", "type": "number" , "role" : "weather.direction.wind", "unit" : "",},
			"d1neerslag" : {"prefix" : "forecast.d1.", "name" : "Neerslagkans morgen", "type": "number" , "role" : "value.precipitation", "unit" : "%",},
			"d1zon" : {"prefix" : "forecast.d1.", "name" : "Zonkans morgen", "type": "number" , "role" : "weather.image", "unit" : "%",},
			"d2weer" : {"prefix" : "forecast.d2.", "name" : "Weericoon overmorgen", "type": "string" , "role" : "weather.image", "unit" : "",},
			"d2tmax" : {"prefix" : "forecast.d2.", "name" : "Maxtemp overmorgen", "type": "number" , "role" : "weather.max.temperature", "unit" : "°C",},
			"d2tmin" : {"prefix" : "forecast.d2.", "name" : "Mintemp overmorgen", "type": "number" , "role" : "weather.min.temperature", "unit" : "°C",},
			"d2windk" : {"prefix" : "forecast.d2.", "name" : "Windkracht overmorgen", "type": "number" , "role" : "weather.force.wind", "unit" : "bft",},
			"d2windr" : {"prefix" : "forecast.d2.", "name" : "Windrichting overmorgen", "type": "number" , "role" : "weather.direction.wind", "unit" : "",},
			"d2neerslag" : {"prefix" : "forecast.d2.", "name" : "Neerslagkans overmorgen", "type": "number" , "role" : "value.precipitation", "unit" : "%",},
			"d2zon" : {"prefix" : "forecast.d2.", "name" : "Zonkans overmorgen", "type": "number" , "role" : "weather.image", "unit" : "%",},
			"alarm" : {"prefix" : "alarm.", "name" : "Geldt er een weerwaarschuwing", "type": "string" , "role" : "weather.alarm", "unit" : "",},
			"alarmtxt" : {"prefix" : "alarm.", "name" : "Omschrijving van de weersituatie", "type": "string" , "role" : "weather.image", "unit" : "",},

		};

		this.log.debug(statename + " : " + value);

		await this.setObjectNotExistsAsync(test[statename]["prefix"] + statename, {
			type: "state",
			common: {
				name: test[statename]["name"],
				type: test[statename]["type"],
				role: test[statename]["role"],
				read: true,
				write: false,
				unit: test[statename]["unit"]
			},
			native: {},
		});

		await this.setStateAsync(test[statename]["prefix"] + statename, {val : value, ack : true});

	}

	async doRainradar(){
		const sys_conf = await this.getForeignObjectAsync("system.config");
		if (!sys_conf) return;
		const lat = sys_conf.common.latitude;
		const long = sys_conf.common.longitude;

		this.doRainStates("rainradar.Current.City_small", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=13&size=1&voor=0", "120x220px");
		this.doRainStates("rainradar.Current.City_medium", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=13&size=2&voor=0", "256x256px");
		this.doRainStates("rainradar.Current.City_tall", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=13&size=2b&voor=0", "330x330px");
		this.doRainStates("rainradar.Current.City_huge", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=13&size=3&voor=0", "550x512px");
		this.doRainStates("rainradar.Current.Region_small", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=11&size=1&voor=0", "120x220px");
		this.doRainStates("rainradar.Current.Region_medium", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=11&size=2&voor=0", "256x256px");
		this.doRainStates("rainradar.Current.Region_tall", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=11&size=2b&voor=0", "330x330px");
		this.doRainStates("rainradar.Current.Region_huge", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=11&size=3&voor=0", "550x512px");
		this.doRainStates("rainradar.Current.Province_small", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=8&size=1&voor=0", "120x220px");
		this.doRainStates("rainradar.Current.Province_medium", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=8&size=2&voor=0", "256x256px");
		this.doRainStates("rainradar.Current.Province_tall", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=8&size=2b&voor=0", "330x330px");
		this.doRainStates("rainradar.Current.Province_huge", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=8&size=3&voor=0", "550x512px");
		this.doRainStates("rainradar.Current.Country_small", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=6&size=1&voor=0", "120x220px");
		this.doRainStates("rainradar.Current.Country_medium", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=6&size=2&voor=0", "256x256px");
		this.doRainStates("rainradar.Current.Country_tall", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=6&size=2b&voor=0", "330x330px");
		this.doRainStates("rainradar.Current.Country_huge", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=6&size=3&voor=0", "550x512px");
		this.doRainStates("rainradar.Forecast_3h.City_small", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=13&size=1&voor=1", "120x220px");
		this.doRainStates("rainradar.Forecast_3h.City_medium", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=13&size=2&voor=1", "256x256px");
		this.doRainStates("rainradar.Forecast_3h.City_tall", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=13&size=2b&voor=1", "330x330px");
		this.doRainStates("rainradar.Forecast_3h.City_huge", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=13&size=3&voor=1", "550x512px");
		this.doRainStates("rainradar.Forecast_3h.Region_small", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=11&size=1&voor=1", "120x220px");
		this.doRainStates("rainradar.Forecast_3h.Region_medium", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=11&size=2&voor=1", "256x256px");
		this.doRainStates("rainradar.Forecast_3h.Region_tall", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=11&size=2b&voor=1", "330x330px");
		this.doRainStates("rainradar.Forecast_3h.Region_huge", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=11&size=3&voor=1", "550x512px");
		this.doRainStates("rainradar.Forecast_3h.Province_small", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=8&size=1&voor=1", "120x220px");
		this.doRainStates("rainradar.Forecast_3h.Province_medium", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=8&size=2&voor=1", "256x256px");
		this.doRainStates("rainradar.Forecast_3h.Province_tall", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=8&size=2b&voor=1", "330x330px");
		this.doRainStates("rainradar.Forecast_3h.Province_huge", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=8&size=3&voor=1", "550x512px");
		this.doRainStates("rainradar.Forecast_3h.Country_small", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=6&size=1&voor=1", "120x220px");
		this.doRainStates("rainradar.Forecast_3h.Country_medium", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=6&size=2&voor=1", "256x256px");
		this.doRainStates("rainradar.Forecast_3h.Country_tall", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=6&size=2b&voor=1", "330x330px");
		this.doRainStates("rainradar.Forecast_3h.Country_huge", "https://gadgets.buienradar.nl/gadget/zoommap/?lat=" + lat + "&lng=" + long + "&overname=2&zoom=6&size=3&voor=1", "550x512px");
	}

	// Function to handle state creation
	async doRainStates(device, value, name){	
	
		// Create objects
		await this.setObjectNotExistsAsync(device, {
			type: "state",
			common: {
				name: name,
				type: "string",
				role: "weather.radar.rain",
				read: true,
				write: false,
			},
			native: {},
		});

		// Store links
		await this.setState(device, {val : value, ack : true});

	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			this.log.info(this.name + " stopped, cleaned everything up...");
			callback();
		} catch (e) {
			callback();
		}
	}
}

if (module.parent) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new Worx(options);
} else {
	// otherwise start the instance directly
	new Worx();
}