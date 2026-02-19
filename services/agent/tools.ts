import { ToolDefinition } from './types';

export const TOOLS: ToolDefinition[] = [
    {
        name: 'search_canteen_menu',
        description: 'Search for canteen menus and recommendations based on location.',
        parameters: {
            type: 'object',
            properties: {
                location: { type: 'string', description: 'User location or specific canteen name' },
                preference: { type: 'string', description: 'Food preference (e.g., spicy, vegetarian)' }
            },
            required: ['location']
        }
    },
    {
        name: 'check_library_availability',
        description: 'Query availability. If libraryName is provided but roomType is not, it returns available Room Types. If both are provided, it returns available Time Slots.',
        parameters: {
            type: 'object',
            properties: {
                libraryName: {
                    type: 'string',
                    description: 'Name of the library (Main Library, Shek Mun Campus Library, AAB Learning Commons)'
                },
                roomType: {
                    type: 'string',
                    description: 'Type of room (Group Study Rooms, Individual Study Rooms, Multipurpose Rooms)'
                }
            },
            required: ['libraryName']
        }
    },
    {
        name: 'book_library_seat',
        description: 'Book a seat in the library. Requires user confirmation step.',
        parameters: {
            type: 'object',
            properties: {
                seatId: { type: 'string', description: 'ID of the seat to book' },
                time: { type: 'string', description: 'Booking time (e.g., 14:00)' }
            },
            required: ['seatId', 'time']
        }
    },
    {
        name: 'get_user_profile',
        description: 'Get user preferences like major, residence hall, and favorite food. Used for semantic memory.',
        parameters: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'save_user_preference',
        description: 'Store a user preference or fact to persistent memory.',
        parameters: {
            type: 'object',
            properties: {
                key: { type: 'string', description: 'The key for the fact (e.g., hall, major, food)' },
                value: { type: 'string', description: 'The value to store' }
            },
            required: ['key', 'value']
        }
    }
];
