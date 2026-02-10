import { useRouter } from 'expo-router';
import { Building, Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ActionModal } from '../../components/campus/ActionModal';
import { PostCard } from '../../components/campus/PostCard';
import { Toast, ToastType } from '../../components/campus/Toast';
import { getCurrentUser } from '../../services/auth';
import { deletePost, fetchPosts, subscribeToPosts, togglePostLike } from '../../services/campus';
import { Post, PostCategory } from '../../types';

const CATEGORIES: PostCategory[] = ['All', 'Events', 'Reviews', 'Guides', 'Lost & Found'];

export default function CampusScreen() {
    const router = useRouter();
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

    const loadPosts = async () => {
        try {
            setLoading(true);
            const user = await getCurrentUser();
            setCurrentUser(user);
            const data = await fetchPosts(activeCategory, user?.uid);
            setPosts(data);
        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadPosts();

        // Subscribe to changes
        const unsubscribe = subscribeToPosts(() => {
            loadPosts();
        });

        return () => unsubscribe();
    }, [activeCategory]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadPosts();
        setRefreshing(false);
    };

    const handlePostPress = (postId: string) => {
        router.push(`/campus/${postId}`);
    };

    const handleCompose = () => {
        router.push('/campus/compose');
    };

    const handleLike = async (postId: string) => {
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
    };

    const handleDeletePost = (postId: string) => {
        setSelectedPostId(postId);
        setDeleteModalVisible(true);
    };

    const confirmDelete = async () => {
        if (!selectedPostId) return;
        try {
            await deletePost(selectedPostId);
            setToast({ visible: true, message: 'Post deleted successfully', type: 'success' });
            // The list will refresh via loadPosts if realtime is working, 
            // but let's filter locally for immediate feedback
            setPosts(prev => prev.filter(p => p.id !== selectedPostId));
        } catch (error) {
            console.error('Error deleting post:', error);
            setToast({ visible: true, message: 'Failed to delete post', type: 'error' });
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
                    <Text style={styles.headerTitle}>Campus Circle</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Building size={20} color="#1E3A8A" />
                            <Text style={styles.actionText}>Campus</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

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
                                activeCategory === item && styles.filterButtonActive
                            ]}
                            onPress={() => setActiveCategory(item)}
                        >
                            <Text style={[
                                styles.filterText,
                                activeCategory === item && styles.filterTextActive
                            ]}>
                                {item}
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
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No posts found.</Text>
                        <Text style={styles.emptySubtext}>Be the first to post!</Text>
                    </View>
                }
            />

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={handleCompose}>
                <Plus size={28} color="#fff" />
            </TouchableOpacity>

            <ActionModal
                visible={deleteModalVisible}
                title="Delete Post"
                message="Are you sure you want to delete this post? This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModalVisible(false)}
                confirmText="Delete"
            />

            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast(prev => ({ ...prev, visible: false }))}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
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
});
