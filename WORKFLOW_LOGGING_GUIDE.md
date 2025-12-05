# Workflow & Agent Logging Guide

## Overview
Ab sab tools mein detailed console logs add kiye gaye hain jo workflow aur agent execution ko track karte hain.

## Log Format

### Vehicle Workflow Logs

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚗 [VEHICLE WORKFLOW] Starting execution
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 Input Query: "I need an SUV for my family"

📊 [STEP 1] Analyzing requirements and extracting data...
✅ [STEP 1] Data extraction complete:
   - Vehicle Type: SUV
   - Use Case: Family transportation
   - Budget: Not specified
   - Preferences: I need an SUV for my family

🤖 [STEP 2] Calling vehicleAgent with structured prompt...
📝 [STEP 2] Prompt prepared, calling agent.generate()...
✅ [STEP 2] Agent response received
   Response length: 450 characters
   Preview: Based on your requirements for a family SUV, I recommend...

📦 [STEP 3] Formatting result...
✅ [VEHICLE WORKFLOW] Execution complete
📤 Output: {"vehicles":[...],"recommendation":"..."}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Booking Workflow Logs

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 [BOOKING WORKFLOW] Starting execution
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 Input Query: "Book a hotel for four members in New York"

📊 [STEP 1] Parsing booking request and extracting data...
✅ [STEP 1] Data extraction complete:
   - Booking Type: Hotel
   - Location: New York
   - Date: Not specified
   - Guests: 4

🤖 [STEP 2] Calling bookingAgent with structured prompt...
📝 [STEP 2] Prompt prepared, calling agent.generate()...
✅ [STEP 2] Agent response received
   Response length: 520 characters
   Preview: Based on your booking request for a hotel in New York...

📦 [STEP 3] Formatting result...
✅ [BOOKING WORKFLOW] Execution complete
📤 Output: {"options":[...],"recommendation":"..."}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Direct Agent Call Logs

#### Vehicle Agent
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚗 [DIRECT VEHICLE AGENT] Calling vehicleAgent directly
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 Input Query: "What's the price of Honda Civic?"
🤖 Getting vehicleAgent from Mastra instance...
📝 Calling agent.generate()...
✅ Agent response received
   Response length: 320 characters
   Preview: The Honda Civic typically ranges from...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Booking Agent
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 [DIRECT BOOKING AGENT] Calling bookingAgent directly
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 Input Query: "Restaurant recommendations"
🤖 Getting bookingAgent from Mastra instance...
📝 Calling agent.generate()...
✅ Agent response received
   Response length: 380 characters
   Preview: Here are some excellent restaurant recommendations...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Error Logs

```
❌ [VEHICLE WORKFLOW] Execution failed
   Error: Vehicle agent not found
   Stack: Error: Vehicle agent not found
       at executeVehicleWorkflowTool...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## What to Check in Logs

### ✅ Success Indicators

1. **Workflow Start**: `[VEHICLE WORKFLOW] Starting execution` ya `[BOOKING WORKFLOW] Starting execution`
2. **Data Extraction**: `[STEP 1] Data extraction complete` with extracted values
3. **Agent Call**: `[STEP 2] Calling ...Agent with structured prompt...`
4. **Agent Response**: `[STEP 2] Agent response received` with response length
5. **Completion**: `[WORKFLOW] Execution complete` with output preview

### ❌ Error Indicators

1. **Agent Not Found**: `Error: Vehicle agent not found` ya `Error: Booking agent not found`
2. **Mastra Not Initialized**: `Error: Mastra instance not initialized`
3. **Query Missing**: `Error: Query parameter is required`
4. **Execution Failed**: `[WORKFLOW] Execution failed` with error details

## How to Verify

### 1. Workflow Execution Verification

**Check:**
- ✅ Workflow start log appears
- ✅ Step 1 extracts correct data (vehicle type, location, guests, etc.)
- ✅ Step 2 calls agent with structured prompt
- ✅ Agent response is received
- ✅ Final result is formatted correctly

**Example Query:** "I need an SUV for my family"
**Expected Logs:**
```
🚗 [VEHICLE WORKFLOW] Starting execution
📥 Input Query: "I need an SUV for my family"
📊 [STEP 1] Analyzing requirements...
✅ [STEP 1] Data extraction complete:
   - Vehicle Type: SUV
   - Use Case: Family transportation
🤖 [STEP 2] Calling vehicleAgent...
✅ [STEP 2] Agent response received
✅ [VEHICLE WORKFLOW] Execution complete
```

### 2. Agent Call Verification

**Check:**
- ✅ Agent is retrieved from Mastra instance
- ✅ `agent.generate()` is called
- ✅ Response is received with content
- ✅ Response length is reasonable (> 100 characters usually)

**Example Query:** "Book a hotel in New York"
**Expected Logs:**
```
📅 [BOOKING WORKFLOW] Starting execution
📥 Input Query: "Book a hotel in New York"
📊 [STEP 1] Parsing booking request...
✅ [STEP 1] Data extraction complete:
   - Booking Type: Hotel
   - Location: New York
🤖 [STEP 2] Calling bookingAgent...
✅ [STEP 2] Agent response received
   Response length: 520 characters
```

### 3. Data Extraction Verification

**Vehicle Workflow:**
- Vehicle Type: SUV, Sedan, Hatchback, Truck, etc.
- Use Case: Family transportation, Daily commuting, etc.
- Budget: Budget-friendly, Premium, or empty

**Booking Workflow:**
- Booking Type: Hotel, Restaurant, Event, Flight
- Location: Extracted from query
- Date: Extracted if present
- Guests: Number extracted from query

## Common Issues & Solutions

### Issue: "Agent not found"
**Solution:** Check if agent is registered in `mastra/index.ts`

### Issue: "Mastra instance not initialized"
**Solution:** Ensure `setMastraInstance(mastra)` is called after Mastra creation

### Issue: No logs appearing
**Solution:** Check if tool is being called by router agent. Verify router agent instructions.

### Issue: Data extraction not working
**Solution:** Check query format. Ensure keywords match extraction logic (e.g., "SUV", "hotel", "New York")

## Log Levels

- **Info (✅)**: Normal execution flow
- **Warning (⚠️)**: Non-critical issues (currently none)
- **Error (❌)**: Execution failures

## Tips

1. **Follow the Flow**: Logs show step-by-step execution. Follow from start to completion.
2. **Check Data Extraction**: Verify extracted values match your query.
3. **Verify Agent Calls**: Ensure agent.generate() is called and response is received.
4. **Check Response Length**: Very short responses (< 50 chars) might indicate issues.
5. **Error Details**: Always check error message and stack trace for debugging.

## Example Test Flow

1. **Start Router Agent**: Ask "I need an SUV for my family"
2. **Check Logs**: Should see `[VEHICLE WORKFLOW] Starting execution`
3. **Verify Steps**: Check Step 1 (extraction) and Step 2 (agent call)
4. **Check Result**: Verify final output is formatted correctly

---

**Note**: All logs use emoji prefixes for easy identification:
- 🚗 Vehicle-related
- 📅 Booking-related
- 📥 Input
- 📊 Analysis/Extraction
- 🤖 Agent calls
- ✅ Success
- ❌ Errors
- 📝 Prompts
- 📦 Formatting


