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

import { html, render } from 'lit';

import CloseIcon from './assets/close-material-svg.js';
import ControlsPrompt from './assets/controls-svg.js';
import ARGlyph from './assets/view-in-ar-material-svg.js';
import VTOGlyph from './assets/view-in-vto-material-svg.js';

const templateResult = html`
<style>
:host {
  font-family: arial, sans-serif;
  display: block;
  position: relative;
  contain: strict;
  width: 300px;
  height: 150px;
}

.container {
  position: relative;
  overflow: hidden;
}

.userInput {
  width: 100%;
  height: 100%;
  display: none;
  position: relative;
  outline-offset: -1px;
  outline-width: 1px;
}

canvas {
  position: absolute;
  display: none;
  pointer-events: none;
  /* NOTE(cdata): Chrome 76 and below apparently have a bug
   * that causes our canvas not to display pixels unless it is
   * on its own render layer
   * @see https://github.com/google/model-viewer/pull/755#issuecomment-536597893
   */
  transform: translateZ(0);
}

.show {
  display: block;
}

/* Adapted from HTML5 Boilerplate
 *
 * @see https://github.com/h5bp/html5-boilerplate/blob/ceb4620c78fc82e13534fc44202a3f168754873f/dist/css/main.css#L122-L133 */
.screen-reader-only {
  border: 0;
  left: 0;
  top: 0;
  clip: rect(0, 0, 0, 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
  pointer-events: none;
}

.slot {
  position: absolute;
  pointer-events: none;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.slot > * {
  pointer-events: initial;
}

.annotation-wrapper ::slotted(*) {
  opacity: var(--max-hotspot-opacity, 1);
  transition: opacity 0.3s;
}

.pointer-tumbling .annotation-wrapper ::slotted(*) {
  pointer-events: none;
}

.annotation-wrapper ::slotted(*) {
  pointer-events: initial;
}

.annotation-wrapper.hide ::slotted(*) {
  opacity: var(--min-hotspot-opacity, 0.25);
}

.slot.poster {
  display: none;
  background-color: inherit;
}

.slot.poster.show {
  display: inherit;
}

.slot.poster > * {
  pointer-events: initial;
}

.slot.poster:not(.show) > * {
  pointer-events: none;
}

#default-poster {
  width: 100%;
  height: 100%;
  /* The default poster is a <button> so we need to set display
   * to prevent it from being affected by text-align: */
  display: block;
  position: absolute;
  border: none;
  padding: 0;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  background-color: #fff0;
}

/*
VYKING 04/03/2025 Replace default progress bar
#default-progress-bar {
  display: block;
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

#default-progress-bar > .bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: var(--progress-bar-height, 5px);
  background-color: var(--progress-bar-color, rgba(0, 0, 0, 0.4));
  transition: transform 0.09s;
  transform-origin: top left;
  transform: scaleX(0);
  overflow: hidden;
}

#default-progress-bar > .bar.hide {
  transition: opacity 0.3s 1s;
  opacity: 0;
}
*/
#default-progress-bar {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 149px;
  height: 180px;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  background:  #D9D9D9CC;
  padding: 0;
  margin: 0;
  border: 0;
  border-radius: 10px;
  color: black;
  pointer-events: none;
}

#default-progress-img {
    pointer-events: none;
    width: 100px;
    height: 100px;
    object-fit: contain;
    padding-top: 10px;
    padding-bottom: 10px;
}

#default-progress-bar > .bar {
  width:109px;
  height: var(--progress-bar-height, 3px);
  background-color: var(--progress-bar-color, black);
  transition: transform 0.09s;
  transform-origin: top left;
  transform: scaleX(0);
  overflow: hidden;
}

#default-progress-percentage {
  font-weight: 500;
  font-size: 15px;
  padding: 5px;
}

#default-progress-text {
    font-weight: 400;
    font-size: 10px;
    color: white;
}

#default-progress-bar.hide {
  transition: opacity 0.3s 1s;
  opacity: 0;
}

.centered {
  align-items: center;
  justify-content: center;
}

.cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.slot.interaction-prompt {
  display: var(--interaction-prompt-display, flex);
  overflow: hidden;
  opacity: 0;
  will-change: opacity;
  transition: opacity 0.3s;
}

.slot.interaction-prompt.visible {
  opacity: 1;
}

.animated-container {
  will-change: transform, opacity;
  opacity: 0;
  transition: opacity 0.3s;
}

.slot.interaction-prompt > * {
  pointer-events: none;
}

.slot.ar-button {
  -moz-user-select: none;
  -webkit-tap-highlight-color: transparent;
  user-select: none;

  display: var(--ar-button-display, block);
}

.slot.ar-button:not(.enabled) {
  display: none;
}

.slot.vto-button {
  -moz-user-select: none;
  -webkit-tap-highlight-color: transparent;
  user-select: none;

  display: var(--vto-button-display, block);
}

.slot.vto-button:not(.enabled) {
  display: none;
}

.fab {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  /*width: 105px;*/
  /*height: 30px;*/
  cursor: pointer;
  /*box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.15);*/
  /*border-radius: 100px;*/
}

.fab > * {
  opacity: 0.87;
}

#default-ar-button {
  position: absolute;
  bottom: 16px;
  right: 10px;
  transform: scale(var(--ar-button-scale, 0.5));
  transform-origin: bottom right;
}

#default-vto-button {
  position: absolute;
  bottom: 46px;
  right: 10px;
  transform: scale(var(--vto-button-scale, 0.5));
  transform-origin: bottom right;
}

#default-vto {
  width: 100%;
  height: 100%;
  background-color: #1E1E1E1A;
  z-index: 2;
}

#default-vto:not(.enabled) {
  display: none;
}

.slot.pan-target {
  display: block;
  position: absolute;
  width: 0;
  height: 0;
  left: 50%;
  top: 50%;
  transform: translate3d(-50%, -50%, 0);
  background-color: transparent;
  opacity: 0;
  transition: opacity 0.3s;
}

#default-pan-target {
  width: 6px;
  height: 6px;
  border-radius: 6px;
  border: 1px solid white;
  box-shadow: 0px 0px 2px 1px rgba(0, 0, 0, 0.8);
}

.slot.default {
  pointer-events: none;
}

.slot.progress-bar {
  pointer-events: none;
}

.slot.exit-webxr-ar-button {
  pointer-events: none;
}

.slot.exit-webxr-ar-button:not(.enabled) {
  display: none;
}

#default-exit-webxr-ar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 32px;
  right: 32px;
  transform: scale(1.5);
  filter: invert(1);
  mix-blend-mode: difference;
  box-sizing: border-box;
}

#default-exit-webxr-ar-button > svg {
  fill: #fff;
}

.slot.view-toggles:not(.enabled) {
  display: none;
}

#default-view-toggles {
    position: absolute;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 5px;
    width: 100px;
    justify-content: space-between;
    cursor: pointer;
}

.toggle-option {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #ccc;
    position: relative;
    transition: background 0.3s ease, transform 0.3s ease;
}

.toggle-option.selected {
    background: black;
    border: 2px solid white;
    outline: 2px solid black;
    transform: scale(1.2);
}

.slot.dimensions-toggle:not(.enabled) {
  display: none;
}

#default-dimensions-toggle {
    position: absolute; 
    top: 16px; 
    left: 50%; 
    transform: translateX(-50%); 
    background: rgba(255, 255, 255, 0.8) !important;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    padding: 8px 16px !important;
    border-radius: 20px !important;
    font-family: inherit;
    font-weight: 400;
    font-style: normal;
    font-stretch: normal;
    font-size: 14px;
    color: #000;
    align-items: center;
    gap: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
}

#default-dimensions-toggle:hover {
    background: rgba(255, 255, 255, 0.9) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

#default-dimensions-toggle:active {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

/* Dimension styles */
.dot {
    display: none;
}

.dim {
    border-radius: 4px;
    border: none;
    box-sizing: border-box;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
    color: rgba(0, 0, 0, 0.8);
    display: block;
    font-family: inherit;
    font-size: 1em;
    font-weight: 700;
    max-width: 128px;
    overflow-wrap: break-word;
    padding: 0.5em 1em;
    position: absolute;
    width: max-content;
    height: max-content;
    transform: translate3d(-50%, -50%, 0);
    pointer-events: none;
    --min-hotspot-opacity: 0;
    background-color: white;
}

@media only screen and (max-width: 800px) {
    .dim {
        font-size: 3vw;
    }
}

:host([vto-status^="presenting"]) .dim {
    display: none;
}

.dimensionLineContainer {
    pointer-events: none;
    display: block;
}

:host([vto-status^="presenting"]) .dimensionLineContainer {
    display: none;
}

.dimensionLine {
    stroke: #000000;
    stroke-width: 2;
}

.hide {
    display: none !important;
}

</style>
<!-- Add dimension hotspots -->
<div id="vyking-hotspots" style="display: none;">
  <div slot="hotspot-vyking-dot+X-Y+Z" class="dot" data-position="1 -1 1" data-normal="1 0 0">
    <button part="hotspot-vyking-dot+X-Y+Z" class="dot" data-position="1 -1 1" data-normal="1 0 0"></button>
  </div>
  <div slot="hotspot-vyking-dim+X-Y" class="dim" data-position="1 -1 0" data-normal="1 0 0">
    <button part="hotspot-vyking-dim+X-Y" class="dim" data-position="1 -1 0" data-normal="1 0 0" style="border-radius: 20px;"></button>
  </div>
  <div slot="hotspot-vyking-dot+X-Y-Z" class="dot" data-position="1 -1 -1" data-normal="1 0 0">
    <button part="hotspot-vyking-dot+X-Y-Z" class="dot" data-position="1 -1 -1" data-normal="1 0 0"></button>
  </div>
  <div slot="hotspot-vyking-dim+X-Z" class="dim" data-position="1 0 -1" data-normal="1 0 0">
    <button part="hotspot-vyking-dim+X-Z" class="dim" data-position="1 0 -1" data-normal="1 0 0" style="border-radius: 20px;"></button>
  </div>
  <div slot="hotspot-vyking-dot+X+Y-Z" class="dot" data-position="1 1 -1" data-normal="0 1 0">
    <button part="hotspot-vyking-dot+X+Y-Z" class="dot" data-position="1 1 -1" data-normal="0 1 0"></button>
  </div>
  <div slot="hotspot-vyking-dim+Y-Z" class="dim" data-position="0 -1 -1" data-normal="0 1 0">
    <button part="hotspot-vyking-dim+Y-Z" class="dim" data-position="0 -1 -1" data-normal="0 1 0" style="border-radius: 20px;"></button>
  </div>
  <div slot="hotspot-vyking-dot-X+Y-Z" class="dot" data-position="-1 1 -1" data-normal="0 1 0">
    <button part="hotspot-vyking-dot-X+Y-Z" class="dot" data-position="-1 1 -1" data-normal="0 1 0"></button>
  </div>
  <div slot="hotspot-vyking-dim-X-Z" class="dim" data-position="-1 0 -1" data-normal="-1 0 0">
    <button part="hotspot-vyking-dim-X-Z" slot="hotspot-vyking-dim-X-Z" class="dim" data-position="-1 0 -1" data-normal="-1 0 0" style="border-radius: 20px;"></button>
  </div>
  <div slot="hotspot-vyking-dot-X-Y-Z" class="dot" data-position="-1 -1 -1" data-normal="-1 0 0">
    <button part="hotspot-vyking-dot-X-Y-Z" class="dot" data-position="-1 -1 -1" data-normal="-1 0 0"></button>
  </div>
  <div slot="hotspot-vyking-dim-X-Y" class="dim" data-position="-1 -1 0" data-normal="-1 0 0">
    <button part="hotspot-vyking-dim-X-Y" slot="hotspot-vyking-dim-X-Y" class="dim" data-position="-1 -1 0" data-normal="-1 0 0" style="border-radius: 20px;"></button>
  </div>
  <div slot="hotspot-vyking-dot-X-Y+Z" class="dot" data-position="-1 -1 1" data-normal="-1 0 0">
    <button part="hotspot-vyking-dot-X-Y+Z" class="dot" data-position="-1 -1 1" data-normal="-1 0 0"></button>
  </div>
</div>

<div class="container">
  <div class="userInput" tabindex="0" role="img"
      aria-label="3D model">
      <div class="slot canvas">
        <slot name="canvas">
          <canvas></canvas>
        </slot>
      </div>
  </div>

  <!-- NOTE(cdata): We need to wrap slots because browsers without ShadowDOM
        will have their <slot> elements removed by ShadyCSS -->
  <div class="slot poster">
    <slot name="poster">
      <button type="button" id="default-poster" aria-hidden="true" aria-label="Loading 3D model"></button>
    </slot>
  </div>

  <div class="slot ar-button">
    <slot name="ar-button">
      <a id="default-ar-button" part="default-ar-button" class="fab"
          tabindex="2"
          aria-label="View in your space">
        ${ARGlyph}
      </a>
    </slot>
  </div>

  <div class="slot vto-button">
    <slot name="vto-button" class="animated-container">
      <a id="default-vto-button" part="default-vto-button" class="fab"
          tabindex="1"
          aria-label="View on your body">
        ${VTOGlyph}
      </a>
    </slot>
  </div>

  <div class="slot pan-target">
    <slot name="pan-target">
      <div id="default-pan-target">
      </div>
    </slot>
  </div>

  <div class="slot interaction-prompt cover centered">
    <div id="prompt" class="animated-container">
      <slot name="interaction-prompt" aria-hidden="true">
        ${ControlsPrompt}
      </slot>
    </div>
  </div>

  <div id="finger0" class="animated-container cover">
    <slot name="finger0" aria-hidden="true">
    </slot>
  </div>
  <div id="finger1" class="animated-container cover">
    <slot name="finger1" aria-hidden="true">
    </slot>
  </div>

  <div class="slot view-toggles">
    <slot name="view-toggles">
        <div id="default-view-toggles" part="default-view-toggles">
        </div>
    </slot>
  </div>

  <div class="slot dimensions-toggle">
    <slot name="dimensions-toggle">
      <button id="default-dimensions-toggle" part="default-dimensions-toggle">
          Show Dimensions
      </button>
    </slot>
  </div>

  <div class="slot default">
    <slot></slot>

    <svg id="dimLines" width="100%" height="100%" class="dimensionLineContainer">
      <line class="dimensionLine hide"></line>
      <line class="dimensionLine hide"></line>
      <line class="dimensionLine hide"></line>
      <line class="dimensionLine hide"></line>
      <line class="dimensionLine hide"></line>
    </svg>

    <!--
    // VYKING 04/03/2025 Replace default progress bar
    <div class="slot progress-bar">
      <slot name="progress-bar">
        <div id="default-progress-bar" aria-hidden="true">
          <div class="bar" part="default-progress-bar"></div>
        </div>
      </slot>
    </div>
        -->
    <div class="slot progress-bar">
      <slot name="progress-bar">
        <div id="default-progress-bar" part="default-progress-bar" aria-hidden="true">
          <img id="default-progress-img" part="default-progress-img"/>
          <div class="bar" part="default-progress-indicator"></div>
          <div id="default-progress-percentage" part="default-progress-percentage">0%</div>
          <div id="default-progress-text" part="default-progress-text">Loading 3D model</div>
        </div>
      </slot>
    </div>

    <div id="default-vto" part="default-vto" aria-hidden="true">
    </div>

    <div class="slot exit-webxr-ar-button">
      <slot name="exit-webxr-ar-button">
        <a id="default-exit-webxr-ar-button" part="default-exit-webxr-ar-button"
            tabindex="3"
            aria-label="Exit AR"
            aria-hidden="true">
          ${CloseIcon}
        </a>
      </slot>
    </div>
  </div>
</div>
<div class="screen-reader-only" role="region" aria-label="Live announcements">
  <span id="status" role="status"></span>
</div>`;

export const makeTemplate = (shadowRoot: ShadowRoot) => {
  render(templateResult, shadowRoot);
};