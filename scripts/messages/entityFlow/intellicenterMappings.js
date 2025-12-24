/**
 * IntelliCenter Entity Mapper
 * 
 * Extracts entity state information from IntelliCenter protocol packets.
 * 
 * Feature ID mapping:
 *   - Features start at ID 129
 *   - Feature 129 = byte[0] bit 0
 *   - Feature 130 = byte[0] bit 1
 *   - Feature 136 = byte[0] bit 7
 *   - Feature 137 = byte[1] bit 0
 *   - etc.
 * 
 * Packet types that contain feature state:
 *   - Action 204: Extended status broadcast
 *     - v1.x: bytes 9-12 (reliable)
 *     - v3.004+: bytes 9-12 (STALE! Do not trust!)
 *   - Action 30 case 15: Config response (AUTHORITATIVE for v3.004+)
 *     - bytes 9-12
 *   - Action 168 case 15: External/Set states (outbound)
 *     - bytes 9-12
 */

(function(window) {
    'use strict';
    
    var IntelliCenterEntityMapper = {
        
        /**
         * Feature state byte offsets for different packet types
         */
        FEATURE_OFFSETS: {
            // Action 2 (Status Broadcast)
            // Byte 7 = Features 1-8 (IDs 129-136), all 8 bits
            // Byte 8 = Features 9-16 (IDs 137-144), all 8 bits (v3.004+ reliable for 9-10)
            '2': {
                featureStart: 7,     // Byte 7 = features 129-136
                featureLength: 2,    // 2 bytes = 16 features (129-144)
                maxFeatures: 16,     // Features 129-144
                isAuthoritative: false,
                note: 'Action 2: byte 7=features 129-136, byte 8=features 137-144'
            },
            // Action 204 (Extended Status Broadcast)
            '204': {
                featureStart: 9,    // For v1.x
                featureLength: 4,   // 4 bytes = 32 features
                isAuthoritative: false,  // Not authoritative for v3.004+
                v3FeatureStart: 9,  // v3.004 uses same offset but data is STALE
                note: 'v3.004+ feature data is STALE'
            },
            // Action 30 case 15 (Config Response - States)
            '30_15': {
                featureStart: 9,
                featureLength: 4,
                isAuthoritative: true,
                note: 'Authoritative source for v3.004+'
            },
            // Action 168 case 15 (External/Set States)
            '168_15': {
                featureStart: 9,
                featureLength: 4,
                isAuthoritative: false,
                note: 'Outbound command'
            },
            // Action 168 case 2 (Single Feature Change)
            '168_2': {
                featureIdByte: 3,
                featureStateByte: 4,
                isAuthoritative: false,
                isSingleFeature: true,
                note: 'Single feature toggle command'
            }
        },
        
        /**
         * Circuit state byte offsets for different packet types
         * Circuits 1-40 are in bytes 3-7 (5 bytes × 8 bits = 40 circuits)
         */
        CIRCUIT_OFFSETS: {
            // Action 2 (Status Broadcast - circuits only)
            // Payload layout: [hours, minutes, circuits1-8, circuits9-16, ...]
            // Circuit byte offset is 2 (0=hours, 1=minutes, 2=circuits1-8)
            '2': {
                circuitStart: 2,    // Byte 2 = circuits 1-8 (bit0=C1/Spa, bit5=C6/Pool)
                circuitLength: 5,   // 5 bytes = 40 circuits
                isAuthoritative: false,
                note: 'Broadcast every ~2 sec, circuits 1-40 only'
            },
            // Action 30 case 15 (Config Response - States)
            '30_15': {
                circuitStart: 3,
                circuitLength: 5,
                isAuthoritative: true,
                note: 'Authoritative source'
            },
            // Action 168 case 15 (External/Set States)
            '168_15': {
                circuitStart: 3,
                circuitLength: 5,
                isAuthoritative: false,
                note: 'Outbound command'
            }
        },
        
        /**
         * Temperature sensor byte offsets (IntelliCenter)
         * Entity IDs: 1=WaterSensor1(Pool), 2=WaterSensor2(Spa), 3=Air, 4=Solar1, 5=Solar2, 6=WaterSensor3, 7=WaterSensor4
         */
        TEMP_OFFSETS: {
            // Action 2 (Status Broadcast)
            '2': {
                sensors: {
                    1: { byte: 14, name: 'Water Sensor 1 (Pool)' },
                    2: { byte: 15, name: 'Water Sensor 2 (Spa)' },
                    3: { byte: 18, name: 'Air' },
                    4: { byte: 19, name: 'Solar Sensor 1' },
                    5: { byte: 17, name: 'Solar Sensor 2' },
                    6: { byte: 20, name: 'Water Sensor 3' },
                    7: { byte: 21, name: 'Water Sensor 4' }
                },
                isAuthoritative: false,
                note: 'Broadcast every ~2 sec'
            },
            // Action 204 (Extended Status)
            '204': {
                sensors: {
                    // Action 204 temps are sparse - only some sensors
                    // Based on EquipmentStateMessage.ts, temps aren't the main focus here
                },
                isAuthoritative: false,
                note: 'Extended status - limited temp data'
            }
        },
        
        /**
         * Body settings byte offsets (IntelliCenter)
         * CRITICAL: v3.004 Wireless Action 168/0 has +1 offset vs Action 30/0!
         * Entity IDs: 1=Pool, 2=Spa
         */
        BODY_SETTINGS_OFFSETS: {
            // Action 30 case 0 (Config Response - Temp Settings)
            '30_0': {
                pool: {
                    setpoint: 19,
                    coolSetpoint: 20,
                    heatMode: 23
                },
                spa: {
                    setpoint: 21,
                    coolSetpoint: 22,
                    heatMode: 24
                },
                isAuthoritative: true,
                isWireless: false,
                note: 'OCP config response'
            },
            // Action 168 case 0 (Wireless Temp Settings) - v3.004+ has different offsets!
            '168_0': {
                pool: {
                    setpoint: 19,      // v1.x offset
                    coolSetpoint: 20,
                    heatMode: 23
                },
                spa: {
                    setpoint: 21,
                    coolSetpoint: 22,
                    heatMode: 24
                },
                // v3.004+ offsets (all +1 due to extra byte)
                v3Pool: {
                    setpoint: 20,
                    coolSetpoint: 21,
                    heatMode: 24
                },
                v3Spa: {
                    setpoint: 22,
                    coolSetpoint: 23,
                    heatMode: 25
                },
                isAuthoritative: false,
                isWireless: true,
                note: 'Wireless command - v3.004+ has +1 offset!'
            }
        },
        
        /**
         * Heat mode value mappings
         */
        HEAT_MODES: {
            1: 'off',
            2: 'heater',
            3: 'solar',
            4: 'solarpref',
            5: 'ultratemp',
            6: 'ultratemppref',
            7: 'hybheat',
            8: 'hybheatpump',
            9: 'heatpump',
            10: 'hybdual',
            11: 'mtheater',
            25: 'heatpumppref'
        },
        
        /**
         * Extract entity state from a packet
         * 
         * @param {Object} msg - The message object
         * @param {string} entityType - 'features', 'circuits', 'temps', 'bodySettings'
         * @param {number|string} entityId - The entity ID (e.g., 129 for feature 129, 6 for circuit 6, 1 for temp sensor 1)
         * @param {Object} options - Optional: { isV3: boolean } for version-specific handling
         * @returns {Object|null} - Extraction result or null if not relevant
         */
        extractEntityState: function(msg, entityType, entityId, options) {
            if (entityType === 'features') {
                return this.extractFeatureState(msg, entityId);
            } else if (entityType === 'circuits') {
                return this.extractCircuitState(msg, entityId);
            } else if (entityType === 'temps') {
                return this.extractTempState(msg, entityId);
            } else if (entityType === 'bodySettings') {
                return this.extractBodySettingsState(msg, entityId, options);
            } else if (entityType === 'bodyState') {
                return this.extractBodyState(msg, entityId);
            } else if (entityType === 'heatModes') {
                return this.extractHeatModeState(msg, entityId, options);
            }
            // Other entity types not yet supported
            return null;
        },

        /**
         * Known Action 184 target IDs for body control
         */
        ACTION_184_TARGETS: {
            '168,237': { name: 'Body Toggle', stateByteIdx: 6, stateLabel: function(v) { return v === 1 ? 'ON' : 'OFF'; } },
            '212,182': { name: 'Body Context', stateByteIdx: 6, stateLabel: function(v) { return v === 255 ? 'OFF ctx' : 'ON ctx'; } },
            // Body Select: byte6=0 sent during Pool→Spa, byte6=1 sent during Spa→Pool
            '114,145': { name: 'Body Select', stateByteIdx: 6, stateLabel: function(v) { return v === 0 ? '→Spa' : '→Pool'; } },
            '94,131':  { name: 'Body Mode', stateByteIdx: 6, stateLabel: function(v) { return 'mode=' + v; } },
            '108,225': { name: 'Pool Circuit', stateByteIdx: 6, stateLabel: function(v) { return v === 1 ? 'ON' : 'OFF'; } }
        },
        
        /**
         * Extract body ON/OFF state (Pool/Spa) from packets.
         *
         * Entity IDs:
         *   - 1 = Pool body (typically circuit 6)
         *   - 2 = Spa body (typically circuit 1)
         *
         * Primary authoritative signal is Action 2 circuit bitfield (payload bytes 2-6).
         * We also accept Action 30/15 (authoritative) and Action 168/15 (outbound) via circuit offsets.
         * Action 184 packets show body control commands with target IDs.
         *
         * @param {Object} msg - The message object
         * @param {number} bodyId - 1=Pool, 2=Spa
         * @returns {Object|null}
         */
        extractBodyState: function(msg, bodyId) {
            // Only Pool/Spa supported
            if (bodyId !== 1 && bodyId !== 2) return null;
            
            var action = (typeof msg.action !== 'undefined' && msg.action !== null)
                ? msg.action
                : (typeof msgManager !== 'undefined' && msgManager.extractActionByte ? msgManager.extractActionByte(msg) : (msg.header && msg.header.length > 4 ? msg.header[4] : null));
            var payload = msg.payload;
            
            // Handle Action 184 (body control commands)
            if (action === 184 && payload && payload.length >= 7) {
                return this._extractAction184BodyState(msg, bodyId);
            }
            
            // Handle Action 1 (ACK for 184)
            if (action === 1 && payload && payload.length > 0 && payload[0] === 184) {
                return this._extractAction1AckState(msg, bodyId);
            }

            // Map body -> circuit id used for ON/OFF in Action 2
            // Spa is circuit 1, Pool is circuit 6 (common IntelliCenter mapping)
            var circuitId = (bodyId === 2) ? 1 : 6;

            // Reuse circuit extraction so offsets and bit formatting stay consistent
            var circ = this.extractCircuitState(msg, circuitId);
            if (!circ) return null;

            // Re-label output for body context
            var bodyName = bodyId === 1 ? 'Pool' : 'Spa';
            var flags = (circ.flags || []).slice();
            flags.push({ type: 'info', text: 'Body' });

            // Ensure bitDetails reads as body state, while still including circuit id in legend
            var stateLabel = bodyName + ' = ' + (circ.state ? 'ON' : 'OFF');
            var bitDetails = stateLabel + (circ.bitDetails ? ('<br/>' + circ.bitDetails) : '');

            return {
                state: circ.state,
                stateType: 'bodyState',
                bytes: circ.bytes,
                bitDetails: bitDetails,
                isAuthoritative: circ.isAuthoritative,
                flags: flags,
                byteOffset: circ.byteOffset,
                bitOffset: circ.bitOffset,
                rawByte: circ.rawByte
            };
        },
        
        /**
         * Extract body state from Action 184 packet
         * Payload: [channelId, seq, format, reserved, targetHi, targetLo, state, ...]
         */
        _extractAction184BodyState: function(msg, bodyId) {
            var payload = msg.payload;
            if (!payload || payload.length < 7) return null;
            
            var targetHi = payload[4];
            var targetLo = payload[5];
            var targetKey = targetHi + ',' + targetLo;
            var stateValue = payload[6];
            
            var targetInfo = this.ACTION_184_TARGETS[targetKey];
            var targetName = targetInfo ? targetInfo.name : 'Unknown';
            var stateLabel = targetInfo ? targetInfo.stateLabel(stateValue) : String(stateValue);
            
            // Determine if this is a command (request) vs actual state based on direction
            // Command: source is NOT OCP (16) and dest IS OCP (16) - e.g., WL→OCP, njsPC→OCP
            // Actual: source IS OCP (16) - e.g., OCP→Broadcast, OCP→WL
            var isCommand = this._isCommandPacket(msg);
            
            // Build relevant bytes - show target ID and state byte
            var relevantBytes = [
                { offset: 4, value: targetHi, isRelevant: true, label: 'tgtHi' },
                { offset: 5, value: targetLo, isRelevant: true, label: 'tgtLo' },
                { offset: 6, value: stateValue, isRelevant: true, label: 'state' }
            ];
            
            // Add bytes 7-9 if present (additional context data)
            if (payload.length > 7) {
                relevantBytes.push({ offset: 7, value: payload[7], isRelevant: false });
            }
            if (payload.length > 8) {
                relevantBytes.push({ offset: 8, value: payload[8], isRelevant: false });
            }
            if (payload.length > 9) {
                relevantBytes.push({ offset: 9, value: payload[9], isRelevant: false });
            }
            
            // Build bit details showing target and state
            var bitDetails = '<b>' + targetName + '</b> [' + targetHi + ',' + targetLo + ']<br/>' +
                             'State: <span class="bit-highlight">' + stateLabel + '</span> (byte6=' + stateValue + ')';
            
            // Determine ON/OFF state based on target type
            var isOn = null;
            if (targetKey === '168,237' || targetKey === '108,225') {
                // Toggle/circuit: byte6=1 means ON
                isOn = stateValue === 1;
            } else if (targetKey === '212,182') {
                // Context: 255 means OFF context
                isOn = stateValue !== 255;
            } else if (targetKey === '114,145') {
                // Body select: 0=switching TO Spa (Pool OFF), 1=switching TO Pool (Spa OFF)
                // For Pool (bodyId=1): ON when switching TO Pool (stateValue=1)
                // For Spa (bodyId=2): ON when switching TO Spa (stateValue=0)
                isOn = (bodyId === 1) ? (stateValue === 1) : (stateValue === 0);
            }
            
            return {
                state: isOn,
                stateType: 'bodyCommand',
                isCommand: isCommand,  // true = request/desired, false = actual/echo
                bytes: relevantBytes,
                bitDetails: bitDetails,
                isAuthoritative: false,
                flags: [{ type: 'info', text: '184 cmd' }],
                byteOffset: 4,
                bitOffset: null,
                rawByte: stateValue
            };
        },
        
        /**
         * Extract ACK info for Action 184
         */
        _extractAction1AckState: function(msg, bodyId) {
            var payload = msg.payload;
            var ackedAction = payload[0];
            
            return {
                state: null,
                stateType: 'ack',
                bytes: [{ offset: 0, value: ackedAction, isRelevant: true, label: 'acked' }],
                bitDetails: 'ACK for Action ' + ackedAction,
                isAuthoritative: false,
                flags: [{ type: 'success', text: 'ACK' }],
                byteOffset: 0,
                bitOffset: null,
                rawByte: ackedAction
            };
        },
        
        /**
         * Determine if a packet is a command (request) vs actual state broadcast
         * Command: source is NOT OCP (16) and dest IS OCP (16) - e.g., WL→OCP, njsPC→OCP
         * Actual: source IS OCP (16) - e.g., OCP→Broadcast, OCP→WL (ACK)
         */
        _isCommandPacket: function(msg) {
            // Extract source and dest from header
            // Header format: [165, proto, dest, src, action, ...]
            var header = msg.header;
            if (!header || header.length < 4) return false;
            
            var dest = header[2];
            var src = header[3];
            
            // OCP addresses: 0 (AquaLink) or 16 (IntelliCenter OCP)
            var isOcpDest = (dest === 0 || dest === 16);
            var isOcpSrc = (src === 0 || src === 16);
            
            // Command = going TO OCP from something else (WL, njsPC, SL, etc.)
            return isOcpDest && !isOcpSrc;
        },
        
        /**
         * Extract feature state from a packet
         * 
         * @param {Object} msg - The message object
         * @param {number} featureId - Feature ID (129-160)
         * @returns {Object|null} - { state, bytes, bitDetails, isAuthoritative, flags }
         */
        extractFeatureState: function(msg, featureId) {
            // Support both EntityFlow-derived messages and Message List messages
            var action = (typeof msg.action !== 'undefined' && msg.action !== null)
                ? msg.action
                : (typeof msgManager !== 'undefined' && msgManager.extractActionByte ? msgManager.extractActionByte(msg) : (msg.header && msg.header.length > 4 ? msg.header[4] : null));
            var payload = msg.payload;
            
            if (!payload || payload.length === 0) return null;
            
            // Determine which offset configuration to use
            var offsetKey = null;
            var offsets = null;
            
            if (action === 2) {
                // Action 2: v3.004+ feature state in byte 7 upper nibble (features 129-132 only)
                return this._extractAction2FeatureState(msg, featureId);
            } else if (action === 204) {
                offsetKey = '204';
                offsets = this.FEATURE_OFFSETS['204'];
            } else if (action === 30 && payload[0] === 15) {
                offsetKey = '30_15';
                offsets = this.FEATURE_OFFSETS['30_15'];
            } else if (action === 168 && payload[0] === 15) {
                offsetKey = '168_15';
                offsets = this.FEATURE_OFFSETS['168_15'];
            } else if (action === 168 && payload[0] === 2) {
                // Single feature change
                return this._extractSingleFeatureState(msg, featureId);
            } else {
                // Not a relevant packet type
                return null;
            }
            
            if (!offsets) return null;
            
            // Calculate byte and bit position for this feature
            // Feature 129 = byte 0, bit 0
            // Feature 130 = byte 0, bit 1
            // Feature 137 = byte 1, bit 0
            var featureOffset = featureId - 129;  // 0-based feature index
            var byteIndex = Math.floor(featureOffset / 8);
            var bitIndex = featureOffset % 8;
            
            var payloadByteIndex = offsets.featureStart + byteIndex;
            
            // Check if payload is long enough
            if (payloadByteIndex >= payload.length) {
                return null;
            }
            
            var featureByte = payload[payloadByteIndex];
            var isOn = (featureByte & (1 << bitIndex)) !== 0;
            
            // Build relevant bytes array (show the specific byte and surrounding context)
            var relevantBytes = [];
            for (var i = 0; i < offsets.featureLength && (offsets.featureStart + i) < payload.length; i++) {
                relevantBytes.push({
                    offset: offsets.featureStart + i,
                    value: payload[offsets.featureStart + i],
                    isRelevant: (i === byteIndex)
                });
            }
            
            // Build bit details string
            var bitDetails = this._formatBitDetails(featureByte, bitIndex, featureId);
            
            // Build flags
            // Note: isV3 should be passed in from the widget based on poolConfig/poolState
            var flags = [];
            if (offsets.isAuthoritative) {
                flags.push({ type: 'success', text: '✓ authoritative' });
            }
            // v3-stale flag is added by the widget, not here, since we don't have version info
            
            return {
                state: isOn,
                bytes: relevantBytes,
                bitDetails: bitDetails,
                isAuthoritative: offsets.isAuthoritative,
                flags: flags,
                byteOffset: payloadByteIndex,
                bitOffset: bitIndex,
                rawByte: featureByte
            };
        },
        
        /**
         * Extract circuit state from a packet
         * 
         * @param {Object} msg - The message object
         * @param {number} circuitId - Circuit ID (1-40)
         * @returns {Object|null} - { state, bytes, bitDetails, isAuthoritative, flags }
         */
        extractCircuitState: function(msg, circuitId) {
            // Support both EntityFlow-derived messages and Message List messages
            var action = (typeof msg.action !== 'undefined' && msg.action !== null)
                ? msg.action
                : (typeof msgManager !== 'undefined' && msgManager.extractActionByte ? msgManager.extractActionByte(msg) : (msg.header && msg.header.length > 4 ? msg.header[4] : null));
            var payload = msg.payload;
            
            if (!payload || payload.length === 0) return null;
            
            // Circuits are 1-40
            if (circuitId < 1 || circuitId > 40) return null;
            
            // Determine which offset configuration to use
            var offsets = null;
            
            if (action === 2) {
                offsets = this.CIRCUIT_OFFSETS['2'];
            } else if (action === 30 && payload[0] === 15) {
                offsets = this.CIRCUIT_OFFSETS['30_15'];
            } else if (action === 168 && payload[0] === 15) {
                offsets = this.CIRCUIT_OFFSETS['168_15'];
            } else if (action === 168 && payload[0] === 1) {
                // Single circuit change
                return this._extractSingleCircuitState(msg, circuitId);
            } else {
                // Not a relevant packet type for circuits
                return null;
            }
            
            if (!offsets) return null;
            
            // Calculate byte and bit position for this circuit
            // Circuit 1 = byte 0, bit 0 (at circuitStart offset)
            // Circuit 2 = byte 0, bit 1
            // Circuit 8 = byte 0, bit 7
            // Circuit 9 = byte 1, bit 0
            var circuitOffset = circuitId - 1;  // 0-based circuit index
            var byteIndex = Math.floor(circuitOffset / 8);
            var bitIndex = circuitOffset % 8;
            
            var payloadByteIndex = offsets.circuitStart + byteIndex;
            
            // Check if payload is long enough
            if (payloadByteIndex >= payload.length) {
                return null;
            }
            
            var circuitByte = payload[payloadByteIndex];
            var isOn = (circuitByte & (1 << bitIndex)) !== 0;
            
            // Build relevant bytes array (show the specific byte and surrounding context)
            var relevantBytes = [];
            for (var i = 0; i < offsets.circuitLength && (offsets.circuitStart + i) < payload.length; i++) {
                relevantBytes.push({
                    offset: offsets.circuitStart + i,
                    value: payload[offsets.circuitStart + i],
                    isRelevant: (i === byteIndex)
                });
            }
            
            // Build bit details string
            var bitDetails = this._formatCircuitBitDetails(circuitByte, bitIndex, circuitId);
            
            // Build flags
            var flags = [];
            if (offsets.isAuthoritative) {
                flags.push({ type: 'success', text: '✓ authoritative' });
            }
            
            return {
                state: isOn,
                bytes: relevantBytes,
                bitDetails: bitDetails,
                isAuthoritative: offsets.isAuthoritative,
                flags: flags,
                byteOffset: payloadByteIndex,
                bitOffset: bitIndex,
                rawByte: circuitByte
            };
        },
        
        /**
         * Extract state from single circuit change packet (Action 168 case 1)
         */
        _extractSingleCircuitState: function(msg, circuitId) {
            var payload = msg.payload;
            
            // Action 168 case 1: [1, ?, ?, circuitId, state, ...]
            if (payload.length < 5) return null;
            
            var packetCircuitId = payload[3];
            var packetState = payload[4];
            
            // Only relevant if this packet is for our circuit
            if (packetCircuitId !== circuitId) return null;
            
            var isOn = packetState !== 0;
            
            return {
                state: isOn,
                bytes: [
                    { offset: 3, value: packetCircuitId, isRelevant: true },
                    { offset: 4, value: packetState, isRelevant: true }
                ],
                bitDetails: 'Circuit ' + circuitId + ' = ' + (isOn ? 'ON' : 'OFF'),
                isAuthoritative: false,
                flags: [{ type: 'info', text: 'Single toggle' }],
                byteOffset: 3,
                bitOffset: null,
                rawByte: packetState
            };
        },
        
        /**
         * Format bit details for circuit display
         */
        _formatCircuitBitDetails: function(byteValue, relevantBit, circuitId) {
            var bits = [];
            for (var i = 7; i >= 0; i--) {
                var isSet = (byteValue & (1 << i)) !== 0;
                var bitStr = isSet ? '1' : '0';
                if (i === relevantBit) {
                    bitStr = '<span class="bit-highlight">' + bitStr + '</span>';
                }
                bits.push(bitStr);
            }
            
            var binary = bits.join('');
            return binary + ' <span class="bit-legend">(bit' + relevantBit + '=C' + circuitId + ')</span>';
        },
        
        /**
         * Extract temperature sensor reading from a packet
         * 
         * @param {Object} msg - The message object
         * @param {number} sensorId - Sensor ID (1=Water1/Pool, 2=Water2/Spa, 3=Air, 4=Solar1, etc.)
         * @returns {Object|null} - { state (temp value), bytes, bitDetails }
         */
        extractTempState: function(msg, sensorId) {
            var action = (typeof msg.action !== 'undefined' && msg.action !== null)
                ? msg.action
                : (typeof msgManager !== 'undefined' && msgManager.extractActionByte ? msgManager.extractActionByte(msg) : (msg.header && msg.header.length > 4 ? msg.header[4] : null));
            var payload = msg.payload;
            
            if (!payload || payload.length === 0) return null;
            
            var offsets = null;
            if (action === 2) {
                offsets = this.TEMP_OFFSETS['2'];
            } else if (action === 204) {
                offsets = this.TEMP_OFFSETS['204'];
            } else {
                return null;
            }
            
            if (!offsets || !offsets.sensors || !offsets.sensors[sensorId]) {
                return null;
            }
            
            var sensorConfig = offsets.sensors[sensorId];
            var byteOffset = sensorConfig.byte;
            
            if (byteOffset >= payload.length) {
                return null;
            }
            
            var tempValue = payload[byteOffset];
            
            // Build relevant bytes (just the temp byte)
            var relevantBytes = [{
                offset: byteOffset,
                value: tempValue,
                isRelevant: true
            }];
            
            // For temps, "state" is the temperature value (not ON/OFF)
            // bitDetails shows the sensor name and reading
            var bitDetails = sensorConfig.name + ': ' + tempValue + '°';
            
            return {
                state: tempValue,  // Temperature value, not boolean
                stateType: 'temperature',  // Indicate this is a temp reading
                bytes: relevantBytes,
                bitDetails: bitDetails,
                isAuthoritative: offsets.isAuthoritative,
                flags: [],
                byteOffset: byteOffset,
                bitOffset: null,
                rawByte: tempValue
            };
        },
        
        /**
         * Extract body settings (setpoint, coolSetpoint, heatMode) from a packet
         * 
         * @param {Object} msg - The message object
         * @param {number} bodyId - Body ID (1=Pool, 2=Spa)
         * @param {Object} options - { isV3: boolean } for version-specific offset handling
         * @returns {Object|null} - { state (setpoint), bytes, bitDetails }
         */
        extractBodySettingsState: function(msg, bodyId, options) {
            var action = (typeof msg.action !== 'undefined' && msg.action !== null)
                ? msg.action
                : (typeof msgManager !== 'undefined' && msgManager.extractActionByte ? msgManager.extractActionByte(msg) : (msg.header && msg.header.length > 4 ? msg.header[4] : null));
            var payload = msg.payload;
            
            if (!payload || payload.length === 0) return null;
            
            // Only bodies 1 (Pool) and 2 (Spa) supported
            if (bodyId !== 1 && bodyId !== 2) return null;
            
            var offsets = null;
            var isWireless = false;
            
            if (action === 30 && payload[0] === 0) {
                offsets = this.BODY_SETTINGS_OFFSETS['30_0'];
            } else if (action === 168 && payload[0] === 0) {
                offsets = this.BODY_SETTINGS_OFFSETS['168_0'];
                isWireless = true;
            } else if (action === 222 && payload[0] === 0) {
                // Config request - no settings data, just a request packet
                var bodyName = bodyId === 1 ? 'Pool' : 'Spa';
                return {
                    state: null,
                    stateType: 'request',
                    bytes: [{ offset: 0, value: payload[0], isRelevant: true, label: 'type' }],
                    bitDetails: 'Request ' + bodyName + ' temp settings (222/0)',
                    isAuthoritative: false,
                    isCommand: true,
                    flags: [{ type: 'info', text: 'REQ' }],
                    byteOffset: 0,
                    bitOffset: null,
                    rawByte: payload[0]
                };
            } else if (action === 1) {
                // ACK packet
                var ackedAction = payload[0];
                if (ackedAction !== 168) return null;
                var bodyName = bodyId === 1 ? 'Pool' : 'Spa';
                return {
                    state: null,
                    stateType: 'ack',
                    bytes: [{ offset: 0, value: ackedAction, isRelevant: true, label: 'acked' }],
                    bitDetails: 'ACK for ' + bodyName + ' settings change',
                    isAuthoritative: false,
                    flags: [{ type: 'success', text: 'ACK' }],
                    byteOffset: 0,
                    bitOffset: null,
                    rawByte: ackedAction
                };
            } else {
                return null;
            }
            
            if (!offsets) return null;
            
            // Get body-specific offsets, accounting for v3 offset difference
            var isV3 = options && options.isV3;
            var bodyKey = bodyId === 1 ? 'pool' : 'spa';
            var bodyOffsets;
            
            if (isWireless && isV3) {
                // v3.004+ Wireless has +1 offset
                bodyOffsets = bodyId === 1 ? offsets.v3Pool : offsets.v3Spa;
            } else {
                bodyOffsets = offsets[bodyKey];
            }
            
            if (!bodyOffsets) return null;
            
            // Check payload length
            var maxOffset = Math.max(bodyOffsets.setpoint, bodyOffsets.coolSetpoint, bodyOffsets.heatMode);
            if (maxOffset >= payload.length) {
                return null;
            }
            
            var setpoint = payload[bodyOffsets.setpoint];
            var coolSetpoint = payload[bodyOffsets.coolSetpoint];
            var heatModeValue = payload[bodyOffsets.heatMode];
            var heatModeName = this.HEAT_MODES[heatModeValue] || ('unknown(' + heatModeValue + ')');
            
            // Build relevant bytes
            var relevantBytes = [
                { offset: bodyOffsets.setpoint, value: setpoint, isRelevant: true, label: 'setpt' },
                { offset: bodyOffsets.coolSetpoint, value: coolSetpoint, isRelevant: true, label: 'cool' },
                { offset: bodyOffsets.heatMode, value: heatModeValue, isRelevant: true, label: 'mode' }
            ];
            
            // Build bit details
            var bodyName = bodyId === 1 ? 'Pool' : 'Spa';
            var bitDetails = bodyName + ': ' + setpoint + '°/' + coolSetpoint + '° ' + heatModeName;
            
            // Build flags
            var flags = [];
            if (isWireless) {
                flags.push({ type: 'info', text: 'Wireless' });
                if (isV3) {
                    flags.push({ type: 'warning', text: 'v3 offset' });
                }
            }
            if (offsets.isAuthoritative) {
                flags.push({ type: 'success', text: '✓ OCP' });
            }
            
            return {
                state: setpoint,  // Primary state is setpoint
                stateType: 'bodySettings',
                setpoint: setpoint,
                coolSetpoint: coolSetpoint,
                heatMode: heatModeValue,
                heatModeName: heatModeName,
                bytes: relevantBytes,
                bitDetails: bitDetails,
                isAuthoritative: offsets.isAuthoritative,
                flags: flags,
                byteOffset: bodyOffsets.setpoint,
                bitOffset: null,
                rawByte: setpoint
            };
        },
        
        /**
         * Extract heat mode from a packet (focused view for tracking mode changes)
         * 
         * @param {Object} msg - The message object
         * @param {number} bodyId - Body ID (1=Pool, 2=Spa)
         * @param {Object} options - { isV3: boolean } for version-specific offset handling
         * @returns {Object|null} - { state (heatMode value), heatModeName, bytes, bitDetails }
         */
        extractHeatModeState: function(msg, bodyId, options) {
            var action = (typeof msg.action !== 'undefined' && msg.action !== null)
                ? msg.action
                : (typeof msgManager !== 'undefined' && msgManager.extractActionByte ? msgManager.extractActionByte(msg) : (msg.header && msg.header.length > 4 ? msg.header[4] : null));
            var payload = msg.payload;
            
            if (!payload || payload.length === 0) return null;
            
            // Only bodies 1 (Pool) and 2 (Spa) supported
            if (bodyId !== 1 && bodyId !== 2) return null;
            
            var offsets = null;
            var isWireless = false;
            
            if (action === 30 && payload[0] === 0) {
                offsets = this.BODY_SETTINGS_OFFSETS['30_0'];
            } else if (action === 168 && payload[0] === 0) {
                offsets = this.BODY_SETTINGS_OFFSETS['168_0'];
                isWireless = true;
            } else if (action === 222 && payload[0] === 0) {
                // Config request - no heat mode data, just a request packet
                return this._extractHeatModeRequest(msg, bodyId);
            } else if (action === 1) {
                // ACK packet - show it's acknowledging a heat mode change
                return this._extractHeatModeAck(msg, bodyId);
            } else {
                return null;
            }
            
            if (!offsets) return null;
            
            // Get body-specific offsets, accounting for v3 offset difference
            var isV3 = options && options.isV3;
            var bodyKey = bodyId === 1 ? 'pool' : 'spa';
            var bodyOffsets;
            
            if (isWireless && isV3) {
                // v3.004+ Wireless has +1 offset
                bodyOffsets = bodyId === 1 ? offsets.v3Pool : offsets.v3Spa;
            } else {
                bodyOffsets = offsets[bodyKey];
            }
            
            if (!bodyOffsets) return null;
            
            // Check payload length - only need heatMode byte
            if (bodyOffsets.heatMode >= payload.length) {
                return null;
            }
            
            var heatModeValue = payload[bodyOffsets.heatMode];
            var heatModeName = this.HEAT_MODES[heatModeValue] || ('unknown(' + heatModeValue + ')');
            
            // Also grab setpoint for context display
            var setpoint = bodyOffsets.setpoint < payload.length ? payload[bodyOffsets.setpoint] : null;
            
            // Build relevant bytes - focus on heatMode, include setpoint for context
            var relevantBytes = [
                { offset: bodyOffsets.heatMode, value: heatModeValue, isRelevant: true, label: 'mode' }
            ];
            if (setpoint !== null) {
                relevantBytes.unshift({ offset: bodyOffsets.setpoint, value: setpoint, isRelevant: false, label: 'setpt' });
            }
            
            // Build bit details - focused on heat mode
            var bodyName = bodyId === 1 ? 'Pool' : 'Spa';
            var bitDetails = '<b>' + bodyName + ' Heat Mode</b>: <span class="state-value">' + heatModeName + '</span> (' + heatModeValue + ')';
            if (setpoint !== null) {
                bitDetails += '<br/>Setpoint: ' + setpoint + '°';
            }
            
            // Determine if this is a command vs config response
            var isCommand = this._isCommandPacket(msg);
            
            // Build flags
            var flags = [];
            if (isWireless) {
                flags.push({ type: 'info', text: 'Wireless' });
                if (isV3) {
                    flags.push({ type: 'warning', text: 'v3 offset' });
                }
            }
            if (offsets.isAuthoritative) {
                flags.push({ type: 'success', text: '✓ OCP' });
            }
            if (isCommand) {
                flags.push({ type: 'info', text: 'cmd' });
            }
            
            return {
                state: heatModeValue,  // Primary state is heat mode value
                stateType: 'heatMode',
                heatMode: heatModeValue,
                heatModeName: heatModeName,
                setpoint: setpoint,
                isCommand: isCommand,
                bytes: relevantBytes,
                bitDetails: bitDetails,
                isAuthoritative: offsets.isAuthoritative,
                flags: flags,
                byteOffset: bodyOffsets.heatMode,
                bitOffset: null,
                rawByte: heatModeValue
            };
        },
        
        /**
         * Extract ACK info for heat mode change (Action 1 acknowledging 168/0)
         */
        _extractHeatModeAck: function(msg, bodyId) {
            var payload = msg.payload;
            if (!payload || payload.length === 0) return null;
            
            var ackedAction = payload[0];
            
            // Only relevant if ACKing action 168 (temp settings)
            if (ackedAction !== 168) return null;
            
            var bodyName = bodyId === 1 ? 'Pool' : 'Spa';
            
            return {
                state: null,
                stateType: 'ack',
                bytes: [{ offset: 0, value: ackedAction, isRelevant: true, label: 'acked' }],
                bitDetails: 'ACK for ' + bodyName + ' settings change',
                isAuthoritative: false,
                flags: [{ type: 'success', text: 'ACK' }],
                byteOffset: 0,
                bitOffset: null,
                rawByte: ackedAction
            };
        },
        
        /**
         * Extract info for heat mode config request (Action 222/0)
         */
        _extractHeatModeRequest: function(msg, bodyId) {
            var payload = msg.payload;
            var bodyName = bodyId === 1 ? 'Pool' : 'Spa';
            
            return {
                state: null,
                stateType: 'request',
                bytes: [{ offset: 0, value: payload[0], isRelevant: true, label: 'type' }],
                bitDetails: 'Request ' + bodyName + ' temp settings (222/0)',
                isAuthoritative: false,
                isCommand: true,
                flags: [{ type: 'info', text: 'REQ' }],
                byteOffset: 0,
                bitOffset: null,
                rawByte: payload[0]
            };
        },
        
        /**
         * Extract feature state from Action 2 (Status Broadcast)
         * Byte 7 = Features 1-8 (IDs 129-136), all 8 bits
         * Byte 8 = Features 9-16 (IDs 137-144), all 8 bits
         */
        _extractAction2FeatureState: function(msg, featureId) {
            var payload = msg.payload;
            var offsets = this.FEATURE_OFFSETS['2'];
            
            // Features 129-144 are in Action 2 (bytes 7-8)
            if (featureId < 129 || featureId > 144) {
                return null;
            }
            
            // Calculate byte and bit position
            // Feature 129 = byte 7, bit 0
            // Feature 136 = byte 7, bit 7
            // Feature 137 = byte 8, bit 0
            // Feature 144 = byte 8, bit 7
            var featureOffset = featureId - 129;  // 0-based feature index (0-15)
            var byteIndex = Math.floor(featureOffset / 8);  // 0 or 1
            var bitIndex = featureOffset % 8;  // 0-7
            
            var payloadByteIndex = offsets.featureStart + byteIndex;  // 7 or 8
            
            // Check payload length
            if (payloadByteIndex >= payload.length) {
                return null;
            }
            
            var featureByte = payload[payloadByteIndex];
            var isOn = (featureByte & (1 << bitIndex)) !== 0;
            
            // Build relevant bytes display (show both bytes 7 and 8 for context)
            var relevantBytes = [];
            for (var i = 0; i < offsets.featureLength && (offsets.featureStart + i) < payload.length; i++) {
                relevantBytes.push({
                    offset: offsets.featureStart + i,
                    value: payload[offsets.featureStart + i],
                    isRelevant: (i === byteIndex)
                });
            }
            
            // Format bit details
            var bitDetails = this._formatBitDetails(featureByte, bitIndex, featureId);
            
            // Determine flag based on feature range
            var flagText = featureId <= 136 ? 'byte7' : 'byte8';
            
            return {
                state: isOn,
                bytes: relevantBytes,
                bitDetails: bitDetails,
                isAuthoritative: false,
                flags: [{ type: 'info', text: flagText }],
                byteOffset: payloadByteIndex,
                bitOffset: bitIndex,
                rawByte: featureByte
            };
        },
        
        /**
         * Extract state from single feature change packet (Action 168 case 2)
         */
        _extractSingleFeatureState: function(msg, featureId) {
            var payload = msg.payload;
            
            // Action 168 case 2: [2, ?, ?, featureId, state, ...]
            if (payload.length < 5) return null;
            
            var packetFeatureId = payload[3];
            var packetState = payload[4];
            
            // Only relevant if this packet is for our feature
            if (packetFeatureId !== featureId) return null;
            
            var isOn = packetState !== 0;
            
            return {
                state: isOn,
                bytes: [
                    { offset: 3, value: packetFeatureId, isRelevant: true },
                    { offset: 4, value: packetState, isRelevant: true }
                ],
                bitDetails: 'Feature ' + featureId + ' = ' + (isOn ? 'ON' : 'OFF'),
                isAuthoritative: false,
                flags: [{ type: 'info', text: 'Single toggle' }],
                byteOffset: 3,
                bitOffset: null,
                rawByte: packetState
            };
        },
        
        /**
         * Format bit details for display
         */
        _formatBitDetails: function(byteValue, relevantBit, featureId) {
            var bits = [];
            for (var i = 7; i >= 0; i--) {
                var isSet = (byteValue & (1 << i)) !== 0;
                var bitStr = isSet ? '1' : '0';
                if (i === relevantBit) {
                    bitStr = '<span class="bit-highlight">' + bitStr + '</span>';
                }
                bits.push(bitStr);
            }
            
            var binary = bits.join('');
            var baseFeature = featureId - (featureId - 129) % 8 + 129 - 1; // First feature in this byte
            
            return binary + ' <span class="bit-legend">(bit' + relevantBit + '=F' + featureId + ')</span>';
        },
        
        /**
         * Get all features that are ON in a given byte range
         */
        extractAllFeatureStates: function(payload, startOffset, length) {
            var features = [];
            
            for (var byteIdx = 0; byteIdx < length; byteIdx++) {
                var payloadIdx = startOffset + byteIdx;
                if (payloadIdx >= payload.length) break;
                
                var byteVal = payload[payloadIdx];
                for (var bit = 0; bit < 8; bit++) {
                    if (byteVal & (1 << bit)) {
                        var featureId = 129 + (byteIdx * 8) + bit;
                        features.push(featureId);
                    }
                }
            }
            
            return features;
        },
        
        /**
         * Compare two packets and identify which features changed
         */
        compareFeatureStates: function(payload1, payload2, startOffset, length) {
            var changes = [];
            
            for (var byteIdx = 0; byteIdx < length; byteIdx++) {
                var idx = startOffset + byteIdx;
                if (idx >= payload1.length || idx >= payload2.length) break;
                
                var byte1 = payload1[idx];
                var byte2 = payload2[idx];
                
                if (byte1 !== byte2) {
                    var diff = byte1 ^ byte2;  // XOR to find changed bits
                    for (var bit = 0; bit < 8; bit++) {
                        if (diff & (1 << bit)) {
                            var featureId = 129 + (byteIdx * 8) + bit;
                            var wasOn = (byte1 & (1 << bit)) !== 0;
                            var isOn = (byte2 & (1 << bit)) !== 0;
                            changes.push({
                                featureId: featureId,
                                from: wasOn,
                                to: isOn
                            });
                        }
                    }
                }
            }
            
            return changes;
        }
    };
    
    // Export to window
    window.IntelliCenterEntityMapper = IntelliCenterEntityMapper;
    
})(window);

