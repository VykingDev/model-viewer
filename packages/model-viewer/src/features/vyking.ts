/**
 * @license
 * Copyright (c) 2023. Vyking.io. All rights reserved.
 * =============================================================================
 */

import { property } from 'lit/decorators.js';

import { IS_VYKING_VTO_CANDIDATE } from '../constants.js';
import ModelViewerElementBase, { $poster, $vykingSrc } from '../model-viewer-base.js';
import { Constructor } from '../utilities.js';
import { FileLoader, LoaderUtils } from 'three';

export interface VykingApparelGlobalConfig {
    isDisabled?: boolean
    disabledQRCodeUrl?: string
}

export declare interface VykingInterface {
    vykingSrc: string | null;
}

export const VykingMixin = <T extends Constructor<ModelViewerElementBase>>(
    ModelViewerElement: T): Constructor<VykingInterface> & T => {

    class VykingModelViewerElement extends ModelViewerElement {
        @property({ type: String, attribute: 'vyking-src' }) set vykingSrc(newValue: string | null) {
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

        #loadFromOffsetsJson = (url: string, onError?: ((event: ErrorEvent) => void) | undefined) => {
            const _onError = function (e: ErrorEvent) {
                if (onError) {
                    onError(e)
                } else {
                    console.error(e);
                }

                // scope.manager.itemError(url)
                // scope.manager.itemEnd(url)
            }

            const loader = new FileLoader()
            loader.setWithCredentials(this.withCredentials)

            loader.setResponseType('text')
            loader.load(url, async (value) => {
                const resourcePath = LoaderUtils.extractUrlBase(url)
                const isUrlAbsolute = (url: string) => (url.indexOf('://') > 0 || url.indexOf('//') === 0)
                const toResourceUrl = (url: string, resourcePath: string) => isUrlAbsolute(url) ? url : resourcePath + url

                try {
                    if (typeof value === 'string') {
                        const json = JSON.parse(value)

                        if (!this.hasAttribute('src')) {
                            const bodyPart = json.schemaVersion === "1.1"
                                ? json.left_foot ? json.footLeft : json.footRight
                                : json.schemaVersion === "2.0"
                                    ? json.name === "foot"
                                        ? json.left_foot ? json.footLeft : json.footRight
                                        : json.name === "head"
                                            ? json.head
                                            : json.name === "wrist"
                                                ? json.wrist
                                                : json.name === "object"
                                                    ? json.object
                                                    : null
                                    : null
                            console.log(`VykingModelViewerElement load %o`, bodyPart)
                            const prop = bodyPart?.apparel[0]?.glb_uri
                            console.log(`VykingModelViewerElement load %o`, prop)

                            if (prop != null) {
                                this.setAttribute('src', toResourceUrl(prop, resourcePath))
                            }
                        }

                        if (!this.hasAttribute('environment-image')) {
                            const prop = json['environment-image'] ?? json['environmentMap']
                            if (prop != null) {
                                this.setAttribute('environment-image', toResourceUrl(prop, resourcePath))
                                // this.setAttribute('skybox-image', toResourceUrl(prop, resourcePath))
                            }
                        }

                        if (!this.hasAttribute('exposure')) {
                            const prop = json['exposure']
                            if (prop != null) {
                                this.setAttribute('exposure', prop)
                            }
                        }

                        if (!this.hasAttribute('shadow-intensity')) {
                            const prop = json['shadow']?.shadowIntensity
                            if (prop != null) {
                                this.setAttribute('shadow-intensity', prop)
                            }
                        }
                        if (!this.hasAttribute('shadow-softness')) {
                            const prop = json['shadow']?.shadowSoftness
                            if (prop != null) {
                                this.setAttribute('shadow-softness', prop)
                            }
                        }

                        if (!this.hasAttribute('autoplay')) {
                            const prop = json['play_inbuilt_animation']
                            if (!!prop) {
                                this.setAttribute('autoplay', '')
                            }
                        }

                        if (!this.hasAttribute('auto-rotate')) {
                            const prop = json['rotate']?.['auto-rotate']
                            if (!!prop) {
                                this.setAttribute('auto-rotate', '')
                            }
                        }

                        if (!this.hasAttribute('rotation-per-second')) {
                            const prop = json['rotate']?.['rotation-per-second']
                            if (prop != null) {
                                this.setAttribute('rotation-per-second', prop)
                            }
                        }
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