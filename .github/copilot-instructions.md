# nodejs-poolController-dashPanel AI Coding Instructions

## Project Overview
This is a TypeScript-based web dashboard for pool control systems that acts as a frontend relay to a separate [nodejs-poolController](https://github.com/tagyoureit/nodejs-poolController) backend server. It provides a web interface for pool management and an RS485 message debugging tool.

## Architecture & Key Components

### Core Service Pattern
- **Main entry**: `app.ts` orchestrates initialization of config → logger → webApp → outQueues
- **Configuration**: Lives in `server/config/Config.ts` with defaults in `defaultConfig.json`
- **Web server**: Multi-protocol support (HTTP/HTTPS/HTTP2) in `server/Server.ts` with Socket.IO for real-time updates
- **Relay pattern**: All `/njsPC/*` requests are proxied to the backend pool controller via `server/relay/relayRoute.ts`

### Frontend Organization
- **Widget-based UI**: jQuery widgets in `scripts/` for dashboard components (bodies, circuits, pumps, chemistry, etc.)
- **Theme system**: SCSS-based themes in `themes/` with Bootstrap integration
- **Real-time updates**: Socket.IO client-server communication for live pool data

### Message System
- **Message Manager**: Dedicated tool for RS485 protocol debugging in `scripts/messages/`
- **Documentation**: Message protocol docs in `server/messages/docs/`
- **Filtering**: Advanced message filtering and decoding capabilities

## Development Workflows

### Build & Run
```bash
npm run build    # TypeScript compilation to dist/
npm start        # Build + run compiled app
npm run watch    # Watch mode for development
```

### Deployment
- **Docker**: Multi-stage build, runs on port 5150, uses PM2 with `ecosystem.config.js`
- **Config**: Backend server connection configured via web UI or manual `config.json` edit

## Code Patterns & Conventions

### TypeScript Structure
- **Modules**: CommonJS with ESNext target
- **Classes**: Singleton pattern for services (webApp, config, logger, outQueues)
- **Error handling**: Custom `ApiError` class extends Error
- **Constants**: Shared utilities in `server/Constants.ts`

### Frontend Patterns
- **jQuery widgets**: Use `$.widget("pic.widgetName", {})` pattern for all UI components
- **Socket events**: Widgets implement receive methods (e.g., `receiveLogMessages`, `receivePortStats`)
- **Panel initialization**: Each widget has an `init` method that accepts data from the backend

### Configuration
- **Hierarchical config**: Web servers, services, and relay settings in nested objects
- **Runtime config**: Web UI allows editing pool controller connection settings
- **Default ports**: Dashboard on 5150, typically connects to pool controller on 4200

### API Structure
- **Config API**: `/config/*` routes for dashboard settings
- **Messages API**: `/messages/*` for RS485 message management
- **Relay pattern**: `/njsPC/*` proxies everything to backend pool controller
- **Upload**: File upload functionality for logs and configs

## Integration Points

### Backend Communication
- **Primary**: Socket.IO connection to nodejs-poolController for real-time pool data
- **Fallback**: HTTP relay for REST API calls when socket unavailable
- **Message relay**: Bidirectional RS485 message passthrough for debugging

### External Dependencies
- **Pool protocols**: IntelliCenter, IntelliTouch, EasyTouch support via backend
- **Network discovery**: SSDP and mDNS for auto-discovery of pool controllers
- **Authentication**: Optional HTTP basic auth with htpasswd files

## Key Files to Understand
- `app.ts` - Application entry and initialization sequence
- `server/Server.ts` - Multi-protocol web server with Socket.IO
- `server/relay/relayRoute.ts` - Backend proxy implementation
- `scripts/dashboard.js` - Main dashboard widget orchestration
- `defaultConfig.json` - Complete configuration schema and defaults
- `ecosystem.config.js` - PM2 process management for production