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
            // Action 2 (Status Broadcast) - v3.004+ ONLY
            // Byte 7 upper nibble (bits 4-7) contains features 129-132
            '2': {
                featureByte: 7,
                featureBitShift: 4,  // Upper nibble
                featureLength: 1,    // Only 4 bits = 4 features (129-132)
                maxFeatures: 4,      // Only features 129-132
                isAuthoritative: false,
                isV3Only: true,
                note: 'v3.004+ byte 7 upper nibble = features 129-132'
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
            '2': {
                circuitStart: 3,
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
            }
            // Other entity types not yet supported
            return null;
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
         * Extract feature state from Action 2 (Status Broadcast)
         * v3.004+: Byte 7 upper nibble (bits 4-7) contains features 129-132
         */
        _extractAction2FeatureState: function(msg, featureId) {
            var payload = msg.payload;
            
            // Only features 129-132 are in Action 2
            if (featureId < 129 || featureId > 132) {
                return null;
            }
            
            // Check payload length (need at least byte 7)
            if (payload.length < 8) {
                return null;
            }
            
            var byte7 = payload[7];
            // Extract upper nibble (bits 4-7) and shift to bits 0-3
            var featureStateByte = (byte7 >> 4) & 0x0F;
            
            // Feature 129 = bit 0, Feature 130 = bit 1, etc.
            var bitIndex = featureId - 129;  // 0-3
            var isOn = (featureStateByte & (1 << bitIndex)) !== 0;
            
            // Build relevant bytes display (show byte 7)
            var relevantBytes = [{
                offset: 7,
                value: byte7,
                isRelevant: true
            }];
            
            // Format bit details - show the upper nibble only
            var bits = [];
            for (var i = 3; i >= 0; i--) {
                var isSet = (featureStateByte & (1 << i)) !== 0;
                var bitStr = isSet ? '1' : '0';
                if (i === bitIndex) {
                    bitStr = '<span class="bit-highlight">' + bitStr + '</span>';
                }
                bits.push(bitStr);
            }
            var bitDetails = bits.join('') + ' <span class="bit-legend">(byte7[7:4] bit' + bitIndex + '=F' + featureId + ')</span>';
            
            return {
                state: isOn,
                bytes: relevantBytes,
                bitDetails: bitDetails,
                isAuthoritative: false,
                flags: [{ type: 'info', text: 'v3 byte7' }],
                byteOffset: 7,
                bitOffset: bitIndex + 4,  // Actual bit position in byte 7
                rawByte: byte7
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

