# Vyking's Virtual Try On Extension to Google's model-viewer Custom HTMLElement.

# Introduction
Vyking have extended Google's model-viewer to load its 3D model from a Vyking offsets.json file and provide a button to launch a virtual try on experience allowing the user to see themselves wearing the model in augmented reality. It makes use of Vyking's vyking-apparel custom HTMLElement (see <a href="https://sneaker-window.vyking.io/vyking-apparel/1/docs/index.html" target="_blank">vyking-apparel documentation</a> for more details). This documentation describe these extensions and should be read in conjunction with <a href="https://modelviewer.dev" target="_blank">Google's model-viewer documentation</a>.

# Quick Start
```
    // Import the component
    <script type="module" src="https://sneaker-window.vyking.io/vyking-model-viewer/model-viewer.min.js"></script>

    <!-- Use it like any other HTML element -->
    <model-viewer ar vto alt="Yeezy Boost" camera-controls touch-action="pan-y"
        vyking-src="https://sneaker-window.vyking.io/vyking-assets/customer/vyking-io/yeezy_boost_700_carbon_blue/offsets.json"
        poster="https://sneaker-window.vyking.io/vyking-assets/customer/vyking-io/yeezy_boost_700_carbon_blue/shoeIcon.png"
        vto-config="../assets/config/modeld.foot.bin" vto-key="io.vyking" vto-autocamera-width=640
        vto-autocamera-height=360>
    </model-viewer>
```
# Examples
- <a href="https://sneaker-window.vyking.io/vyking-model-viewer/examples/model-viewer-example.html" target="_blank">Simple Example</a>
- <a href="https://sneaker-window.vyking.io/vyking-model-viewer/examples/model-viewer-catalog-example.html" target="_blank">Example</a>

# Releases
- 3.1.1-1.6 First documented release
- 3.1.1-1.7 Remove console.logs from minified version
- 3.3.0-1.7 Merge upstream version 3.3.0
- 3.3.0-1.8 Added support for future features.
# Attributes
## vto
Enable the virtual try on (VTO) button.
## vyking-src
Replace the standard "src" attribute with this one to load the model defined by the Vyking offsets.json file referenced by the given url.
## vto-config
The configuration file that will be used by the VTO experience.
## vto-key
The configuration key that will be used by the VTO experience.
## vto-autocamera-width
The ideal camera width the VTO will use when automatically managing the camera.
## vto-autocamera-height
The ideal camera height the VTO will use when automatically managing the camera.
## vto-autocamera-frame-rate
The ideal camera frame rate the VTO will use when automatically managing the camera.
## vto-autocamera-facing-mode
The camera facing mode the VTO will use when automatically managing the camera.
## vto-flipy
If specified the VTO image will be mirrored by flipping about the Y axis.
## vto-rotate
Specify this when the VTO camera needs rotating.  This is typically when an external camera needs to be rotated from landscape to portrait.
## vto-stats
Enable the Three.js statistics element and console logging of internal timings for the VTO.
## vto-debug
Enable VTO debug features such as showing the various canvases used.
## vto-lens-factor
Adjust the VTO zoom factor used when rendering the image.  Zooming in slightly allows the virtual apparel to still be seen when the tracked body part appears to be nearly outside the camera's field of view. Values less that 1.0 zoom in and values greater than 1.0 zoom out.
## vto-share
Enable the VTO share feature.  This uses the navigator.share facility, if supported.
## vto-share-quality
The VTO's share feature generates an 'image/jpeg' image of the rendered canvas using the Canvas.toDataURL method. The share-quality attribute is used as the method's quality parameter.
## vto-status
This read-only attribute enables DOM content to be styled based on the status of the VTO presentation (see the vto-status event for possible values). Typically to enlarge the model-viewer element so that the VTO experience takes up more, if not most, of the screen.

# Events
## vto-status
A CustomEvent reporting the change of status of the VTO. Possible values are:

- 'not-presenting'
- 'presenting'
- 'presenting-qrcode'
- 'failed'
# VTO Global Configuration
Declare the VTO's global configuration object (self.HTMLVykingApparelElement) early if you wish to change any of the default values (see <a href="https://sneaker-window.vyking.io/vyking-apparel/1/docs/index.html" target="_blank">vyking-apparel documentation</a> for more details).
