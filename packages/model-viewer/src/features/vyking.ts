/**
 * @license
 * Copyright (c) 2023. Vyking.io. All rights reserved.
 * =============================================================================
 */

import { property } from 'lit/decorators.js';

import ModelViewerElementBase, { $vykingSrc } from '../model-viewer-base.js';
import { Constructor } from '../utilities.js';
import { FileLoader, LoaderUtils } from 'three';
export declare interface VykingInterface {
    vykingSrc: string | null;
}

export const VykingMixin = <T extends Constructor<ModelViewerElementBase>>(
    ModelViewerElement: T): Constructor<VykingInterface> & T => {

    class VykingModelViewerElement extends ModelViewerElement {
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
                this.#loadFromOffsetsJson(newValue, () => { })
            } else {
                this.src = null
            }
        }
        get vykingSrc() {
            return this[$vykingSrc]
        }

        #VykingMixinVersion = "3.3.0-1.8"
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
                const resourcePath = LoaderUtils.extractUrlBase(url)
                const isUrlAbsolute = (url: string) => (url.indexOf('://') > 0 || url.indexOf('//') === 0)
                const toResourceUrl = (url: string, resourcePath: string) => isUrlAbsolute(url) ? url : resourcePath + url

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
                const loadViewerAttributes = (json: any): void => {
                    {
                        const prop = json['environmentImage-viewer']
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
                            this.setAttribute('camera-orbit', `${yaw} ${pitch} ${distance}`)
                        } else {
                            this.removeAttribute('camera-orbit')
                        }
                    }
                }

                const logStatsToAmazon = async (type: string) => {
                    if (!this.#internetLoggingProperties.loggingEnabled) { return }
                    if (this.#internetLoggingProperties.loggingUrl === '') { return }

                    const version = "1.0"
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
                            + `|${encodeURIComponent(this.#internetLoggingProperties.shortShoeDescription.replace(/|/g, ' '))}^^${encodeURIComponent(this.#internetLoggingProperties.longShoeDescription.replace(/|/g, ' '))}` // asset names
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
                                        console.error(`logStatsToAmazon failed ${this.#internetLoggingProperties.statsLoggingFailureCount}.`)
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
                    let prop = json['shortShoeDescription']
                    if (prop != null) {
                        this.#internetLoggingProperties.shortShoeDescription = prop
                    }

                    prop = json['longShoeDescription']
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
                            const bodyPart = json.schemaVersion === "1.1"
                                ? json.left_foot ? json.footLeft : json.footRight
                                : json.schemaVersion === "2.0"
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
                            const prop = bodyPart?.apparel[0]?.glb_uri

                            if (prop != null) {
                                this.setAttribute('src', toResourceUrl(prop, resourcePath))
                            } else {
                                this.removeAttribute('src')
                            }
                        }

                        const prop = json['viewerAttributes']
                        if (prop != null) {
                            loadViewerAttributes(prop)
                        } else {
                            loadViewerAttributes({})
                        }

                        // If calling loadViewerAttributes did not define the 'environment-image' attribute
                        // use the legacy 'environmentMap' property, if its defined.
                        if (!this.hasAttribute('environment-image')) {
                            const prop = json['environmentMap']
                            if (prop != null) {
                                this.setAttribute('environment-image', toResourceUrl(prop, resourcePath))
                            }
                        }

                        logStatsToAmazon('modelViewer3Dmodel')
                    }
                } catch (e: any) {
                    _onError(e);
                }
            }, () => { }, _onError)
        }

        connectedCallback() {
            super.connectedCallback();
        }

        disconnectedCallback() {
            super.disconnectedCallback();
        }
    }

    return VykingModelViewerElement;
}