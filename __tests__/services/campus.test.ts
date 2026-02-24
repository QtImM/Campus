import { fetchPostById } from '../../services/campus';
import { supabase } from '../../services/supabase';

// Mock the supabase client
jest.mock('../../services/supabase', () => ({
    supabase: {
        from: jest.fn(),
        storage: {
            from: jest.fn(),
        },
        channel: jest.fn(),
        removeChannel: jest.fn(),
    },
}));

// Mock the moderation service since it is used in campus.ts
jest.mock('../../services/moderation', () => ({
    getBlockedUserIds: jest.fn().mockResolvedValue([]),
}));

describe('Campus Service - fetchPostById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return null when supabase returns an error', async () => {
        const mockSingle = jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Network error' }
        });
        const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
        (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

        const result = await fetchPostById('123');
        expect(result).toBeNull();

        // Verify query chain
        expect(supabase.from).toHaveBeenCalledWith('posts');
        expect(mockSelect).toHaveBeenCalledWith('*, author:users!author_id(*)');
        expect(mockEq).toHaveBeenCalledWith('id', '123');
    });

    it('should return mapped post when supabase returns valid data', async () => {
        const mockDbRow = {
            id: 'post-123',
            author_id: 'user-456',
            author: {
                display_name: 'Test Artist',
                major: 'Computer Science',
                avatar_url: 'https://avatar.com/123.jpg'
            },
            content: 'Hello Campus!',
            type: 'event',
            images: ['https://image.url/pic1.jpg'],
            likes: 10,
            comments_count: 2,
            is_anonymous: false,
            created_at: '2023-01-01T10:00:00.000Z',
        };

        const mockSingle = jest.fn().mockResolvedValue({
            data: mockDbRow,
            error: null
        });
        const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
        (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

        const result = await fetchPostById('post-123');

        expect(result).not.toBeNull();
        if (result) {
            expect(result.id).toBe('post-123');
            expect(result.authorName).toBe('Test Artist');
            expect(result.category).toBe('Events'); // Mapped correctly
            expect(result.imageUrl).toBe('https://image.url/pic1.jpg');
            expect(result.images).toEqual(['https://image.url/pic1.jpg']);
            expect(result.likes).toBe(10);
            expect(result.comments).toBe(2);
            expect(result.isAnonymous).toBeFalsy();
        }
    });

    it('should map anonymous correctly if is_anonymous is true', async () => {
        const mockDbRow = {
            id: 'post-anon',
            author_name: 'Anonymous User',
            author_major: 'Unknown',
            content: 'Secret post',
            type: 'review',
            images: [],
            likes: 5,
            comments_count: 0,
            is_anonymous: true,
            created_at: '2023-01-01T10:00:00.000Z',
        };

        const mockSingle = jest.fn().mockResolvedValue({
            data: mockDbRow,
            error: null
        });
        const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
        (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

        const result = await fetchPostById('post-anon');

        expect(result).not.toBeNull();
        if (result) {
            expect(result.isAnonymous).toBeTruthy();
            expect(result.authorName).toBe('Anonymous User');
            expect(result.authorMajor).toBe('Unknown');
            expect(result.authorAvatar).toBeUndefined();
        }
    });
});
