import TracksManager from '../context/TracksManager';
import { apiGet } from '../util/HttpApi';
import { useState } from 'react';

/**
 * Mutation-compatible wrapper over useState(object)
 * Create object copy -> Apply callback() -> Call setter()
 *
 * Example:
 *
 * const [showPoints, mutateShowPoints] = useMutator({ points: true, wpts: true });
 *
 * mutateShowPoints((next) => (next.points = !next.points)) // functional way
 * mutateShowPoints({ points: true, wpts: true }) // classic way supported
 */
export function useMutator(init) {
    const [state, setter] = useState(init);
    const mutator = (update) => {
        if (update && typeof update === 'function') {
            setter((previous) => {
                const proto = (instance) => Object.create(Object.getPrototypeOf(instance));
                const next = Object.assign(proto(previous), previous);
                update(next); // callback
                return next;
            });
            return;
        } else {
            setter(() => update);
        }
    };
    return [state, mutator];
}

async function getFileData(file) {
    let trackData;
    if (file.url.substr(0, 1) === '<') {
        // direct XML has to start with a <
        trackData = file.url;
    } else {
        const response = await apiGet(file.url, file.urlopts ? file.urlopts : {});
        if (response.ok) {
            trackData = await response.text();
        } else {
            trackData = '<gpx version="1.1" />';
        }
    }
    return trackData;
}

const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6372.8; // for haversine use R = 6372.8 km instead of 6371 km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    //double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    //return R * c * 1000;
    // simplyfy haversine:
    return 2 * R * 1000 * Math.asin(Math.sqrt(a));
};

const toRadians = (angdeg) => {
    return (angdeg / 180.0) * Math.PI;
};

function getPointsDist(list) {
    let dist = 0;
    if (list.length > 0) {
        for (let index = 0; index < list.length; ++index) {
            if (index === 0) {
                list[index].distance = 0;
                list[index].distanceSegment = 0;
            } else {
                let d = getDistance(list[index].lat, list[index].lng, list[index - 1].lat, list[index - 1].lng);
                dist += d;
                list[index].distance = d;
                list[index].distanceSegment = dist;
            }
        }
    }
    return list;
}

function hexToArgb(hex) {
    hex = hex.replace(/^#/, '');
    let alphaFromHex = 1;

    if (hex.length === 8) {
        alphaFromHex = Number.parseInt(hex.slice(0, 2), 16) / 255;
        hex = hex.slice(2, 8);
    }
    const number = Number.parseInt(hex, 16);
    const red = number >> 16;
    const green = (number >> 8) & 255;
    const blue = number & 255;
    const alpha = alphaFromHex;
    const alphaString = alpha === 1 ? '' : ` / ${Number((alpha * 100).toFixed(2))}%`;
    return `rgb(${red} ${green} ${blue}${alphaString})`;
}

/*
    Prepare string with NaN(s) before JSON.parse()

    1) "ele":NaN is converted to "ele":NAN_MARKER
    2) all others NaN are converted to null

    NaN isn't supported by JSON standard
*/
export function quickNaNfix(badString) {
    const ele = '"ele":' + TracksManager.NAN_MARKER; // "ele" to NAN_MARKER (99999)
    const nil = ':null'; // other NaN(s) to null (think about srtmEle)

    return badString.replace(/"ele": ?NaN\b/g, ele).replace(/: ?NaN\b/g, nil);
}

/*
    Copy simple (JSON) objects, faster than _.cloneDeep()
    Don't use on objects with circular structure (such as layers)
*/
export function copyObj(obj) {
    return typeof obj === 'object' ? JSON.parse(JSON.stringify(obj)) : obj;
}

// remove dangerous filename parts
export function prepareFileName(filename) {
    const truncate = (sanitized, length) => {
        const uint8Array = new TextEncoder().encode(sanitized);
        const truncated = uint8Array.slice(0, length);
        return new TextDecoder().decode(truncated);
    };

    // eslint-disable-next-line no-useless-escape
    const illegalRe = /[\/\?<>\\:\*\|"]/g;
    // eslint-disable-next-line no-control-regex
    const controlRe = /[\x00-\x1f\x80-\x9f]/g;
    const reservedRe = /^\.+$/;
    // eslint-disable-next-line no-useless-escape
    const unixRe = /[\`\'\$\{\}\[\]\(\)]/g;
    const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
    const spacesRe = / +/g;

    const space = ' ';

    return truncate(
        filename
            .replace(illegalRe, space)
            .replace(controlRe, space)
            .replace(reservedRe, space)
            .replace(unixRe, space)
            .replace(windowsReservedRe, space)
            .replace(spacesRe, space)
            .trim(),
        255
    );
}

const Utils = {
    getFileData,
    getDistance,
    getPointsDist,
    hexToArgb,
};

export default Utils;
