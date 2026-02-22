import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Building, Check, X as CloseIcon, Globe, Plus } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ActionModal } from '../../components/campus/ActionModal';
import { PostCard } from '../../components/campus/PostCard';
import { Toast, ToastType } from '../../components/campus/Toast';
import { EULAModal } from '../../components/common/EULAModal';
import { Skeleton } from '../../components/common/Skeleton';
import { getCurrentUser } from '../../services/auth';
import { deletePost, fetchPosts, subscribeToPosts, togglePostLike } from '../../services/campus';
import { Post, PostCategory } from '../../types';
import { changeLanguage } from '../i18n/i18n';

export default function CampusScreen() {
    const { t, i18n } = useTranslation();
    const router = useRouter();

    const CATEGORIES: { id: PostCategory; label: string }[] = [
        { id: 'All', label: t('campus.categories.all') },
        { id: 'Events', label: t('campus.categories.events') },
        { id: 'Reviews', label: t('campus.categories.reviews') },
        { id: 'Guides', label: t('campus.categories.guides') },
        { id: 'Lost & Found', label: t('campus.categories.lost_found') },
    ];

    const [activeCategory, setActiveCategory] = useState<PostCategory>('All');
    const [refreshing, setRefreshing] = useState(false);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
        visible: false,
        message: '',
        type: 'success'
    });
    const [eulaVisible, setEulaVisible] = useState(false);
    const [langModalVisible, setLangModalVisible] = useState(false);

    const LANGUAGE_OPTIONS = [
        { key: 'zh-Hans', label: '简体中文 (SC)' },
        { key: 'zh-Hant', label: '繁體中文 (HK)' },
        { key: 'en', label: 'English (US)' },
    ];

    const PostSkeleton = () => (
        <View style={styles.skeletonCard}>
            <View style={styles.header}>
                <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                    <Skeleton width="40%" height={14} style={{ marginBottom: 6 }} />
                    <Skeleton width="20%" height={10} />
                </View>
            </View>
            <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
            <Skeleton width="60%" height={16} style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height={200} borderRadius={12} />
        </View>
    );

    const loadPosts = async (isSilent = false) => {
        try {
            if (!isSilent && posts.length === 0) {
                setLoading(true);
            }
            const user = await getCurrentUser();
            setCurrentUser(user);
            const data = await fetchPosts(activeCategory, user?.uid);
            setPosts(data);
        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const checkEULA = async () => {
            try {
                const accepted = await AsyncStorage.getItem('eula_accepted');
                if (accepted !== 'true') {
                    setEulaVisible(true);
                }
            } catch (e) {
                console.error('EULA check error:', e);
            }
        };

        checkEULA();
        loadPosts();

        // Subscribe to changes
        const unsubscribe = subscribeToPosts(() => {
            loadPosts(true); // Silent update on real-time change
        });

        return () => unsubscribe();
    }, [activeCategory]);

    const handleAcceptEULA = async () => {
        try {
            await AsyncStorage.setItem('eula_accepted', 'true');
            setEulaVisible(false);
        } catch (e) {
            console.error('EULA accept error:', e);
            setEulaVisible(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadPosts(true);
    }, [activeCategory, posts.length]);

    const handlePostPress = useCallback((postId: string) => {
        router.push(`/campus/${postId}`);
    }, [router]);

    const handleCompose = useCallback(() => {
        router.push('/campus/compose');
    }, [router]);

    const handleLike = useCallback(async (postId: string) => {
        try {
            if (!currentUser) return;

            await togglePostLike(postId, currentUser.uid);
            // Local update for immediate feedback
            setPosts(prev => prev.map(p =>
                p.id === postId ? {
                    ...p,
                    isLiked: !p.isLiked,
                    likes: p.isLiked ? p.likes - 1 : p.likes + 1
                } : p
            ));
        } catch (error) {
            console.error('Error liking post:', error);
        }
    }, [currentUser]);

    const handleDeletePost = useCallback((postId: string) => {
        setSelectedPostId(postId);
        setDeleteModalVisible(true);
    }, []);

    const confirmDelete = async () => {
        if (!selectedPostId) return;
        try {
            await deletePost(selectedPostId);
            setToast({ visible: true, message: t('campus.modals.delete_success'), type: 'success' });
            // The list will refresh via loadPosts if realtime is working, 
            // but let's filter locally for immediate feedback
            setPosts(prev => prev.filter(p => p.id !== selectedPostId));
        } catch (error) {
            console.error('Error deleting post:', error);
            setToast({ visible: true, message: t('campus.modals.delete_error'), type: 'error' });
        } finally {
            setDeleteModalVisible(false);
            setSelectedPostId(null);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>{t('campus.title')}</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.langButton}
                            onPress={() => setLangModalVisible(true)}
                        >
                            <Globe size={18} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Building size={18} color="#1E3A8A" />
                            <Text style={styles.actionText}>{t('campus.campus_filter')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* AI OCR Section - Hidden for now */}
            {/* <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
                <ScheduleScanner />
            </View> */}

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <FlatList
                    data={CATEGORIES}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterList}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                activeCategory === item.id && styles.filterButtonActive
                            ]}
                            onPress={() => setActiveCategory(item.id)}
                        >
                            <Text style={[
                                styles.filterText,
                                activeCategory === item.id && styles.filterTextActive
                            ]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Posts Feed */}
            <FlatList
                data={posts}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.feedList}
                initialNumToRender={5}
                maxToRenderPerBatch={10}
                windowSize={10}
                removeClippedSubviews={true}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#1E3A8A"
                    />
                }
                renderItem={({ item }) => (
                    <PostCard
                        post={item}
                        onPress={() => handlePostPress(item.id)}
                        onLike={() => handleLike(item.id)}
                        onComment={() => handlePostPress(item.id)}
                        onDelete={() => handleDeletePost(item.id)}
                        currentUserId={currentUser?.uid}
                    />
                )}
                ListEmptyComponent={
                    loading ? (
                        <View>
                            <PostSkeleton />
                            <PostSkeleton />
                            <PostSkeleton />
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>{t('campus.empty.no_posts')}</Text>
                            <Text style={styles.emptySubtext}>{t('campus.empty.be_first')}</Text>
                        </View>
                    )
                }
            />

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={handleCompose}>
                <Plus size={28} color="#fff" />
            </TouchableOpacity>

            <ActionModal
                visible={deleteModalVisible}
                title={t('campus.modals.delete_title')}
                message={t('campus.modals.delete_msg')}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModalVisible(false)}
                confirmText={t('campus.modals.delete_confirm')}
            />

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            <EULAModal
                visible={eulaVisible}
                onAccept={handleAcceptEULA}
            />

            {/* Language Switcher Modal */}
            <Modal
                visible={langModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setLangModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setLangModalVisible(false)}
                >
                    <View style={styles.langModalContent}>
                        <View style={styles.langModalHeader}>
                            <Text style={styles.langModalTitle}>{t('profile.language')}</Text>
                            <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                                <CloseIcon size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.langList}>
                            {LANGUAGE_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt.key}
                                    style={styles.langOption}
                                    onPress={async () => {
                                        await changeLanguage(opt.key);
                                        setLangModalVisible(false);
                                    }}
                                >
                                    <View style={styles.langOptionLeft}>
                                        <Globe size={20} color={i18n.language === opt.key ? "#1E3A8A" : "#9CA3AF"} />
                                        <Text style={[
                                            styles.langOptionText,
                                            i18n.language === opt.key && styles.langOptionTextActive
                                        ]}>
                                            {opt.label}
                                        </Text>
                                    </View>
                                    {i18n.language === opt.key && (
                                        <Check size={20} color="#1E3A8A" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    skeletonCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        marginHorizontal: 0,
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
    filterContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    filterList: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
    },
    filterButtonActive: {
        backgroundColor: '#1E3A8A',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4B5563',
    },
    filterTextActive: {
        color: '#fff',
    },
    feedList: {
        padding: 16,
        paddingBottom: 100,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1E3A8A',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1E3A8A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1E3A8A',
        marginLeft: 4,
    },
    langButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    langModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    langModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    langModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    langList: {
        gap: 12,
    },
    langOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
    },
    langOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    langOptionText: {
        fontSize: 16,
        color: '#4B5563',
        fontWeight: '500',
    },
    langOptionTextActive: {
        color: '#1E3A8A',
        fontWeight: '700',
    },
});
