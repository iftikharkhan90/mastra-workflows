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
// Production-level helper for executing workflows properly
// ============================================================================

interface WorkflowResult<T> {
  status: string;
  result?: T;
  error?: string;
}

async function executeWorkflow<TInput extends Record<string, unknown>, TOutput>(
  workflowId: string,
  input: TInput,
  logPrefix: string
): Promise<TOutput> {
  if (!globalMastraInstance) {
    throw new Error('Mastra instance not initialized. Call setMastraInstance() first.');
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`${logPrefix} Starting workflow execution`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📥 Input:`, JSON.stringify(input, null, 2));

  // Get the workflow from mastra
  const workflow = globalMastraInstance.getWorkflow(workflowId);
  if (!workflow) {
    throw new Error(`Workflow '${workflowId}' not found`);
  }

  // Create a unique run ID for tracking
  const runId = `run-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  console.log(`🆔 Run ID: ${runId}`);

  // Create the workflow run instance
  const run = workflow.createRun({ runId });
  console.log(`✅ Workflow run created`);

  // Start the workflow with input data
  console.log(`🚀 Starting workflow execution...`);
  const startTime = Date.now();

  const result = await run.start({ inputData: input }) as WorkflowResult<TOutput>;

  const duration = Date.now() - startTime;
  console.log(`⏱️  Execution time: ${duration}ms`);

  // Check workflow result status
  if (result.status === 'success') {
    console.log(`✅ Workflow completed successfully`);
    const outputPreview = JSON.stringify(result.result, null, 2);
    console.log(`📤 Output: ${outputPreview.substring(0, 500)}${outputPreview.length > 500 ? '...' : ''}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return result.result as TOutput;
  } else {
    console.error(`❌ Workflow failed with status: ${result.status}`);
    console.error(`   Error: ${result.error || 'Unknown error'}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    throw new Error(`Workflow execution failed: ${result.status}`);
  }
}

// ============================================================================
// ROUTER TOOLS
// Production-level tools that properly execute workflows
// ============================================================================

export function createRouterTools() {
  /**
   * Tool for executing vehicle workflow
   * CLEAN: Uses workflow.createRun().start() pattern
   */
  const executeVehicleWorkflowTool = createTool({
    id: 'execute-vehicle-workflow',
    description: 'Executes the vehicle workflow to get vehicle recommendations, comparisons, or information. Use this when the user asks about vehicles, cars, SUVs, or vehicle-related queries.',
    inputSchema: z.object({
      query: z.string().describe('The user\'s vehicle-related query'),
    }),
    outputSchema: z.object({
      result: z.any().describe('The result from the vehicle workflow'),
    }),
    execute: async ({ context }) => {
      const query = (context as { query: string }).query;

      if (!query) {
        throw new Error('Query parameter is required');
      }

      try {
        // ✅ PRODUCTION: Execute workflow properly - no duplicate logic!
        const result = await executeWorkflow(
          'vehicle-workflow',
          { query },
          '🚗 [VEHICLE WORKFLOW]'
        );

        return { result };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`❌ Vehicle workflow failed: ${errorMessage}`);
        throw new Error(`Failed to execute vehicle workflow: ${errorMessage}`);
      }
    },
  });

  /**
   * Tool for executing booking workflow
   * CLEAN: Uses workflow.createRun().start() pattern
   */
  const executeBookingWorkflowTool = createTool({
    id: 'execute-booking-workflow',
    description: 'Executes the booking workflow to handle booking requests, reservations, hotels, restaurants, events. Use this when the user asks about bookings, reservations, or making appointments.',
    inputSchema: z.object({
      query: z.string().describe('The user\'s booking-related query'),
    }),
    outputSchema: z.object({
      result: z.any().describe('The result from the booking workflow'),
    }),
    execute: async ({ context }) => {
      const query = (context as { query: string }).query;

      if (!query) {
        throw new Error('Query parameter is required');
      }

      try {
        // ✅ PRODUCTION: Execute workflow properly - no duplicate logic!
        const result = await executeWorkflow(
          'booking-workflow',
          { query },
          '📅 [BOOKING WORKFLOW]'
        );

        return { result };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`❌ Booking workflow failed: ${errorMessage}`);
        throw new Error(`Failed to execute booking workflow: ${errorMessage}`);
      }
    },
  });

  /**
   * Tool for calling vehicle agent directly
   * Use for quick queries that don't need full workflow processing
   */
  const callVehicleAgentTool = createTool({
    id: 'call-vehicle-agent',
    description: 'Calls the vehicle agent directly for quick vehicle-related queries without full workflow processing.',
    inputSchema: z.object({
      query: z.string().describe('The user\'s vehicle-related query'),
    }),
    outputSchema: z.object({
      response: z.string().describe('The response from the vehicle agent'),
    }),
    execute: async ({ context }) => {
      const query = (context as { query: string }).query;

      if (!globalMastraInstance) {
        throw new Error('Mastra instance not initialized');
      }

      console.log(`\n🚗 [DIRECT AGENT] Calling vehicleAgent`);
      console.log(`📥 Query: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"`);

      const agent = globalMastraInstance.getAgent('vehicleAgent');
      if (!agent) {
        throw new Error('Vehicle agent not found');
      }

      const response = await agent.generate([
        { role: 'user', content: query },
      ]);

      console.log(`✅ Response received (${response.text.length} chars)\n`);

      return { response: response.text };
    },
  });

  /**
   * Tool for calling booking agent directly
   * Use for quick queries that don't need full workflow processing
   */
  const callBookingAgentTool = createTool({
    id: 'call-booking-agent',
    description: 'Calls the booking agent directly for quick booking-related queries without full workflow processing.',
    inputSchema: z.object({
      query: z.string().describe('The user\'s booking-related query'),
    }),
    outputSchema: z.object({
      response: z.string().describe('The response from the booking agent'),
    }),
    execute: async ({ context }) => {
      const query = (context as { query: string }).query;

      if (!globalMastraInstance) {
        throw new Error('Mastra instance not initialized');
      }

      console.log(`\n📅 [DIRECT AGENT] Calling bookingAgent`);
      console.log(`📥 Query: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"`);

      const agent = globalMastraInstance.getAgent('bookingAgent');
      if (!agent) {
        throw new Error('Booking agent not found');
      }

      const response = await agent.generate([
        { role: 'user', content: query },
      ]);

      console.log(`✅ Response received (${response.text.length} chars)\n`);

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
