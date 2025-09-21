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
Below is a minimal example running both the backend `nodejs-poolController` (service name `njspc`) and this dashPanel UI (service name `njspc-dash`). Adjust volumes and device mappings as needed.

```yaml
services:
  njspc:
    image: ghcr.io/sam2kb/njspc
    container_name: njspc
    restart: unless-stopped
    environment:
      - TZ=${TZ:-UTC}
      - NODE_ENV=production
    ports:
      - "4200:4200"
    # Map RS-485 USB adapter (example path may differ):
    devices:
      - /dev/ttyACM0:/dev/ttyUSB0

  njspc-dash:
    image: ghcr.io/sam2kb/njspc-dash
    container_name: njspc-dash
    restart: unless-stopped
    depends_on:
      - njspc
    environment:
      - TZ=${TZ:-UTC}
      - NODE_ENV=production
      # Default linkage to backend (override if backend differs):
      - POOL_WEB_SERVICES_IP=njspc
      - POOL_WEB_SERVICES_PORT=4200
      - POOL_WEB_SERVICES_PROTOCOL=http://
    ports:
      - "5150:5150"
```

After starting, browse to: `http://localhost:5150` and configure any remaining settings via the UI. The dashPanel will connect automatically to `njspc:4200` unless overridden.

For production hardenings consider: enabling HTTPS, adding reverse proxy headers, mounting persistent volumes, and restricting exposed ports.


