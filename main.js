"use strict";

/*
 * Created with @iobroker/create-adapter v1.11.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");

/*const worx = require(__dirname + '/lib/api');
const week = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const ERRORCODES = {
    0: 'No error',
    1: 'Trapped',
    2: 'Lifted',
    3: 'Wire missing',
    4: 'Outside wire',
    5: 'Raining',
    6: 'Close door to mow',
    7: 'Close door to go home',
    8: 'Blade motor blocked',
    9: 'Wheel motor blocked',
    10: 'Trapped timeout',
    11: 'Upside down',
    12: 'Battery low',
    13: 'Reverse wire',
    14: 'Charge error',
    15: 'Timeout finding home',
    16: 'Mower locked',
    17: 'Battery over temperature',
};
const STATUSCODES = {
    0: 'IDLE',
    1: 'Home',
    2: 'Start sequence',
    3: 'Leaving home',
    4: 'Follow wire',
    5: 'Searching home',
    6: 'Searching wire',
    7: 'Mowing',
    8: 'Lifted',
    9: 'Trapped',
    10: 'Blade blocked',
    11: 'Debug',
    12: 'Remote control',
    30: 'Going home',
    32: 'Border Cut',
    33: 'Searching zone',
    34: 'Pause'
};
const WEATHERINTERVALL = 60000 * 30 // = 30 min.
*/
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
        // Initialize your adapter here

        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:
        this.log.info('config e-mail: ' + this.config.mail);
        this.log.info('config password: ' + this.config.password);
        this.log.info('config mower: ' + this.config.mower);

        this.setStateAsync('info.connection', {
            val: false,
            ack: true
        });
        /*
        const WorxCloud = new worx(this.config.mail, this.config.password);
        
        WorxCloud.on('connect', worxc => {
            this.log.info('sucess conect!');
            this.setStateAsync('info.connection', {
                val: true,
                ack: true
            });
        });
        WorxCloud.on('error', worxc => {
            this.log.info('Error');
            this.setStateAsync('info.connection', {
                val: false,
                ack: true
            });
        });

        let that = this
        
        WorxCloud.on('found', function (mower) {

            that.log.info('found!' + JSON.stringify(mower));
            that.createDevices(mower).then(_ => {
                mower.status().then(status => {
                    setTimeout(function () {
                        that.setStates(mower.serial, status);
                    }, 1000);


                });
            });
            that.UpdateWeather(mower);

            mower.connectMqtt().then(data => {
                that.log.info(data);
            });

            mower.on('mqtt', (serial, data) => {
                that.log.info(JSON.stringify(serial + " " + JSON.stringify(data)));
                that.setStates(mower.serial, data);
            });

        });

        WorxCloud.on('error', err => {
            this.log.error('ERROR: ' + err);
            this.setStateAsync('info.connection', {
                val: false,
                ack: true
            });
        });
*/
        // in this template all states changes inside the adapters namespace are subscribed
        this.subscribeStates('*');

        /*
        setState examples
        you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
        */
        // the variable testVariable is set to true as command (ack=false)

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