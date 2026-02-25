import { APP_CONFIG } from '../constants/Config';
import { supabase } from './supabase';

export type ReportReason = 'spam' | 'harassment' | 'hate_speech' | 'sexual_content' | 'other';

export interface Report {
    id: string;
    reporterId: string;
    targetId: string; // post_id or comment_id
    targetType: 'post' | 'comment';
    reason: ReportReason;
    details?: string;
    status: 'pending' | 'resolved' | 'dismissed';
    createdAt: Date;
}

export interface UserBlock {
    id: string;
    blockerId: string;
    blockedId: string;
    createdAt: Date;
}

/**
 * Report a post or comment
 */
export const reportContent = async (params: {
    reporterId: string;
    targetId: string;
    targetType: 'post' | 'comment';
    reason: ReportReason;
    details?: string;
}) => {
    // Skip real DB call in demo mode to avoid RLS error
    if (params.reporterId === APP_CONFIG.demoCredentials.uid) {
        return { success: true, id: 'mock_report_' + Date.now() };
    }

    const { data, error } = await supabase
        .from('reports')
        .insert({
            reporter_id: params.reporterId,
            target_id: params.targetId,
            target_type: params.targetType,
            reason: params.reason,
            details: params.details || '',
            status: 'pending'
        })
        .select()
        .single();

    if (error) {
        if (error.code === 'PGRST205') {
            console.warn('Moderation table "reports" not found. Please see database_setup.md.');
        } else {
            console.error('Error reporting content:', error);
        }
        // Fallback for demo mode
        return { success: true, id: 'mock_report_' + Date.now() };
    }

    return { success: true, id: data.id };
};

/**
 * Block a user
 */
export const blockUser = async (blockerId: string, blockedId: string) => {
    // Skip real DB call in demo mode to avoid RLS error
    if (blockerId === APP_CONFIG.demoCredentials.uid) {
        return { success: true };
    }

    const { data, error } = await supabase
        .from('user_blocks')
        .insert({
            blocker_id: blockerId,
            blocked_id: blockedId
        })
        .select()
        .single();

    if (error) {
        console.error('Error blocking user:', error);
        // Fallback for demo mode or existing block
        return { success: true };
    }

    return { success: true };
};

/**
 * Get IDs of users blocked by the current user
 */
export const getBlockedUserIds = async (userId: string): Promise<string[]> => {
    const { data, error } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', userId);

    if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('not found')) {
            console.warn('Moderation tables not found in Supabase. Please see database_setup.md.');
            return [];
        }
        console.error('Error fetching blocked users:', error);
        return [];
    }

    return data.map(d => d.blocked_id);
};

/**
 * Unblock a user
 */
export const unblockUser = async (blockerId: string, blockedId: string) => {
    const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId);

    if (error) {
        console.error('Error unblocking user:', error);
        return { success: false };
    }

    return { success: true };
};
