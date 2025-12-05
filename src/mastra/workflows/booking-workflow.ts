import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

const BookingTypeEnum = z.enum(['Hotel', 'Restaurant', 'Event', 'Flight', 'General']);
type BookingType = z.infer<typeof BookingTypeEnum>;

const bookingRequestSchema = z.object({
  bookingType: BookingTypeEnum.describe('Type of booking'),
  location: z.string().optional().describe('Location for the booking'),
  date: z.string().optional().describe('Date for the booking'),
  guests: z.number().optional().describe('Number of guests'),
  preferences: z.string().optional().describe('Additional preferences'),
  originalQuery: z.string().describe('Original user query for context'),
});

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
// ============================================================================

const parseBookingRequest = createStep({
  id: 'parse-booking-request',
  description: 'Parses user booking request to extract details',
  inputSchema: z.object({
    query: z.string().describe('User query about booking'),
  }),
  outputSchema: bookingRequestSchema,
  execute: async ({ inputData }) => {
    console.log('[STEP 1] parseBookingRequest | Input:', inputData?.query);

    if (!inputData?.query) {
      throw new Error('Query is required');
    }

    const query = inputData.query.toLowerCase();
    const originalQuery = inputData.query;

    // Booking type detection
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

    // Location extraction
    let location: string | undefined;
    const locationPatterns = [
      /(?:in|at|near|to|for)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z]?[a-zA-Z]+)*)/i,
      /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\s+(?:hotel|restaurant|flight|airport)/i,
    ];

    for (const pattern of locationPatterns) {
      const match = originalQuery.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        const commonWords = ['the', 'for', 'with', 'and', 'best', 'good', 'nice', 'great', 'living', 'staying'];
        if (!commonWords.includes(match[1].toLowerCase())) {
          location = match[1].trim();
          break;
        }
      }
    }

    // Date extraction
    let date: string | undefined;
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      /(today|tomorrow|tonight)/i,
      /(next\s+(?:week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i,
    ];

    for (const pattern of datePatterns) {
      const match = query.match(pattern);
      if (match) {
        date = match[1] || match[0];
        break;
      }
    }

    // Guest count extraction
    let guests: number | undefined;
    const wordToNumber: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5,
      six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    };

    const guestPatterns = [
      /(\d+)\s*(?:people|guests|persons|pax|members|adults)/i,
      /(?:for|with)\s*(\d+)/i,
      /(one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:people|guests|persons|pax|members)?/i,
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

    console.log('[STEP 1] Output:', { bookingType, location: location || 'N/A', date: date || 'N/A', guests: guests || 'N/A' });

    return result;
  },
});

// ============================================================================
// STEP 2: Generate Booking Options
// ============================================================================

const generateBookingOptions = createStep({
  id: 'generate-booking-options',
  description: 'Generates booking options using the booking agent',
  inputSchema: bookingRequestSchema,
  outputSchema: bookingOptionsSchema,
  execute: async ({ inputData, mastra }) => {
    console.log('[STEP 2] generateBookingOptions | Type:', inputData?.bookingType);

    if (!inputData) {
      throw new Error('Input data not found');
    }

    const agent = mastra?.getAgent('bookingAgent');
    if (!agent) {
      throw new Error('Booking agent not found.');
    }

    const typeSpecificInfo: Record<BookingType, string> = {
      Hotel: 'Include: star rating, amenities, room types',
      Restaurant: 'Include: cuisine type, price range, ambiance',
      Event: 'Include: venue details, seating, timing',
      Flight: 'Include: airlines, times, layovers',
      General: 'Include all relevant details',
    };

    const prompt = `You are a booking assistant. Provide recommendations for:
- Type: ${inputData.bookingType}
- Location: ${inputData.location || 'Not specified'}
- Date: ${inputData.date || 'Flexible'}
- Guests: ${inputData.guests || 'Not specified'}
- Request: "${inputData.originalQuery}"

${typeSpecificInfo[inputData.bookingType]}

Provide 3-5 options with name, price, rating, and features.`;

    console.log('[STEP 2] Calling AI agent...');

    try {
      const startTime = Date.now();
      const response = await agent.generate([
        { role: 'user', content: prompt },
      ]);
      const duration = Date.now() - startTime;

      console.log('[STEP 2] AI response received in', duration, 'ms');

      const bookingDetailsParts = [
        `Type: ${inputData.bookingType}`,
        inputData.guests ? `Guests: ${inputData.guests}` : null,
        inputData.location ? `Location: ${inputData.location}` : null,
      ].filter(Boolean);

      return {
        options: [{
          name: 'See recommendations below',
          type: inputData.bookingType,
          location: inputData.location || 'Various',
          availability: 'Check details',
          price: 'Varies',
          rating: 'See below',
          features: ['Tailored to request'],
        }],
        recommendation: response.text,
        bookingDetails: bookingDetailsParts.join(' | '),
        parsedRequest: inputData,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('[STEP 2] Error:', errorMessage);

      return {
        options: [],
        recommendation: `Error: ${errorMessage}. Please try again.`,
        bookingDetails: 'Error occurred',
        parsedRequest: inputData,
      };
    }
  },
});

// ============================================================================
// WORKFLOW DEFINITION
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

bookingWorkflow.commit();

export { bookingWorkflow };
