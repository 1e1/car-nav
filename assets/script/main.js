import { Locator } from './module/Locator.js';
import { MovingData } from './module/MovingData.js';
import { Router } from './module/Router.js';
import { Stalker } from './module/Stalker.js';
import { Tracer } from './module/Tracer.js';



var html_speedLimit = document.getElementById("speedLimit");
var html_speed      = document.getElementById("speed");
var html_address    = document.getElementById("address");
var html_eta        = document.getElementById("eta");

var cardata = new MovingData();
var step    = Stalker.fromFrance({type:"notime"});
var map     = null;
var locator = null;
var router  = null;
var tracer  = null;
var animationId = null;




function changeViewMap(anchor, dimension) {
    document.body.dataset.povanc = anchor;
    document.body.dataset.povdim = dimension;

    const position = cardata.getPosition2dAsArray();

    if (dimension == "3d") {
        centerMap3d(cardata.getPosition2dAsArray(), cardata.vector.heading, cardata.vector.speed);
    } else {
        centerMap2d(position);
    }
}

function isLockedMap() {
    return document.body.dataset.povanc == "car";
}

function is3dMap() {
    return document.body.dataset.povdim == "3d";
}


function centerMap2d(position) {
    //map.panBy([0, -2*speed]);
    map.flyTo({
        center: position,
        bearing: 0,
        pitch: 0,
        zoom: 12,
    });
}
function centerMap3d(position, heading, speed) {
    //map.panBy([0, -2*speed]);
    map.flyTo({
        center: position,
        bearing: heading,
        pitch: Math.min(speed/2, 85),
        zoom: 18-(speed/25),
    });
}

function startRoute(longitude, latitude) {
    cardata.setTripDestination(longitude, latitude);
    router.reset();
    router.set(longitude, latitude);
    router.goto();
    moveDrone([longitude, latitude]);

    changeViewMap("free", "2d");
}

function reloadRoute() {
    router.reset();
    console.log(cardata);
    if (cardata.destination != null) {
        router.set(cardata.destination.longitude, cardata.destination.latitude);
        router.goto();
    }
}

function drawRoute(geometry, duration, distance) {
    const route = {
        "type": "Feature",
        "properties": {},
        "geometry": geometry,
    }

    if (map.getSource('route')) {
        map.getSource('route').setData(route);
    } else {
        map.addSource('route', {
            'type': 'geojson',
            'data': route,
        });

        map.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#17ea3d',
                'line-width': 8,
                'line-opacity': 0.66,
            }
        });
    }

    cardata.setTripInfo(duration*1000, distance);
}

function undrawRoute() {
    if (map.getSource('route')) {
        if (map.getLayer('route')) {
            map.removeLayer('route');
        }
        map.removeSource('route');
    }
}

