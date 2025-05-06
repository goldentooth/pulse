# 🫀 Pulse

_Infrastructure and Network conditions visualized as a heartbeat_

GoldenTooth Pulse is a minimal visualization of real-time signals from a 10-node Raspberry Pi cluster. Each node is pinged regularly by a Go backend, and its latency, clock drift, and availability are rendered in a visually expressive, canvas-based frontend. The result is an ambient, living representation of the cluster’s internal rhythm — glowing, rippling, and reacting in real time.

## 📸 Demo

> Visit: [https://pulse.home-proxy.goldentooth.net](https://pulse.home-proxy.goldentooth.net)
> (Coming soon — May 2025)

Each node:
- Emits a pulse based on live ping responses
- Displays a ripple effect whose shape and brightness reflect its latency
- Fades when unreachable
- Is styled according to a distinct theme (2-3 colors)

## 🧠 Architecture

- **Backend**: Go HTTP server
  - Loads static config of known nodes (names, IPs, colors)
  - Pings each node on a loop and stores recent measurements
  - Exposes two endpoints:
    - `GET /api/nodes` – static node metadata (name, IP, theme)
    - `GET /api/data` – latest latency, clock drift, and availability info

- **Frontend**: JavaScript + HTML5 Canvas
  - Loads node metadata
  - Polls `/api/data` periodically
  - Renders animated visualization of the cluster state

## 🛠 Development

### Prerequisites

- Go (1.21+)
- Node.js (18+)
- Make

### Running Locally

```bash
# Start backend
cd backend
go run main.go
```

Then open `http://localhost:5173` in your browser.

### Configuration

Node configuration is supplied via a JSON file or environment variable.

Example:
```json
[
  {
    "name": "allyrion",
    "ip": "10.4.0.10",
    "theme": {
      "primary": "#dc143c",
      "secondary": "#ffcccb",
      "tertiary": "#aabbcc"
    }
  },
  ...
]
```

This can be:
- Mounted via Kubernetes ConfigMap
- Loaded from a local file (`nodes.json`)
- Supplied via an env var (`NODES_JSON`)

## 🚀 Deployment

This repo is intended to be deployed via Argo CD to `pulse.goldentooth.net`.
See `deploy/argocd.yaml` for application definition.

Production build:
```bash
# Build static frontend
cd frontend
npm run build

# Build Go binary with embedded frontend
cd ../cmd/pulse
go build -o pulse main.go
```

## 📋 TODO

- [ ] Canvas ripple physics
- [ ] Visual decay for missing nodes
- [ ] Optional: drift-based distortion
- [ ] Full Argo CD deployment
- [ ] Weekly reflection posts + demo

## 📜 License

Released under the Unlicense. See [LICENSE](./LICENSE) for details.

Built for joy and expressive infrastructure.
