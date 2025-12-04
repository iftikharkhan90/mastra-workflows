import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// ============================================================================
// SCHEMAS - Define data structures with Zod for type safety
// ============================================================================

/**
 * Booking types supported by the system
 */
const BookingTypeEnum = z.enum(['Hotel', 'Restaurant', 'Event', 'Flight', 'General']);
type BookingType = z.infer<typeof BookingTypeEnum>;

/**
 * Schema for parsed booking request
 * Output of Step 1, Input of Step 2
 */
const bookingRequestSchema = z.object({
  bookingType: BookingTypeEnum.describe('Type of booking'),
  location: z.string().optional().describe('Location for the booking'),
  date: z.string().optional().describe('Date for the booking'),
  guests: z.number().optional().describe('Number of guests'),
  preferences: z.string().optional().describe('Additional preferences'),
  originalQuery: z.string().describe('Original user query for context'),
});

/**
 * Schema for final booking options output
 * Final output of the workflow
 */
const bookingOptionsSchema = z.object({
  options: z.array(z.object({
    name: z.string(),
    type: z.string(),
    location: z.string(),
    availability: z.string(),
    price: z.string(),
    rating: z.string().optional(),
    features: z.array(z.string()),
  })),
  recommendation: z.string(),
  bookingDetails: z.string(),
  parsedRequest: bookingRequestSchema.optional(),
});

// ============================================================================
// STEP 1: Parse Booking Request
// Responsibility: Extract structured booking data from user's natural language
// ============================================================================