function initMap() {
    //document.getElementById('map').style.opacity = 0;

    // https://openmaptiles.geo.data.gouv.fr
    map = new maplibregl.Map({
        container: "map",
        style: "https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json",
        zoom: 15,
        center: [-1.5115, 48.6345],
        pitch: 80,
        bearing: -17.6,
        minZoom: 10,
    });

    let html_car = document.createElement('div');
    //html_car.className = 'marker_car';
    html_car.className = 'marker_arrow';

    cardata.marker = new maplibregl.Marker(html_car)
        .setLngLat([-1.5115, 48.6345])
        .addTo(map)
    ;

    map.on('load', () => {
        map.addSource('drone', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': [
                    {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [-1.5115, 48.6345]
                        }
                    }
                ]
            }
        });

        map.addLayer({
            "id": "drone-glow-strong",
            "type": "circle",
            "source": "drone",
            "paint": {
                "circle-radius": 18,
                "circle-color": "#fff",
                "circle-opacity": 0.4
            }
        });

        map.addLayer({
            "id": "drone-glow",
            "type": "circle",
            "source": "drone",
            "paint": {
                "circle-radius": 40,
                "circle-color": "#fff",
                "circle-opacity": 0.1
            }
        });
        /*
        map.addSource('mapillary', {
            'type': 'vector',
            'tiles': [
                'https://openmaptiles.geo.data.gouv.fr/data/france-vector.json'
            ],
            'minzoom': 6,
            'maxzoom': 14
        });

        map.addLayer({
            'id': 'mapillary',
            'type': 'line',
            'source': 'mapillary',
            'source-layer': 'sequence',
            'layout': {
                'line-cap': 'round',
                'line-join': 'round'
            },
            'paint': {
                'line-opacity': 0.6,
                'line-color': 'rgb(53, 175, 109)',
                'line-width': 2
            }
        }, 'water_name_line');
        */
        /*
        map.addSource("Batiments", {
            type: "geojson",
            data:
            "https://raw.githubusercontent.com/mastersigat/data/main/BatiRennes.geojson",
        });

        map.addLayer({
            id: "Batiments",
            type: "fill-extrusion",
            source: "Batiments",
            paint: {
            "fill-extrusion-height": { type: "identity", property: "HAUTEUR" },
            "fill-extrusion-color": {
                property: "HAUTEUR",
                stops: [
                [5, "#1a9850"],
                [7, "#91cf60"],
                [9, "#d9ef8b"],
                [12, "#ffffbf"],
                [16, "#fee08b"],
                [20, "#fc8d59"],
                [30, "#d73027"],
                ],
            },
            "fill-extrusion-opacity": 0.7,
            "fill-extrusion-base": 0,
            },
        });
        */
        changeViewMap("car", "3d");
        document.getElementById('map').style.opacity = 1;
    });

    //map.addControl(new maplibregl.NavigationControl({ position: "top-left" }));
    //map.addControl(new maplibregl.ScaleControl({ position: "bottom-right" }));
    map.addControl(new maplibregl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true,
        },
        trackUserLocation: false,
    }));
}

function moveDrone(position) {
    if (map.loaded() && map.getSource('drone') != null) {
        //const angle = is3dMap() ? 0 : cardata.vector.heading * (180 / Math.PI);
        //map.setLayoutProperty('drone', 'icon-rotate', angle);
        map.getSource('drone').setData({
            "type": "Point",
            "coordinates": position,
        });
    }
}


function animate(timestamp) {
    const now = Date.now();
    const vcardata = cardata.getVirtualClone();

    if (map.loaded() && vcardata!=null) {
        let position2d = [ vcardata.position.longitude, vcardata.position.latitude ];

        if (cardata.marker) {
            const markerLngLat = cardata.marker.getLngLat();

            if (isNaN(markerLngLat[0] || isNaN(markerLngLat[1]))) {
                console.debug(cardata.marker, markerLngLat); // TODO REMOVE
            }

            if (now - cardata.position.timestamp < cardata.dvector.timestamp) {
                const ratio = (now - cardata.position.timestamp) / cardata.dvector.timestamp;
                const markerPosition = cardata.marker.getLngLat();

                const dLng = (vcardata.position.longitude-markerPosition.lng) *ratio;
                const dLat = (vcardata.position.latitude -markerPosition.lat) *ratio;

                position2d = [ markerPosition.lng+dLng, markerPosition.lat+dLat ];
            }

            const angle = is3dMap() ? 0 : vcardata.vector.heading * (180 / Math.PI);
            
            if (isNaN(position2d[0] || isNaN(position2d[1]))) {
                console.debug(position2d, cardata, vcardata); // TODO REMOVE
            }

            cardata.marker
                .setLngLat(position2d)
                .setRotation(angle)
            ;
        }

        if (!map.isMoving() && !map.isRotating() && isLockedMap()) {
            if (is3dMap()) {
                map.jumpTo({
                    bearing: cardata.vector.heading,
                    center: position2d,
                    pitch: Math.min(cardata.vector.speed/2, 85),
                    zoom: 18-(cardata.vector.speed/25),
                });
                map.panBy(
                    [0, -window.innerHeight*0.3],
                    {animate:false}
                );
            } else {
                map.jumpTo({
                    bearing: 0,
                    center: position2d,
                    pitch: 0,
                    zoom: 18-(cardata.vector.speed/25),
                });
                map.panBy(
                    [0, -window.innerHeight*0.3],
                    {animate:false}
                );
            }
        }
    }

    step.update(cardata.vector.speed);
    const speedLimit = step.getLevel();

    if (html_speedLimit.innerHTML != speedLimit) {
        html_speedLimit.innerHTML = speedLimit;
    }

    const speed = Math.round(cardata.vector.speed * 3.6);

    if (html_speed.innerHTML != speed) {
        html_speed.innerHTML = speed;
    }

    // TODO
    // refresh Duration
    // refresh Distance

    const eta = cardata.trip == null 
        ? ''
        : '⏱ ' + cardata.getTripEtaInDate().toLocaleTimeString('fr-FR', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
        })
    ;

    if (html_eta.innerHTML != eta) {
        html_eta.innerHTML = eta;
    }

    try {
        router.set(cardata.position.longitude, cardata.position.latitude);
        if (router.route == null) {
            undrawRoute();
        }
    } catch(error) {
        console.warn(error, "reloadRoute()");
        reloadRoute();
    }

    animationId = window.requestAnimationFrame(animate);
}

