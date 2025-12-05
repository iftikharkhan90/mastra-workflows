# Testing Guide: How to Test Workflows and Track Agent Calls

This guide explains how to test your Mastra workflows and track which agents are being called.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Testing Methods](#testing-methods)
3. [Tracking Agent Calls](#tracking-agent-calls)
4. [Using Mastra Studio](#using-mastra-studio)
5. [Programmatic Testing](#programmatic-testing)

---

## Quick Start

### 1. Start Mastra Dev Server
```bash
npm run dev
```

This will start Mastra Studio at `http://localhost:4111`

### 2. Access Mastra Studio
Open your browser and navigate to:
```
http://localhost:4111
```

---

## Testing Methods

### Method 1: Using Mastra Studio UI (Recommended)

#### A. Test Router Agent
1. Go to **Agents** → **Router Agent** → **Chat**
2. Type a query like:
   - `"I need some vehicle info"`
   - `"I need to book a hotel"`
3. The router agent will analyze and route to the appropriate sub-agent

#### B. Test Workflows Directly
1. Go to **Workflows** in the sidebar
2. Click on **vehicleWorkflow** or **bookingWorkflow**
3. Click **Execute** or **Test**
4. Enter test input:
   - For vehicle: `{ "query": "I need an SUV for family" }`
   - For booking: `{ "query": "Book a hotel in New York" }`

#### C. Test Agents Directly
1. Go to **Agents** in the sidebar
2. Click on **Vehicle Agent** or **Booking Agent**
3. Go to **Chat** tab
4. Type your query directly

---

## Tracking Agent Calls

### Method 1: Using Mastra Studio Traces (Best Method)

#### Step 1: Enable Observability
Observability is already enabled in your `src/mastra/index.ts`:
```typescript
observability: {
  default: { enabled: true }, 
}
```

#### Step 2: View Traces
1. After executing a workflow or agent:
   - Go to **Traces** section in Mastra Studio
   - Or click on the **Traces** tab in the agent/workflow view

2. You'll see:
   - **Which agent was called** (e.g., "vehicleAgent", "bookingAgent")
   - **Which workflow was executed** (e.g., "vehicleWorkflow")
   - **Execution steps** (each step in the workflow)
   - **Input/Output** for each step
   - **Timing information**
   - **Agent calls within workflows**

#### Step 3: Trace Details
Click on any trace to see:
- Full execution flow
- Which agent handled which step
- Input/output data
- Execution time
- Any errors

### Method 2: Console Logging

The workflows already include console logging. When you run workflows, you'll see:
- Step execution messages
- Agent streaming output
- Error messages

### Method 3: Programmatic Tracking

Use the test script provided (`test-workflows.ts`) which includes:
- Logging of which agent/workflow is being called
- Input/output display
- Execution tracking

---

## Using Mastra Studio

### Navigation Structure

```
Mastra Studio
├── Agents
│   ├── Router Agent (Main/Basic Agent)
│   │   ├── Chat (Test routing)
│   │   ├── Traces (See execution history)
│   │   └── Overview (Configuration)
│   ├── Vehicle Agent (Sub-Agent)
│   │   ├── Chat (Test directly)
│   │   ├── Traces (See when called)
│   │   └── Overview
│   └── Booking Agent (Sub-Agent)
│       ├── Chat (Test directly)
│       ├── Traces (See when called)
│       └── Overview
└── Workflows
    ├── vehicleWorkflow
    │   ├── Execute (Test workflow)
    │   ├── Traces (See execution)
    │   └── Overview
    └── bookingWorkflow
        ├── Execute (Test workflow)
        ├── Traces (See execution)
        └── Overview
```

### How to See Which Agent is Called

#### Scenario 1: Testing Through Router Agent
1. Go to **Agents** → **Router Agent** → **Chat**
2. Send a query: `"I need vehicle info"`
3. Go to **Traces** tab
4. You'll see:
   - Router Agent execution
   - If router calls a workflow, you'll see the workflow trace
   - Inside workflow trace, you'll see which agent was called

#### Scenario 2: Testing Workflow Directly
1. Go to **Workflows** → **vehicleWorkflow** → **Execute**
2. Enter input: `{ "query": "SUV for family" }`
3. Execute
4. Go to **Traces** tab
5. You'll see:
   - Workflow execution trace
   - Step 1: `analyze-requirements` (no agent)
   - Step 2: `generate-recommendations` → **vehicleAgent** called

#### Scenario 3: Testing Agent Directly
1. Go to **Agents** → **Vehicle Agent** → **Chat**
2. Send a query
3. Go to **Traces** tab
4. You'll see:
   - Direct agent execution
   - No workflow involved

---

## Programmatic Testing

### Using the Test Script

A comprehensive test script is provided: `test-workflows.ts`

#### Run the Test Script:
```bash
npx tsx test-workflows.ts
```

Or add to package.json:
```json
{
  "scripts": {
    "test:workflows": "tsx test-workflows.ts"
  }
}
```

Then run:
```bash
npm run test:workflows
```

### Test Script Features

The test script includes:
1. **Direct Workflow Testing** - Tests workflows directly
2. **Direct Agent Testing** - Tests agents directly
3. **Router Agent Testing** - Tests routing logic
4. **Streaming Tests** - Tests streaming responses
5. **Execution Logging** - Shows which agent/workflow is called

### Example Test Output

```
🧪 TEST 1: Direct Vehicle Workflow Execution

============================================================
🚀 EXECUTING: WORKFLOW - vehicleWorkflow
============================================================
📥 INPUT: {
  "query": "I need an SUV for my family"
}
⏳ Processing...

[Workflow executes...]
[Step 1: analyze-requirements]
[Step 2: generate-recommendations]
[Agent called: vehicleAgent]

============================================================
✅ COMPLETED: WORKFLOW - vehicleWorkflow
============================================================
📤 OUTPUT: {
  "vehicles": [...],
  "recommendation": "..."
}
============================================================

💡 Note: This workflow internally calls "vehicleAgent"
```

---

## Understanding the Flow

### Flow Diagram

```
User Query
    ↓
Router Agent (Analyzes & Routes)
    ↓
    ├──→ vehicleWorkflow
    │       ├── Step 1: analyze-requirements
    │       └── Step 2: generate-recommendations
    │                   └──→ vehicleAgent (called here)
    │
    └──→ bookingWorkflow
            ├── Step 1: parse-booking-request
            └── Step 2: generate-booking-options
                        └──→ bookingAgent (called here)
```

### How to Track in Traces

1. **Router Agent Trace**:
   - Shows routing decision
   - Shows which workflow/agent was selected

2. **Workflow Trace**:
   - Shows all steps
   - Each step shows:
     - Step ID (e.g., "analyze-requirements")
     - Input/Output
     - If agent is called, shows agent trace link

3. **Agent Trace**:
   - Shows agent execution
   - Shows model calls
   - Shows streaming chunks
   - Shows final response

---

## Example Test Queries

### Vehicle Queries
- `"I need some vehicle info"`
- `"Recommend a car for family"`
- `"Compare SUVs"`
- `"Best vehicle for commuting"`
- `"I need an SUV"`

### Booking Queries
- `"I need to book a hotel"`
- `"Restaurant reservation"`
- `"Book a hotel in New York for 2 people"`
- `"I need event tickets"`
- `"Make a booking"`

---

## Troubleshooting

### Issue: Can't see traces
**Solution**: 
- Make sure observability is enabled in `src/mastra/index.ts`
- Refresh Mastra Studio
- Check browser console for errors

### Issue: Agent not being called
**Solution**:
- Check workflow code - agent should be retrieved with `mastra?.getAgent('agentName')`
- Verify agent is registered in `src/mastra/index.ts`
- Check agent name matches exactly (case-sensitive)

### Issue: Router not routing correctly
**Solution**:
- Check router agent instructions
- Test with clearer queries
- Check router agent traces to see routing decision

---

## Best Practices

1. **Always check Traces** after testing to see execution flow
2. **Test both workflows and agents** directly to understand behavior
3. **Use clear, specific queries** for better routing
4. **Monitor execution time** in traces for performance
5. **Check error traces** if something fails

---

## Quick Reference

| What to Test | Where to Go | What to Look For |
|-------------|-------------|------------------|
| Router routing | Agents → Router Agent → Chat | Traces tab shows routing decision |
| Vehicle workflow | Workflows → vehicleWorkflow → Execute | Traces shows vehicleAgent call |
| Booking workflow | Workflows → bookingWorkflow → Execute | Traces shows bookingAgent call |
| Direct agent test | Agents → [Agent Name] → Chat | Traces shows direct agent execution |
| All traces | Traces section | Complete execution history |

---

## Next Steps

1. Run `npm run dev` to start Mastra Studio
2. Test router agent with different queries
3. Check traces to see which agents are called
4. Test workflows directly
5. Use the test script for programmatic testing

For more details, see `CHANGES_DOCUMENTATION.md`