const parseBookingRequest = createStep({
  id: 'parse-booking-request',
  description: 'Parses user booking request to extract details',
  inputSchema: z.object({
    query: z.string().describe('User query about booking'),
  }),
  outputSchema: bookingRequestSchema,
  execute: async ({ inputData }) => {
    if (!inputData?.query) {
      throw new Error('Query is required');
    }

    console.log('📊 [Step 1: Parse] Processing booking request...');
    const query = inputData.query.toLowerCase();
    const originalQuery = inputData.query;

    // ─────────────────────────────────────────────────────────────────────────
    // Booking Type Detection
    // ─────────────────────────────────────────────────────────────────────────
    const bookingTypeMap: Record<BookingType, string[]> = {
      'Hotel': ['hotel', 'accommodation', 'stay', 'room', 'resort', 'inn', 'motel', 'airbnb', 'lodge'],
      'Restaurant': ['restaurant', 'dining', 'dinner', 'lunch', 'breakfast', 'cafe', 'table', 'eat', 'food'],
      'Event': ['event', 'concert', 'show', 'theater', 'theatre', 'ticket', 'match', 'game', 'movie', 'cinema'],
      'Flight': ['flight', 'airline', 'plane', 'air ticket', 'fly', 'airport'],
      'General': [],
    };

    let bookingType: BookingType = 'General';
    for (const [type, keywords] of Object.entries(bookingTypeMap) as [BookingType, string[]][]) {
      if (keywords.some(kw => query.includes(kw))) {
        bookingType = type;
        break;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Location Extraction (Improved patterns)
    // ─────────────────────────────────────────────────────────────────────────
    let location: string | undefined;
    const locationPatterns = [
      /(?:in|at|near|to|for)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z]?[a-zA-Z]+)*)/i,
      /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:hotel|restaurant|flight|airport)/i,
    ];

    for (const pattern of locationPatterns) {
      const match = originalQuery.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        // Filter out common words that aren't locations
        const commonWords = ['the', 'for', 'with', 'and', 'best', 'good', 'nice', 'great'];
        if (!commonWords.includes(match[1].toLowerCase())) {
          location = match[1].trim();
          break;
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Date Extraction (Multiple formats supported)
    // ─────────────────────────────────────────────────────────────────────────
    let date: string | undefined;
    const datePatterns = [
      { pattern: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/, name: 'numeric' },
      { pattern: /(today|tomorrow|tonight)/i, name: 'relative' },
      { pattern: /(next\s+(?:week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i, name: 'next' },
      { pattern: /(?:on|for)\s+(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{4})?)/i, name: 'specific' },
      { pattern: /(this\s+(?:weekend|friday|saturday|sunday))/i, name: 'this' },
    ];

    for (const { pattern } of datePatterns) {
      const match = query.match(pattern);
      if (match) {
        date = match[1] || match[0];
        break;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Guest Count Extraction (Words and numbers)
    // ─────────────────────────────────────────────────────────────────────────
    let guests: number | undefined;
    const wordToNumber: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
      eleven: 11, twelve: 12,
    };

    const guestPatterns = [
      /(\d+)\s*(?:people|guests|persons|pax|members|adults|travelers)/i,
      /(?:for|with|party of)\s*(\d+)/i,
      /(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:people|guests|persons|pax|members)?/i,
    ];

    for (const pattern of guestPatterns) {
      const match = query.match(pattern);
      if (match) {
        const numStr = match[1].toLowerCase();
        guests = wordToNumber[numStr] ?? parseInt(numStr, 10);
        if (!isNaN(guests)) break;
      }
    }

    const result = {
      bookingType,
      location,
      date,
      guests,
      preferences: originalQuery,
      originalQuery,
    };

    console.log('✅ [Step 1: Complete] Request parsed:');
    console.log(`   • Booking Type: ${result.bookingType}`);
    console.log(`   • Location: ${result.location || 'Not specified'}`);
    console.log(`   • Date: ${result.date || 'Not specified'}`);
    console.log(`   • Guests: ${result.guests || 'Not specified'}`);

    return result;
  },
});

// ============================================================================
// STEP 2: Generate Booking Options
// Responsibility: Use AI agent to generate personalized booking recommendations
// ============================================================================

const generateBookingOptions = createStep({
  id: 'generate-booking-options',
  description: 'Generates booking options using the booking agent',
  inputSchema: bookingRequestSchema,
  outputSchema: bookingOptionsSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    console.log('🤖 [Step 2: Generate] Creating AI booking options...');

    // Get the booking agent from Mastra
    const agent = mastra?.getAgent('bookingAgent');
    if (!agent) {
      throw new Error('Booking agent not found. Ensure bookingAgent is registered with Mastra.');
    }

    // Construct booking-specific prompts based on type
    const typeSpecificInfo: Record<BookingType, string> = {
      Hotel: 'Include: star rating, amenities (WiFi, pool, parking), room types, check-in/out times',
      Restaurant: 'Include: cuisine type, ambiance, price range ($ to $$$$), dietary options, dress code',
      Event: 'Include: venue details, seating sections, event date/time, age restrictions',
      Flight: 'Include: airlines, flight times, layovers, baggage policy, class options',
      General: 'Include all relevant details for the booking type',
    };

    const prompt = `You are an expert booking assistant. Based on the following request, provide helpful and detailed booking recommendations.

## Booking Request Details:
- **Type:** ${inputData.bookingType}
- **Location:** ${inputData.location || 'Not specified - please suggest popular options'}
- **Date:** ${inputData.date || 'Flexible'}
- **Number of Guests:** ${inputData.guests || 'Not specified'}
- **Original Request:** "${inputData.originalQuery}"

## Type-Specific Requirements:
${typeSpecificInfo[inputData.bookingType]}

## Please Provide:

### 🏆 Top 3-5 ${inputData.bookingType} Options
For each option, include:
1. **Name** (with location/address)
2. **Price Range** (per night/person/ticket)
3. **Rating** (out of 5 stars)
4. **Key Features/Amenities** (4-5 highlights)
5. **Availability Status**
6. **Why It's a Good Match** (brief reason)

### ⭐ Top Recommendation
Your #1 pick with detailed reasoning based on the request.

### 📝 Booking Steps
Clear steps to complete this booking (online, phone, requirements).

### 💡 Pro Tips
Any insider tips or things to consider for this booking.

Format your response clearly with sections and bullet points.`;

    try {
      const response = await agent.generate([
        { role: 'user', content: prompt },
      ]);

      console.log('✅ [Step 2: Complete] AI booking options generated');
      console.log(`   • Response length: ${response.text.length} characters`);

      // Construct booking details summary
      const bookingDetailsParts = [
        `Booking Type: ${inputData.bookingType}`,
        inputData.guests ? `Guests: ${inputData.guests}` : null,
        inputData.date ? `Date: ${inputData.date}` : null,
        inputData.location ? `Location: ${inputData.location}` : null,
        'Please contact the provider directly to confirm availability and complete your booking.',
      ].filter(Boolean);

      return {
        options: [
          {
            name: 'See detailed options below',
            type: inputData.bookingType,
            location: inputData.location || 'Various locations',
            availability: 'Check details in recommendation',
            price: 'Varies by selection',
            rating: 'See individual ratings below',
            features: ['Tailored to your requirements'],
          },
        ],
        recommendation: response.text,
        bookingDetails: bookingDetailsParts.join(' | '),
        parsedRequest: inputData,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ [Step 2: Error] AI generation failed:', errorMessage);

      // Return graceful fallback
      return {
        options: [],
        recommendation: `I apologize, but I encountered an issue generating booking options.

**Error:** ${errorMessage}

**Suggestions:**
- Please try again with a more specific query
- Include details like location, date, and number of guests
- Example: "Book a hotel in New York for 2 guests on December 15th"`,
        bookingDetails: 'Please contact support for assistance with your booking.',
        parsedRequest: inputData,
      };
    }
  },
});

// ============================================================================
// WORKFLOW DEFINITION
// Chains steps together: Parse → Generate
// ============================================================================

const bookingWorkflow = createWorkflow({
  id: 'booking-workflow',
  inputSchema: z.object({
    query: z.string().describe('User query about booking'),
  }),
  outputSchema: bookingOptionsSchema,
})
  .then(parseBookingRequest)
  .then(generateBookingOptions);

// Finalize the workflow
bookingWorkflow.commit();

export { bookingWorkflow };
