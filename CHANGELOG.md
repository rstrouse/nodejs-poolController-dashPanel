# Changelog

## [10.0.0] - 2026-06-28

### Breaking Changes
- **Express 5**: Upgraded from Express 4.x to 5.x. Route wildcard syntax changed (named params required). Error middleware requires explicit typing.
- **jQuery 4**: Upgraded from jQuery 3.x to 4.0. Removed deprecated `$.isFunction()`, `$.isArray()`, `$.getScript()` usage.
- **Font Awesome 7**: Upgraded from FA 6.x to 7.x. Backward-compatible via v4-shims and v5-font-face CSS.
- **TypeScript 5.9**: Upgraded from TypeScript 4.9 to 5.9. All imports converted to default imports with `esModuleInterop`.
- **Removed jquery-ui-dist**: Replaced with the built-in `jquery-ui/dist/` bundle (1.14.x, jQuery 4 compatible).
- **Removed jquery-ui-touch-punch-c**: Vendored into `scripts/vendor/` with jQuery 4 compatibility patch.

### Features
- **IntelliCenter v3 OCP WebSocket**: New `ocpws` port type for direct local WebSocket connection to IntelliCenter v3 OCP (port 6680). Includes mDNS discovery, connection testing, reconnect/timeout settings, and real-time stats via `icwsStats` socket event.
- **Cooling mode visibility**: Cool setpoint field now conditionally shown based on whether the selected heat mode supports cooling (`hasCoolSetpoint`). Previously always shown when `hasCooling` was true.
- **New heater types**: Added `utheat`, `meheat`, `eti250heat`, and `utcool` to the heater state display logic.
- **Vacation mode control via WebSocket**: When connected via OCP WebSocket, vacation mode settings (enabled, date range) are fully editable with a save button. RS-485 connections retain read-only behavior with a warning.
- **Manual Heat checkbox**: Added "Manual Heat" option to IntelliCenter general configuration.
- **Pump min/max overrides**: Pump circuit speed/flow spinners now use per-pump overrides (`pump.minSpeed`, `pump.maxSpeed`, `pump.minFlow`, `pump.maxFlow`) when available, falling back to type defaults.
- **Schedule time controls**: Sunrise/sunset multiplier and offset fields now restricted to Nixie controllers only (hidden for IntelliCenter/IntelliTouch).
- **Firmware version parsing**: Dashboard now extracts numeric firmware version (e.g., "3.004" from "v3.004-build123") for cleaner display and comparison.
- **Config tab selection fix**: Fixed tab persistence when navigating between config sub-pages (circuits, bodies, schedules, controller).

### Bug Fixes
- **Swapped req/res in HTTPS redirect**: Fixed parameter order in the HTTPS redirect route handler (was silently broken since original implementation).
- **Priming speed display**: Fixed priming speed spinner only showing when both `maxPrimingTime` and `minSpeed`/`maxSpeed` are defined (avoids showing spinner for flow-only pumps that don't have priming speed).
- **url.parse deprecation**: Replaced deprecated `url.parse()` with `new URL()` in relay proxy.

### Dependency Upgrades
| Package | From | To |
|---------|------|-----|
| express | 4.21 | 5.2 |
| @types/express | 4.17 | 5.0 |
| typescript | 4.9 | 5.9 |
| @types/node | 20.x | 22.x |
| jquery | 3.7 | 4.0 |
| @fortawesome/fontawesome-free | 6.7 | 7.3 |
| multer | 2.0 | 2.2 |
| winston | 3.17 | 3.19 |

## [9.1.0] - 2026-06-01

### Features
- Pool covers panel with real-time socket updates
- Freeze protection status indicators
- Vacation mode scheduling UI
- Dynamic alert configuration UI with category rendering
- IntelliCenter role-based access control and PIN login (security)
- Covers/remotes config tabs
- Jandy heater protocol support
- JXi/LXi heater address picker
- Virtual equipment tabbed UI with chlorinator tab
- Pump configuration enhancements

### Bug Fixes
- Strip port from IP when building service URL (#110)
- Message Manager clear messages flow improvements

## [9.0.0] - 2026-03-15

### Features
- Virtual equipment configuration and functionality
- Valve dashboard integration
- AquaLink and WaterColors UI enhancements
- Neptune Modbus pump support
- QA smoke test scripts
- Firmware-aware dashboard and chemistry configuration
- Entity Flow Analyzer for protocol debugging
- Message documentation refactoring
- Body control support in entity flow

## [8.5.1] - 2025-12-20

### Bug Fixes
- AquaLink and WaterColors UI fixes
- Century pump light fix (PR #108)
- Remove regalmodbus2 reference

## [8.5.0] - 2025-11-15

### Features
- Entity flow features with body control support
- Message documentation enhancements
- CSS layering fixes for message manager
