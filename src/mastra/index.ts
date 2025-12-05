import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { vehicleWorkflow } from './workflows/vehicle-workflow';
import { bookingWorkflow } from './workflows/booking-workflow';
import { createRouterAgent } from './agents/router-agent';
import { vehicleAgent } from './agents/vehicle-agent';
import { bookingAgent } from './agents/booking-agent';
import { setMastraInstance } from './tools/router-tools';

// Create router agent
const routerAgent = createRouterAgent();

// Create Mastra instance
export const mastra = new Mastra({
  workflows: { 
    'vehicle-workflow': vehicleWorkflow,
    'booking-workflow': bookingWorkflow,
  },
  agents: { 
    routerAgent,
    vehicleAgent,
    bookingAgent,
  },
  storage: new LibSQLStore({
    url: ':memory:',
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  telemetry: {
    enabled: false, 
  },
  observability: {
    default: { enabled: true }, 
  },
});

// Set mastra instance for tools
setMastraInstance(mastra);
