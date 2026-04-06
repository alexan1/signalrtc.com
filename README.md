# signalrtc.com

Web client for [SignalRTC](https://github.com/alexan1/SignalRTC) — a WebRTC video and text chat application. Deployed at https://signalrtc.com/

## Features

- Real-time video chat via WebRTC (peer-to-peer)
- Text chat — public broadcast or direct messages to a specific user
- Webcam and microphone toggle with device selection
- Live online users list with media status indicators
- No registration required; messages are not stored
- PWA — installable on desktop and mobile

## Configuration

The SignalR hub URL is set in `Scripts/config.js`:

```js
var hubUrl = "https://signalrtc-hfejcjbsc6acf7fj.canadaeast-01.azurewebsites.net/signalr";
```

For local development, change it to `http://localhost:5000/signalr` — but don't commit that change.

## Key Files

```
signalrtc.com/
├── index.html            # Main page
├── videochat.html        # Video chat page
├── mobile.html           # Mobile landing page
├── Privacy.html          # Privacy policy
├── Scripts/
│   ├── config.js         # Hub URL configuration
│   ├── signalr.js        # SignalR connection and messaging
│   ├── video.js          # WebRTC video logic
│   ├── dom.js            # DOM element references
│   └── utils.js          # Utility functions
├── signalrtc.css         # Styles
├── sw.js                 # Service worker (PWA)
└── manifest.json         # PWA manifest
```
