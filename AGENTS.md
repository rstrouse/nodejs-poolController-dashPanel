# Agent Guidelines for nodejs-poolcontroller-dashpanel

This document provides guidance for AI agents working on this codebase.

## Project Overview

This is the **dashboard/web UI** for nodejs-poolController, providing:
- Message Manager for protocol analysis and debugging
- Entity Flow Analyzer for entity-centric packet analysis
- Real-time pool equipment monitoring interface

## Key Documentation

### Protocol & Entity Flow Analysis

When working with **Message Manager**, **Entity Flow**, **packet parsing**, or **protocol analysis**:

**ALWAYS READ FIRST**:
- `.plan/ENTITY_FLOW_ANALYZER.md` - Complete guide to entity types, byte offsets, and extraction logic

This document contains:
- Packet → Entity mapping tables with exact byte offsets
- Circuit/Feature/Body state extraction logic
- Flow Timeline (flame graph) span types
- Step-by-step guide for adding new entity types
- Common bugs and fixes (e.g., Action 2 circuit offset is 2, not 3)

### Message Documentation

When working with **packet structures** or **protocol messages**:
- `server/messages/docs/messageDoc.json` - Detailed packet documentation
- `server/messages/docs/entityFlow.json` - Entity type definitions and matchers
- `server/messages/docs/constants.json` - Device address names and constants

### Key Source Files

| Area | Files |
|------|-------|
| Entity Flow Widget | `scripts/messages/entityFlow/entityFlow.widget.js` |
| Entity Extraction | `scripts/messages/entityFlow/intellicenterMappings.js` |
| Entity Flow Styles | `scripts/messages/entityFlow/entityFlow.css` |
| Message List Widget | `scripts/messages/messageList/messageList.widget.js` |
| Main Page | `pages/messageManager.html` |

## Critical Implementation Notes

### IntelliCenter Circuit Offsets

**Action 2 (Status Broadcast)** payload layout:
```
[0] = hours
[1] = minutes  
[2] = circuits 1-8   ← Spa = bit 0, Pool = bit 5
[3] = circuits 9-16
[4] = circuits 17-24
[5] = circuits 25-32
[6] = circuits 33-40
[7] = circuit groups (lower) + features 129-132 (upper nibble)
...
```

**Action 30/15 and 168/15** have circuits starting at byte 3 (different from Action 2).

### Body State Extraction

Body ON/OFF state is derived from circuit state:
- **Spa** = Circuit 1 (bodyId=2 maps to circuitId=1)
- **Pool** = Circuit 6 (bodyId=1 maps to circuitId=6)

### State Display: Command vs Actual

- `→ON` / `→OFF` = **Command** (request, WL→OCP or outbound)
- `ON` / `OFF` = **Actual** state (Action 2 broadcast, OCP→Broadcast)

### Action 184 Body Control (v3.004+)

Payload layout: `[channelId, seq, format, reserved, targetHi, targetLo, data0, data1, data2, data3]`

| Target ID | Name | Byte 6 Meaning |
|-----------|------|----------------|
| `168,237` | Body Toggle | 0=OFF, 1=ON |
| `212,182` | Body Context | Pre-toggle context |
| `114,145` | Body Select | 0=Pool, 1=Spa |

### Flow Timeline Spans

The flame graph detects these span types:
- **Config sweep** - Extended 222→30 sessions
- **Config item** - Individual 222→30 pairs
- **Set circuit** - 168/184 → ACK → state readback
- **Body ctrl** - Action 184 with body target IDs (168,237 / 212,182 / 114,145 / 94,131 / 108,225)

## Related Projects

- `nodejs-poolController` - The main pool controller server (protocol handling, equipment control)
- Protocol documentation: `/Users/rgoldin/Programming/nodejs-poolController/.plan/` directory

## Testing Changes

After modifying entity extraction or flow timeline logic:
1. Load a replay ZIP with packet logs
2. Select the relevant entity type
3. Verify state extraction matches expected values
4. Check that byte offsets shown in "Relevant Bytes" column are correct
5. Test Flow Timeline spans appear for the expected packet sequences

