/* @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { property } from 'lit/decorators.js';

import { IS_VYKING_VTO_CANDIDATE } from '../constants.js';
import ModelViewerElementBase, { $poster, $shouldAttemptPreload, $updateSource, $renderer } from '../model-viewer-base.js';
import { enumerationDeserializer } from '../styles/deserializers.js';
import { Constructor, waitForEvent } from '../utilities.js';

export interface VykingApparelGlobalConfig {
    isDisabled?: boolean
    disabledQRCodeUrl?: string
}

let isVTOBlocked = false;

export type VTOStatus =
    'not-presenting' | 'presenting' | 'failed';

export const VTOStatus: { [index: string]: VTOStatus } = {
    NOT_PRESENTING: 'not-presenting',
    PRESENTING: 'presenting',
    FAILED: 'failed'
};

export type VTOMode = 'vyking-vto-iframe' | 'none';

const deserializeVTOModes = enumerationDeserializer<VTOMode>(
    ['vyking-vto-iframe', 'none']);

const DEFAULT_VTO_MODES = 'vyking-vto-iframe';
const DEFAULT_VTO_URL = 'https://sneaker-window.vyking.io/vyking-apparel/1/vyking-apparel.js';

const VTOMode: { [index: string]: VTOMode } = {
    VYKING_VTO_IFRAME: 'vyking-vto-iframe',
    NONE: 'none'
};

const $vtoButtonContainer = Symbol('vtoButtonContainer');
export const $openIframeViewer = Symbol('openIframeViewer');
// const $canActivateVTO = Symbol('canActivateVTO');
const $vtoMode = Symbol('vtoMode');
const $vtoModes = Symbol('vtoModes');
const $vtoAnchor = Symbol('vtoAnchor');
const $preload = Symbol('preload');

const $onVTOButtonContainerClick = Symbol('onVTOButtonContainerClick');
const $onVTOStatus = Symbol('onVTOStatus');
const $onVTOTracking = Symbol('onVTOTracking');
const $onVTOTap = Symbol('onVTOTap');
const $selectVTOMode = Symbol('selectVTOMode');
const $triggerLoad = Symbol('triggerLoad');

export declare interface VTOInterface {
    vto: boolean;
    vtoUrl: string;
    vtoModes: string;
    vtoConfig: string | null;
    vtoKey: string | null;
    vtoAutoCameraWidth: number;
    vtoAutoCameraHeight: number;
    vtoAutoCameraFramerate: number;
    vtoAdvice: string | null;
    vtoFlipY: boolean;
    vtoRotate: boolean;
    vtoStats: boolean;
    vtoDebug: boolean;
    readonly canActivateVTO: boolean;
    activateVTO(): Promise<void>;
}

export const VTOMixin = <T extends Constructor<ModelViewerElementBase>>(
    ModelViewerElement: T): Constructor<VTOInterface> & T => {
    class VTOModelViewerElement extends ModelViewerElement {
        @property({ type: Boolean, attribute: 'vto' }) vto: boolean = false;

        @property({ type: String, attribute: 'vto-modes' })
        vtoModes: string = DEFAULT_VTO_MODES;

        @property({ type: String, attribute: 'vto-url' })
        vtoUrl: string = DEFAULT_VTO_URL;

        @property({ type: String, attribute: 'vto-config' })
        vtoConfig: string | null = null;

        @property({ type: String, attribute: 'vto-key' })
        vtoKey: string | null = null;

        @property({ type: String, attribute: 'vto-autocamera-width' })
        vtoAutoCameraWidth: number = 960;

        @property({ type: String, attribute: 'vto-autocamera-height' })
        vtoAutoCameraHeight: number = 540;

        @property({ type: String, attribute: 'vto-autocamera-framerate' })
        vtoAutoCameraFramerate: number = 60;

        @property({ type: String, attribute: 'vto-advice' })
        vtoAdvice: string | null = null;

        @property({ type: Boolean, attribute: 'vto-flipy' })
        vtoFlipY: boolean = false;

        @property({ type: Boolean, attribute: 'vto-rotate' })
        vtoRotate: boolean = false;

        @property({ type: Boolean, attribute: 'vto-disable-roi' })
        vtoDisableROI: boolean = false

        @property({ type: Number, attribute: 'vto-lens-factor' })
        vtoLensFactor: number | null = null

        @property({ type: Boolean, attribute: 'vto-stats' })
        vtoStats: boolean = false;

        @property({ type: Boolean, attribute: 'vto-debug' })
        vtoDebug: boolean = false;

        get canActivateVTO(): boolean {
            return this[$vtoMode] !== VTOMode.NONE;
        }

        // protected [$canActivateVTO]: boolean = false;

        // TODO: Add this to the shadow root as part of this mixin's
        // implementation:
        protected [$vtoButtonContainer]: HTMLElement =
            this.shadowRoot!.querySelector('.vto-button') as HTMLElement;

        protected [$vtoAnchor] = document.createElement('a');

        protected [$vtoModes]: Set<VTOMode> = new Set();
        protected [$vtoMode]: VTOMode = VTOMode.NONE;
        protected [$preload] = false;

        private [$onVTOButtonContainerClick] = (event: Event) => {
            event.preventDefault();
            this.activateVTO();
        };

        // private[$onVTOStatus] = ({status}: ThreeEvent) => {
        //   if (status === ARStatus.NOT_PRESENTING ||
        //       this[$renderer].arRenderer.presentedScene === this[$scene]) {
        //     this.setAttribute('ar-status', status);
        //     this.dispatchEvent(
        //         new CustomEvent<VTOStatusDetails>('ar-status', {detail: {status}}));
        //     if (status === ARStatus.NOT_PRESENTING) {
        //       this.removeAttribute('ar-tracking');
        //     } else if (status === ARStatus.SESSION_STARTED) {
        //       this.setAttribute('ar-tracking', ARTracking.TRACKING);
        //     }
        //   }
        // };

        // private[$onVTOTracking] = ({status}: ThreeEvent) => {
        //   this.setAttribute('ar-tracking', status);
        //   this.dispatchEvent(new CustomEvent<ARTrackingDetails>(
        //       'ar-tracking', {detail: {status}}));
        // };

        connectedCallback() {
            super.connectedCallback();

            this.setAttribute('vto-status', VTOStatus.NOT_PRESENTING);

            //   this[$renderer].arRenderer.addEventListener('status', this[$onVTOStatus]);

            //   this[$renderer].arRenderer.addEventListener(
            //       'tracking', this[$onVTOTracking]);

            //   this[$vtoAnchor].addEventListener('message', this[$onVTOTap]);
        }

        disconnectedCallback() {
            super.disconnectedCallback();

            //   this[$renderer].arRenderer.removeEventListener(
            //       'status', this[$onVTOStatus]);
            //   this[$renderer].arRenderer.removeEventListener(
            //       'tracking', this[$onVTOTracking]);

            //   this[$vtoAnchor].removeEventListener('message', this[$onVTOTap]);
        }

        update(changedProperties: Map<string, any>) {
            super.update(changedProperties);

            console.log(`VTOModelViewerElement %o`, changedProperties)

            if (changedProperties.has('vtoModes')) {
                this[$vtoModes] = deserializeVTOModes(this.vtoModes);
            }

            if (changedProperties.has('vto') || changedProperties.has('vtoModes') ||
                changedProperties.has('src')) {
                this[$selectVTOMode]();
            }
        }

        async activateVTO() {
            console.log(`VTOModelViewerElement.activateVTO`)
            switch (this[$vtoMode]) {
                case VTOMode.VYKING_VTO:
                    this[$openIframeViewer]();
                    break;
                default:
                    console.warn(
                        'No VTO Mode can be activated. This is probably due to missing \
configuration or device capabilities');
                    break;
            }
        }

        async[$selectVTOMode]() {
            console.log(`VTOModelViewerElement.selectVTOMode ${this.vto}`)

            let vtoMode = VTOMode.NONE;
            if (this.vto) {
                if (this.src != null) {
                    for (const value of this[$vtoModes]) {
                        if (value === 'vyking-vto-iframe' && IS_VYKING_VTO_CANDIDATE) {
                            vtoMode = VTOMode.VYKING_VTO;
                            break;
                        }
                    }
                }
            }

            if (vtoMode !== VTOMode.NONE) {
                console.log(`VTOModelViewerElement.selectVTOMode add click event`)

                this[$vtoButtonContainer].classList.add('enabled');
                this[$vtoButtonContainer].addEventListener(
                    'click', this[$onVTOButtonContainerClick]);
            } else if (this[$vtoButtonContainer].classList.contains('enabled')) {
                this[$vtoButtonContainer].removeEventListener(
                    'click', this[$onVTOButtonContainerClick]);
                this[$vtoButtonContainer].classList.remove('enabled');

                // // If AR went from working to not, notify the element.
                // const status = ARStatus.FAILED;
                // this.setAttribute('ar-status', status);
                // this.dispatchEvent(
                //     new CustomEvent<VTOStatusDetails>('ar-status', {detail: {status}}));
            }
            this[$vtoMode] = vtoMode;
        }

        async[$triggerLoad]() {
            if (!this.loaded) {
                this[$preload] = true;
                this[$updateSource]();
                await waitForEvent(this, 'load');
                this[$preload] = false;
            }
        }

        [$shouldAttemptPreload](): boolean {
            return super[$shouldAttemptPreload]() || this[$preload];
        }

        /**
         * Takes a URL and a title string, and attempts to launch VTO on
         * the current device.
         */
        [$openIframeViewer]() {
            console.log(`VTOModelViewerElement.openIframeViewer ${self.location.href}`)
            console.log(`Attempting to present in VTO with iframe: ${this.src}`);

            const escapeHTML = (text: string) => document.createTextNode(text)
            const vykingApparelGlobalConfigToJSString = (config: VykingApparelGlobalConfig) =>
                'self.HTMLVykingApparelElement = self.HTMLVykingApparelElement || {};\n'
                    .concat(config.isDisabled != null ? `        self.HTMLVykingApparelElement.isDisabled = ${config.isDisabled};\n` : '')
                    .concat(config.disabledQRCodeUrl != null ? `        self.HTMLVykingApparelElement.disabledQRCodeUrl = "${config.disabledQRCodeUrl}";\n` : `        self.HTMLVykingApparelElement.disabledQRCodeUrl = "${self.location.href}";\n`)

            const HTMLVykingApparelElement: VykingApparelGlobalConfig =
                (self as any).HTMLVykingApparelElement || {}
            const container = this.shadowRoot!.querySelector('#default-vto') as HTMLElement

            const iframe = document.createElement('iframe')
            iframe.srcdoc = escapeHTML(this.#srcDoc(vykingApparelGlobalConfigToJSString(HTMLVykingApparelElement))).textContent!
            iframe.referrerPolicy = 'origin'
            iframe.allow = 'camera;'
            // iframe.sandbox.add('allow-same-origin')
            // iframe.sandbox.add('allow-scripts')
            // iframe.sandbox.add('allow-modals')
            iframe.setAttribute("style", "top:0; left:0; border:0; margin:0; padding:0; height:100%; width:100%;");

            console.log(`steve iframe %o`, iframe)

            container.prepend(iframe);
            container.classList.add('enabled')
            this.setAttribute('vto-status', VTOStatus.PRESENTING);

            const exitButton = this.shadowRoot!.querySelector('.slot.exit-webxr-ar-button') as HTMLElement;
            const onExit = () => {
                if (exitButton != null) {                    
                    this.setAttribute('vto-status', VTOStatus.NOT_PRESENTING);
                    exitButton.classList.remove('enabled');
                }

                container.classList.remove('enabled')
                container.removeChild(iframe)
            }
            if (exitButton != null) {
                exitButton.classList.add('enabled');
                exitButton.addEventListener('click', onExit, {
                    once: true
                });
            }
        }

        #srcDoc = (config: string) => {
            const getURL = (parentUrl: string, name: string) => {
                console.log(`getURL: ${parentUrl}, ${name}`)

                const isUrlAbsolute = (url: string) => (url.indexOf('://') > 0 || url.indexOf('//') === 0)

                const matches = parentUrl?.match(/.+\//)
                if (matches != null && matches.length > 0 && !isUrlAbsolute(name)) {
                    return matches[0] + name
                } else {
                    return name
                }
            }

            return `
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Vyking Apparel</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

    <link rel="icon" type="image/png" href="../assets/images/favicon.png">

    <script>
        ${config}

        // Disable pinch to zoom because it crashes iOS Safari.
        document.addEventListener('touchmove', function (event) {
            event.preventDefault()
        }, { passive: false })
    </script>
    <script type="module" src="${this.vtoUrl}"></script>

    <style>
        html,
        body {
            background-color: black;
            height: 100%;
            left: 0;
            margin: auto;
            padding: 0px;
            position: fixed;
            top: 0;
            width: 100%;
        }

        .advice {
            display: none;
            width: 100px;
            pointer-events: none;
        }

        #vyking-apparel {
            border: 0px;
            height: 100%;
            margin: 0px;
            padding: 0px;
            width: 100%;
        }
    </style>
</head>

<body>
    <vyking-apparel id="vyking-apparel"
        ${this.vtoStats ? 'stats' : ''}
        ${this.vtoDebug ? 'debug' : ''}  
        onerror="alert('Error: ' + event.message)"
        autocamera 
        autocamera-width=${this.vtoAutoCameraWidth}
        autocamera-height=${this.vtoAutoCameraHeight}
        autocamera-framerate=${this.vtoAutoCameraFramerate}
        ${this.vtoFlipY ? 'flipy' : ''}
        ${this.vtoRotate ? 'rotate' : ''}
        ${this.vtoDisableROI ? 'rotate' : ''}
        ${!!this.vtoLensFactor ? 'lens-factor="' + this.vtoLensFactor + '"' : ''}
        ${this[$poster] ? 'poster="' + this[$poster] + '"' : ''}
        ${!!this.vtoAdvice ? 'advice="' + this.vtoAdvice + '"' : ''}
        ${!!this.src ? 'apparel="' + this.src + '"' : ''}
        ${!!this.getAttribute('environment-image') ? 'environment-image="' + getURL(self.location.href, this.getAttribute('environment-image')!) + '"' : ''}
        ${!!this.vtoConfig ? 'config="' + this.vtoConfig + '"' : ''}
        ${!!this.vtoKey ? 'key="' + this.vtoKey + '"' : ''}
        ${!!this.alt ? 'alt="' + this.alt + '"' : ''}
        ${this.withCredentials ? 'with-credentials' : ''}
        >
        <video slot="src" hidden autoplay muted playsinline></video>
        <canvas slot="canvas">Virtual Try On</canvas>
    </vyking-apparel>
</body>

</html>
`
        }
    }

    return VTOModelViewerElement;
}