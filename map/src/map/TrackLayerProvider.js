import L from 'leaflet';
import MarkerOptions from "./markers/MarkerOptions";

function createLayersByTrackData(data) {
    let layers = [];
    data.tracks.forEach(track => {
        parsePoints(track.points, layers);
    })
    parseWpt(data.wpts, layers);

    if (layers.length > 0) {
        return new L.FeatureGroup(layers);
    }
}

function parsePoints(points, layers) {
    let coordsTrk = [];
    let coordsAll = [];
    points.forEach(point => {
        if (point.geometry) {
            drawRoutePoints(points, point.geometry, coordsAll, layers);
        } else {
            coordsTrk.push(new L.LatLng(point.lat, point.lng))
            if (point.profile === 'gap' && coordsTrk.length > 0) {
                layers.push(new L.Polyline(coordsTrk, getPolylineOpt()));
                coordsAll = coordsAll.concat(Object.assign([], coordsTrk));
                coordsTrk = [];
            }
        }
    })

    points.forEach(p => {
        layers.push(new L.Marker((new L.LatLng(p.lat, p.lng)), {
            icon: MarkerOptions.options.route,
        }));
    })

    //add start end
    if (coordsTrk.length > 0) {
        layers.push(new L.Polyline(coordsTrk, getPolylineOpt()));
        coordsAll = coordsAll.concat(Object.assign([], coordsTrk));
        addStartEndMarkers(coordsAll, layers);
    } else {
        addStartEndMarkers(points, layers);
    }
}

function drawRoutePoints(points, pointsTrk, coordsAll, layers) {
    let coords = [];
    pointsTrk.forEach(p => {
        if (p.profile === 'gap' && coords.length > 0) {
            layers.push(new L.Polyline(coords, getPolylineOpt()));
            coordsAll = coordsAll.concat(Object.assign([], coords));
            coords = [];
        } else {
            coords.push(new L.LatLng(p.lat, p.lng))
        }
    })
    coordsAll = coordsAll.concat(Object.assign([], coords));
    if (coords.length > 0) {
        layers.push(new L.Polyline(coords, getPolylineOpt()));
    }
}

function parseWpt(points, layers) {
    points && points.forEach(point => {
        let opt;
        let icon = MarkerOptions.getWptIcon(point, point.color, point.background, point.icon)
        let pInfo = point.ext;
        if (icon) {
            opt = {clickable: true, icon: icon};
            opt.group = pInfo.category ? pInfo.category : 'Favorites';
            if (pInfo.time) {
                opt.time = pInfo.time;
            }
            if (pInfo.cmt) {
                opt.cmt = pInfo.cmt;
            }
        }
        if (point.name) {
            opt.title = point.name;
        }
        if (point.desc) {
            opt.desc = point.desc;
        }
        if (point.address) {
            opt.address = point.address;
        }

        let marker = new L.Marker(new L.LatLng(pInfo.lat, pInfo.lon), opt);

        layers.push(marker);
    })
}

function addStartEndMarkers(points, layers) {
    let start = new L.LatLng(points[0].lat, points[0].lng);
    let end = new L.LatLng(points[points.length - 1].lat, points[points.length - 1].lng);

    layers.push(new L.Marker(start, {
        icon: MarkerOptions.options.startIcon
    }))
    layers.push(new L.Marker(end, {
        icon: MarkerOptions.options.endIcon
    }))
}

function getPolylineOpt() {
    return {
        color: 'blue'
    }
}


const TrackLayerProvider = {
    createLayersByTrackData
};

export default TrackLayerProvider;