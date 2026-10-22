# CDTP Robot Evaluation App

A React web app for viewing a robot with a phone camera, detecting ArUco markers, displaying robot telemetry, and running scored evaluation tasks. The laptop runs the web app; open it in the phone's browser to use the phone's rear camera.

## What it does

- Shows a live camera feed and asks for the environment-facing (usually rear) camera.
- Detects ArUco markers in the browser with `js-aruco`; it does not require OpenCV.
- Displays telemetry received over WebSocket: robot link status, tilt, battery voltage, charging state, motion, direction, and estimated dock distance.
- Provides timed evaluation tasks and generates a result report with a SHA-256 digest.
- Uses a responsive layout: the camera and stats appear above the controls on a phone; on wider screens, controls sit beside the camera and stats.

## Requirements

- Node.js and npm.
- A current browser on the phone with camera access.
- The laptop and phone connected to a network that lets the phone reach the laptop. If the robot creates its own Wi-Fi network, configure the laptop/phone and WebSocket connection to match that network.
- A WebSocket endpoint that sends robot telemetry. A mock endpoint is included for local development.

## Run the app

From the project folder:

```bash
npm install
npm run dev
```

Vite listens on `0.0.0.0:5173`, so it can be reached from other devices on the same network. Find the laptop's LAN IP address and open the URL shown by Vite on the phone, typically:

```text
https://<laptop-ip>:5173
```

The Vite configuration enables a self-signed HTTPS certificate. HTTPS is needed for camera access on a phone when the page is opened from another device. The phone may show a certificate warning; camera permission can also depend on the browser trusting or accepting that certificate. Grant camera permission when prompted.

The app uses the phone camera, not a camera stream from the robot. Keep the phone pointed at the robot and markers while using the app.

## Connect telemetry

The browser connects to a WebSocket endpoint. By default, Vite proxies the app's `/ws` WebSocket path to `ws://localhost:8080`. This assumes a telemetry service is listening on the laptop at port 8080. To target a different endpoint, set `VITE_WS_URL` to the WebSocket URL before starting Vite, for example:

```text
VITE_WS_URL=wss://<host>/ws
```

Restart Vite after changing the environment variable. For an HTTPS app, use a secure WebSocket (`wss://`) endpoint unless the endpoint is proxied through the app's HTTPS origin. Browsers may block insecure WebSocket connections from an HTTPS page.

### Mock ESP32 telemetry

The included `mock-esp32.js` program runs a test WebSocket server on port 8080. In a second terminal, start it with:

```bash
node mock-esp32.js
```

The mock broadcasts a JSON packet once per second:

```json
{
  "tilt": 0.2,
  "battery": 12.4,
  "charging": false
}
```

While it is running, keyboard commands in its terminal simulate telemetry changes:

| Key | Effect |
| --- | --- |
| `c` | Toggle charging state |
| `t` | Set tilt to 12 degrees |
| `r` | Reset tilt to 0.2 degrees |
| `b` | Decrease battery by 0.5 volts |
| `Ctrl+C` | Stop the mock server |

For the real ESP32, implement or configure a WebSocket endpoint that provides the same JSON fields. The Vite proxy currently points to the laptop's `localhost:8080`; it does not automatically connect to the ESP32's Wi-Fi address. Set up a bridge/proxy or configure `VITE_WS_URL` and the network so the phone's browser can reach the real endpoint.

## ArUco marker setup

Marker detection and measurement settings are in `src/config.js`:

| Purpose | Marker ID |
| --- | ---: |
| Charging station / dock | `0` |
| Robot | `1` |

The configured printed marker side length is 10 cm. Print markers with the matching IDs and known physical size, keep them visible to the phone camera, and avoid glare or motion blur.

The stats behave as follows:

- **Robot marker visible:** the app reports motion state and direction based on changes in the marker's image position.
- **Robot and station visible:** it also estimates the distance between their image centers and shows Dock Distance.
- **No usable robot/station pair:** Dock Distance displays “Searching markers...”.
- The app does not currently draw marker boxes, labels, or highlights over the video.

The marker position and distance calculations are image-based approximations, not calibrated robot localization. Camera angle, perspective, marker size, lighting, and detection quality can affect the results. Validate measurements against the physical setup before relying on them for evaluation.

## Evaluation tasks

Choose a task in the Evaluation Console, start the test, and end it to generate a report:

| Task | Current pass condition |
| --- | --- |
| Static Balance | Test duration is at least 30 seconds |
| Robot Guidance | Tracked distance is between 0.8 m and 1.2 m |
| Charging | Charging telemetry is active when the test ends, within 5 seconds |
| Integrated Task | Tracked distance is at least 0.8 m and charging telemetry is active |

The report includes task, duration, measured distance, tilt, result, diagnostic text, timestamp, and a SHA-256 digest of the report data. The digest can help detect changes to the generated data; it is not a digital signature or proof that sensor inputs are authentic. Reports are held in the page state and are not saved to a database.

## Project structure

```text
src/
  App.jsx                    Main page layout and shared hook state
  components/
    CameraView.jsx           Phone camera feed and processing canvas
    TelemetryHud.jsx         Robot and vision stats
    TestManager.jsx          Evaluation selection, controls, and report
    AuditReport.jsx          Report component
  hooks/
    useCameraVision.js       Camera access and ArUco detection loop
    useTelemetry.js          WebSocket telemetry and connection watchdog
  utils/
    visionMath.js            Marker geometry and motion calculations
    reportCrypto.js          SHA-256 report digest
  config.js                  WebSocket and marker/evaluation settings
mock-esp32.js                Local WebSocket telemetry simulator
vite.config.js               Vite, HTTPS, LAN host, and WebSocket proxy
```

## Useful commands

```bash
npm run dev       # Start the development server
npm run build     # Create the production build in dist/
npm run preview   # Preview the production build
npm run lint      # Run ESLint across the repository
```
