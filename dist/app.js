"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("./server/logger/Logger");
const Config_1 = require("./server/config/Config");
const Server_1 = require("./server/Server");
const readline = require("readline");
function initAsync() {
    return Promise.resolve()
        .then(function () { Config_1.config.init(); })
        .then(function () { Logger_1.logger.init(); })
        .then(function () { Server_1.webApp.init(); });
}
exports.initAsync = initAsync;
function stopAsync() {
    return Promise.resolve()
        .then(function () { console.log('Shutting down open processes'); })
        .then(function () { process.exit(); });
}
exports.stopAsync = stopAsync;
if (process.platform === 'win32') {
    let rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.on('SIGINT', function () { stopAsync(); });
}
else {
    process.on('SIGINT', function () { return stopAsync(); });
}
initAsync();
//# sourceMappingURL=app.js.map