/**
 * @license
 * Copyright (c) 2023. Vyking.io. All rights reserved.
 * =============================================================================
 */

import { property } from 'lit/decorators.js';

import { IS_ANDROID, IS_VYKING_VTO_CANDIDATE, IS_WKWEBVIEW } from '../constants.js';
import ModelViewerElementBase, { $poster, $renderer, $vykingSrc } from '../model-viewer-base.js';
import { enumerationDeserializer } from '../styles/deserializers.js';
import { Constructor, waitForEvent } from '../utilities.js';

export interface VykingApparelGlobalConfig {
    isDisabled?: boolean
    disabledQRCodeUrl?: string
}

let isVTOBlocked = false;

export type VTOStatus =
    'not-presenting' | 'presenting' | 'presenting-qrcode' | 'failed';

export const VTOStatus: { [index: string]: VTOStatus } = {
    NOT_PRESENTING: 'not-presenting',
    PRESENTING: 'presenting',
    PRESENTING_QRCODE: 'presenting-qrcode',
    FAILED: 'failed'
};

export type VTOMode = 'vyking-vto-vykwebview' | 'vyking-vto-iframe' | 'none';

const deserializeVTOModes = enumerationDeserializer<VTOMode>(
    ['vyking-vto-vykwebview', 'vyking-vto-iframe', 'none']);

const DEFAULT_VTO_MODES = 'vyking-vto-iframe'; // Ordered list 
const DEFAULT_VTO_URL = 'https://sneaker-window.vyking.io/vyking-apparel/1/vyking-apparel.js';

