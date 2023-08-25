/**
 * @license
 * Copyright (c) 2023. Vyking.io. All rights reserved.
 * =============================================================================
 */

import { property } from 'lit/decorators.js';

import { IS_ANDROID, IS_VYKING_VTO_CANDIDATE, IS_WKWEBVIEW } from '../constants.js';
import ModelViewerElementBase, { $renderer, $scene, $vykingSrc } from '../model-viewer-base.js';
import { enumerationDeserializer } from '../styles/deserializers.js';
import { Constructor } from '../utilities.js';

export interface VykingApparelGlobalConfig {
    isDisabled?: boolean
    disabledQRCodeUrl?: string
    disabledQRCodeCaption?: string
    powerPreference?: "high-performance" | "low-power" | "default"
    style?: string
    html?: string
}

export type VTOStatus =
    'not-presenting' | 'presenting' | 'presenting-qrcode' | 'failed';

export const VTOStatus: { [index: string]: VTOStatus } = {
    NOT_PRESENTING: 'not-presenting',
    PRESENTING: 'presenting',
    PRESENTING_QRCODE: 'presenting-qrcode',
    FAILED: 'failed'
};

export type VTOMode = 'sneakerwindow' | 'vyking' | 'none';

const deserializeVTOModes = enumerationDeserializer<VTOMode>(
    ['sneakerwindow', 'vyking', 'none']);

const DEFAULT_VTO_MODES = 'vyking'; // Ordered list 
const DEFAULT_VTO_VYKING_APPAREL_URL = 'https://sneaker-window.vyking.io/vyking-apparel/1/vyking-apparel.js';
const DEFAULT_VTO_SNEAKER_WINDOW_URL = 'https://sneaker-window.vyking.io/1/index.html'

const VTOMode: { [index: string]: VTOMode } = {
    VYKING_VTO_SNEAKER_WINDOW: 'sneakerwindow',
    VYKING_VTO_VYKING_APPAREL: 'vyking',
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
    vtoVykingApparelUrl: string;
    vtoSneakerWindowUrl: string;
    vtoModes: string;
    vtoConfig: string | null;
    vtoKey: string | null;
    vtoAutoCameraWidth: number;
    vtoAutoCameraHeight: number;
    vtoAutoCameraFramerate: number;
    vtoShareQuality: number;
    vtoFlipY: boolean;
    vtoRotate: boolean;
    vtoStats: boolean;
    vtoDebug: boolean;
    readonly canActivateVTO: boolean;
    readonly VTOElement?: HTMLElement;
    readonly VTOMode: VTOMode;
    activateVTO(): void;
    deactivateVTO(): void;
    pauseVTO(): void
    playVTO(): void
    // takePhotoVTO(type: string, encoderOptions: any): void
}

