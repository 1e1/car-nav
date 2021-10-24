class MovingData {
    constructor() {
        this.vector = {
            heading: 321,
            speed: 0,
            timestamp: Date.now(),
        };
        this.dvector = {
            heading: 0,
            speed: 0,
            timestamp: 1,
        },
        this.position = {
            longitude: -1.658711,
            latitude: 48.117881,
            altitude: 1,
            timestamp: Date.now(),
        };
        this.destination = null;
        this.trip = null;
    }

    setVector(heading, speed) {
        const now = Date.now();
        const dtime = now - this.vector.timestamp;

        this.dvector = {
            heading: (heading-this.vector.heading) * 1000/dtime,
            speed: (speed-this.vector.speed) * 1000/dtime, 
            timestamp: dtime,
        };

        this.vector.heading = 0 + heading;
        this.vector.speed = 0 + speed;
        this.vector.timestamp = now;
    }

    setPosition(longitude, latitude, altitude) {
        this.position.longitude = longitude;
        this.position.latitude  = latitude;
        this.position.altitude  = altitude;
        this.position.timestamp = Date.now();
    }

    getPosition2dAsArray() {
        return [ this.position.longitude, this.position.latitude ];
    }

    getPosition3dAsArray() {
        return this.getPosition2dAsArray().concat([this.position.altitude]);
    }

    getVirtualClone() {
        if (this.dvector.timestamp == 1) {
            return null;
        }

        const earthRadiusInM = 6372795.477598;
        const deg2rad = deg => Math.PI * deg / 180;
        const rad2deg = rad => 180 * rad / Math.PI;
        const now = Date.now();
        const dtime = now - this.position.timestamp;
        const speed = this.vector.speed + (this.dvector.speed*dtime/1000);
        const distanceInM = speed * this.dvector.timestamp /1000;
        const heading = this.vector.heading + (this.dvector.heading*dtime/1000);
        const headingInRad = deg2rad(heading);
        const ratio = distanceInM / earthRadiusInM;
        const lngInRad = deg2rad(this.position.longitude);
        const latInRad = deg2rad(this.position.latitude);

        const nextLatInRad = Math.asin( 
            (Math.sin(latInRad)*Math.cos(ratio)) +
            (Math.cos(latInRad)*Math.sin(ratio)*Math.cos(headingInRad))
        );
        
        const nextLngInRad = lngInRad + 
            Math.atan2(
                Math.sin(headingInRad)*Math.sin(ratio)*Math.cos(latInRad),
                Math.cos(ratio) - (Math.sin(latInRad)*Math.sin(nextLatInRad))
            )
        ;

        return {
            vector: {
                heading: heading,
                speed: speed,
                timestamp: now,
            },
            position: {
                longitude: rad2deg(nextLngInRad),
                latitude:  rad2deg(nextLatInRad),
                timestamp: now,
            }
        };
    }

    resetTrip() {
        this.destination = null;
        this.trip = null;
    }

    setTripDestination(longitude, latitude) {
        this.destination = {
            longitude: longitude,
            latitude:  latitude,
            timestamp: Date.now(),
        };
    }

    getTripDestination2dAsArray() {
        return [ this.destination.longitude, this.destination.latitude ];
    }

    setTripInfo(durationInMs, distanceInM) {
        this.trip = {
            duration: durationInMs,
            distance: distanceInM,
            timestamp: Date.now(),
        };
    }

    getTripEtaInDate() {
        return (this.trip == null) ? new Date() : new Date(this.trip.duration + this.trip.timestamp);
    }
}

export { MovingData };
