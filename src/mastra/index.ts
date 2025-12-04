
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { vehicleWorkflow } from './workflows/vehicle-workflow';
import { bookingWorkflow } from './workflows/booking-workflow';
import { createRouterAgent } from './agents/router-agent';
import { vehicleAgent } from './agents/vehicle-agent';
import { bookingAgent } from './agents/booking-agent';
import { setMastraInstance } from './tools/router-tools';

// Create router agent first (tools will access globalMastraInstance when executed)
// The global instance will be set after Mastra is created
const routerAgent = createRouterAgent();

// Create Mastra instance with all agents including router
export const mastra = new Mastra({
  workflows: { 
    vehicleWorkflow,
    bookingWorkflow,
  },
  agents: { 
    routerAgent,
    vehicleAgent,
    bookingAgent,
  },
  storage: new LibSQLStore({
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  telemetry: {
    // Telemetry is deprecated and will be removed in the Nov 4th release
    enabled: false, 
  },
  observability: {
    // Enables DefaultExporter and CloudExporter for AI tracing
    default: { enabled: true }, 
  },
});

// Set mastra instance for tools to use (tools access this when executed)
setMastraInstance(mastra);
