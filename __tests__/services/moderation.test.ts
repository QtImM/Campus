import { getBlockedUserIds, reportContent } from '../../services/moderation';
import { supabase } from '../../services/supabase';

// Mock the supabase client
jest.mock('../../services/supabase', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

// Mock APP_CONFIG
jest.mock('../../constants/Config', () => ({
    APP_CONFIG: {
        demoCredentials: {
            uid: 'demo-user-123'
        }
    }
}));

describe('AI Content Moderation & Reporting Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('reportContent should bypass DB for demo user credentials', async () => {
        const result = await reportContent({
            reporterId: 'demo-user-123',
            targetId: 'post-1',
            targetType: 'post',
            reason: 'spam'
        });

        expect(result.success).toBe(true);
        expect(result.id).toMatch(/^mock_report_/);
        expect(supabase.from).not.toHaveBeenCalled();
    });

    it('reportContent should insert to DB for regular user', async () => {
        const mockSingle = jest.fn().mockResolvedValue({
            data: { id: 'real_report_456' },
            error: null
        });
        const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
        const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
        (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

        const result = await reportContent({
            reporterId: 'regular-user-789',
            targetId: 'comment-2',
            targetType: 'comment',
            reason: 'harassment',
            details: 'vulgar language'
        });

        expect(supabase.from).toHaveBeenCalledWith('reports');
        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
            reporter_id: 'regular-user-789',
            target_id: 'comment-2',
            target_type: 'comment',
            reason: 'harassment',
            details: 'vulgar language',
            status: 'pending'
        }));
        expect(result.success).toBe(true);
        expect(result.id).toBe('real_report_456');
    });

    it('getBlockedUserIds should map data correctly', async () => {
        const mockData = [
            { blocked_id: 'userA' },
            { blocked_id: 'userB' }
        ];

        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: mockData, error: null })
            })
        });

        const blockedIds = await getBlockedUserIds('me-111');
        expect(blockedIds).toEqual(['userA', 'userB']);
    });
});