window.addEventListener("load", () => {
    router = new Router(cardata.position, (result) => {
        if (result.routes.length) {
            const duration = result.routes[0].duration; // TODO ETA
            const distance = result.routes[0].distance; // TODO -gps.distance

            drawRoute(result.routes[0].geometry, duration, distance);
        }
    });
    locator = new Locator(cardata.position, (result) => {
        let frag = document.createDocumentFragment();
        //const nearFeatures = result.features.filter(f => f.properties.distance < 75000); // 75km max
        const nearFeatures = result.features; // TODO REMOVE
        nearFeatures.forEach(feature => {
            let a = document.createElement('a');
            a.addEventListener('click', (event) => {
                startRoute(feature.geometry.coordinates[0], feature.geometry.coordinates[1]);
                document.getElementById('form').style.display='none';
            })
            a.text = feature.properties.name;
            a.dataset.city = feature.properties.city;
            frag.appendChild(a);
        });

        if (nearFeatures.length > 0) {
            centerMap2d(nearFeatures[0].geometry.coordinates);
        }

        document.getElementById('addresses').replaceChildren(frag);
    });
    tracer = new Tracer(t => {
        const p = t.getSmoothPosition();
        if (p != null) {
            cardata.setPosition(p.coords.longitude, p.coords.latitude, p.coords.altitude);
            cardata.setVector(p.coords.heading, p.coords.speed);
        }
    });


    html_address.addEventListener('keyup', (event) => {
        const text = event.currentTarget.value;

        locator.search(text);
    });

    document.querySelector("#commands button[name='changeViewMapCar3d']").addEventListener("click", event => changeViewMap('car','3d'));
    document.querySelector("#commands button[name='changeViewMapFree2d']").addEventListener("click", event => changeViewMap('free','2d'));
    document.querySelector("#commands button[name='search']").addEventListener("click", event => {
        document.getElementById('form').style.display='block';
        const html_address = document.getElementById('address');
        html_address.selectionStart = html_address.value.length;
        html_address.selectionEnd = html_address.value.length;
        html_address.focus();
    });

    document.querySelectorAll("#form button[name='close']").forEach(button => button.addEventListener("click", event => {
        document.getElementById('form').style.display='none';
    }));
    document.querySelector("#form button[name='unroute']").addEventListener("click", event => {
        undrawRoute();
        document.getElementById('form').style.display='none';
    });
    document.querySelector("#form button[name='search']").addEventListener("click", event => {
        const html_address = document.getElementById('address');
        locator.search(html_address.value)
    });
    
    if (maplibregl.supported()) {
        initMap();
    } else {
        console.error("mapboxgl not supported");
    }

    tracer.start();

    animationId = window.requestAnimationFrame(animate);
});