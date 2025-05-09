/**
 * @license
 * Copyright (c) 2023. Vyking.io. All rights reserved.
 * =============================================================================
 */

import { property } from 'lit/decorators.js';

import ModelViewerElementBase, { $vykingSrc } from '../model-viewer-base.js';
import { Constructor } from '../utilities.js';
import { FileLoader, LoaderUtils } from 'three';
import { AnnotationInterface } from './annotation.js';
import { LoadingInterface } from './loading.js';
import { ControlsInterface } from './controls.js';
import { Renderer } from '../three-components/Renderer.js';

export declare interface VykingInterface {
    vykingSrc: string | null;
    vykingCanvas: HTMLCanvasElement | null;
}

// Define the type for view points
type ViewPoint = {
    orbit: string;
    target: string;
};

type ViewPoints = Array<ViewPoint>

export const VykingMixin = <T extends Constructor<ModelViewerElementBase & AnnotationInterface & LoadingInterface & ControlsInterface>>(
    ModelViewerElement: T): Constructor<VykingInterface> & T => {

    class VykingModelViewerElement extends ModelViewerElement {
        dimensionsVisible = false;

        constructor(...args: Array<any>) {
            super(args)

            console.info(`VykingModelViewerElement version: ${this.#VykingMixinVersion}`)
        }

        @property({ type: String, attribute: 'vyking-src' }) set vykingSrc(newValue: string | null) {
            if (this[$vykingSrc] === newValue) {
                return
            }

            this[$vykingSrc] = newValue
            if (newValue != null) {
                this.#loadFromOffsetsJson(newValue, (error: Error) => {
                    this.dispatchEvent(new CustomEvent(
                        'error', { detail: { type: 'loadfailure', sourceError: error } }));
                })
            } else {
                this.src = null
            }
        }
        get vykingSrc() {
            return this[$vykingSrc]
        }

        get vykingCanvas() {
            return Renderer.singleton.canvas3D
        }

        #VykingMixinVersion = "3.3.0-2.2"
        #internetLoggingProperties = {
            isSuspended: false,
            loggingEnabled: true,
            loggingFailureThreshold: 25,
            loggingUrl: 'https://vykingstatseu.net/cgi-bin/logpostdata.cgi',
            initialiseCount: 0,
            startCount: 0,
            modelViewer3Dmodel: 0,
            statsLoggingFailureCount: 0,
            shortShoeDescription: '',
            longShoeDescription: '',
            assetId: '',
            organizationId: ''
        }

        /**
         * Set or remove appropriate attributes based on contents of the specified offsets.json file. 
         * NOTE: 
         * If we do not remove the appropriate attributes for properties missing in the offsets.json file then the rendering will
         * be dependent upon the values set by a previous offsets.json file.
         * @param url Offsets.json file to load from
         * @param onError 
         */
        #loadFromOffsetsJson = (url: string, onError?: ((error: Error) => void) | undefined) => {
            console.log(`#loadFromOffsetsJson`)

            const _onError = function (e: unknown) {
                if (onError) {
                    onError(e instanceof Error ? e : new Error('VykingModelViewerElement load error.'))
                } else {
                    console.error(e);
                }
            }

            const loader = new FileLoader()
            loader.setWithCredentials(this.withCredentials)

            loader.setResponseType('text')
            loader.load(url, async (value) => {
                // const resourcePath = LoaderUtils.extractUrlBase(url)
                // const isUrlAbsolute = (url: string) => (url.indexOf('://') > 0 || url.indexOf('//') === 0)
                // const toResourceUrl = (url: string, resourcePath: string) => isUrlAbsolute(url) ? url : resourcePath + url
                const resourcePath = url
                const toResourceUrl = (name: string, parentUrl: string) => {
                    console.log(`getURL: ${parentUrl}, ${name}`)
                
                    const isUrlAbsolute = (url: string) => (url.indexOf('://') > 0 || url.indexOf('//') === 0)
                    const queryString = (url: string) => {
                        let search = ''
                        try {
                            search = new URL(url).search
                        } catch (e) {
                        }
                
                        return search.length > 0 ? search : ''
                    }
                
                    const matches = parentUrl?.match(/.+\//)
                    if (matches != null && matches.length > 0 && !isUrlAbsolute(name)) {
                        return matches[0] + name + queryString(parentUrl)
                    } else {
                        return name
                    }
                }

                // const loadViewerAttributes = (json: any): void => {
                //     if (!this.hasAttribute('environment-image')) {
                //         const prop = json['environmentImage']
                //         if (prop != null) {
                //             if (prop === 'neutral' || prop === 'legacy') {
                //                 this.setAttribute('environment-image', prop)
                //             } else {
                //                 this.setAttribute('environment-image', toResourceUrl(prop, resourcePath))
                //                 // this.setAttribute('skybox-image', toResourceUrl(prop, resourcePath))
                //             }
                //         }
                //     }

                //     if (!this.hasAttribute('exposure')) {
                //         const prop = json['exposure']
                //         if (prop != null) {
                //             this.setAttribute('exposure', prop)
                //         }
                //     }

                //     if (!this.hasAttribute('shadow-intensity')) {
                //         const prop = json['shadow']?.shadowIntensity
                //         if (prop != null) {
                //             this.setAttribute('shadow-intensity', prop)
                //         }
                //     }
                //     if (!this.hasAttribute('shadow-softness')) {
                //         const prop = json['shadow']?.shadowSoftness
                //         if (prop != null) {
                //             this.setAttribute('shadow-softness', prop)
                //         }
                //     }

                //     if (!this.hasAttribute('autoplay')) {
                //         const prop = json['playInbuiltAnimation']
                //         if (!!prop) {
                //             this.setAttribute('autoplay', '')
                //         }
                //     }

                //     if (!this.hasAttribute('auto-rotate')) {
                //         const prop = json['rotate']?.autoRotate
                //         if (!!prop) {
                //             this.setAttribute('auto-rotate', '')
                //         }
                //     }

                //     if (!this.hasAttribute('rotation-per-second')) {
                //         const prop = json['rotate']?.rotationPerSecond
                //         if (prop != null) {
                //             this.setAttribute('rotation-per-second', prop)
                //         }
                //     }

                //     if (!this.hasAttribute('camera-orbit')) {
                //         const prop = json['initialCameraPosition']
                //         if (prop != null) {
                //             const yaw = prop.yaw ?? "auto"
                //             const pitch = prop.pitch ?? "auto"
                //             const distance = prop.dist ?? "auto"
                //             this.setAttribute('camera-orbit', `${yaw} ${pitch} ${distance}`)
                //         }
                //     }
                // }
                const toggleViewSlot = this.shadowRoot!.querySelector('.slot.view-toggles') as HTMLElement
                if (toggleViewSlot != null) {
                    toggleViewSlot.classList.remove(`enabled`)
                }

                this.dimensionsVisible = false
                this.setDimensionsVisibility(false)
                const toggleDimensionsSlot = this.shadowRoot!.querySelector('.slot.dimensions-toggle') as HTMLElement
                if (toggleDimensionsSlot != null) {
                    toggleDimensionsSlot.classList.remove(`enabled`)
                }
                const loadViewerAttributes = (json: any): void => {
                    {
                        const prop = json['environmentImage_viewer']
                        if (prop != null) {
                            if (prop === 'neutral' || prop === 'legacy') {
                                this.setAttribute('environment-image', prop)
                            } else {
                                this.setAttribute('environment-image', toResourceUrl(prop, resourcePath))
                                // this.setAttribute('skybox-image', toResourceUrl(prop, resourcePath))
                            }
                        } else {
                            const prop = json['environmentImage']
                            if (prop != null) {
                                if (prop === 'neutral' || prop === 'legacy') {
                                    this.setAttribute('environment-image', prop)
                                } else {
                                    this.setAttribute('environment-image', toResourceUrl(prop, resourcePath))
                                    // this.setAttribute('skybox-image', toResourceUrl(prop, resourcePath))
                                }
                            } else {
                                this.removeAttribute('environment-image')
                            }
                        }
                    }

                    {
                        const prop = json['exposure_viewer']
                        if (prop != null) {
                            this.setAttribute('exposure', prop)
                        } else {
                            const prop = json['exposure']
                            if (prop != null) {
                                this.setAttribute('exposure', prop)
                            } else {
                                this.removeAttribute('exposure')
                            }
                        }
                    }

                    {
                        const prop = json['shadow']?.shadowIntensity
                        if (prop != null) {
                            this.setAttribute('shadow-intensity', prop)
                        } else {
                            this.removeAttribute('shadow-intensity')
                        }
                    }
                    {
                        const prop = json['shadow']?.shadowSoftness
                        if (prop != null) {
                            this.setAttribute('shadow-softness', prop)
                        } else {
                            this.removeAttribute('shadow-softness')
                        }
                    }

                    {
                        const prop = json['playInbuiltAnimation']
                        if (!!prop) {
                            this.setAttribute('autoplay', '')
                        } else {
                            this.removeAttribute('autoplay')
                        }
                    }

                    {
                        const prop = json['rotate']?.autoRotate
                        if (!!prop) {
                            this.setAttribute('auto-rotate', '')
                        } else {
                            this.removeAttribute('auto-rotate')
                        }
                    }

                    {
                        const prop = json['rotate']?.rotationPerSecond
                        if (prop != null) {
                            this.setAttribute('rotation-per-second', prop)
                        } else {
                            this.removeAttribute('rotation-per-second')
                        }
                    }

                    {
                        const prop = json['initialCameraPosition']
                        if (prop != null) {
                            const yaw = prop.yaw ?? "auto"
                            const pitch = prop.pitch ?? "auto"
                            const distance = prop.dist ?? "auto"
                            this.cameraOrbit = `${yaw} ${pitch} ${distance}`
                            this.cameraTarget = prop.target ?? 'auto'
                        } else {
                            this.removeAttribute('camera-orbit')
                        }
                    }

                    {
                        const toggleProps = json['toggle_views']
                        if (toggleProps != null && toggleProps.showToggle === true) {
                            toggleViewSlot.classList.add(`enabled`)
                        }

                        const toggleView = this.shadowRoot!.querySelector('#default-view-toggles') as HTMLElement
                        if (toggleView != null && toggleProps != null) {
                            const viewPoints: ViewPoints = toggleProps.views

                            toggleView.onclick = (event: MouseEvent) => {
                                const target = event?.target
                                if (target instanceof HTMLElement && target.classList.contains('toggle-option')) {
                                    const view = Number(target.getAttribute('data-view'))
                                    if (view == null) {
                                        return
                                    }

                                    this.removeAttribute('auto-rotate')

                                    // Update camera position
                                    const viewPoint = viewPoints[view];
                                    this.cameraOrbit = viewPoint.orbit;
                                    this.cameraTarget = viewPoint.target;

                                    // Update active button state
                                    const toggleOptions = this.shadowRoot!.querySelectorAll('.toggle-option')
                                    toggleOptions.forEach(option => {
                                        option.classList.remove('selected');
                                    });
                                    target.classList.add('selected');
                                }
                            }

                            while (toggleView.firstChild) {
                                toggleView.firstChild.remove()
                            }

                            if (toggleProps != null) {
                                let dataView = 0
                                toggleProps.views.forEach(() => {
                                    const div = document.createElement('HTMLDivElement') as HTMLDivElement
                                    div.classList.add('toggle-option')
                                    div.setAttribute('data-view', dataView.toString())
                                    // if (dataView === 0) {
                                    //     div.classList.add(`selected`)
                                    // }

                                    toggleView.appendChild(div)
                                    dataView++
                                });
                            }
                        }
                    }

                    {
                        const toggleDimensions = json['show_dimensions']
                        if (toggleDimensions != null && toggleDimensions === true) {
                            toggleDimensionsSlot.classList.add(`enabled`)
                        }

                        const toggleDimension = this.shadowRoot!.querySelector('#default-dimensions-toggle') as HTMLElement
                        if (toggleDimension != null) {
                            toggleDimension.textContent = 'Show Dimensions';

                            toggleDimension.onclick = (/*event: MouseEvent*/) => {
                                this.dimensionsVisible = !this.dimensionsVisible;
                                this.setDimensionsVisibility(this.dimensionsVisible);

                                if (this.dimensionsVisible) {
                                    toggleDimension.classList.add('active');
                                    toggleDimension.textContent = 'Hide Dimensions';

                                    this.dataset.savedCameraOrbit = this.cameraOrbit;
                                    this.dataset.savedCameraTarget = this.cameraTarget;

                                    // Change to a skewed view that better shows the dimensions
                                    this.cameraOrbit = '45deg 65deg 130%';
                                    this.cameraTarget = 'auto';

                                    this.removeAttribute('auto-rotate')
                                } else {
                                    toggleDimension.classList.remove('active');
                                    toggleDimension.textContent = 'Show Dimensions';

                                    this.cameraOrbit = this.dataset.savedCameraOrbit ?? '';
                                    this.cameraTarget = this.dataset.savedCameraTarget ?? 'auto';
                                    this.dataset.savedCameraOrbit = '';
                                    this.dataset.savedCameraTarget = '';
                                }

                                {
                                    // Get model dimensions
                                    const center = this.getBoundingBoxCenter();
                                    const size = this.getDimensions();
                                    const x2 = size.x * 1.05 / 2;
                                    const y2 = size.y * 1.05 / 2;
                                    const z2 = size.z * 1.05 / 2;
                                    let target

                                    // Update hotspot positions
                                    this.updateHotspot({
                                        name: 'hotspot-vyking-dot+X-Y+Z',
                                        position: `${center.x + x2} ${center.y - y2} ${center.z + z2}`
                                    });

                                    this.updateHotspot({
                                        name: 'hotspot-vyking-dim+X-Y',
                                        position: `${center.x + x2 * 1.2} ${center.y - y2 * 1.1} ${center.z}`
                                    });
                                    this.shadowRoot!.querySelector('slot[name="hotspot-vyking-dim+X-Y"] > button')!.textContent = `${(size.z * 100).toFixed(0)} cm`;
                                    target = this.querySelector('[slot="hotspot-vyking-dim+X-Y"]')
                                    if (target != null) {
                                        target.textContent = `${(size.z * 100).toFixed(0)} cm`
                                    }

                                    this.updateHotspot({
                                        name: 'hotspot-vyking-dot+X-Y-Z',
                                        position: `${center.x + x2} ${center.y - y2} ${center.z - z2}`
                                    });

                                    this.updateHotspot({
                                        name: 'hotspot-vyking-dim+X-Z',
                                        position: `${center.x + x2 * 1.2} ${center.y} ${center.z - z2 * 1.2}`
                                    });
                                    this.shadowRoot!.querySelector('slot[name="hotspot-vyking-dim+X-Z"] > button')!.textContent = `${(size.y * 100).toFixed(0)} cm`;
                                    target = this.querySelector('[slot="hotspot-vyking-dim+X-Z"]')
                                    if (target != null) {
                                        target.textContent = `${(size.y * 100).toFixed(0)} cm`
                                    }

                                    this.updateHotspot({
                                        name: 'hotspot-vyking-dot+X+Y-Z',
                                        position: `${center.x + x2} ${center.y + y2} ${center.z - z2}`
                                    });

                                    this.updateHotspot({
                                        name: 'hotspot-vyking-dim+Y-Z',
                                        position: `${center.x} ${center.y + y2 * 1.1} ${center.z - z2 * 1.1}`
                                    });
                                    this.shadowRoot!.querySelector('slot[name="hotspot-vyking-dim+Y-Z"] > button')!.textContent = `${(size.x * 100).toFixed(0)} cm`;
                                    target = this.querySelector('[slot="hotspot-vyking-dim+Y-Z"]')
                                    if (target != null) {
                                        target.textContent = `${(size.x * 100).toFixed(0)} cm`
                                    }

                                    this.updateHotspot({
                                        name: 'hotspot-vyking-dot-X+Y-Z',
                                        position: `${center.x - x2} ${center.y + y2} ${center.z - z2}`
                                    });

                                    this.updateHotspot({
                                        name: 'hotspot-vyking-dim-X-Z',
                                        position: `${center.x - x2 * 1.2} ${center.y} ${center.z - z2 * 1.2}`
                                    });
                                    this.shadowRoot!.querySelector('slot[name="hotspot-vyking-dim-X-Z"] > button')!.textContent = `${(size.y * 100).toFixed(0)} cm`;
                                    target = this.querySelector('[slot="hotspot-vyking-dim-X-Z"]')
                                    if (target != null) {
                                        target.textContent = `${(size.y * 100).toFixed(0)} cm`
                                    }

                                    this.updateHotspot({
                                        name: 'hotspot-vyking-dot-X-Y-Z',
                                        position: `${center.x - x2} ${center.y - y2} ${center.z - z2}`
                                    });

                                    this.updateHotspot({
                                        name: 'hotspot-vyking-dim-X-Y',
                                        position: `${center.x - x2 * 1.2} ${center.y - y2 * 1.1} ${center.z}`
                                    });
                                    this.shadowRoot!.querySelector('slot[name="hotspot-vyking-dim-X-Y"] > button')!.textContent = `${(size.z * 100).toFixed(0)} cm`;
                                    target = this.querySelector('[slot="hotspot-vyking-dim-X-Y"]')
                                    if (target != null) {
                                        target.textContent = `${(size.z * 100).toFixed(0)} cm`
                                    }

                                    this.updateHotspot({
                                        name: 'hotspot-vyking-dot-X-Y+Z',
                                        position: `${center.x - x2} ${center.y - y2} ${center.z + z2}`
                                    });

                                    this.renderSVG();
                                }
                            }
                        }
                    }
                }

                const logStatsToAmazon = async (type: string) => {
                    if (!this.#internetLoggingProperties.loggingEnabled) { return }
                    if (this.#internetLoggingProperties.loggingUrl === '') { return }

                    const fqdn = window.self === window.top
                            ? new URL(document.location.href).hostname
                            : document.referrer !== '' // The spec says this should be set, but for firefox it's not!!!!
                                ? new URL(document.referrer).hostname
                                : new URL(window.top!.location.href).hostname // Best guess at an alternative
                    const reversedFQDN = (fqdn: string) => fqdn.split('.').reverse().join('.')
                    const encodeURIComponent = (x: string) => x
                    const sumString = (str: string) => {
                        let sum = 0
                        for (let i = 0; i < str.length; i++) {
                            sum += str.charCodeAt(i)
                        }
                        return sum
                    }

                    let count = 0
                    switch (type) {
                        case 'modelViewer3Dmodel':
                            count = ++this.#internetLoggingProperties.modelViewer3Dmodel
                            break
                    }

                    try {
                        const logMessage = 'web'
                            + `|${encodeURIComponent(this.#VykingMixinVersion)}` // a version
                            + `|${encodeURIComponent('')}` // client id
                            + `|${encodeURIComponent(reversedFQDN(fqdn))}` // domain
                            + `|${encodeURIComponent(type)}` // request type 
                            + `|${encodeURIComponent(count.toString())}` // a count per request type
                            + `|${encodeURIComponent(new Date().toISOString())}` // data and time
                            + `|${encodeURIComponent(navigator.language)}` // locale
                            + `|${encodeURIComponent(navigator.userAgent)}` // browser type and version
                            + `|${encodeURIComponent(this.#internetLoggingProperties.shortShoeDescription.replace(/\|/g, ' ').replace(/—/g, '-'))}^^${encodeURIComponent(this.#internetLoggingProperties.longShoeDescription.replace(/\|/g, ' ').replace(/—/g, '-'))}` // asset names
                            + `|${encodeURIComponent(this.#internetLoggingProperties.organizationId)}`
                            + `|${encodeURIComponent(this.#internetLoggingProperties.assetId)}`

                        const logMessageSum = sumString(logMessage)
                        console.info(`logStatsToAmazon: ${logMessage}, ${logMessageSum}`)

                        const response = await fetch(this.#internetLoggingProperties.loggingUrl, {
                            method: 'POST',
                            credentials: 'omit',
                            cache: 'no-cache',
                            headers: {
                                'Content-Type': 'multipart/form-data',//'text/plain',
                            },
                            body: logMessage
                        })
                        if (!response.ok) { throw new Error(`${response.status}`) }
                        response.headers.forEach((value, key) => {
                            switch (key) {
                                case "vykvalue":
                                    this.#internetLoggingProperties.statsLoggingFailureCount = (parseInt(value, 10) === logMessageSum) ? 0 : this.#internetLoggingProperties.statsLoggingFailureCount + 1
                                    if (this.#internetLoggingProperties.statsLoggingFailureCount > 0) {
                                        console.error(`logStatsToAmazon failed ${parseInt(value, 10)} ${this.#internetLoggingProperties.statsLoggingFailureCount}.`)
                                    }
                                    break
                                case "suspend":
                                    console.error(`logStatsToAmazon suspending service.`)
                                    this.#internetLoggingProperties.isSuspended = true
                                    break
                            }
                        })
                    } catch (cause) {
                        console.error(`logStatsToAmazon: location.href "${fqdn}"`)
                        console.error(`logStatsToAmazon: ${cause}`)
                    }
                }

                const loadStatsProperties = (json: any): void => {
                    let prop = json['shortDescription'] ?? json['shortShoeDescription']
                    if (prop != null) {
                        this.#internetLoggingProperties.shortShoeDescription = prop
                    }

                    prop = json['longDescription'] ?? json['longShoeDescription']
                    if (prop != null) {
                        this.#internetLoggingProperties.longShoeDescription = prop
                    }

                    prop = json['assetId']
                    if (prop != null) {
                        this.#internetLoggingProperties.assetId = prop
                    }

                    prop = json['organizationId']
                    if (prop != null) {
                        this.#internetLoggingProperties.organizationId = prop
                    }
                }

                try {
                    if (typeof value === 'string') {
                        const json = JSON.parse(value)

                        loadStatsProperties(json)

                        {
                            let prop = json.viewerAttributes?.viewer_model
                            if (prop == null) {
                                const bodyPart = json.schemaVersion === "1.1"
                                    ? json.left_foot ? json.footLeft : json.footRight
                                    : Number(json.schemaVersion) >= 2.0
                                        ? json.type === "foot"
                                            ? json.left_foot ? json.footLeft : json.footRight
                                            : json.type === "head"
                                                ? json.head
                                                : json.type === "wrist"
                                                    ? json.wrist
                                                    : json.type === "object"
                                                        ? json.object
                                                        : null
                                        : null
                                prop = bodyPart?.apparel[0]?.glb_uri
                            }

                            const img = this.shadowRoot!.querySelector('#default-progress-img') as HTMLImageElement
                            if (prop != null) {
                                const imgUri = json.asset_icon_uri ?? json.icon_uri
                                if (img != null && imgUri != null) {
                                    img.src = toResourceUrl(imgUri, resourcePath)
                                }

                                this.setAttribute('src', toResourceUrl(prop, resourcePath))
                            } else {
                                if (img != null) {
                                    img.src = ''
                                }

                                this.removeAttribute('src')
                            }
                        }

                        const prop = json['viewerAttributes']
                        if (prop != null) {
                            loadViewerAttributes(prop)
                        } else {
                            loadViewerAttributes({
                                // "environmentImage": "neutral",
                                "toneMapping": "ACESFilmicToneMapping",
                                "exposure": 1.0,
                                "initialCameraPosition": {
                                    "yaw": "42.0deg",
                                    "pitch": "60.0deg",
                                    "distance": "auto"
                                },
                                "shadow": {
                                    "shadowIntensity": 1.0,
                                    "shadowSoftness": 1.0
                                },
                                "playInbuiltAnimation": false,
                                "rotate": {
                                    "autoRotate": true,
                                    "rotationPerSecond": 0.1
                                }
                            })
                        }

                        // If calling loadViewerAttributes did not define the 'environment-image' attribute
                        // use the legacy 'environmentMap' property, if its defined.
                        if (!this.hasAttribute('environment-image')) {
                            const prop = json['environmentMap']
                            if (prop != null && prop !== 'envMap.jpg') {
                                this.setAttribute('environment-image', toResourceUrl(prop, resourcePath))
                            } else {
                                this.setAttribute('environment-image', 'neutral')
                            }
                        }

                        logStatsToAmazon('modelViewer3Dmodel')
                    }
                } catch (e: any) {
                    console.error(`#loadFromOffsetsJson: ${e}`)
                    _onError(e);
                }
            }, () => { }, _onError)
        }

        setDimensionsVisibility = (visible: boolean) => {
            const dimElements = Array.from(this.shadowRoot!.querySelectorAll('slot[name^="hotspot-vyking"]')).concat([this.shadowRoot!.querySelector('#dimLines')!]);

            dimElements.forEach((element) => {
                if (visible) {
                    element.classList.remove('hide');
                } else {
                    element.classList.add('hide');
                }
            });
        }

        // Function to render SVG dimension lines
        renderSVG = () => {
            const dimLines = this.shadowRoot!.querySelectorAll('.dimensionLine');

            this.drawLine(
                dimLines[0],
                this.queryHotspot('hotspot-vyking-dot+X-Y+Z'),
                this.queryHotspot('hotspot-vyking-dot+X-Y-Z'),
                this.queryHotspot('hotspot-vyking-dim+X-Y')
            );

            this.drawLine(
                dimLines[1],
                this.queryHotspot('hotspot-vyking-dot+X-Y-Z'),
                this.queryHotspot('hotspot-vyking-dot+X+Y-Z'),
                this.queryHotspot('hotspot-vyking-dim+X-Z')
            );

            this.drawLine(
                dimLines[2],
                this.queryHotspot('hotspot-vyking-dot+X+Y-Z'),
                this.queryHotspot('hotspot-vyking-dot-X+Y-Z'),
                this.queryHotspot('hotspot-vyking-dim+X-Z') // THIS MAY BE WRong
            );

            this.drawLine(
                dimLines[3],
                this.queryHotspot('hotspot-vyking-dot-X+Y-Z'),
                this.queryHotspot('hotspot-vyking-dot-X-Y-Z'),
                this.queryHotspot('hotspot-vyking-dim-X-Z')
            );

            this.drawLine(
                dimLines[4],
                this.queryHotspot('hotspot-vyking-dot-X-Y-Z'),
                this.queryHotspot('hotspot-vyking-dot-X-Y+Z'),
                this.queryHotspot('hotspot-vyking-dim-X-Y')
            );
        }

        // Function to draw dimension lines
        drawLine = (svgLine: any, dotHotspot1: any, dotHotspot2: any, dimensionHotspot: any) => {
            if (dotHotspot1 && dotHotspot2) {
                // Calculate the midpoint between the two dots
                const x1 = dotHotspot1.canvasPosition.x;
                const y1 = dotHotspot1.canvasPosition.y;
                const x2 = dotHotspot2.canvasPosition.x;
                const y2 = dotHotspot2.canvasPosition.y;

                // Create an offset for the dimension line (don't connect directly)
                const offsetX = (x2 - x1) * 0.1; // 10% offset
                const offsetY = (y2 - y1) * 0.1; // 10% offset

                // Set the line to start and end with a small gap from the dots
                svgLine.setAttribute('x1', x1 + offsetX);
                svgLine.setAttribute('y1', y1 + offsetY);
                svgLine.setAttribute('x2', x2 - offsetX);
                svgLine.setAttribute('y2', y2 - offsetY);

                // Use provided optional hotspot to tie visibility of this svg line to
                if (dimensionHotspot && !dimensionHotspot.facingCamera) {
                    svgLine.classList.add('hide');
                } else {
                    svgLine.classList.remove('hide');
                }
            }
        }

        connectedCallback() {
            super.connectedCallback();

            this.setDimensionsVisibility(this.dimensionsVisible);
            this.addEventListener('camera-change', this.renderSVG);
        }

        disconnectedCallback() {
            super.disconnectedCallback();

            this.removeEventListener('camera-change', this.renderSVG);
        }
    }

    return VykingModelViewerElement;
}