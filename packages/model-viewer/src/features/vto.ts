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
import { Event as ThreeEvent } from 'three';

import { IS_VYKING_VTO_CANDIDATE } from '../constants.js';
import ModelViewerElementBase, { $needsRender, $poster, $progressTracker, $renderer, $scene, $shouldAttemptPreload, $updateSource } from '../model-viewer-base.js';
import { enumerationDeserializer } from '../styles/deserializers.js';
import { Constructor, waitForEvent } from '../utilities.js';

let isVTOBlocked = false;

export type VTOMode = 'vyking-vto' | 'none';

const deserializeVTOModes = enumerationDeserializer<VTOMode>(
    ['vyking-vto', 'none']);

const DEFAULT_VTO_MODES = 'vyking-vto';

const VTOMode: { [index: string]: VTOMode } = {
    VYKING_VTO: 'vyking-vto',
    NONE: 'none'
};

const $vtoButtonContainer = Symbol('vtoButtonContainer');
export const $openIframeViewer = Symbol('openIframeViewer');
const $canActivateVTO = Symbol('canActivateVTO');
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
    vtoModes: string;
    vtoConfig: string;
    vtoKey: string;
    readonly canActivateVTO: boolean;
    activateVTO(): Promise<void>;
}

export const VTOMixin = <T extends Constructor<ModelViewerElementBase>>(
    ModelViewerElement: T): Constructor<VTOInterface> & T => {
    class VTOModelViewerElement extends ModelViewerElement {
        @property({ type: Boolean, attribute: 'vto' }) vto: boolean = false;

        @property({ type: String, attribute: 'vto-modes' })
        vtoModes: string = DEFAULT_VTO_MODES;

        @property({ type: String, attribute: 'vto-config' }) vtoConfig: string = '';
        @property({ type: String, attribute: 'vto-key' }) vtoKey: string = '';
        @property({ type: String, attribute: 'vto-autocamera-width' }) vtoAutoCameraWidth: number = 960;
        @property({ type: String, attribute: 'vto-autocamera-height' }) vtoAutoCameraHeight: number = 540;
        @property({ type: String, attribute: 'vto-autocamera-framerate' }) vtoAutoCameraFramerate: number = 60;

        get canActivateVTO(): boolean {
            return this[$vtoMode] !== VTOMode.NONE;
        }

        protected [$canActivateVTO]: boolean = false;

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

            //   this[$renderer].arRenderer.addEventListener('status', this[$onVTOStatus]);
            //   this.setAttribute('ar-status', ARStatus.NOT_PRESENTING);

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
                        if (value === 'vyking-vto' && IS_VYKING_VTO_CANDIDATE) {
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
            const location = self.location.href;
            const modelUrl = new URL(this.src!, location);
            if (modelUrl.hash) modelUrl.hash = '';
            const params = new URLSearchParams(modelUrl.search);

            console.log(`Attempting to present in VTO with iframe: ${this.src}, ${location}`);

            const container = document.createElement('div')
            const escapeHTML = (text: string) => document.createTextNode(text)

            const iframe = document.createElement('iframe')
            iframe.setAttribute('seamless', 'true')
            iframe.srcdoc = escapeHTML(this.#srcDoc(location)).textContent!
            iframe.referrerPolicy = 'origin'
            iframe.sandbox.add('allow-same-origin')
            iframe.sandbox.add('allow-scripts')
            iframe.sandbox.add('allow-modals')
            iframe.allow = 'camera; fullscreen;'
            iframe.setAttribute("style", "top:0; left:0; position:fixed; height:100%; width:100%;z-index:2000;");
            container.appendChild(iframe);

            const closeButton = document.createElement('button');
            closeButton.innerText = 'Close me?'
            closeButton.setAttribute("style", "top:10%; left:0; position:fixed; height:10%; width:10%;;z-index:2001");
            closeButton.addEventListener('click', () => {
                document.body.removeChild(container)
            }, {
                once: true
            })
            container.appendChild(closeButton);

            document.body.appendChild(container)

            // if (iframe.requestFullscreen) {
            //     iframe.requestFullscreen()
            //         .then(() => {

            //         })
            //         .catch(cause => {
            //             console.warn('Error while trying to present in VTO in an iframe');
            //             console.error(cause);
            //             document.body.removeChild(container)
            //         })
            // }
        }

        #srcDoc = (disabledQRCodeUrl: string) => `
<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Vyking Apparel</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">

    <link rel="icon" type="image/png" href="../assets/images/favicon.png">

    <script>
        const isDisabled = () => {
            if (/android/i.test(navigator.userAgent) || /iPad|iPhone|iPod/.test(navigator.userAgent)) {
                return false
            }

            return true
        }
        self.HTMLVykingApparelElement = self.HTMLVykingApparelElement || {}
        self.HTMLVykingApparelElement.isDisabled = isDisabled()
        self.HTMLVykingApparelElement.disabledQRCodeUrl = '${disabledQRCodeUrl}'
    </script>
    <script type="module" src="https://192.168.0.20:1234/vyking-apparel.js"></script>

    <style>
        html,
        body {
            background-color: rgb(246, 169, 235);
            height: 100%;
            margin: 0px;
            padding: 0px;
        }

        .advice {
            display: none;
            width: 100px;
            pointer-events: none;
        }

        #vyking-apparel-placeholder {
            background-color: black;
            height: 100%;
            left: 0;
            margin: auto;
            padding: 0px;
            position: fixed;
            top: 0;
            width: 100%;
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
    <div id="vyking-apparel-placeholder">
        <vyking-apparel id="vyking-apparel"
            stats 
            onerror="alert('Error: ' + event.message)"
            autocamera 
            autocamera-width=${this.vtoAutoCameraWidth}
            autocamera-height=${this.vtoAutoCameraHeight}
            autocamera-framerate=${this.vtoAutoCameraFramerate}
            poster='${this[$poster]}'
            apparel='${this.src}'
            config='${this.vtoConfig}'
            key='${this.vtoKey}'
            alt='${this.alt}'>
            <video slot="src" hidden autoplay muted playsinline></video>
            <canvas slot="canvas">Shoe Try-on</canvas>
            <div slot="advice" class="advice" alt="Point at your feet">
                <img style="width: 100%; height: 100%" src="assets/vto/images/point_at_your_feet.png" />
            </div>
        </vyking-apparel>
    </div>
</body>

</html>
`
    }

    return VTOModelViewerElement;
}