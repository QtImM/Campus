import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { supabase } from './supabase';

const DEMO_MODE_KEY = 'hkcampus_demo_mode';

// Helper to check if we are in demo mode
export const isDemoMode = async () => {
    const value = await AsyncStorage.getItem(DEMO_MODE_KEY);
    return value === 'true';
};

// Sign up
export const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    if (error) throw error;
    return data.user ? { ...data.user, uid: data.user.id } : null;
};

// Sign in
export const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data.user ? { ...data.user, uid: data.user.id } : null;
};

// Sign out
export const signOut = async () => {
    await supabase.auth.signOut();
};

// Create user profile in Supabase (users table)
export const createUserProfile = async (
    uid: string,
    displayName: string,
    socialTags: string[],
    major: string,
    avatarUrl: string = ''
) => {
    const userData: User = {
        uid, // Will be stored as 'id' in DB if column name differs, but usually we map JSON
        displayName,
        socialTags,
        major,
        avatarUrl,
        createdAt: new Date(), // Supabase handles timestamp, but we keep structure
    };

    // We assume a 'users' table exists with these columns.
    // In Supabase, you might need to handle column name mapping (snake_case vs camelCase)
    // For now, we assume the table accepts this JSON (if columns match) or we map it:
    const { error } = await supabase
        .from('users')
        .upsert({
            id: uid,
            display_name: displayName,
            major: major,
            avatar_url: avatarUrl,
            social_tags: socialTags,
            updated_at: new Date().toISOString(),
        });

    if (error) {
        console.error('Error creating profile:', error);
        throw error; // Throw so the UI can show the error
    }
    return userData;
};

// Get user profile
export const getUserProfile = async (uid: string): Promise<User | null> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();

    if (error || !data) return null;

    // Map back to User type (snake_case -> camelCase)
    return {
        uid: data.id,
        displayName: data.display_name || data.displayName, // Fallback
        major: data.major,
        avatarUrl: data.avatar_url || data.avatarUrl,
        socialTags: data.social_tags || data.socialTags || [],
        createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    } as User;
};

// Auth state listener
export const onAuthChange = (callback: (user: any | null) => void) => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        const user = session?.user ? { ...session.user, uid: session.user.id } : null;
        callback(user);
    });
    return () => data.subscription.unsubscribe();
};

// Get current user (Abstracted for Demo vs Real)
export const getCurrentUser = async () => {
    const isDemo = await isDemoMode();
    if (isDemo) {
        return {
            uid: 'd3b07384-dead-4bef-cafe-000000000000',
            displayName: 'Demo User',
            photoURL: 'https://ui-avatars.com/api/?name=Demo+User&background=random',
            isAnonymous: false,
        };
    }

    // For Supabase, check session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        return { ...session.user, uid: session.user.id };
    }
    return null;
};

// Re-export auth as compatibility object if needed, but preferably avoid usage.
export const auth = supabase.auth; 
