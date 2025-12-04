import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// ============================================================================
// SCHEMAS - Define data structures with Zod for type safety
// ============================================================================

/**
 * Schema for analyzed vehicle requirements
 * Output of Step 1, Input of Step 2
 */
const vehicleRequirementsSchema = z.object({
  vehicleType: z.string().describe('Type of vehicle (SUV, Sedan, Hatchback, etc.)'),
  budget: z.string().optional().describe('Budget range'),
  useCase: z.string().describe('Primary use case for the vehicle'),
  preferences: z.string().optional().describe('Additional preferences'),
  originalQuery: z.string().describe('Original user query for context'),
});

/**
 * Schema for final vehicle comparison output
 * Final output of the workflow
 */
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
  analyzedRequirements: vehicleRequirementsSchema.optional(),
});

// ============================================================================
// STEP 1: Analyze Requirements
// Responsibility: Extract structured data from user's natural language query
// ============================================================================

const analyzeRequirements = createStep({
  id: 'analyze-requirements',
  description: 'Analyzes user requirements for vehicle selection',
  inputSchema: z.object({
    query: z.string().describe('User query about vehicles'),
  }),
  outputSchema: vehicleRequirementsSchema,
  execute: async ({ inputData }) => {
    if (!inputData?.query) {
      throw new Error('Query is required');
    }

    console.log('📊 [Step 1: Analyze] Processing user query...');
    const query = inputData.query.toLowerCase();
    const originalQuery = inputData.query;

    // ─────────────────────────────────────────────────────────────────────────
    // Vehicle Type Detection
    // ─────────────────────────────────────────────────────────────────────────
    const vehicleTypeMap: Record<string, string[]> = {
      'SUV': ['suv', 'sport utility', 'crossover', 'compact suv'],
      'Hatchback': ['hatchback', 'hatch', 'hot hatch'],
      'Sedan': ['sedan', 'saloon', 'compact car'],
      'Coupe': ['coupe', 'sports car', 'gt'],
      'Truck': ['truck', 'pickup', 'bakkie', 'ute'],
      'Minivan': ['minivan', 'mpv', 'van', 'people carrier'],
      'Electric': ['electric', 'ev', 'tesla', 'battery'],
      'Hybrid': ['hybrid', 'phev', 'plug-in'],
      'Luxury': ['luxury', 'premium', 'executive'],
    };

    let vehicleType = 'Sedan'; // default
    for (const [type, keywords] of Object.entries(vehicleTypeMap)) {
      if (keywords.some(kw => query.includes(kw))) {
        vehicleType = type;
        break;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Use Case Detection
    // ─────────────────────────────────────────────────────────────────────────
    const useCaseMap: Record<string, string[]> = {
      'Family transportation': ['family', 'kids', 'children', 'spacious', 'room'],
      'Daily commuting': ['commute', 'work', 'daily', 'office', 'city'],
      'Off-road and adventure': ['off-road', 'adventure', 'outdoor', '4x4', 'trail', 'camping'],
      'Luxury and comfort': ['luxury', 'premium', 'comfort', 'executive', 'business'],
      'Fuel efficiency': ['fuel efficient', 'economical', 'mileage', 'gas saver', 'eco'],
      'Performance': ['fast', 'speed', 'performance', 'sporty', 'racing', 'powerful'],
      'Towing and hauling': ['tow', 'haul', 'trailer', 'cargo', 'load'],
    };

    let useCase = 'General use';
    for (const [uc, keywords] of Object.entries(useCaseMap)) {
      if (keywords.some(kw => query.includes(kw))) {
        useCase = uc;
        break;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Budget Detection
    // ─────────────────────────────────────────────────────────────────────────
    let budget = '';
    if (/budget|cheap|affordable|under \d+|less than|inexpensive/i.test(query)) {
      budget = 'Budget-friendly (Under $30,000)';
    } else if (/premium|luxury|expensive|high.?end|top.?of/i.test(query)) {
      budget = 'Premium ($50,000+)';
    } else if (/mid.?range|moderate|average|reasonable/i.test(query)) {
      budget = 'Mid-range ($30,000 - $50,000)';
    }

    // Extract specific price if mentioned
    const priceMatch = query.match(/(\$?\d{1,3}[,\s]?\d{3}|\d+k)/i);
    if (priceMatch) {
      budget = `Around ${priceMatch[0]}`;
    }

    const result = {
      vehicleType,
      useCase,
      budget,
      preferences: originalQuery,
      originalQuery,
    };

    console.log('✅ [Step 1: Complete] Requirements extracted:');
    console.log(`   • Vehicle Type: ${result.vehicleType}`);
    console.log(`   • Use Case: ${result.useCase}`);
    console.log(`   • Budget: ${result.budget || 'Not specified'}`);

    return result;
  },
});

// ============================================================================
// STEP 2: Generate Recommendations
// Responsibility: Use AI agent to generate personalized vehicle recommendations
// ============================================================================

const generateRecommendations = createStep({
  id: 'generate-recommendations',
  description: 'Generates vehicle recommendations using the vehicle agent',
  inputSchema: vehicleRequirementsSchema,
  outputSchema: vehicleComparisonSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    console.log('🤖 [Step 2: Generate] Creating AI recommendations...');

    // Get the vehicle agent from Mastra
    const agent = mastra?.getAgent('vehicleAgent');
    if (!agent) {
      throw new Error('Vehicle agent not found. Ensure vehicleAgent is registered with Mastra.');
    }

    // Construct a detailed prompt for the AI
    const prompt = `You are an expert automotive consultant. Based on the following requirements, provide detailed and helpful vehicle recommendations.

## Customer Requirements:
- **Preferred Vehicle Type:** ${inputData.vehicleType}
- **Primary Use Case:** ${inputData.useCase}
- **Budget:** ${inputData.budget || 'Flexible / Not specified'}
- **Original Request:** "${inputData.originalQuery}"

## Please Provide:

### 🚗 Top 3-5 Vehicle Recommendations
For each vehicle, include:
1. **Name & Model** (with year if relevant)
2. **Vehicle Type** (SUV, Sedan, etc.)
3. **Price Range** (MSRP estimate)
4. **Fuel Efficiency** (City/Highway MPG or range for EVs)
5. **Key Features** (Top 4-5 standout features)
6. **Pros** (2-3 advantages)
7. **Cons** (1-2 potential drawbacks)

### 🏆 Top Recommendation
Provide your #1 pick with detailed reasoning based on the customer's specific needs.

### 💡 Additional Tips
Any relevant advice for this type of purchase.

Format your response clearly with sections and bullet points for easy reading.`;

    try {
      const response = await agent.generate([
        { role: 'user', content: prompt },
      ]);

      console.log('✅ [Step 2: Complete] AI recommendations generated');
      console.log(`   • Response length: ${response.text.length} characters`);

      // Return structured output with the AI response
      return {
        vehicles: [
          {
            name: 'See detailed recommendations below',
            type: inputData.vehicleType,
            price: 'Varies by model',
            fuelEfficiency: 'See details in recommendation',
            features: ['Tailored to your requirements'],
            pros: ['Based on your specific needs'],
            cons: ['Compare options carefully'],
          },
        ],
        recommendation: response.text,
        analyzedRequirements: inputData,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [Step 2: Error] AI generation failed:', errorMessage);

      // Return graceful fallback instead of throwing
      return {
        vehicles: [],
        recommendation: `I apologize, but I encountered an issue generating vehicle recommendations. 

**Error:** ${errorMessage}

**Suggestions:**
- Please try again with a more specific query
- Include details like budget, vehicle type, and intended use
- Example: "Recommend an SUV for a family of 4, budget around $40,000"`,
        analyzedRequirements: inputData,
      };
    }
  },
});

// ============================================================================
// WORKFLOW DEFINITION
// Chains steps together: Analyze → Generate
// ============================================================================

const vehicleWorkflow = createWorkflow({
  id: 'vehicle-workflow',
  inputSchema: z.object({
    query: z.string().describe('User query about vehicle recommendations'),
  }),
  outputSchema: vehicleComparisonSchema,
})
  .then(analyzeRequirements)
  .then(generateRecommendations);

// Finalize the workflow
vehicleWorkflow.commit();

export { vehicleWorkflow };
