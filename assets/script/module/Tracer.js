import { Defaults } from './../Defaults.js';

const CFG = new Defaults('Tracer', {
    decay: 1.2,
});


class Tracer {
    constructor(callback) {
        this.callback = callback;
        this.pid = null;
        this.rawPosition = null;
        this.smoothPosition = null;

        this.decay = CFG._('decay');
        this.variance = -1;
        this.altitudeVariance = -1;
        this.minAccuracy = 1;
    }

    update(position) {
        this.rawPosition = position;

        const localTimestamp = Date.now();

        let accuracy = 0+ position.coords.accuracy;
        let altitudeAccuracy = 0+ position.coords.altitudeAccuracy;

        if (accuracy < this.minAccuracy) {
            accuracy = this.minAccuracy;
        }

        if (altitudeAccuracy < this.minAccuracy) {
            altitudeAccuracy = this.minAccuracy;
        }

        if (this.variance < 0) {
            this.smoothPosition = {
                coords: {
                    accuracy: position.coords.accuracy,
                    longitude: position.coords.longitude,
                    latitude: position.coords.latitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    altitude: position.coords.altitude,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                },
                timestamp: position.timestamp,
                localTimestamp: localTimestamp,
            };
            this.variance = accuracy * accuracy;
            this.altitudeVariance = altitudeAccuracy * altitudeAccuracy;
        } else {
            const timeIncMs = position.timestamp - this.smoothPosition.timestamp;
            const coeffVariance = (timeIncMs * this.decay * this.decay) / 1000;

            if (timeIncMs > 0) {
                this.variance += coeffVariance;
                this.altitudeVariance += coeffVariance;
                this.smoothPosition.timestamp = position.timestamp;
            }

            const deltaVariance = this.variance / (this.variance + (accuracy*accuracy));
            this.smoothPosition.coords.longitude += deltaVariance * (position.coords.longitude - this.smoothPosition.coords.longitude);
            this.smoothPosition.coords.latitude += deltaVariance * (position.coords.latitude - this.smoothPosition.coords.latitude);
            this.variance = (1 - deltaVariance) * this.variance;

            const deltaAltitudeVariance = this.altitudeVariance / (this.altitudeVariance + (altitudeAccuracy*altitudeAccuracy));
            this.smoothPosition.coords.altitude += deltaAltitudeVariance * (position.coords.altitude - this.smoothPosition.coords.altitude);
            this.altitudeVariance = (1 - deltaAltitudeVariance) * this.altitudeVariance;

            this.smoothPosition.localTimestamp = localTimestamp;
        }
    }

    getRawPosition() {
        return this.rawPosition;
    }

    getSmoothPosition() {
        return this.smoothPosition;
    }

    start() {
        if (this.pid == null) {
            this.pid = navigator.geolocation.watchPosition(position => {
                this.update(position);
                this.callback(this);
            },
                error => {
                // console.debug(error); // TODO
            },
            {
                enableHighAccuracy: true,
                timeout: 4321,
                maximumAge: 666,
            });
        }
    }

    stop() {
        navigator.geolocation.clearWatch(this.pid);
    }
}

export { Tracer };
