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
var hubUrl = "https://your-server.azurewebsites.net/signalr";
```

For local development:

```js
var hubUrl = "http://localhost:5000/signalr";
```

## Project Structure

```
signalrtc.com/
├── index.html            # Main page
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
