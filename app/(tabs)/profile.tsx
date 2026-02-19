import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'expo-router';
import { Bell, Bot, ChevronRight, Edit3, Eye, Globe, Heart as HeartIcon, HelpCircle, LogOut, MessageSquare, Shield, Sparkles, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { getCurrentUser, signOut } from '../../services/auth';
import { fetchNotifications, markAllAsRead, markAsRead, Notification, subscribeToNotifications } from '../../services/notifications';
import { changeLanguage } from '../i18n/i18n';

const DEMO_MODE_KEY = 'hkcampus_demo_mode';

const SOCIAL_TAGS = [
    'Library Ghost 📚', 'Coffee Addict ☕', 'Night Owl 🦉',
    'Foodie 🍜', 'Gym Rat 💪', 'Cat Person 🐱',
    'Music Lover 🎵', 'Tech Geek 💻', 'Film Buff 🎬'
];

const LANGUAGE_OPTIONS = [
    { key: 'zh-Hans', label: '简' },
    { key: 'zh-Hant', label: '繁' },
    { key: 'en', label: 'EN' },
];

export default function ProfileScreen() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const [ghostMode, setGhostMode] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>(['Coffee Addict ☕', 'Night Owl 🦉']);
    const currentLang = i18n.language;
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const loadNotifications = async () => {
        try {
            const user = await getCurrentUser();
            if (user) {
                setUserId(user.uid);
                const data = await fetchNotifications(user.uid);
                setNotifications(data);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoadingNotifications(false);
        }
    };

    useEffect(() => {
        loadNotifications();

        let subscription: any;
        const initSubscription = async () => {
            const user = await getCurrentUser();
            if (user) {
                subscription = subscribeToNotifications(user.uid, (payload) => {
                    if (payload.new) {
                        setNotifications(prev => [payload.new, ...prev]);
                    }
                });
            }
        };

        initSubscription();

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, []);

    const handleNotificationPress = async (notification: Notification) => {
        if (!notification.is_read) {
            try {
                await markAsRead(notification.id);
                setNotifications(prev => prev.map(n =>
                    n.id === notification.id ? { ...n, is_read: true } : n
                ));
            } catch (error) {
                console.error('Error marking notification read:', error);
            }
        }

        if (notification.related_id) {
            setShowNotifications(false);
            router.push('/courses/exchange');
        }
    };

    const handleMarkAllRead = async () => {
        if (!userId) return;
        try {
            await markAllAsRead(userId);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all read:', error);
        }
    };

    const handleLanguageChange = async (lang: string) => {
        await changeLanguage(lang);
    };

    const handleSignOut = () => {
        Alert.alert(
            t('profile.sign_out'),
            t('profile.sign_out_confirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('profile.sign_out'),
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        await AsyncStorage.removeItem(DEMO_MODE_KEY);
                        router.replace('/(auth)/login');
                    }
                }
            ]
        );
    };

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else if (selectedTags.length < 3) {
            setSelectedTags([...selectedTags, tag]);
        } else {
            Alert.alert('Limit Reached', 'You can only select up to 3 tags');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('profile.title')}</Text>
            </View>

            {/* Profile Card */}
            <View style={styles.profileCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>你</Text>
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>Demo Student</Text>
                    <Text style={styles.profileMajor}>HKBU Student</Text>
                </View>
                <TouchableOpacity style={styles.editButton}>
                    <Edit3 size={20} color="#1E3A8A" />
                </TouchableOpacity>
            </View>

            {/* Innovation Lab / Agent Entry */}
            <View style={styles.innovationSection}>
                <View style={styles.innovationHeader}>
                    <Sparkles size={24} color="#1E3A8A" />
                    <Text style={styles.innovationTitle}>创新实验室 (Experimental)</Text>
                </View>
                <TouchableOpacity
                    style={styles.agentButton}
                    onPress={() => router.push('/agent/chat')}
                >
                    <View style={styles.agentButtonContent}>
                        <Bot size={24} color="#fff" />
                        <View style={styles.agentButtonText}>
                            <Text style={styles.agentButtonTitle}>校园生活 Agent</Text>
                            <Text style={styles.agentButtonDesc}>智能办公助手：查位子、点外卖、懂你心</Text>
                        </View>
                    </View>
                    <ChevronRight size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Notifications Section */}
            <View style={styles.section}>
                <View style={[styles.sectionHeader, { marginBottom: 16 }]}>
                    <View style={styles.settingLeft}>
                        <Bell size={20} color="#1E3A8A" />
                        <Text style={[styles.sectionTitle, { marginLeft: 12, marginBottom: 0 }]}>{t('profile.notifications')}</Text>
                        {unreadCount > 0 && (
                            <View style={styles.countBadgeInline}>
                                <Text style={styles.countTextInline}>{unreadCount}</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity onPress={() => setShowNotifications(true)}>
                        <Text style={styles.seeAllText}>{t('profile.see_all')}</Text>
                    </TouchableOpacity>
                </View>

                {loadingNotifications ? (
                    <ActivityIndicator color="#1E3A8A" />
                ) : notifications.length === 0 ? (
                    <Text style={styles.emptyText}>{t('profile.no_notifications')}</Text>
                ) : (
                    <View style={styles.notificationPreviewList}>
                        {notifications.slice(0, 2).map((notif) => (
                            <TouchableOpacity
                                key={notif.id}
                                style={[styles.notifPreviewItem, !notif.is_read && styles.notifUnread]}
                                onPress={() => handleNotificationPress(notif)}
                            >
                                <View style={[styles.notifPreviewIcon, {
                                    backgroundColor: notif.type === 'comment' ? '#DBEAFE' :
                                        notif.type === 'like' ? '#FEE2E2' : '#F5F3FF'
                                }]}>
                                    {notif.type === 'comment' ? <MessageSquare size={14} color="#2563EB" /> :
                                        notif.type === 'like' ? <HeartIcon size={14} color="#EF4444" /> :
                                            <Sparkles size={14} color="#8B5CF6" />}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.notifPreviewTitle} numberOfLines={1}>{notif.title}</Text>
                                    <Text style={styles.notifPreviewContent} numberOfLines={1}>{notif.content}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Social Tags */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('profile.social_tags')}</Text>
                <Text style={styles.sectionSubtitle}>{t('profile.select_tags')}</Text>
                <View style={styles.tagsGrid}>
                    {SOCIAL_TAGS.map((tag) => (
                        <TouchableOpacity
                            key={tag}
                            style={[
                                styles.tagButton,
                                selectedTags.includes(tag) && styles.tagButtonActive
                            ]}
                            onPress={() => toggleTag(tag)}
                        >
                            <Text style={[
                                styles.tagText,
                                selectedTags.includes(tag) && styles.tagTextActive
                            ]}>
                                {tag}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Activity Stats */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('profile.my_activity')}</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>12</Text>
                        <Text style={styles.statLabel}>{t('profile.posts')}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>48</Text>
                        <Text style={styles.statLabel}>{t('profile.connections')}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>156</Text>
                        <Text style={styles.statLabel}>{t('profile.likes')}</Text>
                    </View>
                </View>
            </View>

            {/* Ghost Mode */}
            <View style={styles.section}>
                <View style={styles.settingRow}>
                    <View style={styles.settingLeft}>
                        <Eye size={20} color="#4B0082" />
                        <Text style={styles.settingLabel}>{t('profile.ghost_mode')}</Text>
                    </View>
                    <Switch
                        value={ghostMode}
                        onValueChange={setGhostMode}
                        trackColor={{ false: '#E5E7EB', true: '#4B0082' }}
                        thumbColor="#fff"
                    />
                </View>
                <Text style={styles.settingHint}>
                    {t('profile.ghost_hint')}
                </Text>
            </View>

            {/* Language Switcher */}
            <View style={styles.section}>
                <View style={styles.settingRow}>
                    <View style={styles.settingLeft}>
                        <Globe size={20} color="#1E3A8A" />
                        <Text style={styles.settingLabel}>{t('profile.language')}</Text>
                    </View>
                </View>
                <Text style={styles.settingHint}>{t('profile.language_hint')}</Text>
                <View style={styles.langSwitcher}>
                    {LANGUAGE_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt.key}
                            style={[
                                styles.langBtn,
                                currentLang === opt.key && styles.langBtnActive
                            ]}
                            onPress={() => handleLanguageChange(opt.key)}
                        >
                            <Text style={[
                                styles.langBtnText,
                                currentLang === opt.key && styles.langBtnTextActive
                            ]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Settings */}
            <View style={styles.section}>
                <TouchableOpacity style={styles.menuItem}>
                    <Shield size={20} color="#6B7280" />
                    <Text style={styles.menuText}>{t('profile.privacy')}</Text>
                    <ChevronRight size={20} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                    <HelpCircle size={20} color="#6B7280" />
                    <Text style={styles.menuText}>{t('profile.help')}</Text>
                    <ChevronRight size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>

            {/* Sign Out */}
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <LogOut size={20} color="#EF4444" />
                <Text style={styles.signOutText}>{t('profile.sign_out')}</Text>
            </TouchableOpacity>

            <View style={{ height: 100 }} />

            {/* Notifications Modal */}
            <Modal
                visible={showNotifications}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowNotifications(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{t('profile.notifications')}</Text>
                        <TouchableOpacity onPress={() => setShowNotifications(false)} style={styles.closeButton}>
                            <X size={24} color="#1F2937" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={notifications}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.notificationsList}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.notificationItem, !item.is_read && styles.notificationUnread]}
                                onPress={() => handleNotificationPress(item)}
                            >
                                <View style={[styles.notifIcon, {
                                    backgroundColor: item.type === 'comment' ? '#DBEAFE' :
                                        item.type === 'like' ? '#FEE2E2' : '#F5F3FF'
                                }]}>
                                    {item.type === 'comment' ? (
                                        <MessageSquare size={18} color="#2563EB" />
                                    ) : item.type === 'like' ? (
                                        <HeartIcon size={18} color="#EF4444" />
                                    ) : (
                                        <Sparkles size={18} color="#8B5CF6" />
                                    )}
                                </View>
                                <View style={styles.notifContent}>
                                    <View style={styles.headerRow}>
                                        <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
                                        <Text style={styles.notifTime}>
                                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                        </Text>
                                    </View>
                                    <Text style={styles.notifPreview} numberOfLines={2}>{item.content}</Text>
                                </View>
                                {!item.is_read && <View style={styles.dot} />}
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyNotif}>
                                <Bell size={48} color="#D1D5DB" />
                                <Text style={styles.emptyNotifText}>{t('profile.no_notifications_yet')}</Text>
                            </View>
                        }
                    />

                    {notifications.length > 0 && (
                        <TouchableOpacity
                            style={styles.clearAllButton}
                            onPress={handleMarkAllRead}
                        >
                            <Text style={styles.clearAllText}>{t('profile.mark_all_read')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        paddingBottom: 40,
    },
    header: {
        paddingTop: 56,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: '#1E3A8A',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1E3A8A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    profileMajor: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    editButton: {
        padding: 8,
    },
    section: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    seeAllText: {
        fontSize: 14,
        color: '#1E3A8A',
        fontWeight: '600',
    },
    countBadgeInline: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    countTextInline: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    notificationPreviewList: {
        gap: 12,
    },
    notifPreviewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    notifUnread: {
        backgroundColor: '#EFF6FF',
        borderColor: '#DBEAFE',
    },
    notifPreviewIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    notifPreviewTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
    },
    notifPreviewContent: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 1,
    },
    emptyText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        paddingVertical: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 12,
    },
    tagsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    tagButtonActive: {
        backgroundColor: '#1E3A8A',
        borderColor: '#4B0082',
    },
    tagText: {
        fontSize: 12,
        color: '#4B5563',
    },
    tagTextActive: {
        color: '#fff',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 8,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E3A8A',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: 16,
        color: '#111827',
        marginLeft: 12,
    },
    settingHint: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
        marginLeft: 12,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginTop: 24,
        padding: 16,
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
    },
    signOutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
        marginLeft: 8,
    },
    menuIconWrapper: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: '#fff',
    },
    countBadge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginRight: 8,
    },
    countText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    closeButton: {
        padding: 4,
    },
    notificationsList: {
        padding: 16,
    },
    notificationItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    notificationUnread: {
        backgroundColor: '#F0F9FF',
        borderColor: '#BAE6FD',
        borderWidth: 1,
    },
    notifIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    notifContent: {
        flex: 1,
    },
    notifTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    notifPreview: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
    notifTime: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#1E3A8A',
        marginLeft: 8,
    },
    emptyNotif: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyNotifText: {
        marginTop: 16,
        fontSize: 16,
        color: '#9CA3AF',
    },
    clearAllButton: {
        padding: 16,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    clearAllText: {
        fontSize: 14,
        color: '#1E3A8A',
        fontWeight: '600',
    },
    langSwitcher: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
        marginTop: 12,
    },
    langBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    langBtnActive: {
        backgroundColor: '#1E3A8A',
        shadowColor: '#1E3A8A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    langBtnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    langBtnTextActive: {
        color: '#fff',
    },
    innovationSection: {
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        backgroundColor: '#F0F9FF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    innovationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    innovationTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E3A8A',
        marginLeft: 8,
    },
    agentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1E3A8A',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#1E3A8A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    agentButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    agentButtonText: {
        marginLeft: 12,
    },
    agentButtonTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    agentButtonDesc: {
        fontSize: 11,
        color: '#DBEAFE',
        marginTop: 2,
    },
});
