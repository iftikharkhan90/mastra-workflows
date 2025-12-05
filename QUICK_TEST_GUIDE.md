# Quick Test Guide - How to Test & Track Agent Calls

## 🚀 Quick Start (3 Steps)

### Step 1: Start Mastra Studio
```bash
npm run dev
```
Opens at: `http://localhost:4111`

### Step 2: Test in Mastra Studio
1. Go to **Agents** → **Router Agent** → **Chat**
2. Type: `"I need some vehicle info"`
3. See the response

### Step 3: Check Which Agent Was Called
1. Click **Traces** tab (in Router Agent view)
2. You'll see:
   - Router Agent execution
   - If workflow was called → Click workflow trace
   - Inside workflow → See which agent was called (e.g., `vehicleAgent`)

---

## 📊 How to See Which Agent is Called

### Method 1: Mastra Studio Traces (Easiest)

**Path**: `Agents → Router Agent → Traces`

You'll see:
```
Router Agent Trace
  └── vehicleWorkflow Trace (if routed)
      ├── Step 1: analyze-requirements
      └── Step 2: generate-recommendations
          └── vehicleAgent ← THIS IS THE AGENT CALLED
```

### Method 2: Direct Workflow Test

**Path**: `Workflows → vehicleWorkflow → Execute`

1. Enter: `{ "query": "SUV for family" }`
2. Click **Execute**
3. Go to **Traces** tab
4. See: `vehicleAgent` called in Step 2

### Method 3: Direct Agent Test

**Path**: `Agents → Vehicle Agent → Chat`

1. Type your query
2. Go to **Traces** tab
3. See: Direct `vehicleAgent` execution

---

## 🧪 Test Examples

### Test Vehicle Workflow
```
Query: "I need an SUV for my family"
Expected Agent: vehicleAgent
Where to Check: Traces → vehicleWorkflow → Step 2
```

### Test Booking Workflow
```
Query: "I need to book a hotel"
Expected Agent: bookingAgent
Where to Check: Traces → bookingWorkflow → Step 2
```

### Test Router Agent
```
Query: "I need vehicle info"
Expected Flow: Router Agent → vehicleWorkflow → vehicleAgent
Where to Check: Traces → Router Agent → vehicleWorkflow → vehicleAgent
```

---

## 📝 Programmatic Testing

### Run Test Script
```bash
npm run test:workflows
```

Or:
```bash
npx tsx test-workflows.ts
```

This will:
- Test all workflows
- Test all agents
- Show which agent is called
- Display execution logs

---

## 🔍 Understanding Traces

### Trace Structure
```
Trace Name: [Agent/Workflow Name]
├── Input: {...}
├── Steps:
│   ├── Step 1: [Step Name]
│   │   └── Agent Call: [Agent Name] ← Agent called here
│   └── Step 2: [Step Name]
└── Output: {...}
```

### What to Look For
- **Agent Name**: Shows which agent executed (e.g., `vehicleAgent`, `bookingAgent`)
- **Step ID**: Shows which workflow step called the agent
- **Input/Output**: Shows data passed to/from agent
- **Timing**: Shows execution time

---

## ✅ Quick Checklist

- [ ] Started Mastra Studio (`npm run dev`)
- [ ] Tested Router Agent with a query
- [ ] Checked Traces tab to see routing
- [ ] Verified which agent was called
- [ ] Tested workflow directly
- [ ] Verified agent call in workflow trace

---

## 🎯 Key Points

1. **Router Agent** = Main entry point (routes to workflows/agents)
2. **Workflows** = Multi-step processes (call agents in steps)
3. **Agents** = Handle specific tasks
4. **Traces** = Show execution flow and agent calls

---

## 📚 More Details

- Full guide: `TESTING_GUIDE.md`
- Changes documentation: `CHANGES_DOCUMENTATION.md`

---

## 💡 Pro Tips

1. **Always check Traces** - This is the best way to see agent calls
2. **Test both ways** - Test through router AND directly
3. **Use clear queries** - Better routing results
4. **Check execution time** - Monitor performance in traces

