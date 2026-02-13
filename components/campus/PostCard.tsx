import { formatDistanceToNow } from 'date-fns';
import { Heart, MapPin, MessageCircle, Trash2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Post } from '../../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PostCardProps {
    post: Post;
    onLike?: () => void;
    onComment?: () => void;
    onPress?: () => void;
    onDelete?: () => void;
    currentUserId?: string;
}

export const PostCard: React.FC<PostCardProps> = React.memo(({ post, onLike, onComment, onPress, onDelete, currentUserId }) => {
    const [zoomImage, setZoomImage] = useState<string | null>(null);
    const timeAgo = formatDistanceToNow(post.createdAt, { addSuffix: true });

    const categoryColors: Record<string, string> = {
        'Events': '#FF6B6B',
        'Reviews': '#4ECDC4',
        'Guides': '#FFE66D',
        'Lost & Found': '#95E1D3',
    };

    const renderImages = () => {
        const images = post.images || (post.imageUrl ? [post.imageUrl] : []);
        if (images.length === 0) return null;

        if (images.length === 1) {
            return (
                <TouchableOpacity
                    style={styles.imageContainer}
                    onPress={() => setZoomImage(images[0])}
                    activeOpacity={0.9}
                >
                    <Image
                        source={{ uri: images[0] }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                </TouchableOpacity>
            );
        }

        return (
            <View style={styles.multiImageContainer}>
                {images.map((img, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={[
                            styles.gridImageWrapper,
                            images.length === 2 && { width: '49%', aspectRatio: 1 },
                            images.length === 3 && { width: '32%', aspectRatio: 1 }
                        ]}
                        onPress={() => setZoomImage(img)}
                        activeOpacity={0.9}
                    >
                        <Image source={{ uri: img }} style={styles.gridImage} resizeMode="cover" />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {post.isAnonymous ? '?' : post.authorName.charAt(0)}
                    </Text>
                </View>
                <View style={styles.authorInfo}>
                    <Text style={styles.authorName}>
                        {post.isAnonymous ? '匿名用户' : post.authorName}
                    </Text>
                    <Text style={styles.timeText}>{timeAgo}</Text>
                </View>
                {post.category && (
                    <View style={[styles.categoryBadge, { backgroundColor: categoryColors[post.category] || '#E5E7EB' }]}>
                        <Text style={styles.categoryText}>{post.category}</Text>
                    </View>
                )}
            </View>

            {/* Content */}
            <Text style={styles.content}>{post.content}</Text>

            {/* Location Tag */}
            {post.locationTag && (
                <View style={styles.locationContainer}>
                    <MapPin size={12} color="#1E3A8A" />
                    <Text style={styles.locationTag}>{post.locationTag}</Text>
                </View>
            )}

            {/* Images */}
            {renderImages()}

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton} onPress={onLike}>
                    <Heart
                        size={20}
                        color={post.isLiked ? '#EF4444' : '#6B7280'}
                        fill={post.isLiked ? '#EF4444' : 'transparent'}
                    />
                    <Text style={[styles.actionText, post.isLiked && { color: '#EF4444' }]}>{post.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={onComment}>
                    <MessageCircle size={20} color="#6B7280" />
                    <Text style={styles.actionText}>{post.comments}</Text>
                </TouchableOpacity>

                {currentUserId === post.authorId && (
                    <TouchableOpacity
                        style={[styles.actionButton, { marginLeft: 'auto', marginRight: 0 }]}
                        onPress={onDelete}
                    >
                        <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Image Zoom Modal */}
            <Modal visible={!!zoomImage} transparent={true} animationType="fade">
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => setZoomImage(null)}
                    >
                        <X size={30} color="#fff" />
                    </TouchableOpacity>
                    {zoomImage && (
                        <Image
                            source={{ uri: zoomImage }}
                            style={styles.modalImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1E3A8A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    authorInfo: {
        flex: 1,
    },
    authorName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    timeText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#111827',
    },
    content: {
        fontSize: 15,
        lineHeight: 22,
        color: '#374151',
        marginBottom: 12,
    },
    imageContainer: {
        width: '100%',
        height: 220,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        marginBottom: 12,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    multiImageContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    gridImageWrapper: {
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
        marginBottom: 4,
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    modalImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT * 0.8,
    },
    actions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
    },
    actionText: {
        marginLeft: 6,
        fontSize: 14,
        color: '#6B7280',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#F0F7FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        gap: 4,
    },
    locationTag: {
        fontSize: 11,
        color: '#1E3A8A',
        fontWeight: '600',
    },
});