export const VTOMixin = <T extends Constructor<ModelViewerElementBase>>(
    ModelViewerElement: T): Constructor<VTOInterface> & T => {
    class VTOModelViewerElement extends ModelViewerElement {
        /** @ignore */ readonly #isDisabled: boolean
        /** @ignore */ readonly #disabledQRCodeUrl?: string

        constructor(...args: Array<any>) {
            super(args)

            console.info(`VTOModelViewerElement`)

            const HTMLVykingApparelElement: VykingApparelGlobalConfig =
                (self as any).HTMLVykingApparelElement || {}
            this.#isDisabled = HTMLVykingApparelElement.isDisabled || false
            this.#disabledQRCodeUrl = HTMLVykingApparelElement.disabledQRCodeUrl
        }

        @property({ type: Boolean, attribute: 'vto' }) vto: boolean = false;

        @property({ type: String, attribute: 'vto-modes' })
        vtoModes: string = DEFAULT_VTO_MODES;

        // @property({ type: Number, attribute: 'vto-vykwebview-port' })
        // vtoVykWebViewPort: number = 0;
        #vtoVykWebViewPort: number = 0;
        @property({ type: Number, attribute: 'vto-vykwebview-port' }) set vtoVykWebViewPort(newValue: number) {
            this.#vtoVykWebViewPort = newValue

            // If the port number has changed and we are active in SneakerWindow, then re-post the config
            // This will typically occur if the socket is broken because the app has gone into the background.
            const vto = this.shadowRoot?.querySelector('#vto-iframe') as HTMLIFrameElement | null
            switch (this[$vtoMode]) {
                case VTOMode.VYKING_VTO_SNEAKER_WINDOW:
                    if (vto != null && this.vtoVykWebViewPort !== 0) {
                        (vto.contentWindow as any)?.postConfigForSocket?.(this.vtoAutoCameraWidth, this.vtoAutoCameraHeight, this.vtoVykWebViewPort)
                    }
                    break;
                default:
                    break;
            }
        }
        get vtoVykWebViewPort() {
            return this.#vtoVykWebViewPort
        }

        @property({ type: String, attribute: 'vto-vyking-apparel-url' })
        vtoVykingApparelUrl: string = DEFAULT_VTO_VYKING_APPAREL_URL;

        @property({ type: String, attribute: 'vto-sneaker-window-url' })
        vtoSneakerWindowUrl: string = DEFAULT_VTO_SNEAKER_WINDOW_URL;

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

        @property({ type: Number, attribute: 'vto-share-quality' })
        vtoShareQuality: number = 1.0;

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

        @property({ type: Boolean, attribute: 'vto-share' })
        vtoShare: boolean = false;

        get canActivateVTO(): boolean {
            // console.log(`${this[$vtoMode]} ${this[$vykingSrc]}`)
            return this[$vtoMode] !== VTOMode.NONE && this[$vykingSrc] != null && (!this.#isDisabled || (this.#isDisabled && this.#disabledQRCodeUrl != null));
        }

        get VTOElement() {
            console.log(`VTOElement`)

            const vto = this.shadowRoot?.querySelector('#vto-iframe') as HTMLIFrameElement | null
            switch (this[$vtoMode]) {
                case VTOMode.VYKING_VTO_VYKING_APPAREL:
                    return vto?.contentWindow?.document.querySelector('vyking-apparel') as HTMLElement | undefined
                case VTOMode.VYKING_VTO_SNEAKER_WINDOW:
                    return vto?.contentWindow as HTMLElement | undefined
                default:
                    return undefined
            }
        }

        get VTOMode() {
            return this[$vtoMode]
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

            // Reflect any property changes into the VTO before the model-viewer because changes to
            // properties like 'src' mean we loose the knowledge of the current vtoMode and this function
            // uses that to decide if to change any VTO properties.
            const reflectChangesIntoVTO = (properties: Map<string, any>) => {
                console.log(`VTOModelViewerElement reflectChangesIntoVTO ${this[$vtoMode]} %o`, properties)

                const vto = this.shadowRoot?.querySelector('#vto-iframe') as HTMLIFrameElement | null | undefined

                switch (this[$vtoMode]) {
                    case VTOMode.VYKING_VTO_VYKING_APPAREL:
                        const vykingApparel = vto?.contentWindow?.document?.querySelector('vyking-apparel')

                        properties.forEach((value, key) => {
                            if (value == null) {
                                vykingApparel?.removeAttribute(key)
                            } else {
                                vykingApparel?.setAttribute(key, value)
                            }
                        })
                        break;
                    case VTOMode.VYKING_VTO_SNEAKER_WINDOW:
                        if (properties.has('apparel')) {
                            const value = properties.get('apparel')
                            if (value == null) {
                                (vto?.contentWindow as any)?.removeAccessories?.()
                            } else {
                                (vto?.contentWindow as any)?.replaceAccessories?.(value)
                            }
                        }
                        break;
                    default:
                        break;
                }
            }

            const changedVTOProperties = new Map<string, any>()
            if (changedProperties.has('src')) {
                changedVTOProperties.set('apparel', this[$vykingSrc])
            }
            if (changedProperties.has('alt')) {
                changedVTOProperties.set('alt', this.alt)
            }
            reflectChangesIntoVTO(changedVTOProperties)

            if (changedProperties.has('vto') ||
                changedProperties.has('vtoModes') ||
                changedProperties.has('src') || // SB 31/07/2023 We watch this attribute because we can't watch this[$vykingSrc]
                changedProperties.has('vtoVykWebViewPort') ||
                changedProperties.has('vtoConfig') ||
                changedProperties.has('vtoKey')) {
                this[$selectVTOMode]();
            }
        }

        activateVTO() {
            console.log(`VTOModelViewerElement.activateVTO ${this[$vtoMode]} ${this.vtoVykWebViewPort}`)

            //Make sure we are not already active
            if (this.#onExit != null) {
                return
            }

            switch (this[$vtoMode]) {
                case VTOMode.VYKING_VTO_VYKING_APPAREL:
                    this[$openIframeViewer]();
                    break;
                case VTOMode.VYKING_VTO_SNEAKER_WINDOW:
                    this[$openIframeViewer]();
                    break;
                default:
                    console.warn(
                        'No VTO Mode can be activated. This is probably due to missing \
configuration or device capabilities');
                    break;
            }
        }

        deactivateVTO() {
            this.#onExit?.()
        }

        pauseVTO() {
            console.log(`pauseVTO`)

            const vto = this.shadowRoot?.querySelector('#vto-iframe') as HTMLIFrameElement | null
            switch (this[$vtoMode]) {
                case VTOMode.VYKING_VTO_VYKING_APPAREL:
                    (vto?.contentWindow?.document.querySelector('vyking-apparel') as any)?.pause?.()
                    break;
                case VTOMode.VYKING_VTO_SNEAKER_WINDOW:
                    (vto?.contentWindow as any)?.pause?.()
                    break;
                default:
                    break;
            }
        }

        playVTO() {
            console.log(`playVTO`)

            const vto = this.shadowRoot?.querySelector('#vto-iframe') as HTMLIFrameElement | null
            switch (this[$vtoMode]) {
                case VTOMode.VYKING_VTO_VYKING_APPAREL:
                    (vto?.contentWindow?.document.querySelector('vyking-apparel') as any)?.play?.()
                    break;
                case VTOMode.VYKING_VTO_SNEAKER_WINDOW:
                    (vto?.contentWindow as any)?.play?.()
                    break;
                default:
                    break;
            }
        }

        // SB 17/08/2023 This only works for SneakerWindow VTO.
        takePhotoVTO(type: string, encoderOptions: any) {
            console.log(`takePhotoVTO`)

            const vto = this.shadowRoot?.querySelector('#vto-iframe') as HTMLIFrameElement | null
            switch (this[$vtoMode]) {
                // case VTOMode.VYKING_VTO_VYKING_APPAREL:
                //     (vto?.contentWindow?.document.querySelector('vyking-apparel') as any)?.share?.()
                //     break;
                case VTOMode.VYKING_VTO_SNEAKER_WINDOW:
                    (vto?.contentWindow as any)?.takePhoto?.(type, encoderOptions)
                    break;
                default:
                    break;
            }
        }

        async[$selectVTOMode]() {
            console.log(`VTOModelViewerElement.selectVTOMode ${this.vto} ${this[$vykingSrc]}, %o`, this[$vtoModes])
            console.log(`VTOModelViewerElement.selectVTOMode ${IS_VYKING_VTO_CANDIDATE} ${IS_WKWEBVIEW}`)
            console.log(`VTOModelViewerElement.selectVTOMode ${this.vtoConfig} ${this.vtoKey}`)

            let vtoMode = VTOMode.NONE;
            if (this.vto && (!this.#isDisabled || (this.#isDisabled && this.#disabledQRCodeUrl != null))) {
                if (this[$vykingSrc] != null) {
                    for (const value of this[$vtoModes]) {
                        if (value === 'sneakerwindow' &&
                            IS_VYKING_VTO_CANDIDATE) {
                            vtoMode = VTOMode.VYKING_VTO_SNEAKER_WINDOW;
                            break;
                        }

                        if (value === 'vyking' && IS_VYKING_VTO_CANDIDATE && this.vtoConfig != null && this.vtoKey != null) {
                            vtoMode = VTOMode.VYKING_VTO_VYKING_APPAREL;
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

        /**
         * Takes a URL and a title string, and attempts to launch VTO on
         * the current device.
         */
        [$openIframeViewer]() {
            console.log(`VTOModelViewerElement.openIframeViewer ${self.location.href} ${this[$vtoMode]}`)
            console.log(`Attempting to present in VTO with iframe: ${this.src}`);

            // Reset the scene to free memory
            this[$scene].reset()

            const escapeHTML = (text: string) => document.createTextNode(text)
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
            iframe.srcdoc = this[$vtoMode] === VTOMode.VYKING_VTO_VYKING_APPAREL
                ? escapeHTML(this.#vykingApparelTemplate(HTMLVykingApparelElement)).textContent!
                : escapeHTML(this.sneakerWindowTemplate()).textContent!

            console.log(`iframe %o`, iframe)

            container.prepend(iframe);
            container.classList.add('enabled')

            const status = this.#isDisabled ? VTOStatus.PRESENTING_QRCODE : VTOStatus.PRESENTING
            this.setAttribute('vto-status', status);
            this.dispatchEvent(new CustomEvent<VTOStatus>('vto-status', { detail: status }));

            const exitButton = this.shadowRoot!.querySelector('.slot.exit-webxr-ar-button') as HTMLElement;
            const onExit = () => {
                this.#onExit = undefined

                container.removeChild(iframe)

                if (exitButton != null) {
                    exitButton.classList.remove('enabled');
                    exitButton.removeEventListener('click', onExit)
                }

                container.classList.remove('enabled')
                this.setAttribute('vto-status', VTOStatus.NOT_PRESENTING);

                //Re-applying vyking-src now we are not presenting will allow the 
                //model-viewer to update
                const tmp = this.getAttribute('vyking-src') 
                this.removeAttribute('vyking-src')
                if (tmp != null) {
                    this.setAttribute('vyking-src', tmp)
                }

                this.dispatchEvent(
                    new CustomEvent<VTOStatus>('vto-status', { detail: VTOStatus.NOT_PRESENTING }));
            }

            if (exitButton != null) {
                exitButton.classList.add('enabled');
                exitButton.addEventListener('click', onExit, {
                    once: true
                });
            }

            this.#onExit = onExit
        }

        #onExit?: () => any

        #vykingApparelTemplate = (config: VykingApparelGlobalConfig) => {
            const toVykingApparelGlobalConfigString = (config: VykingApparelGlobalConfig) =>
            'self.HTMLVykingApparelElement = self.HTMLVykingApparelElement || {};\n'
                .concat(config.isDisabled != null ? `        self.HTMLVykingApparelElement.isDisabled = ${config.isDisabled};\n` : '')
                .concat(config.disabledQRCodeUrl != null ? `        self.HTMLVykingApparelElement.disabledQRCodeUrl = "${config.disabledQRCodeUrl}";\n` : `        self.HTMLVykingApparelElement.disabledQRCodeUrl = "${self.location.href}";\n`)
                .concat(config.disabledQRCodeCaption != null ? `        self.HTMLVykingApparelElement.disabledQRCodeCaption = "${config.disabledQRCodeCaption}";\n` : '')
                .concat(config.powerPreference != null ? `        self.HTMLVykingApparelElement.powerPreference = "${config.powerPreference}";\n` : '')

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
        ${toVykingApparelGlobalConfigString(config)}

        // Disable pinch to zoom because it crashes iOS Safari.
        document.addEventListener('touchmove', function (event) {
            event.preventDefault()
        }, { passive: false })
    </script>
    <script type="module" src="${this.vtoVykingApparelUrl}"></script>

    <style>
        /* Without this the custom loader doesn't start properly at the beginning on iOS */
        /* an other user defined slot elements are visible too soon. */
        *:not(:defined) { display:none }
        html,
        body {
            border:0;
            height: 100%;
            left: 0;
            margin: 0;
            padding: 0;
            position: fixed;
            top: 0;
            width: 100%;
        }

        #vyking-apparel {
            background-color: rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
            border: 0px;
            height: 100%;
            margin: 0px;
            padding: 0px;
            width: 100%;
        }

        ${config.style ?? ''}
    </style>
</head>

<body>
    <vyking-apparel id="vyking-apparel"
        ${this.vtoStats ? 'stats' : ''}
        ${this.vtoDebug ? 'debug' : ''}  
        ${this.vtoShare ? 'share' : ''}  
        autocamera 
        autocamera-width=${this.vtoAutoCameraWidth}
        autocamera-height=${this.vtoAutoCameraHeight}
        autocamera-framerate=${this.vtoAutoCameraFramerate}
        default-exposure=${this[$renderer].threeRenderer.toneMappingExposure}
        ${this.vtoFlipY ? 'flipy' : ''}
        ${this.vtoRotate ? 'rotate' : ''}
        ${this.vtoDisableROI ? 'rotate' : ''}
        ${!!this.vtoLensFactor ? 'lens-factor="' + this.vtoLensFactor + '"' : ''}
        ${!!this.vtoShareQuality ? 'share-quality="' + this.vtoShareQuality + '"' : ''}
        ${!!this[$vykingSrc] ? 'apparel="' + this[$vykingSrc] + '"' : ''}
        ${!!this.getAttribute('environment-image') ? 'default-environment-image="' + getURL(self.location.href, this.getAttribute('environment-image')!) + '"' : ''}
        ${!!this.vtoConfig ? 'config="' + this.vtoConfig + '"' : ''}
        ${!!this.vtoKey ? 'key="' + this.vtoKey + '"' : ''}
        ${!!this.alt ? 'alt="' + this.alt + '"' : ''}
        ${this.withCredentials ? 'with-credentials' : ''}
        >
        <video slot="src" hidden autoplay muted playsinline></video>
        <canvas slot="canvas">Virtual Try On</canvas>
        ${config.html ?? ''}
    </vyking-apparel>
</body>

</html>
`
        }

        sneakerWindowTemplate = () => {
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
    const url = new URL('${this.vtoSneakerWindowUrl}')
    const targetOrigin = url.origin
    const targetPath = ${this.vtoVykWebViewPort} !== 0 ? url.pathname.replace('index.html', 'app.html') : url.pathname        
    let isReady = false
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
        if (!isReady) { return }

        showLoader()

        if (document.getElementById('vyking-sneaker-window') != null) {
            document.getElementById('vyking-sneaker-window').contentWindow.postMessage({
                type: 'VYKING_SNEAKER_WINDOW_REPLACE_ACCESSORIES',
                accessoryDescriptionUrl: uri
            }, targetOrigin)
        }
    }

    function removeAccessories() {
        if (!isReady) { return }

        showLoader()

        if (document.getElementById('vyking-sneaker-window') != null) {
            document.getElementById('vyking-sneaker-window').contentWindow.postMessage({
                type: 'VYKING_SNEAKER_WINDOW_REMOVE_ACCESSORIES'
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
    function dispose() {
        document.getElementById('vyking-sneaker-window') && document.getElementById('vyking-sneaker-window').contentWindow.postMessage({
            type: 'VYKING_SNEAKER_WINDOW_DISPOSE'
        }, targetOrigin)
    }

    function takePhoto(type, encoderOptions) {
        document.getElementById('vyking-sneaker-window') && document.getElementById('vyking-sneaker-window').contentWindow.postMessage({
            type: 'VYKING_SNEAKER_WINDOW_TAKE_PHOTO',
            toDataURL: {
                type: type,
                encoderOptions: encoderOptions
            }
        }, targetOrigin)
    }

    function postConfigForSocket(cameraWidth, cameraHeight, webSocketPort, accessoryDescriptionUrl) {    
        document.getElementById('vyking-sneaker-window') && document.getElementById('vyking-sneaker-window').contentWindow.postMessage({
            type: 'VYKING_SNEAKER_WINDOW_CONFIG_FOR_SOCKET',
            cameraWidth: cameraWidth,
            cameraHeight: cameraHeight,
            webSocketPort: webSocketPort,
            accessoryDescriptionUrl: accessoryDescriptionUrl,
            autoPlay: true
        },
            targetOrigin)
    }

    function postConfig (cameraWidth, cameraHeight, accessoryDescriptionUrl) {   
        const getConfig = async uri => {
            const response = await fetch(encodeURI(uri), {
                method: 'GET',
                cache: 'no-cache',
            })
            if (!response.ok) {
                throw new Error('Failed to load configuration')
            }
            return response.arrayBuffer()
        }
        
        getConfig('${this.vtoConfig}')
            .then(configPromise => {
                document.getElementById('vyking-sneaker-window') && document.getElementById('vyking-sneaker-window').contentWindow.postMessage({
                    type: 'VYKING_SNEAKER_WINDOW_CONFIG',
                    cameraWidth: cameraWidth,
                    cameraHeight: cameraHeight,
                    config: configPromise,
                    key: '${this.vtoKey}',
                    accessoryDescriptionUrl: accessoryDescriptionUrl,
                    autoPlay: true
                },
                    targetOrigin)
        }) 
    }

    const main = () => {
        const placeholder = document.getElementById("vyking-sneaker-window-placeholder")
        const templateClone = document.getElementById("vyking-sneaker-window-template").cloneNode(true)
        const iframe = templateClone.content.getElementById("vyking-sneaker-window")
        const targetUri = targetOrigin + targetPath

        window.onmessage = event => {
            const { data } = event

            switch (data.type) {
                // Received when the VinkingSneakerWindow is ready for its configuration information.
                // This will typically be the first message received
                case 'VYKING_SNEAKER_WINDOW_WAITING_FOR_CONFIG':
                    if (${this.vtoVykWebViewPort} === 0) {
                        postConfig(${this.vtoAutoCameraWidth}, ${this.vtoAutoCameraHeight})
                    } else {
                        postConfigForSocket(${this.vtoAutoCameraWidth}, ${this.vtoAutoCameraHeight}, ${this.vtoVykWebViewPort}, '${this[$vykingSrc]}')
                    }
                    break;
                // Information message indicating licence expiry time
                case 'VYKING_SNEAKER_WINDOW_EXPIRY_TIME':
                    console.info('Licence expiry date: ' + data.expiryTime.toString())
                    //If close to licence expiry reload the configuration file ready for next time
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

                    if (${this.vtoVykWebViewPort} === 0) {
                      replaceAccessories('${this[$vykingSrc]}')
                    }
                    break
                // Accessory replacement is complete
                case 'VYKING_SNEAKER_WINDOW_REPLACE_ACCESSORIES':
                    if (data.complete === 1) { hideLoader() }
                    break
                case 'VYKING_SNEAKER_WINDOW_REMOVE_ACCESSORIES':
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