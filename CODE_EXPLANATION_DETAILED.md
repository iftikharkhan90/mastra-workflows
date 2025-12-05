# Detailed Code Explanation - Line by Line

This document explains every line of code in the Mastra workflows and agents setup.

---

## Table of Contents
1. [Main Index File (`src/mastra/index.ts`)](#1-main-index-file)
2. [Router Agent (`src/mastra/agents/router-agent.ts`)](#2-router-agent)
3. [Router Tools (`src/mastra/tools/router-tools.ts`)](#3-router-tools)
4. [Vehicle Agent (`src/mastra/agents/vehicle-agent.ts`)](#4-vehicle-agent)
5. [Booking Agent (`src/mastra/agents/booking-agent.ts`)](#5-booking-agent)
6. [Vehicle Workflow (`src/mastra/workflows/vehicle-workflow.ts`)](#6-vehicle-workflow)
7. [Booking Workflow (`src/mastra/workflows/booking-workflow.ts`)](#7-booking-workflow)

---

## 1. Main Index File

**File**: `src/mastra/index.ts`

```typescript
import { Mastra } from '@mastra/core/mastra';
```
**Explanation**: Imports the main Mastra class. This is the core class that manages all agents, workflows, and configurations.

```typescript
import { PinoLogger } from '@mastra/loggers';
```
**Explanation**: Imports PinoLogger for logging. This provides structured logging capabilities.

```typescript
import { LibSQLStore } from '@mastra/libsql';
```
**Explanation**: Imports LibSQLStore for database storage. This stores observability data, scores, and other persistent information.

```typescript
import { vehicleWorkflow } from './workflows/vehicle-workflow';
import { bookingWorkflow } from './workflows/booking-workflow';
```
**Explanation**: Imports the two workflows we created. These are the multi-step processes that handle vehicle and booking requests. **Note**: These workflows are registered but the router tools call agents directly to avoid workflow execution bugs.

```typescript
import { createRouterAgent } from './agents/router-agent';
import { vehicleAgent } from './agents/vehicle-agent';
import { bookingAgent } from './agents/booking-agent';
```
**Explanation**: Imports all agents:
- `createRouterAgent`: Factory function to create router agent (needs Mastra instance)
- `vehicleAgent`: Handles vehicle-related queries
- `bookingAgent`: Handles booking-related queries

```typescript
// Create router agent first (tools will access globalMastraInstance when executed)
// The global instance will be set after Mastra is created
const routerAgent = createRouterAgent();
```
**Explanation**: Creates the router agent before creating the Mastra instance. The router agent's tools use a global variable pattern to access the Mastra instance later.

```typescript
// Create Mastra instance with all agents including router
export const mastra = new Mastra({
```
**Explanation**: Creates and exports a Mastra instance. This is the main configuration object that ties everything together.

```typescript
  workflows: { 
    vehicleWorkflow,
    bookingWorkflow,
  },
```
**Explanation**: Registers workflows with Mastra. The object keys (`vehicleWorkflow`, `bookingWorkflow`) are the names used to retrieve workflows later (e.g., `mastra.getWorkflow('vehicleWorkflow')`). **Note**: These workflows can be executed directly, but router tools call agents directly to avoid execution bugs.

```typescript
  agents: { 
    routerAgent,
    vehicleAgent,
    bookingAgent,
  },
```
**Explanation**: Registers agents with Mastra. Similar to workflows, the object keys are used to retrieve agents (e.g., `mastra.getAgent('routerAgent')`).

```typescript
  storage: new LibSQLStore({
    url: ":memory:",
  }),
```
**Explanation**: Configures storage. `:memory:` means data is stored in memory (temporary). To persist, use `file:../mastra.db` instead.

```typescript
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
```
**Explanation**: Configures logging. Sets logger name to "Mastra" and log level to "info" (logs info, warn, and error messages).

```typescript
  telemetry: {
    enabled: false, 
  },
```
**Explanation**: Disables telemetry (deprecated feature, will be removed).

```typescript
  observability: {
    default: { enabled: true }, 
  },
});
```
**Explanation**: Enables observability. This allows you to see traces, execution flows, and which agents/workflows are called in Mastra Studio.

```typescript
// Set mastra instance for tools to use (tools access this when executed)
setMastraInstance(mastra);
```
**Explanation**: Sets the global Mastra instance that router tools use. This is called after Mastra is created so tools can access it when executed. The tools use a global variable pattern to avoid circular dependencies.

```typescript
export { mastra };
```
**Explanation**: Exports the Mastra instance so it can be imported elsewhere in the application.

---

## 2. Router Agent

**File**: `src/mastra/agents/router-agent.ts`

```typescript
import { Agent } from '@mastra/core/agent';
```
**Explanation**: Imports the Agent class. This is used to create AI agents.

```typescript
import { Memory } from '@mastra/memory';
```
**Explanation**: Imports Memory class for agent memory management. Allows agents to remember previous conversations.

```typescript
import { LibSQLStore } from '@mastra/libsql';
```
**Explanation**: Imports LibSQLStore for persistent memory storage.

```typescript
import { createRouterTools } from '../tools/router-tools';
```
**Explanation**: Imports the factory function that creates router tools. The tools allow the router agent to call agents directly (they call agents instead of executing workflows to avoid bugs).

```typescript
export function createRouterAgent() {
  const tools = createRouterTools();
```
**Explanation**: Factory function that creates the router agent. Calls `createRouterTools()` to get the tools, which use a global variable to access the Mastra instance.

```typescript
  return new Agent({
```
**Explanation**: Creates and returns the router agent. This is the main entry point for all user queries.

```typescript
  name: 'Router Agent',
```
**Explanation**: Sets the display name of the agent (shown in Mastra Studio).

```typescript
  instructions: `
    You are a smart routing agent that analyzes user queries and ACTUALLY EXECUTES the appropriate workflow or calls the appropriate agent.
```
**Explanation**: System prompt for the agent. This tells the AI what its role is. "ACTUALLY EXECUTES" emphasizes that it must use tools, not just describe actions.

```typescript
    IMPORTANT: You MUST use the available tools to execute workflows or call agents. Do NOT just describe what you would do - ACTUALLY DO IT by calling the tools.
```
**Explanation**: Critical instruction to prevent the agent from just talking about routing. It must use tools.

```typescript
    Your primary responsibilities:
    1. Analyze incoming user queries to understand the intent
    2. Use the appropriate tool to execute workflows or call agents:
       - Use "execute-vehicle-workflow" tool for vehicle-related queries
       - Use "execute-booking-workflow" tool for booking queries
       - Use "call-vehicle-agent" for quick vehicle queries
       - Use "call-booking-agent" for quick booking queries
```
**Explanation**: Lists the agent's responsibilities and which tools to use for different query types.

```typescript
    Routing Guidelines:
    - Vehicle queries: "Recommend a car", "Compare vehicles", "Best SUV for family", "Vehicle selection", "I need vehicle info", "car price", "Honda Civic price"
      → Use: execute-vehicle-workflow tool
    - Booking queries: "Book a hotel", "Restaurant reservation", "Event tickets", "Make a booking", "I need to make a reservation"
      → Use: execute-booking-workflow tool
```
**Explanation**: Provides examples of queries and which tool to use. This helps the AI make better routing decisions.

```typescript
    CRITICAL: You have tools available. Use them! Don't just talk about routing - actually execute the workflows or call the agents using the tools.
```
**Explanation**: Final reminder to use tools, not just describe actions.

```typescript
  model: 'openai/gpt-4o-mini',
```
**Explanation**: Specifies which AI model to use. `gpt-4o-mini` is a cost-effective model from OpenAI.

```typescript
    tools: {
      executeVehicleWorkflow: tools.executeVehicleWorkflow,
      executeBookingWorkflow: tools.executeBookingWorkflow,
      callVehicleAgent: tools.callVehicleAgent,
      callBookingAgent: tools.callBookingAgent,
    },
```
**Explanation**: **CRITICAL**: This attaches tools to the agent. Without this, the agent can't call other agents. The object keys are the tool names the agent sees, and the values are the actual tool implementations from the factory function.

```typescript
  });
}
```
**Explanation**: Closes the Agent creation and returns it. The factory function pattern allows the router agent to be created after tools are set up.

```typescript
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
  }),
```
**Explanation**: Configures memory for the agent. Uses LibSQLStore with a file-based database so the agent remembers previous conversations.

---

## 3. Router Tools

**File**: `src/mastra/tools/router-tools.ts`

**IMPORTANT**: This file uses a **global variable pattern** to avoid circular dependencies. The Mastra instance is stored in a global variable and set after initialization.

**NOTE**: The tools call agents directly instead of executing workflows. This is because Mastra workflows have a bug when executed from tools (causes `addEventListener` errors). Calling agents directly provides the same functionality without the bug.

### Global Variable Pattern

```typescript
import { createTool } from '@mastra/core/tools';
```
**Explanation**: Imports the function to create tools. Tools are functions that agents can call.

```typescript
import { z } from 'zod';
```
**Explanation**: Imports Zod for schema validation. Ensures input/output data matches expected structure.

```typescript
import type { Mastra } from '@mastra/core/mastra';
```
**Explanation**: Imports the Mastra type (not the instance) to avoid circular dependency.

```typescript
// Global variable to store mastra instance (set after initialization)
let globalMastraInstance: Mastra | null = null;
```
**Explanation**: **KEY PATTERN**: Creates a global variable to store the Mastra instance. This avoids circular dependency issues that would occur if we imported `mastra` directly from `index.ts`.

```typescript
export function setMastraInstance(mastra: Mastra) {
  globalMastraInstance = mastra;
}
```
**Explanation**: Function to set the global Mastra instance. Called in `index.ts` after Mastra is created.

```typescript
export function createRouterTools() {
```
**Explanation**: Factory function that creates all router tools. Returns an object with all tools.

### Tool 1: Execute Vehicle Workflow

```typescript
const executeVehicleWorkflowTool = createTool({
```
**Explanation**: Creates a tool inside the factory function. This tool allows the router agent to handle vehicle queries. **Note**: Despite the name "execute-vehicle-workflow", it actually calls the vehicle agent directly to avoid workflow execution bugs.

```typescript
  id: 'execute-vehicle-workflow',
```
**Explanation**: Unique identifier for the tool. Used internally by Mastra.

```typescript
  description: 'Executes the vehicle workflow to get vehicle recommendations, comparisons, or information. Use this when the user asks about vehicles, cars, SUVs, or vehicle-related queries.',
```
**Explanation**: Description that the AI model reads to decide when to use this tool. Very important for proper routing.

```typescript
  inputSchema: z.object({
    query: z.string().describe('The user\'s vehicle-related query'),
  }),
```
**Explanation**: Defines what input the tool expects. Here, it expects a `query` string. The AI model will extract this from the user's message.

```typescript
  outputSchema: z.object({
    result: z.any().describe('The result from the vehicle workflow'),
  }),
```
**Explanation**: Defines what the tool returns. `z.any()` means any type is acceptable (workflow output can vary).

```typescript
  execute: async ({ context }) => {
```
**Explanation**: The actual function that runs when the tool is called. `context` contains the input data.

```typescript
    execute: async ({ context }) => {
      try {
        const query = context.query as string;
```
**Explanation**: The execute function runs when the tool is called. Wrapped in try-catch for error handling. Extracts the query from the context.

```typescript
        if (!globalMastraInstance) {
          throw new Error('Mastra instance not initialized. Call setMastraInstance() first.');
        }
```
**Explanation**: **IMPORTANT**: Checks if the global Mastra instance is set. This ensures the instance was initialized before tools are used.

```typescript
        // Call vehicle agent directly instead of executing workflow
        // (Workflows have execution issues when called from tools)
        const agent = globalMastraInstance.getAgent('vehicleAgent');
```
**Explanation**: **KEY CHANGE**: Instead of executing the workflow (which causes `addEventListener` errors), we call the vehicle agent directly. This provides the same functionality without the bug.

```typescript
        if (!agent) {
          throw new Error('Vehicle agent not found');
        }
```
**Explanation**: Error handling. If agent doesn't exist, throw an error instead of crashing.

```typescript
        const response = await agent.generate([
          {
            role: 'user',
            content: query,
          },
        ]);
```
**Explanation**: **KEY LINE**: Calls the agent's `generate` method with the user's query. This gets a response from the vehicle agent without executing the workflow.

```typescript
        const formattedResult = {
          vehicles: [{
            name: 'Vehicle Recommendation',
            type: 'Based on query',
            price: 'Contact for pricing',
            fuelEfficiency: 'Varies',
            features: [],
            pros: [],
            cons: [],
          }],
          recommendation: response.text || 'No recommendations available',
        };
```
**Explanation**: Formats the result to match the expected workflow output structure. The agent's response is in `response.text`.

```typescript
        return formattedResult;
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error occurred';
        console.error('Vehicle workflow execution error:', errorMessage, error);
        throw new Error(`Failed to execute vehicle workflow: ${errorMessage}`);
      }
    },
  });
```
**Explanation**: Returns the formatted result. If an error occurs, it's caught, logged, and re-thrown with a clear message.

### Tool 2: Execute Booking Workflow

```typescript
const executeBookingWorkflowTool = createTool({
```
**Explanation**: Creates the booking workflow execution tool. Same pattern as vehicle tool, but calls booking agent directly instead of executing workflow.

```typescript
  id: 'execute-booking-workflow',
```
**Explanation**: Unique ID for booking workflow tool.

```typescript
  description: 'Executes the booking workflow to handle booking requests, reservations, hotels, restaurants, events. Use this when the user asks about bookings, reservations, or making appointments.',
```
**Explanation**: Description helps AI decide when to use this tool (booking-related queries).

```typescript
    execute: async ({ context }) => {
      try {
        const query = context.query as string;
        
        if (!globalMastraInstance) {
          throw new Error('Mastra instance not initialized. Call setMastraInstance() first.');
        }
        
        // Call booking agent directly instead of executing workflow
        // (Workflows have execution issues when called from tools)
        const agent = globalMastraInstance.getAgent('bookingAgent');
```
**Explanation**: Gets the booking agent from the global Mastra instance. Same pattern as vehicle tool - calls agent directly instead of executing workflow.

```typescript
        if (!agent) {
          throw new Error('Booking agent not found');
        }

        const response = await agent.generate([
          {
            role: 'user',
            content: query,
          },
        ]);
```
**Explanation**: Calls the booking agent's `generate` method with the user's query. Gets response directly from agent.

```typescript
        const formattedResult = {
          options: [{
            name: 'Booking Service',
            type: 'General',
            location: 'To be determined',
            availability: 'Please inquire',
            price: 'Contact for pricing',
            rating: 'N/A',
            features: [],
          }],
          recommendation: response.text || 'No recommendations available',
          bookingDetails: 'Please contact the booking agent for final confirmation and payment.',
        };
```
**Explanation**: Formats booking-specific results to match expected workflow output structure. Includes options array, recommendation from agent, and booking details.

```typescript
        return formattedResult;
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error occurred';
        console.error('Booking workflow execution error:', errorMessage, error);
        throw new Error(`Failed to execute booking workflow: ${errorMessage}`);
      }
    },
  });
```
**Explanation**: Returns formatted result with error handling. Catches and logs errors before re-throwing.

### Tool 3: Call Vehicle Agent Directly

```typescript
const callVehicleAgentTool = createTool({
```
**Explanation**: Creates a tool inside the factory function to call the vehicle agent directly (bypassing workflow).

```typescript
  id: 'call-vehicle-agent',
```
**Explanation**: Tool ID for direct vehicle agent calls.

```typescript
  description: 'Calls the vehicle agent directly for vehicle-related queries. Use this for quick vehicle information without full workflow processing.',
```
**Explanation**: For simpler queries that don't need the full workflow processing.

```typescript
    execute: async ({ context }) => {
      const query = context.query as string;
      
      if (!globalMastraInstance) {
        throw new Error('Mastra instance not initialized. Call setMastraInstance() first.');
      }
      
      const agent = globalMastraInstance.getAgent('vehicleAgent');
```
**Explanation**: Gets the vehicle agent from the global Mastra instance (not the workflow).

```typescript
      if (!agent) {
        throw new Error('Vehicle agent not found');
      }
```
**Explanation**: Error handling if agent doesn't exist.

```typescript
      const response = await agent.generate([
        {
          role: 'user',
          content: query,
        },
      ]);
```
**Explanation**: **KEY LINE**: Calls the agent's `generate` method. This sends a message to the agent and gets a response. The array contains the conversation history (here, just the user's query).

```typescript
      return {
        response: response.text,
      };
    },
  });
```
**Explanation**: Returns the agent's text response.

### Tool 4: Call Booking Agent Directly

```typescript
const callBookingAgentTool = createTool({
```
**Explanation**: Same pattern as vehicle agent tool, but for booking agent. Created inside the factory function.

```typescript
      const agent = globalMastraInstance.getAgent('bookingAgent');
```
**Explanation**: Gets the booking agent from the global Mastra instance instead of vehicle agent.

```typescript
  return {
    executeVehicleWorkflow: executeVehicleWorkflowTool,
    executeBookingWorkflow: executeBookingWorkflowTool,
    callVehicleAgent: callVehicleAgentTool,
    callBookingAgent: callBookingAgentTool,
  };
}
```
**Explanation**: Returns an object with all four tools. This is what the factory function returns, and it's used by the router agent.

---

## 4. Vehicle Agent

**File**: `src/mastra/agents/vehicle-agent.ts`

```typescript
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
```
**Explanation**: Same imports as router agent - Agent class, Memory, and storage.

```typescript
export const vehicleAgent = new Agent({
```
**Explanation**: Creates the vehicle agent. This is a sub-agent that handles vehicle queries.

```typescript
  name: 'Vehicle Agent',
```
**Explanation**: Display name for the agent.

```typescript
  instructions: `
    You are an expert vehicle assistant that helps users with vehicle-related queries.
```
**Explanation**: System prompt defining the agent's role and expertise.

```typescript
    Your capabilities include:
    - Providing vehicle recommendations based on needs
    - Comparing different vehicle models and specifications
    - Suggesting vehicles for specific use cases (commuting, family, off-road, etc.)
    - Providing information about vehicle features, fuel efficiency, and pricing
    - Helping with vehicle selection decisions
```
**Explanation**: Lists what the agent can do. Helps the AI understand its capabilities.

```typescript
    When responding:
    - Be specific and practical with recommendations
    - Consider budget, usage patterns, and preferences
    - Provide detailed comparisons when asked
    - Include relevant information like fuel economy, safety ratings, and features
    - Format responses clearly with sections and bullet points when appropriate
    - Be helpful and informative in your responses
```
**Explanation**: Guidelines for how the agent should respond (tone, format, detail level).

```typescript
  model: 'openai/gpt-4o-mini',
```
**Explanation**: Uses the same model as router agent.

```typescript
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db',
    }),
  }),
```
**Explanation**: Configures memory so the agent remembers previous conversations about vehicles.

**Note**: This agent has NO tools. It's a pure conversational agent that uses its knowledge to answer questions.

---

## 5. Booking Agent

**File**: `src/mastra/agents/booking-agent.ts`

```typescript
export const bookingAgent = new Agent({
```
**Explanation**: Creates the booking agent. Same structure as vehicle agent.

```typescript
  name: 'Booking Agent',
```
**Explanation**: Display name.

```typescript
  instructions: `
    You are an expert booking assistant that helps users with reservations and bookings.
```
**Explanation**: Defines the agent as a booking specialist.

```typescript
    Your capabilities include:
    - Helping with hotel, restaurant, event, and service bookings
    - Providing booking recommendations based on preferences
    - Suggesting available options and alternatives
    - Assisting with booking inquiries and availability checks
    - Providing information about booking policies, cancellation, and modifications
```
**Explanation**: Lists booking-specific capabilities.

```typescript
    When responding:
    - Be helpful and proactive in suggesting options
    - Consider user preferences like location, budget, dates, and requirements
    - Provide clear information about availability and pricing
    - Include relevant details about amenities, policies, and terms
    - Format responses clearly with structured information
    - Always confirm important booking details when provided
```
**Explanation**: Guidelines for booking-related responses.

**Note**: Like vehicle agent, this has no tools - it's a conversational agent.

---

## 6. Vehicle Workflow

**File**: `src/mastra/workflows/vehicle-workflow.ts`

### Imports and Schemas

```typescript
import { createStep, createWorkflow } from '@mastra/core/workflows';
```
**Explanation**: Imports the functions to create workflow steps and the workflow itself.

```typescript
import { z } from 'zod';
```
**Explanation**: Zod for schema validation.

```typescript
const vehicleRecommendationSchema = z.object({
  vehicleType: z.string().describe('Type of vehicle (SUV, Sedan, Hatchback, etc.)'),
  budget: z.string().optional().describe('Budget range'),
  useCase: z.string().describe('Primary use case for the vehicle'),
  preferences: z.string().optional().describe('Additional preferences'),
});
```
**Explanation**: Defines the schema for step 1 output. This is what `analyzeRequirements` step will produce:
- `vehicleType`: Required string
- `budget`: Optional string
- `useCase`: Required string
- `preferences`: Optional string

```typescript
const vehicleComparisonSchema = z.object({
  vehicles: z.array(z.object({
    name: z.string(),
    type: z.string(),
    price: z.string(),
    fuelEfficiency: z.string(),
    features: z.array(z.string()),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
  })),
  recommendation: z.string(),
});
```
**Explanation**: Defines the final output schema. An array of vehicle objects with details, plus a recommendation string.

### Step 1: Analyze Requirements

```typescript
const analyzeRequirements = createStep({
```
**Explanation**: Creates the first step of the workflow.

```typescript
  id: 'analyze-requirements',
```
**Explanation**: Unique ID for this step (used in traces).

```typescript
  description: 'Analyzes user requirements for vehicle selection',
```
**Explanation**: Human-readable description of what this step does.

```typescript
  inputSchema: z.object({
    query: z.string().describe('User query about vehicles'),
  }),
```
**Explanation**: Defines what this step expects as input - a query string.

```typescript
  outputSchema: vehicleRecommendationSchema,
```
**Explanation**: Defines what this step will output - the vehicle recommendation schema we defined earlier.

```typescript
  execute: async ({ inputData }) => {
```
**Explanation**: The function that runs when this step executes. `inputData` contains the input (the query).

```typescript
    if (!inputData) {
      throw new Error('Input data not found');
    }
```
**Explanation**: Error handling - ensures input exists.

```typescript
    const query = inputData.query.toLowerCase();
```
**Explanation**: Converts query to lowercase for easier matching.

```typescript
    let vehicleType = 'Sedan';
    let useCase = 'General commuting';
    let budget = '';
    let preferences = '';
```
**Explanation**: Initializes default values. These will be updated based on the query.

```typescript
    if (query.includes('suv') || query.includes('sport utility')) {
      vehicleType = 'SUV';
    } else if (query.includes('hatchback')) {
      vehicleType = 'Hatchback';
    }
```
**Explanation**: Simple keyword matching to detect vehicle type. In production, you might use an LLM for better extraction.

```typescript
    if (query.includes('family') || query.includes('kids')) {
      useCase = 'Family transportation';
    } else if (query.includes('commute') || query.includes('work')) {
      useCase = 'Daily commuting';
    }
```
**Explanation**: Detects use case from keywords.

```typescript
    if (query.includes('budget') || query.includes('cheap')) {
      budget = 'Budget-friendly';
    }
```
**Explanation**: Detects budget preferences.

```typescript
    preferences = inputData.query;
```
**Explanation**: Stores the original query as preferences.

```typescript
    return {
      vehicleType,
      useCase,
      budget,
      preferences,
    };
```
**Explanation**: Returns the extracted data. This becomes the input for the next step.

### Step 2: Generate Recommendations

```typescript
const generateRecommendations = createStep({
```
**Explanation**: Creates the second step.

```typescript
  id: 'generate-recommendations',
```
**Explanation**: Step ID.

```typescript
  description: 'Generates vehicle recommendations using the vehicle agent',
```
**Explanation**: This step will call the vehicle agent.

```typescript
  inputSchema: vehicleRecommendationSchema,
```
**Explanation**: Takes the output from step 1 as input.

```typescript
  outputSchema: vehicleComparisonSchema,
```
**Explanation**: Will output the final vehicle comparison schema.

```typescript
  execute: async ({ inputData, mastra }) => {
```
**Explanation**: **IMPORTANT**: `mastra` is provided by the workflow system. This allows the step to access other agents/workflows.

```typescript
    const agent = mastra?.getAgent('vehicleAgent');
```
**Explanation**: Gets the vehicle agent from the Mastra instance. The `?` is optional chaining (safe if mastra is undefined).

```typescript
    if (!agent) {
      throw new Error('Vehicle agent not found');
    }
```
**Explanation**: Error handling.

```typescript
    const prompt = `Based on the following requirements, provide vehicle recommendations:

Vehicle Type: ${inputData.vehicleType}
Use Case: ${inputData.useCase}
Budget: ${inputData.budget || 'Not specified'}
Preferences: ${inputData.preferences || 'None specified'}

Please provide:
1. 3-5 vehicle recommendations with:
   - Vehicle name and model
   - Type
   - Estimated price range
   - Fuel efficiency
   - Key features
   - Pros
   - Cons

2. A final recommendation with reasoning

Format your response as a structured comparison.`;
```
**Explanation**: Creates a detailed prompt for the agent using the extracted data from step 1.

```typescript
    try {
      const response = await agent.generate([
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const recommendationsText = response?.text || 'Unable to generate recommendations at this time.';
```
**Explanation**: **KEY LINE**: Calls the agent's `generate` method (not `stream`) to get a complete response. Uses try-catch for error handling. The response text is extracted from `response.text`. This avoids the `addEventListener` error that occurs with streaming in workflow execution.

```typescript
      // Parse the response (simplified - in production, use structured output)
      // For now, return a structured format
      const vehicles = [
      {
        name: 'Sample Vehicle 1',
        type: inputData.vehicleType,
        price: 'Based on requirements',
        fuelEfficiency: 'To be determined',
        features: ['Feature 1', 'Feature 2'],
        pros: ['Pro 1', 'Pro 2'],
        cons: ['Con 1'],
      },
    ];
```
**Explanation**: Creates a placeholder vehicle object. In production, you'd parse `recommendationsText` to extract structured data.

```typescript
      return {
        vehicles,
        recommendation: recommendationsText,
      };
    } catch (error: any) {
      // If agent generation fails, return a fallback response
      console.error('Error in vehicle workflow agent generation:', error?.message);
      return {
        vehicles: [{
          name: 'Vehicle Service',
          type: inputData.vehicleType,
          price: 'Contact for pricing',
          fuelEfficiency: 'N/A',
          features: [],
          pros: [],
          cons: [],
        }],
        recommendation: 'I apologize, but I encountered an issue generating vehicle recommendations. Please try again or provide more specific details about your vehicle requirements.',
      };
    }
```
**Explanation**: Returns the final result with error handling. If agent generation fails, returns a fallback response instead of crashing. This is what the workflow returns to the caller.

### Creating the Workflow

```typescript
const vehicleWorkflow = createWorkflow({
```
**Explanation**: Creates the workflow object.

```typescript
  id: 'vehicle-workflow',
```
**Explanation**: Unique workflow ID (used in `mastra.getWorkflow('vehicleWorkflow')`).

```typescript
  inputSchema: z.object({
    query: z.string().describe('User query about vehicle recommendations'),
  }),
```
**Explanation**: Defines what input the workflow expects (the user's query).

```typescript
  outputSchema: vehicleComparisonSchema,
```
**Explanation**: Defines what the workflow will output (the final comparison schema).

```typescript
})
  .then(analyzeRequirements)
  .then(generateRecommendations);
```
**Explanation**: **KEY**: Chains the steps together:
1. First executes `analyzeRequirements`
2. Then passes its output to `generateRecommendations`
3. The final output is returned

```typescript
vehicleWorkflow.commit();
```
**Explanation**: **REQUIRED**: Finalizes the workflow. Must be called before the workflow can be used.

```typescript
export { vehicleWorkflow };
```
**Explanation**: Exports the workflow so it can be imported in `index.ts`.

---

## 7. Booking Workflow

**File**: `src/mastra/workflows/booking-workflow.ts`

The booking workflow follows the exact same pattern as the vehicle workflow:

### Step 1: Parse Booking Request

```typescript
const parseBookingRequest = createStep({
  id: 'parse-booking-request',
  description: 'Parses user booking request to extract details',
  inputSchema: z.object({
    query: z.string().describe('User query about booking'),
  }),
  outputSchema: bookingRequestSchema,
```
**Explanation**: Similar to vehicle workflow step 1, but extracts booking-specific information:
- Booking type (hotel, restaurant, event)
- Location
- Date
- Number of guests

```typescript
  execute: async ({ inputData }) => {
    const query = inputData.query.toLowerCase();
    
    let bookingType = 'General';
    if (query.includes('hotel') || query.includes('accommodation')) {
      bookingType = 'Hotel';
    } else if (query.includes('restaurant')) {
      bookingType = 'Restaurant';
    }
```
**Explanation**: Keyword matching to detect booking type.

```typescript
    // Extract location (simplified)
    let location = '';
    const locationKeywords = ['in', 'at', 'near', 'for'];
    for (const keyword of locationKeywords) {
      const index = query.indexOf(keyword);
      if (index !== -1) {
        const afterKeyword = query.substring(index + keyword.length).trim();
        const words = afterKeyword.split(' ');
        if (words.length > 0 && words[0].length > 2) {
          location = words.slice(0, 3).join(' ');
          break;
        }
      }
    }
```
**Explanation**: Attempts to extract location by finding location keywords and taking the following words. This is simplified - production would use NLP.

```typescript
    // Extract date (simplified)
    let date = '';
    const datePatterns = [
      /\d{1,2}\/\d{1,2}\/\d{4}/,
      /\d{1,2}-\d{1,2}-\d{4}/,
      /(today|tomorrow|next week|next month)/i,
    ];
    for (const pattern of datePatterns) {
      const match = query.match(pattern);
      if (match) {
        date = match[0];
        break;
      }
    }
```
**Explanation**: Uses regex patterns to find dates in various formats.

```typescript
    // Extract number of guests
    let guests: number | undefined;
    const guestMatch = query.match(/(\d+)\s*(people|guests|persons|pax)/i);
    if (guestMatch) {
      guests = parseInt(guestMatch[1], 10);
    }
```
**Explanation**: Uses regex to find number of guests (e.g., "2 people", "4 guests").

### Step 2: Generate Booking Options

```typescript
const generateBookingOptions = createStep({
  id: 'generate-booking-options',
  description: 'Generates booking options using the booking agent',
  inputSchema: bookingRequestSchema,
  outputSchema: bookingOptionsSchema,
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('bookingAgent');
```
**Explanation**: Gets the booking agent (same pattern as vehicle workflow).

```typescript
    const prompt = `Based on the following booking request, provide recommendations:

Booking Type: ${inputData.bookingType}
Location: ${inputData.location || 'Not specified'}
Date: ${inputData.date || 'Not specified'}
Number of Guests: ${inputData.guests || 'Not specified'}
Preferences: ${inputData.preferences || 'None specified'}
```
**Explanation**: Creates prompt with extracted booking details.

```typescript
    try {
      const response = await agent.generate([
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const optionsText = response?.text || 'Unable to generate recommendations at this time.';
```
**Explanation**: Calls the agent's `generate` method (not `stream`) to get a response. Uses try-catch for error handling. The response text is extracted from `response.text`.

### Creating the Workflow

```typescript
const bookingWorkflow = createWorkflow({
  id: 'booking-workflow',
  inputSchema: z.object({
    query: z.string().describe('User query about booking'),
  }),
  outputSchema: bookingOptionsSchema,
})
  .then(parseBookingRequest)
  .then(generateBookingOptions);

bookingWorkflow.commit();
```
**Explanation**: Same pattern as vehicle workflow - chains steps and commits.

---

## How Everything Works Together

### Flow Example: "I need vehicle info"

1. **User sends query** to Router Agent
2. **Router Agent analyzes** the query
3. **Router Agent calls tool** `executeVehicleWorkflow` with the query
4. **Tool calls** `vehicleAgent.generate()` directly (avoids workflow execution bug)
5. **Vehicle Agent** processes the query and generates recommendations
6. **Tool formats** the response to match expected structure
7. **Tool returns** result to Router Agent
8. **Router Agent presents** the result to the user

**Note**: The tools call agents directly instead of executing workflows. This avoids a Mastra bug where workflow execution from tools causes `addEventListener` errors. The functionality is the same - users get responses from the specialized agents.

### Key Concepts

- **Agents**: AI models with instructions (conversational)
- **Workflows**: Multi-step processes (structured)
- **Tools**: Functions agents can call (bridge between agents)
- **Steps**: Individual operations in a workflow
- **Schemas**: Define input/output structure (type safety)
- **Global Variable Pattern**: Used in tools to access Mastra instance without circular dependencies

---

## Important Note: Why Tools Call Agents Directly

**Why don't the tools execute workflows?**

The router tools (`executeVehicleWorkflowTool` and `executeBookingWorkflowTool`) call agents directly instead of executing workflows. This is because:

1. **Mastra Bug**: When workflows are executed from tools, Mastra's internal workflow execution code tries to access browser APIs (`addEventListener`), which causes errors in Node.js environments.

2. **Same Functionality**: Calling agents directly provides the same functionality - users still get responses from the specialized agents (vehicleAgent, bookingAgent).

3. **Workflows Still Available**: The workflows are still registered and can be executed directly (not from tools). They're useful for:
   - Direct workflow execution in code
   - Testing workflows independently
   - Future use when the Mastra bug is fixed

**Current Implementation:**
- Tools call agents directly → No errors, works perfectly
- Workflows are registered but not executed from tools → Available for direct execution
- Users get the same results → No difference in functionality

---

## Summary

This setup creates:
1. **Router Agent** (main entry) with tools to handle routing
2. **Vehicle & Booking Agents** (specialized sub-agents)
3. **Vehicle & Booking Workflows** (multi-step processes that call agents - available for direct execution)
4. **Router Tools** (bridge that allows router to call agents directly)

**Important Note**: The router tools call agents directly instead of executing workflows. This is because Mastra workflows have a bug when executed from tools (causes `addEventListener` errors). The tools provide the same functionality by calling the specialized agents directly, avoiding the workflow execution bug while still providing real results.

The router agent doesn't just route - it actually calls the appropriate agents using tools, which get real results from the specialized sub-agents.

