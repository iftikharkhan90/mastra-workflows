import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { Mastra } from '@mastra/core/mastra';

// ============================================================================
// GLOBAL MASTRA INSTANCE
// ============================================================================

let globalMastraInstance: Mastra | null = null;

export function setMastraInstance(mastra: Mastra) {
  globalMastraInstance = mastra;
}

export function getMastraInstance(): Mastra | null {
  return globalMastraInstance;
}

// ============================================================================
// WORKFLOW EXECUTION HELPER
// ============================================================================

interface WorkflowResult<T> {
  status: string;
  result?: T;
  error?: string;
}

async function executeWorkflow<TInput extends Record<string, unknown>, TOutput>(
  workflowId: string,
  input: TInput
): Promise<TOutput> {
  console.log('\n[TOOL] Starting workflow:', workflowId);

  if (!globalMastraInstance) {
    throw new Error('Mastra instance not initialized.');
  }

  const workflow = globalMastraInstance.getWorkflow(workflowId);
  if (!workflow) {
    throw new Error(`Workflow '${workflowId}' not found`);
  }

  const runId = `run-${Date.now()}`;
  const run = await workflow.createRunAsync({ runId });

  const result = await run.start({ inputData: input }) as WorkflowResult<TOutput>;

  console.log('[TOOL] Workflow completed. Status:', result.status);

  if (result.status === 'success') {
    return result.result as TOutput;
  } else {
    throw new Error(`Workflow failed: ${result.status}`);
  }
}

// ============================================================================
// ROUTER TOOLS
// ============================================================================

export function createRouterTools() {
  const executeVehicleWorkflowTool = createTool({
    id: 'execute-vehicle-workflow',
    description: 'Executes the vehicle workflow for vehicle-related queries.',
    inputSchema: z.object({
      query: z.string().describe('The user\'s vehicle-related query'),
    }),
    outputSchema: z.object({
      result: z.any().describe('The result from the vehicle workflow'),
    }),
    execute: async ({ context }) => {
      const query = (context as { query: string }).query;
      console.log('\n🚗 [TOOL] execute-vehicle-workflow | Query:', query);

      if (!query) throw new Error('Query required');

      const result = await executeWorkflow('vehicle-workflow', { query });
      return { result };
    },
  });

  const executeBookingWorkflowTool = createTool({
    id: 'execute-booking-workflow',
    description: 'Executes the booking workflow for booking-related queries.',
    inputSchema: z.object({
      query: z.string().describe('The user\'s booking-related query'),
    }),
    outputSchema: z.object({
      result: z.any().describe('The result from the booking workflow'),
    }),
    execute: async ({ context }) => {
      const query = (context as { query: string }).query;
      console.log('\n📅 [TOOL] execute-booking-workflow | Query:', query);

      if (!query) throw new Error('Query required');

      const result = await executeWorkflow('booking-workflow', { query });
      return { result };
    },
  });

  const callVehicleAgentTool = createTool({
    id: 'call-vehicle-agent',
    description: 'Calls the vehicle agent directly for quick queries.',
    inputSchema: z.object({
      query: z.string().describe('The user\'s vehicle-related query'),
    }),
    outputSchema: z.object({
      response: z.string().describe('The response from the vehicle agent'),
    }),
    execute: async ({ context }) => {
      const query = (context as { query: string }).query;
      console.log('\n🚗 [DIRECT] call-vehicle-agent | Query:', query);

      if (!globalMastraInstance) throw new Error('Mastra not initialized');

      const agent = globalMastraInstance.getAgent('vehicleAgent');
      if (!agent) throw new Error('Vehicle agent not found');

      const response = await agent.generate([{ role: 'user', content: query }]);
      return { response: response.text };
    },
  });

  const callBookingAgentTool = createTool({
    id: 'call-booking-agent',
    description: 'Calls the booking agent directly for quick queries.',
    inputSchema: z.object({
      query: z.string().describe('The user\'s booking-related query'),
    }),
    outputSchema: z.object({
      response: z.string().describe('The response from the booking agent'),
    }),
    execute: async ({ context }) => {
      const query = (context as { query: string }).query;
      console.log('\n📅 [DIRECT] call-booking-agent | Query:', query);

      if (!globalMastraInstance) throw new Error('Mastra not initialized');

      const agent = globalMastraInstance.getAgent('bookingAgent');
      if (!agent) throw new Error('Booking agent not found');

      const response = await agent.generate([{ role: 'user', content: query }]);
      console.log("response-booking-agent", response.text)
      return { response: response.text };
    },
  });

  return {
    executeVehicleWorkflow: executeVehicleWorkflowTool,
    executeBookingWorkflow: executeBookingWorkflowTool,
    callVehicleAgent: callVehicleAgentTool,
    callBookingAgent: callBookingAgentTool,
  };
}
