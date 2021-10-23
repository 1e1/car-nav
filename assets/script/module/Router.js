class Router {
    constructor(position, callback) {
        this.longitude = 100;
        this.latitude = 100;
        this.position = position;
        this.xhr = new XMLHttpRequest();
        this.xhr.addEventListener('load', (event) => {
            const result = JSON.parse(this.xhr.responseText);
            callback(result);
        });
    };

    set(longitude, latitude) {
        this.longitude = longitude;
        this.latitude = latitude;
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
