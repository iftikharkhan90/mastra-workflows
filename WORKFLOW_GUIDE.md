# Mastra Workflow Guide

A simple guide to understand how this Mastra application works.

---

## Table of Contents

1. [Overview](#overview)
2. [The Three Main Parts](#the-three-main-parts)
3. [How They Connect](#how-they-connect)
4. [Complete Flow Example](#complete-flow-example)
5. [Code Breakdown](#code-breakdown)
6. [FAQ](#faq)

---

## Overview

This application has a **routing system** that:
1. Takes user queries
2. Routes them to the right workflow
3. Returns AI-generated responses

**Example:**
- User says: "Book a hotel in Dubai"
- System routes to: Booking Workflow
- Returns: Hotel recommendations from AI

---

## The Three Main Parts

### 1. Tools (router-tools.ts)

**What it does:** Triggers/Starts workflows

**Analogy:** A TV remote - it doesn't play movies, it just turns on the TV

```
Tool = Remote Control 🎮
- Presses "start" button
- Workflow starts running
- Tool waits for result
- Tool returns result
```

**Key Code:**
```typescript
// Tool just starts the workflow
const result = await run.start({ inputData: { query } });
return { result };
```

---

### 2. Workflows (booking-workflow.ts, vehicle-workflow.ts)

**What it does:** Defines the steps to process a request

**Analogy:** A recipe - it defines what to do step by step

```
Workflow = Recipe 📋
- Step 1: Parse the user's request
- Step 2: Call AI agent to generate response
- Return: Final result
```

**Key Code:**
```typescript
// Workflow chains steps together
const workflow = createWorkflow()
  .then(step1)  // First, parse the query
  .then(step2); // Then, call AI agent
```

---

### 3. Agents (booking-agent.ts, vehicle-agent.ts)

**What it does:** AI entities that generate responses

**Analogy:** Expert consultants - they have knowledge and give advice

```
Agent = Expert Consultant 🧑‍💼
- Receives a question
- Uses AI (GPT-4) to think
- Returns expert answer
```

**Key Code:**
```typescript
// Agent generates AI response
const response = await agent.generate([
  { role: 'user', content: prompt }
]);
```

---

## How They Connect

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  index.ts (Connects Everything)                                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    MASTRA                                │   │
│  │                                                          │   │
│  │  Workflows registered:                                   │   │
│  │  • 'booking-workflow' → bookingWorkflow                  │   │
│  │  • 'vehicle-workflow' → vehicleWorkflow                  │   │
│  │                                                          │   │
│  │  Agents registered:                                      │   │
│  │  • 'bookingAgent' → bookingAgent                         │   │
│  │  • 'vehicleAgent' → vehicleAgent                         │   │
│  │  • 'routerAgent'  → routerAgent                          │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│              setMastraInstance(mastra)                          │
│              (Makes Mastra available to tools)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Connection happens through IDs:**

```
Registration:       'booking-workflow': bookingWorkflow
                            ↑
                         Same ID
                            ↓
Tool lookup:        mastra.getWorkflow('booking-workflow')
```

---

## Complete Flow Example

### Example Query: "Book a hotel in Dubai for 3 guests"

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User sends query                                        │
│                                                                 │
│ "Book a hotel in Dubai for 3 guests"                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Router Agent receives query                             │
│                                                                 │
│ Router Agent thinks:                                            │
│ • "hotel" keyword detected                                      │
│ • "book" keyword detected                                       │
│ • This is a booking query!                                      │
│ • I should use: execute-booking-workflow tool                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Tool executes                                           │
│                                                                 │
│ // router-tools.ts                                              │
│ const workflow = mastra.getWorkflow('booking-workflow');        │
│ const run = await workflow.createRunAsync({ runId });           │
│ const result = await run.start({ inputData: { query } });       │
│                              ↓                                  │
│                     Workflow starts!                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Workflow Step 1 - Parse Request                         │
│                                                                 │
│ // booking-workflow.ts - parseBookingRequest                    │
│                                                                 │
│ Input:  "Book a hotel in Dubai for 3 guests"                    │
│                                                                 │
│ Processing:                                                     │
│ • Detect booking type: "Hotel" (found "hotel")                  │
│ • Extract location: "Dubai" (found "in Dubai")                  │
│ • Extract guests: 3 (found "3 guests")                          │
│                                                                 │
│ Output: {                                                       │
│   bookingType: "Hotel",                                         │
│   location: "Dubai",                                            │
│   guests: 3                                                     │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Workflow Step 2 - Generate Options                      │
│                                                                 │
│ // booking-workflow.ts - generateBookingOptions                 │
│                                                                 │
│ Input: { bookingType: "Hotel", location: "Dubai", guests: 3 }   │
│                                                                 │
│ Processing:                                                     │
│ 1. Get agent: mastra.getAgent('bookingAgent')                   │
│ 2. Build prompt with hotel details                              │
│ 3. Call AI: agent.generate([{ role: 'user', content: prompt }]) │
│ 4. Wait for AI response...                                      │
│                                                                 │
│ Output: {                                                       │
│   recommendation: "Here are the best hotels in Dubai...",       │
│   options: [...],                                               │
│   bookingDetails: "..."                                         │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Result returns                                          │
│                                                                 │
│ Workflow → Tool → Router Agent → User                           │
│                                                                 │
│ User receives: "Here are the best hotels in Dubai for 3         │
│ guests: 1. Burj Al Arab... 2. Atlantis..."                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Code Breakdown

### Tool Code (Starts the workflow)

```typescript
// router-tools.ts

async function executeWorkflow(workflowId, input) {
  // 1. Get workflow from Mastra
  const workflow = mastra.getWorkflow(workflowId);
  
  // 2. Create a run instance
  const run = await workflow.createRunAsync({ runId });
  
  // 3. START the workflow ← This triggers all steps!
  const result = await run.start({ inputData: input });
  
  // 4. Return result
  return result;
}
```

### Workflow Code (Defines the steps)

```typescript
// booking-workflow.ts

// Step 1: Parse the query
const parseBookingRequest = createStep({
  execute: async ({ inputData }) => {
    // Extract: bookingType, location, date, guests
    return { bookingType, location, guests };
  }
});

// Step 2: Call AI agent
const generateBookingOptions = createStep({
  execute: async ({ inputData, mastra }) => {
    // Get agent
    const agent = mastra.getAgent('bookingAgent');
    
    // Call AI ← This is where AI response is generated!
    const response = await agent.generate([...]);
    
    return { recommendation: response.text };
  }
});

// Chain steps together
const workflow = createWorkflow()
  .then(parseBookingRequest)    // Step 1
  .then(generateBookingOptions); // Step 2
```

### Agent Code (AI entity)

```typescript
// booking-agent.ts

const bookingAgent = new Agent({
  name: 'Booking Agent',
  model: 'openai/gpt-4o-mini',
  instructions: 'You are an expert booking assistant...'
});
```

---

## FAQ

### Q: Why is agent called inside workflow, not in tool?

**A:** Because the workflow step is where the actual work happens.

```
Tool        → Just starts the workflow (like pressing play)
Workflow    → Runs the steps
Step 2      → Needs AI response → Calls agent
```

The tool doesn't know what work needs to be done. It just triggers the workflow. The workflow step knows it needs AI help, so it calls the agent.

---

### Q: Why do we need workflows? Why not call agent directly?

**A:** Workflows provide structure and multi-step processing.

**Without Workflow (Direct call):**
```
Query → Agent → Response
```
Simple but no data extraction, no structured processing.

**With Workflow:**
```
Query → Step 1 (Parse) → Step 2 (AI) → Structured Response
```
Better parsing, structured data, better prompts, better results.

---

### Q: How does the tool find the workflow?

**A:** Through the workflow ID registered in Mastra.

```typescript
// index.ts - Registration
workflows: {
  'booking-workflow': bookingWorkflow  // ID → Workflow
}

// router-tools.ts - Lookup
mastra.getWorkflow('booking-workflow')  // Same ID
```

---

### Q: What's the difference between workflow tools and direct agent tools?

**A:**

| Tool Type | What it does | When to use |
|-----------|--------------|-------------|
| `executeBookingWorkflow` | Runs full workflow (parse + AI) | Detailed responses |
| `callBookingAgent` | Calls agent directly | Quick simple responses |

---

## Summary Table

| Component | File | Purpose | Key Method |
|-----------|------|---------|------------|
| Tool | `router-tools.ts` | Start workflow | `run.start()` |
| Workflow | `booking-workflow.ts` | Define steps | `.then(step)` |
| Step | Inside workflow | Do actual work | `execute()` |
| Agent | `booking-agent.ts` | Generate AI response | `agent.generate()` |
| Mastra | `index.ts` | Connect everything | Registration |

---

## Visual Summary

```
User Query
    │
    ▼
Router Agent ──► "Which tool should I use?"
    │
    ▼
Tool ──────────► "Let me start the workflow"
    │
    ▼
Workflow ──────► "Let me run my steps"
    │
    ├──► Step 1: Parse query
    │
    └──► Step 2: Call Agent ──► "Generate AI response"
                   │
                   ▼
              AI Response
                   │
                   ▼
              Back to User
```

---

*Created for understanding Mastra workflow architecture.*

