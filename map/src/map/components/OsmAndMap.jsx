import { useEffect, useRef, useContext, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { MapContainer, TileLayer, ZoomControl, Marker, ScaleControl } from 'react-leaflet';
import AppContext from '../../context/AppContext';
import RouteLayer from '../layers/RouteLayer';
import WeatherLayer from '../layers/WeatherLayer';
import 'leaflet-hash';
import L from 'leaflet';
import 'leaflet-contextmenu';
import 'leaflet-contextmenu/dist/leaflet.contextmenu.css';
import FavoriteLayer from '../layers/FavoriteLayer';
import TrackLayer from '../layers/TrackLayer';
import LocalClientTrackLayer from '../layers/LocalClientTrackLayer';
import MarkerOptions from '../markers/MarkerOptions';
import ContextMenu from './ContextMenu';
import PoiLayer from '../layers/PoiLayer';
import GraphLayer from '../layers/GraphLayer';

const useStyles = makeStyles(() => ({
    root: (props) => ({
        width: '100%',
        height: '100%',
        position: 'fixed',
        '& .leaflet-control-layers': {
            border: '0px !important',
        },
        '& .leaflet-control-zoom': {
            left: `${props.mainMenuWidth}px`,
        },
        '& .leaflet-bottom ': {
            bottom: `${props.mobile ? 50 + props.drawerRightHeight : 50}px`,
            right: `${props.mobile ? 0 : props.drawerRightWidth}`,
        },
        '& .leaflet-control-scale-line': {
            marginBottom: `${props.mobile ? -6 : 0}px`,
        },
        '& .leaflet-control-layers-toggle': {
            width: '0px !important',
            height: '0px !important',
        },
        '& .leaflet-bar': {
            border: '4px !important',
        },
        '& .leaflet-bar a': {
            width: '41px !important',
            color: '#757575',
            border: '4px !important',
        },
        '& .leaflet-bar a:first-child': {
            borderTopLeftRadius: '4px !important',
            borderTopRightRadius: '4px !important',
        },
        '& .leaflet-bar a:last-child': {
            borderBottomLeftRadius: '4px !important',
            borderBottomRightRadius: '4px !important',
        },
        '& .leaflet-control': {
            boxShadow: '0 1px 5px rgba(0,0,0,0.65)',
            transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
            color: 'black',
            borderRadius: '4px',
        },
    }),
}));

// initial location on map
const position = [50, 5];

const updateMarker = (lat, lng, setHoverPoint, hoverPointRef) => {
    if (lat) {
        if (hoverPointRef.current) {
            hoverPointRef.current.setLatLng([lat, lng]);
        } else {
            setHoverPoint({ lat: lat, lng: lng });
        }
    } else {
        setHoverPoint(null);
    }
};

const OsmAndMap = ({ mobile, drawerRightHeight, mainMenuWidth, drawerRightWidth }) => {
    const classes = useStyles({ mobile, drawerRightHeight, mainMenuWidth, drawerRightWidth });
    const mapRef = useRef(null);
    const tileLayer = useRef(null);
    const hoverPointRef = useRef(null);

    const [geocodingData, setGeocodingData] = useState(null);
    const [regionData, setRegionData] = useState(null);

    const ctx = useContext(AppContext);
    const [hoverPoint, setHoverPoint] = useState(null);

    const whenReadyHandler = (event) => {
        const { target: map } = event;
        if (map) {
            new L.Hash(map);
            map.attributionControl.setPrefix('');
            mapRef.current = map;
            if (!ctx.mapMarkerListener) {
                ctx.setMapMarkerListener(() => (lat, lng) => updateMarker(lat, lng, setHoverPoint, hoverPointRef));
            }
        }
    };

    useEffect(() => {
        if (tileLayer.current) {
            tileLayer.current.setUrl(ctx.tileURL.url);
        }
    }, [ctx.tileURL]);

    // fix contextmenu of point for mobile device
    useEffect(() => {
        const markerEventHandler = (e) => {
            if (
                e.target?.draggable &&
                e.target?.alt === 'Marker' &&
                e.target?.classList?.contains('leaflet-marker-draggable')
            ) {
                if (e.type === 'touchstart') {
                    ctx.setPointContextMenu({});
                    e.preventDefault();
                }
                if (e.type === 'touchend') {
                    e.preventDefault();
                    if (e.target?.title !== 'poly') {
                        e.target?.dispatchEvent(new Event('contextmenu', e));
                    }
                }
            }
        };
        document.addEventListener('touchstart', markerEventHandler, { passive: false });
        document.addEventListener('touchend', markerEventHandler, { passive: false });
    }, []);

    return (
        <MapContainer
            center={position}
            zoom={5}
            className={classes.root}
            minZoom={1}
            maxZoom={20}
            zoomControl={false}
            whenReady={whenReadyHandler}
            contextmenu={true}
            contextmenuItems={[]}
            editable={true}
        >
            <LocalClientTrackLayer />
            <PoiLayer />
            <RouteLayer geocodingData={geocodingData} region={regionData} />
            <FavoriteLayer />
            <WeatherLayer />
            <TrackLayer />
            <GraphLayer />
            <TileLayer
                ref={tileLayer}
                attribution='WEB OsmAnd 0.1 &amp;copy <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                minZoom={1}
                maxZoom={20}
                maxNativeZoom={18}
                url={ctx.tileURL.url}
            />

            {hoverPoint && (
                <Marker ref={hoverPointRef} position={hoverPoint} icon={MarkerOptions.options.pointerGraph} />
            )}
            {mobile && <ZoomControl position="topright" />}
            {!mobile && <ZoomControl position="bottomleft" />}
            {mobile && <ScaleControl imperial={false} position="bottomleft" />}
            {!mobile && <ScaleControl imperial={false} position="bottomright" />}
            <ContextMenu setGeocodingData={setGeocodingData} setRegionData={setRegionData} />
        </MapContainer>
    );
};
export default OsmAndMap;
