# nodejs-poolController-dashPanel
## What is nodejs-poolController-dashPanel?
dashPanel is a controller designed to operate using a [nodejs-poolController](https://github.com/tagyoureit/nodejs-poolController) server backend.  You will need to set up your nodejs-poolController server and have it communicating with your pool equipment prior to setting up this server.  Once you have done that you can set up the dashPanel to communicate with that server.

While this project was originally developed using an IntelliCenter control panel it should operate equally well with an IntelliTouch or EasyTouch control panel.
![image](https://user-images.githubusercontent.com/47839015/83304160-38a86780-a1b3-11ea-8214-442db6c6bdc4.png)

## Configuring the dashPanel
To configure the dashPanel you need to place the url for your [nodejs-poolController](https://github.com/tagyoureit/nodejs-poolController) server in the configuration.  Click the bars menu on the top left of the screen and fill in the ip address and port.  Then press the Apply button.  If this button is grayed out you will need to edit the config.json file manually and enter the settings under the services menu.

## What is Message Manager?
Message manager allows you to inspect your RS485 communication coming from and going to the [nodejs-poolController](https://github.com/tagyoureit/nodejs-poolController) server.  This tool decodes the messages and displays them in a manner where important chatter on the RS485 connection can be decoded while eliminating the chatter that don't matter.  Special filters can be applied to reduce the information to only the items you are interested in.
![image](https://user-images.githubusercontent.com/47839015/83314254-7a92d700-a1ce-11ea-8891-545db084624e.png)

## Quick Start (docker-compose)
Below is a minimal example running both the backend `nodejs-poolController` (service name `njspc`) and this dashPanel UI (service name `njspc-dash`). Adjust volumes and device mappings as needed. The dashPanel writes its configuration to `/app/config.json`, so we bind mount a host file to persist it. Additional runtime state (queues/uploads/logs) uses named volumes.

```yaml
services:
   njspc:
      image: ghcr.io/sam2kb/njspc
      container_name: njspc
      restart: unless-stopped
      environment:
         - TZ=${TZ:-UTC}
         - NODE_ENV=production
         # Serial vs network connection options
         # - POOL_NET_CONNECT=true
         # - POOL_NET_HOST=raspberrypi
         # - POOL_NET_PORT=9801
         # Provide coordinates so sunrise/sunset (heliotrope) works immediately - change as needed
         - POOL_LATITUDE=28.5383
         - POOL_LONGITUDE=-81.3792
      ports:
         - "4200:4200"
      devices:
         - /dev/ttyACM0:/dev/ttyUSB0
      # Persistence (create host directories/files first)
      volumes:
         - ./config/config.json:/app/config.json   # Persisted config file on host
         - njspc-data:/app/data                    # State & equipment snapshots
         - njspc-backups:/app/backups              # Backup archives
         - njspc-logs:/app/logs                    # Logs
         - njspc-bindings:/app/web/bindings/custom # Custom bindings
      # OPTIONAL: If you get permission errors accessing /dev/tty*, prefer adding the container user to the host dialout/uucp group;
      # only as a last resort temporarily uncomment the two lines below to run privileged/root (less secure).
      # privileged: true
      # user: "0:0"

   njspc-dash:
     image: ghcr.io/sam2kb/njspc-dash
     container_name: njspc-dash
     restart: unless-stopped
     depends_on:
       - njspc
     environment:
       - TZ=${TZ:-UTC}
       - NODE_ENV=production
       - POOL_WEB_SERVICES_IP=njspc      # Link to backend service name
     ports:
       - "5150:5150"
     volumes:
       - ./dash-config/config.json:/app/config.json
       - njspc-dash-data:/app/data
       - njspc-dash-logs:/app/logs
       - njspc-dash-uploads:/app/uploads

volumes:
  njspc-data:
  njspc-backups:
  njspc-logs:
  njspc-bindings:
  njspc-dash-data:
  njspc-dash-logs:
  njspc-dash-uploads:
```

After starting, browse to: `http://localhost:5150` and configure any remaining settings via the UI. The dashPanel will connect automatically to `njspc:4200` unless overridden.

## Persistence & Configuration
The application loads configuration from `/app/config.json` at startup and rewrites it atomically after changes (writes to a temporary file then renames). To persist across container recreations:

1. Create a host directory and seed the file (optional – if omitted, an empty file will be populated after first change):
  ```bash
  mkdir -p config
  docker run --rm ghcr.io/sam2kb/njspc-dash cat /app/config.json > config/config.json
  ```
2. Use the bind mount shown in the compose example: `./config/config.json:/app/config.json`.
3. If the mounted file is empty, defaults + environment overrides are applied and the file will be written once you change settings via the UI/API.

If a write is interrupted, the app can recover from a `.tmp` file; if corruption is detected the previous file is backed up as `config.json.corrupt` (when non-empty) and defaults are re-applied.

Environment variable overrides (new hierarchical form) include:
* `POOL_WEB_SERVICES_IP`
* `POOL_WEB_SERVICES_PORT`
* `POOL_WEB_SERVICES_PROTOCOL`
* `POOL_WEB_SERVERS_HTTP_PORT`, `POOL_WEB_SERVERS_HTTPS_PORT`
* `POOL_WEB_SERVERS_HTTP_ENABLED`, `POOL_WEB_SERVERS_HTTPS_ENABLED`

Legacy variables `POOL_HTTP_IP` and `POOL_HTTP_PORT` are still honored.

For production hardenings consider: enabling HTTPS, adding reverse proxy headers, mounting persistent volumes, and restricting exposed ports. Ensure ownership of the mounted `config.json` permits writes by the container user (UID 1000 in the official image); otherwise configuration changes will be disabled.


