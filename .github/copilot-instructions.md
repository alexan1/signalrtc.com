# Copilot Instructions — signalrtc.com Client

## Project
Static web client for SignalRTC — a WebRTC video/audio/text chat app.
Hosted on GitHub Pages (served from `master` branch root).
Custom domain: `signalrtc.com`

## Stack
- Vanilla JavaScript + jQuery
- `@microsoft/signalr` 8.x (`HubConnectionBuilder`, `hub.invoke`, `connection.on`)
- WebRTC (`RTCPeerConnection`, `getUserMedia`)
- No build step — static files served directly

## Key Files
- `Scripts/config.js` — hub URL (production: Azure App Service endpoint)
- `Scripts/signalr.js` — SignalR connection, hub events, message handling
- `Scripts/video.js` — WebRTC peer connection, media devices
- `index.html` — main chat UI

## Conventions
- Hub URL is configured in `Scripts/config.js` only — never hardcode in other files
- For local dev, change `hubUrl` in `config.js` to `http://localhost:5000/signalr` (don't commit)
- Avoid `innerHTML` with untrusted input — use `textContent` or DOM methods to prevent XSS
- No build/bundle step — keep dependencies as CDN or committed scripts

## Branch Strategy
- `dev` → active development
- `master` → live on GitHub Pages (deployed immediately on push)
- PRs merged using rebase from `dev` → `master`
