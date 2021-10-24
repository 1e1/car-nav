class Router {
    constructor(position, callback) {
        this.longitude = 100;
        this.latitude = 100;
        this.position = position;
        this.xhr = new XMLHttpRequest();
        this.reset();
        this.xhr.addEventListener('load', (event) => {
            this.route = JSON.parse(this.xhr.responseText);
            this.checkpointIndex = this.route.routes.length ? 0: -1;
            this.checkpointDistance = Number.MAX_SAFE_INTEGER;
            this.nextCheckpointDistance = Number.MAX_SAFE_INTEGER;

            callback(this.route);
        });
    };

    reset() {
        this.route = null;
        this.checkpointIndex = -1;
        this.checkpointDistance = -1;
        this.nextCheckpointDistance = -1;
    };

    set(longitude, latitude) {
        this.longitude = longitude;
        this.latitude = latitude;

        if (this.checkpointIndex < 0) {
            return; // no pathway
        }

        const checkpoint = this.route.routes[0].geometry.coordinates[this.checkpointIndex];
        const checkpointDistance = this.geodistance(this.longitude, this.latitude, checkpoint[0], checkpoint[1]);
        
        const nextCheckpoint = this.route.routes[0].geometry.coordinates[this.checkpointIndex+1];
        const nextCheckpointDistance = nextCheckpoint==undefined 
            ? -1 
            : this.geodistance(this.longitude, this.latitude, nextCheckpoint[0], nextCheckpoint[1]);
        
        if (checkpointDistance <= this.checkpointDistance) {
            this.checkpointDistance = checkpointDistance;
            this.nextCheckpointDistance = nextCheckpointDistance;
            return; // good way
        }

        if (nextCheckpoint==undefined) {
            this.reset();
            return; // trip done
        }

        if (nextCheckpointDistance <= this.nextCheckpointDistance) {
            this.checkpointIndex++;
            this.checkpointDistance = nextCheckpointDistance;
            this.nextCheckpointDistance = this.route.routes[0].geometry.coordinates[this.checkpointIndex+1]==undefined
                ? -1
                : Number.MAX_SAFE_INTEGER;
            return; // next step
        }

        if (checkpointDistance-this.checkpointDistance>10 && nextCheckpointDistance-this.nextCheckpointDistance>10) {
            throw 'lost';
        } else {
            // margin
        }
    };

    geodistance(lon1, lat1, lon2, lat2) {
        const earthRadiusInM = 6372795.477598;
        const deg2rad = deg => Math.PI * deg / 180;
        const rad2deg = rad => 180 * rad / Math.PI;
        const φ1 = deg2rad(lat1);
        const φ2 = deg2rad(lat2);
        const Δφ = deg2rad(lat2-lat1);
        const Δλ = deg2rad(lon2-lon1);

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2)
            + Math.cos(φ1)*Math.cos(φ2) * Math.sin(Δλ/2)*Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return earthRadiusInM * c;
    };

    goto() {
        if (this.longitude <= 90 && this.latitude <= 90) {
            this.xhr.abort();
            this.xhr.open('GET', `https://router.project-osrm.org/route/v1/driving/${this.position.longitude},${this.position.latitude};${this.longitude},${this.latitude}.json?geometries=geojson&overview=full`, true);
            this.xhr.send();
        }
    };
}

export { Router };
