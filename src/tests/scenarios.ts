
import type { AnimationOptions, Map } from "@2gis/mapgl/types";

function sleep(time: any) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

function waitIdle(map: Map) {
    return new Promise((resolve) => {
        map.once('idle', resolve);
    });
}

export async function runScenario(map: Map, name: string, speedMultiplier = 1) {
    const scenario = scenarios[name];
    for (const part of scenario) {
        console.log(part);
        // console.log(part);
        const duration = (part.duration || 0) / speedMultiplier;
        if (part.zoom !== undefined) {
            const params: AnimationOptions = {
                duration,
                // @ts-ignore
                animateHeight: true,
            };
            if (part.zoomEasing) {
                params.easing = part.zoomEasing;
            }
            map.setZoom(part.zoom, params);
        }
        if (part.pitch !== undefined) {
            const params: AnimationOptions = {
                duration,
            };
            if (part.pitchEasing) {
                params.easing = part.pitchEasing;
            }
            map.setPitch(part.pitch, params);
        }
        if (part.center) {
            const params: AnimationOptions = {
                duration,
            };
            if (part.centerEasing) {
                params.easing = part.centerEasing;
            }
            map.setCenter(part.center, params);
        }
        if (part.rotation !== undefined) {
            const params: AnimationOptions = {
                duration,
            };
            if (part.rotationEasing) {
                params.easing = part.rotationEasing;
            }
            map.setRotation(part.rotation, { ...params, normalize: false });
        }

        if (typeof part.f === 'function') {
            part.f();
        }

        if (part.waitIdle) {
            await waitIdle(map);
        } else {
            await sleep(duration);
        }
    }
}

const city = [[
    { center: [37.53845987671461, 55.74797546907836], duration: 0, },
    { zoom: 16.25, pitch: 45, rotation: -125, duration: 0, },
], [
    { center: [37.53845987671461, 55.74797546907836], duration: 0, },
    { zoom: 16.25, pitch: 45, rotation: -120, duration: 30, },
], [
    { center: [37.53845987671461, 55.74797546907836], duration: 0, },
    { zoom: 16.25, pitch: 45, rotation: -130, duration: 60, },
], [{ center: [37.53845987671461, 55.74797546907836], duration: 0, },
{ zoom: 16.25, pitch: 45, rotation: -125, duration: 30, },
]].reduce((res, scenario) => {
    scenario.forEach((viewRequest) =>
        res.push({ ...viewRequest, duration: viewRequest.duration * 100 }),
    );
    return res;
}, []);

const vdnh = [
    // Москва, ВДНХ. 
    [
        { center: [37.62742345406123, 55.82719709325038], duration: 0, },
        { zoom: 18.7, pitch: 67, rotation: 8.5, duration: 0, },
    ],
    [
        { center: [37.62740929769575, 55.82757376817635], duration: 30, },
        { zoom: 18.7, pitch: 64, rotation: 12, duration: 30, },
    ],
    [
        { center: [37.626723019217266, 55.828143174195105], duration: 30, },
        { zoom: 20, pitch: 68.4983, rotation: 39.654, duration: 30, },
    ],
    [
        { center: [37.62752609489254, 55.82847523383511], duration: 30, },
        { zoom: 20, pitch: 85, rotation: -49.841, duration: 30, },
    ],
    [
        { center: [37.62943941090172, 55.82949640733734], duration: 50, },
        { zoom: 20, pitch: 57, rotation: -49.610, duration: 30, },
    ],
    [
        { center: [37.631090238670055, 55.829268843812685], duration: 30, },
        { zoom: 20, pitch: 85, rotation: -94.35, duration: 40, },
    ],
    [
        { center: [37.63193298066959, 55.82937624333414], duration: 30, },
        { zoom: 20, pitch: 66, rotation: -2.35, duration: 60, },
    ],
    [
        { center: [37.63234400652952, 55.829290773398505], duration: 30, },
        { zoom: 18.7, pitch: 59, rotation: 43, duration: 60, },
    ],
    [
        { center: [37.63234400652952, 55.829290773398505], duration: 10, },
        { zoom: 18.7, pitch: 33, rotation: 43, duration: 70, },
    ],
].reduce((res, scenario) => {
    scenario.forEach((viewRequest) =>
        res.push({ ...viewRequest, duration: viewRequest.duration * 100 }),
    );
    return res;
}, []);

const easy = [
    // москва дефолт
    [
        { center: [37.62017, 55.753466], duration: 0, easing: 'easeInOutQuad' },
        { zoom: 11, pitch: 0, rotation: 0, duration: 0, easing: 'easeOutCubic' },
    ],
    // вднх вход
    [
        { center: [37.637587, 55.826326], duration: 120, easing: 'easeInOutQuad' },
        { zoom: 19.89, pitch: 44.13, rotation: 34.85, duration: 150, easing: 'easeInOutCubic' },
    ],
    // вднх отзум
    [
        { center: [37.630834, 55.830619], duration: 70, easing: 'easeInOutQuad' },
        { zoom: 16.39, pitch: 45, rotation: 174.95, duration: 80, easing: 'easeInOutCubic' },
    ],
].reduce((res, scenario) => {
    scenario.forEach((viewRequest) =>
        res.push({ ...viewRequest, duration: viewRequest.duration * 100 }),
    );
    return res;
}, []);


export const scenarios: any = { "МоскваСити": city, "ВДНХ": vdnh, "Москва малый": easy, }
