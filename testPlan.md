# vyking-apparel Test Play

## Locally in Browser (Mac: Safari, Chrome, Firefox; iOS; Android: Chrome, Firefox)
Start the local dev server with: npm run serve
Start SneakerWindow dev server with: npm start (in the SneakerWindow project)

- https://192.168.0.20.1234
    - Must do this first to validate the certificate for this site

- https://192.168.0.20.3001/steve.html
    - Must do this first to validate the certificate for this site

- https://192.168.0.20:8080
    - Must do this first to validate the certificate for this site
    - Select packages->modelviewer.dev
    - Test VTO

- https://192.168.0.20:3001/model-viewer-test.html
    - Ensure the local version of model-viewer.min.js is imported.
    - Ensure live site SneakerWindow & vyking-apparel are selected
    - Edit model-viewer-test.html to test with vto-modes="vyking sneakerwindow"
    - Edit model-viewer-test.html to test with vto-modes="sneakerwindow vyking"