const VTOMode: { [index: string]: VTOMode } = {
    VYKING_VTO_VYKWEBVIEW: 'vyking-vto-vykwebview',
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
        /** @ignore */ readonly #isDisabled: boolean

        constructor(...args: Array<any>) {
            super(args)

            console.info(`VTOModelViewerElement`)

            const HTMLVykingApparelElement: VykingApparelGlobalConfig =
                (self as any).HTMLVykingApparelElement || {}
            this.#isDisabled = HTMLVykingApparelElement.isDisabled || false
        }

        @property({ type: Boolean, attribute: 'vto' }) vto: boolean = false;

        @property({ type: String, attribute: 'vto-modes' })
        vtoModes: string = DEFAULT_VTO_MODES;

        @property({ type: Number, attribute: 'vto-vykwebview-port' })
        vtoVykWebViewPort: number = 0;

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
            // console.log(`${this[$vtoMode]} ${this[$vykingSrc]}`)
            return this[$vtoMode] !== VTOMode.NONE && this[$vykingSrc] != null;
        }

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
            console.log(`VTOModelViewerElement changedProperties %o`, changedProperties)

            super.update(changedProperties);

            if (changedProperties.has('vtoModes')) {
                this[$vtoModes] = deserializeVTOModes(this.vtoModes);
            }

            if (changedProperties.has('vto') ||
                changedProperties.has('vtoModes') ||
                changedProperties.has('vtoVykWebViewPort') ||
                changedProperties.has('vtoConfig') ||
                changedProperties.has('vtoKey')) {
                this[$selectVTOMode]();
            }
        }

        async activateVTO() {
            console.log(`VTOModelViewerElement.activateVTO ${this[$vtoMode]}`)
            switch (this[$vtoMode]) {
                case VTOMode.VYKING_VTO_IFRAME:
                    this[$openIframeViewer]();
                    break;
                case VTOMode.VYKING_VTO_VYKWEBVIEW:
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
            console.log(`VTOModelViewerElement.selectVTOMode ${this.vto}, %o`, this[$vtoModes])

            let vtoMode = VTOMode.NONE;
            if (this.vto) {
                if (this[$vykingSrc] != null) {
                    for (const value of this[$vtoModes]) {
                        if (value === 'vyking-vto-vykwebview' &&
                            IS_VYKING_VTO_CANDIDATE &&
                            this.vtoVykWebViewPort !== 0 &&
                            (IS_WKWEBVIEW || IS_ANDROID)) {
                            vtoMode = VTOMode.VYKING_VTO_VYKWEBVIEW;
                            break;
                        }

                        if (value === 'vyking-vto-iframe' && IS_VYKING_VTO_CANDIDATE && this.vtoConfig != null && this.vtoKey != null) {
                            vtoMode = VTOMode.VYKING_VTO_IFRAME;
                            break;
                        }
                    }
                }
            }

            if (vtoMode !== VTOMode.NONE) {
                this[$vtoButtonContainer].classList.add('enabled');
                this[$vtoButtonContainer].addEventListener(
                    'click', this[$onVTOButtonContainerClick]);
            } else if (this[$vtoButtonContainer].classList.contains('enabled')) {
                this[$vtoButtonContainer].removeEventListener(
                    'click', this[$onVTOButtonContainerClick]);
                this[$vtoButtonContainer].classList.remove('enabled');
            }
            this[$vtoMode] = vtoMode;
        }

        // async[$triggerLoad]() {
        //     if (!this.loaded) {
        //         this[$preload] = true;
        //         this[$updateSource]();
        //         await waitForEvent(this, 'load');
        //         this[$preload] = false;
        //     }
        // }

        // [$shouldAttemptPreload](): boolean {
        //     return super[$shouldAttemptPreload]() || this[$preload];
        // }

        /**
         * Takes a URL and a title string, and attempts to launch VTO on
         * the current device.
         */
        [$openIframeViewer]() {
            console.log(`VTOModelViewerElement.openIframeViewer ${self.location.href} ${this[$vtoMode]}`)
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
            iframe.id = 'vto-iframe'
            iframe.referrerPolicy = 'origin'
            iframe.allow = 'camera;fullscreen;'
            // iframe.sandbox.add('allow-same-origin')
            // iframe.sandbox.add('allow-scripts')
            // iframe.sandbox.add('allow-modals')
            iframe.setAttribute("style", "top:0; left:0; border:0; margin:0; padding:0; height:100%; width:100%;");
            iframe.srcdoc = this[$vtoMode] === VTOMode.VYKING_VTO_IFRAME
                ? escapeHTML(this.#srcDoc(vykingApparelGlobalConfigToJSString(HTMLVykingApparelElement))).textContent!
                : escapeHTML(this.#srcDocVykWebView()).textContent!

            console.log(`iframe %o`, iframe)

            container.prepend(iframe);
            container.classList.add('enabled')

            const status = this.#isDisabled ? VTOStatus.PRESENTING_QRCODE : VTOStatus.PRESENTING
            this.setAttribute('vto-status', status);
            this.dispatchEvent(new CustomEvent<VTOStatus>('vto-status', { detail: status }));

            // This doesn't work on iphone safari
            // if (iframe.requestFullscreen) {
            //     iframe.requestFullscreen();
            // }

            const exitButton = this.shadowRoot!.querySelector('.slot.exit-webxr-ar-button') as HTMLElement;
            const onExit = () => {
                container.removeChild(iframe)

                if (exitButton != null) {
                    exitButton.classList.remove('enabled');
                }

                container.classList.remove('enabled')
                this.setAttribute('vto-status', VTOStatus.NOT_PRESENTING);
                this.dispatchEvent(
                    new CustomEvent<VTOStatus>('vto-status', { detail: VTOStatus.NOT_PRESENTING }));

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
                // console.log(`getURL: ${parentUrl}, ${name}`)

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
        default-exposure=${this[$renderer].threeRenderer.toneMappingExposure}
        ${this.vtoFlipY ? 'flipy' : ''}
        ${this.vtoRotate ? 'rotate' : ''}
        ${this.vtoDisableROI ? 'rotate' : ''}
        ${!!this.vtoLensFactor ? 'lens-factor="' + this.vtoLensFactor + '"' : ''}
        ${!!this[$poster] ? 'poster="' + this[$poster] + '"' : ''}
        ${!!this.vtoAdvice ? 'advice="' + this.vtoAdvice + '"' : ''}
        ${!!this[$vykingSrc] ? 'apparel="' + this[$vykingSrc] + '"' : ''}
        ${!!this.getAttribute('environment-image') ? 'default-environment-image="' + getURL(self.location.href, this.getAttribute('environment-image')!) + '"' : ''}
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

        #srcDocVykWebView = () => {
            return `
<!DOCTYPE html>
<html>

<head>
<meta charset="utf-8">
<title>Vyking Sneaker Window</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">

<style>
html,
body {
    background-color: white;
    height: 100%;
    margin: 0px;
    overflow: hidden;
    padding: 0px;
}

.loader {
    display: inline-block;
    left: 50%;
    width: 80px;
    height: 80px;
    pointer-events: none;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    visibility: visible;
    z-index: 2;
}

.loader:after {
    content: " ";
    display: inline-block;
    width: 64px;
    height: 64px;
    margin: 2px;
    border-radius: 50%;
    border: 6px solid rgb(20, 54, 71);
    border-color: rgb(20, 54, 71) transparent rgb(20, 54, 71) transparent;
    animation: loader 1.2s linear infinite;
}

@keyframes loader {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.feature {
    height: 100%;
    margin: auto;
    padding: 0px;
    width: 100%;
}

.feature #vyking-sneaker-window-placeholder {
    height: 100%;
    left: 0;
    margin: auto;
    padding: 0px;
    position: fixed;
    top: 0;
    width: 100%;
}

#vyking-sneaker-window {
    border: 0px;
    height: 100%;
    margin: 0px;
    padding: 0px;
    width: 100%;
}
</style>

<script>
    // Disable pinch to zoom because it crashes iOS Safari.
    document.addEventListener('touchmove', function (event) {
        event.preventDefault()
    }, { passive: false })
</script>
</head>

<body>
<div id="loader-image" class="loader"></div>

<div class="feature">
    <div id="vyking-sneaker-window-placeholder">
    </div>
</div>

<template id="vyking-sneaker-window-template">
    <iframe id="vyking-sneaker-window" title="Vyking Sneakerkit Window" allow="camera">
        Try-on with webcam
    </iframe>
</template>

<script>
    // const targetOrigin = 'https://sneaker-window.vyking.io'
    // const targetPath = '/1/app.html'
    const targetOrigin = 'https://192.168.0.20:3001'
    const targetPath = '/app.html'        
    let isReady = false
    let selectedAccessories = '${this[$vykingSrc]}'
    let showLoaderCount = 0

    const showLoader = (v) => {
        if (++showLoaderCount > 0) { document.getElementById("loader-image").style.visibility = "visible" }
    }
    const hideLoader = () => {
        if (--showLoaderCount <= 0) {
            showLoaderCount = 0
            document.getElementById("loader-image").style.visibility = "hidden"
        }
    }

    function replaceAccessories(uri) {
        selectedAccessories = uri

        if (!isReady) { return }

        showLoader()

        if (document.getElementById('vyking-sneaker-window') != null) {
            document.getElementById('vyking-sneaker-window').contentWindow.postMessage({
                type: 'VYKING_SNEAKER_WINDOW_REPLACE_ACCESSORIES',
                accessoryDescriptionUrl: uri
            }, targetOrigin)
        }
    }

    function play() {
        document.getElementById('vyking-sneaker-window') && document.getElementById('vyking-sneaker-window').contentWindow.postMessage({
            type: 'VYKING_SNEAKER_WINDOW_PLAY'
        }, targetOrigin)
    }
    function pause() {
        document.getElementById('vyking-sneaker-window') && document.getElementById('vyking-sneaker-window').contentWindow.postMessage({
            type: 'VYKING_SNEAKER_WINDOW_PAUSE'
        }, targetOrigin)
    }

    const main = () => {
        const placeholder = document.getElementById("vyking-sneaker-window-placeholder")
        const templateClone = document.getElementById("vyking-sneaker-window-template").cloneNode(true)
        const iframe = templateClone.content.getElementById("vyking-sneaker-window")
        const targetUri = targetOrigin + targetPath

        const postConfig = (clientWidth, clientHeight, webSocketPort) => {    
            // Preferred camera dimensions (not guarenteed to be honoured)
            let cameraWidth = 360
            let cameraHeight = 720
    
            document.getElementById('vyking-sneaker-window') && document.getElementById('vyking-sneaker-window').contentWindow.postMessage({
                type: 'VYKING_SNEAKER_WINDOW_CONFIG_FOR_SOCKET',
                cameraWidth: cameraWidth,
                cameraHeight: cameraHeight,
                webSocketPort: webSocketPort,
                autoPlay: true
            },
                targetOrigin)
        }

        window.onmessage = event => {
            const { data } = event

            switch (data.type) {
                // Received when the VinkingSneakerWindow is ready for its configuration information.
                // This will typically be the first message received
                case 'VYKING_SNEAKER_WINDOW_WAITING_FOR_CONFIG':
                    postConfig(0, 0, ${this.vtoVykWebViewPort})
                    break;
                // Information message indicating licence expiry time
                case 'VYKING_SNEAKER_WINDOW_EXPIRY_TIME':
                    console.info('Licence expiry date: ' + data.expiryTime.toString())
                    //If close to licencse expiry reload the configuration file ready for next time
                    if (data.expiryTime.getTime() - new Date().getTime() < 1 * 24 * 60 * 60 * 1000) {
                        alert('Expiry date: ' + data.expiryTime.toString())
                        fetch(configUri, {
                            method: 'GET',
                            cache: 'reload',
                        })
                    }
                    break
                // VykingSneakerWindow is now running and ready for instructions
                case 'VYKING_SNEAKER_WINDOW_READY':
                    hideLoader()
                    isReady = true

                    replaceAccessories(selectedAccessories)
                    break
                // Accessory replacement is complete
                case 'VYKING_SNEAKER_WINDOW_REPLACE_ACCESSORIES':
                    if (data.complete === 1) { hideLoader() }
                    break
                case 'VYKING_SNEAKER_WINDOW_ARE_FEET_DETECTED':
                    console.log('Are feet detected: ' + data.value)
                    break
                case 'VYKING_SNEAKER_WINDOW_BUSY_ERROR':
                    hideLoader()
                    break
                // An error has occurred
                case 'VYKING_SNEAKER_WINDOW_ERROR':
                    hideLoader()
                    alert(data.requestType + ' ' + data.value)
                    break
            }

            // Forward the responses to the native code
            window.webkit?.messageHandlers.vykWebViewMessageHandler.postMessage(JSON.stringify(data))
            window.android?.vykWebViewMessageHandler(JSON.stringify(data))
        }

        //  Giving the iframe a name stops Safari caching it in memory and doubling our memory size on a page refresh!!!
        iframe.name = Date.now()
        iframe.src = encodeURI(targetUri)
        placeholder.innerHTML = templateClone.innerHTML

        showLoader()
    }

    document.addEventListener('DOMContentLoaded', async () => {
        console.log('DOMContentLoaded')

        try {
            main()
        } catch (e) {
            alert(e)
            hideLoader()
        }
    })
</script>
</body>

</html>
`
        }
    }

    return VTOModelViewerElement;
}