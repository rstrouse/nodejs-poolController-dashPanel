var outModule = {
    isCancelled: false,
    msgToSend: null,
    msgInitial: null,
    messagesSent: 0,
    knownAddresses: [12, 15, 16],
    knownActions:[2, 30, 168, 164, 204, 222, 228],
    options: {
        stopOnInboundChange: true,
        waitForFirstInbound: true,
        sendOnResponse: false,
        delay:500
    },
    logParams:  {
        packet: {
            enabled: true,
            logToConsole: false,
            logToFile: true,
            invalid: false,
            broadcast: { enabled: false },
            pump: { enabled: false },
            chlorinator: { enabled: false },
            intellichem: { enabled: false },
            intellivalve: {
                enabled: true,
                includeActions: [],
                exclueActions: [],
                includeSource: [],
                includeDest: [],
                excludeSource: [],
                excludeDest: []
            },
            unidentified: {
                enabled: true,
                includeSource: [],
                includeDest: [],
                excludeSource: [],
                excludeDest: []
            },
            unknown: {
                enabled: true,
                includeSource: [],
                includeDest: [],
                excludeSource: [],
                excludeDest: []
            },
            replay: false
        }
    },
    begin: function () {
        var self = this;
        var mmgr = $('div.picMessageManager');
        self.isCancelled = false;
        // Calculate out the know addresses.  We don't want to send these.
        this.knownAddresses.push();
        for (let b = 32; b <= 35; b++) this.knownAddresses.push(b);  // Control panels
        for (let b = 80; b <= 84; b++) this.knownAddresses.push(b); // Pumps
        for (let b = 96; b <= 111; b++) this.knownAddresses.push(b); // Pumps
        for (let b = 113; b <= 128; b++) this.knownAddresses.push(b); // Heaters
        for (let b = 144; b <= 159; b++) this.knownAddresses.push(b); // Chem controllers
        
        // Set up the logging.
        $.putApiService('app/logger/setOptions', this.logParams, function (data, status, xhr) {
            // Subscribe to the events.
            mmgr[0].receiveLogMessages(true);
            mmgr.on('messageReceived.valveMessage', function (evt) { self.messageReceived(evt); });
            if (!self.options.sendOnResponse && !self.waitForFirstInbound) {
                setTimeout(function () { self.sendNextMessage(); }, 50);
            }
        });
    },
    cancel: function () {
        var mmgr = $('div.picMessageManager');
        mmgr.off('messageReceived.valveMessage');
        mmgr[0].receiveLogMessages(false);
        this.isCancelled = true;
    },
    messageReceived: function (evt) {
        var msg = evt.message;
        if (msg.dir === 'out') {
            // See if this is the message we sent.
            if (msgManager.isArrayDiff(this.msgToSend.header, msg.header) ||
                msgManager.isArrayDiff(this.msgToEnd.payload, msg.payload)) return;
            else {
                this.sendNextMessage();
            }
        }
        else if (msg.isValid === true) {
            // We have an inbound message
            if (this.options.waitForFirstInbound && !this.msgInitial) {
                this.msgInitial = msg;
                console.log({ text: 'A message was received', msg: msg, opt: this.options, init: this.msgInitial, t:this });
                this.sendNextMessage();
                return;
            }
            else {
                if (msgManager.isArrayDiff(this.msgInitial.header, msg.header) ||
                    msgManager.isArrayDiff(this.msgInitial.payload, msg.payload)) {
                    // Yahoooooo!!! the inbound message has changed.
                    if (!this.options.stopOnInboundChange)
                        this.sendNextMessage();
                }
                //else
                //    this.sendNextMessage();
            }
        }
    },
    getNextDest: function (curr) {
        curr++;
        while (this.knownAddresses.indexOf(curr) !== -1) curr++;
        return curr;
    },
    getNextAction: function (curr) {
        curr++;
        while (this.knownActions.indexOf(curr) !== -1) curr++;
        return curr;
    },
    sendNextMessage: function () {
        var self = this;
        var mm = $('div.picMessageManager')[0];
        // Examples of Valve Hail messages in the wild
        //[255, 0, 255][165, 1, 16, 12, 82, 8][0, 128, 216, 128, 57, 64, 25, 166][4, 44] -- Mine
        //   Number on Housing: 521381
        //   Label P/N: 521485
        //   Label S/N: 1245110160038L
        //   Label Barcode: 69857861
        //   Label Date: 04/19/2016
        //   Site: W
        //[255, 0, 255][165, 1, 16, 12, 82, 8][0, 128, 216, 128, 57, 159, 209, 162][5, 63]
        //   This is a guess since MCQuerty didn't indicate which valves were wich.  This seems to be an earlier valve.
        //   Label S/N:1245342160120K
        //   Label Barcode: 7420586?
        //[255, 0, 255][165, 1, 16, 12, 82, 8][0, 128, 128, 31, 18, 76, 39, 119][3, 55]
        //[255, 0, 255][165, 1, 16, 12, 82, 8][0, 128, 128, 31, 18, 75, 154, 185][3, 235]
        //[255, 0, 255][165, 1, 16, 12, 82, 8][0, 128, 128  31, 18, 79, 209, 34][3, 143]
        //    Label S/N: 1245225190054F
        //    Label Barcode: 16213213
        //    Label Date: 08/19/2019
        // NOTABLES:
        // 1. byte(0) + byte(1) are 0 and 128 in all examples.  Possibilities include
        //      a. Endpoints
        //      b. Continuation of the address.  In an increasing sequence the leftmost bytes would
        //         remain constant as the rightmost change.  While possible I can't believe there are that
        //         many of these that have been created.
        // 2. This could be a mac address of sorts given there are 6 remaining bytes after looking at the first
        //    two bytes as endpoints.
        //      a. It is possible that the examples above come from two separate manufacturing lines. 216,128,57 and 128,31,18. This
        //         would leave a 3 byte serial number at the end.
        // 3. IChlor also uses address 12 to broadcast some sort of hail [255, 0, 255][166, 1, 176, 12, 103, 1][0][1, 203]
        //      a. This means that 12 is not a specific IntelliValve address but more likely a hail channel where equipment
        //         publish their existence on the bus.


        // The following has yielded no results.
        // 1. Return the entire message to destinations on every possible address.

        if (!this.msgToSend) {
            if (!this.options.waitForFirstInbound) {
                this.msgInitial = {
                    protocol: 'intellivalve',
                    preamble: [255, 0, 255],
                    header: [165, 1, 16, 12, 82, 8],
                    payload: [0, 128, 216, 128, 57, 64, 25, 166],
                    term: [4, 44]
                };
            }
            else if (!this.msgInitial) return;
            this.msgToSend = {
                protocol: 'intellivalve',
                preamble: [255, 0, 255],
                header: [165, 1, 50, 16, 240, 0],
                payload: this.msgInitial.payload.slice(),
                term: [0, 0]
            };
            this.msgToSend.payload[0] = 1;
            msgManager.calcChecksum(this.msgToSend);
        }
        else {
            this.msgToSend.header[2] = this.getNextDest(this.msgToSend.header[2]);
            if (this.msgToSend.header[2] > 255) {
                mm.clearOutbound();
                this.msgToSend.header[2] = 17;
                this.msgToSend.header[4] = this.getNextAction(this.msgToSend.header[4]);
                if (this.msgToSend.header[4] === 256) {
                    this.msgToSend.header[4] = 3;
                    this.msgToSend.payload[0] = this.msgToSend.payload[0] + 1;
                    
                }

            }
            msgManager.calcChecksum(this.msgToSend);
        }
        if (!this.isCancelled) {
            mm.sendOutboundMessage(this.msgToSend);
            //console.log({ text: 'Sending Message', msg: this.msgToSend });
            if (!this.options.sendOnResponse) {
                setTimeout(function () { self.sendNextMessage(); }, this.options.delay);
            }
        }
    }
};