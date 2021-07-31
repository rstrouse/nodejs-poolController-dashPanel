import { logger } from "./server/logger/Logger";
import { config } from "./server/config/Config";
import { webApp } from "./server/Server";
import { outQueues } from "./server/queues/outboundQueue";
import { njsPCRelay } from "./server/relay/relayRoute";
import * as readline from 'readline';

export function initAsync() {
    return Promise.resolve()
        .then(function () { config.init(); })
        .then(function () { logger.init(); })
        .then(function () { webApp.init(); })
        .then(function () { outQueues.init(); })
}
export function stopAsync(): Promise<void> {
    return Promise.resolve()
        .then(function () { console.log('Shutting down open processes'); })
        .then(function () { process.exit(); });
}
if (process.platform === 'win32') {
    let rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.on('SIGINT', function () { stopAsync(); });
}
else {
    process.on('SIGINT', function () { return stopAsync(); });
}
initAsync();