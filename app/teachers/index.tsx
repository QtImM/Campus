import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Search, Star } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTeachers } from '../../services/teachers';
import { Teacher } from '../../types';

const FACULTIES = ['All', 'Science', 'Creative Arts', 'Chinese Medicine', 'Communication', 'Business', 'Arts & Social Sciences'];

// 根据姓名生成首字母
const getInitials = (name: string): string => {
    const parts = name.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0]?.[0] || '?').toUpperCase();
};

// 根据姓名生成专属配色
const AVATAR_COLORS = [
    '#1E3A8A', '#7C3AED', '#059669', '#DC2626', '#D97706',
    '#0891B2', '#BE185D', '#4338CA', '#065F46', '#9333EA',
    '#B45309', '#1D4ED8', '#047857', '#7C2D12', '#6D28D9',
];
const getAvatarColor = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const DEPARTMENTS: Record<string, string[]> = {
    'Science': ['All', 'Computer Science', 'Physics', 'Chemistry', 'Mathematics', 'Biology'],
    'Creative Arts': ['All', 'SCA', 'Visual Arts'],
    'Chinese Medicine': ['All', 'Teaching & Research'],
    'Communication': ['All', 'Communication Studies', 'Interactive Media', 'Journalism'],
    'Business': ['All', 'Management', 'MMIS', 'AEF'],
    'Arts & Social Sciences': ['All', 'Education', 'Sociology']
};

export default function TeacherListScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFaculty, setActiveFaculty] = useState('All');
    const [activeDepartment, setActiveDepartment] = useState('All');

    const loadTeachers = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getTeachers({
                faculty: activeFaculty === 'All' ? undefined : activeFaculty,
                department: activeDepartment === 'All' ? undefined : activeDepartment,
                searchQuery
            });
            setTeachers(data);
        } catch (err: any) {
            console.error('Error loading teachers:', err);
            setError(err.message || 'Failed to load instructors');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTeachers();
    }, [activeFaculty, activeDepartment, searchQuery]);

    // 当切换学院时，重置学系
    useEffect(() => {
        setActiveDepartment('All');
    }, [activeFaculty]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTeachers();
        setRefreshing(false);
    };

    const renderTeacherItem = ({ item }: { item: Teacher }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/teachers/${item.id}` as any)}
        >
            <View style={styles.cardContent}>
                <View style={[styles.initialsAvatar, { backgroundColor: getAvatarColor(item.name) }]}>
                    <Text style={styles.initialsText}>{getInitials(item.name)}</Text>
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.dept}>{item.department}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.ratingBadge}>
                            <Star size={14} color="#F59E0B" fill="#F59E0B" />
                            <Text style={styles.ratingText}>
                                {item.reviewCount > 0 ? item.ratingAvg.toFixed(1) : t('teachers.no_reviews')}
                            </Text>
                        </View>
                        <Text style={styles.reviewCount}>({t('teachers.reviews_count', { count: item.reviewCount })})</Text>
                    </View>
                </View>
                <ChevronRight color="#D1D5DB" size={20} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                headerShown: false // 我们自己处理状态栏和Header
            }} />

            {/* Status Bar Background */}
            <View style={[styles.statusBarBg, { height: insets.top }]} />

            {/* Custom Header */}
            <View style={styles.customHeader}>
                <TouchableOpacity onPress={() => router.replace('/(tabs)/course')} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{t('teachers.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Search size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="輸入講師名字..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        clearButtonMode="while-editing"
                    />
                </View>
            </View>

            {/* Faculty Filter */}
            <View style={styles.filterContainer}>
                <FlatList
                    data={FACULTIES}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContent}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.filterItem,
                                activeFaculty === item && styles.filterItemActive
                            ]}
                            onPress={() => setActiveFaculty(item)}
                        >
                            <Text style={[
                                styles.filterText,
                                activeFaculty === item && styles.filterTextActive
                            ]}>{item}</Text>
                        </TouchableOpacity>
                    )}
                    keyExtractor={item => item}
                />
            </View>

            {/* Department Filter (Secondary) */}
            {activeFaculty !== 'All' && DEPARTMENTS[activeFaculty] && (
                <View style={[styles.filterContainer, { borderBottomWidth: 0, paddingTop: 0 }]}>
                    <FlatList
                        data={DEPARTMENTS[activeFaculty]}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterContent}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.deptItem,
                                    activeDepartment === item && styles.deptItemActive
                                ]}
                                onPress={() => setActiveDepartment(item)}
                            >
                                <Text style={[
                                    styles.deptText,
                                    activeDepartment === item && styles.deptTextActive
                                ]}>{item}</Text>
                            </TouchableOpacity>
                        )}
                        keyExtractor={item => item}
                    />
                </View>
            )}

            {/* List Section */}
            {loading && !refreshing ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#1E3A8A" />
                </View>
            ) : error ? (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: '#EF4444' }]}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={loadTeachers}>
                        <Text style={styles.retryText}>{t('common.retry')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={teachers}
                    keyExtractor={item => item.id}
                    renderItem={renderTeacherItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E3A8A" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{t('teachers.no_reviews')}</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    statusBarBg: {
        backgroundColor: '#1E3A8A',
    },
    searchSection: {
        backgroundColor: '#1E3A8A',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    customHeader: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: '#1E3A8A',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },
    spacer: {
        backgroundColor: '#fff',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#1F2937',
    },
    filterContainer: {
        backgroundColor: '#fff',
        paddingTop: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    filterContent: {
        paddingHorizontal: 16,
    },
    filterItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
        height: 36,
        justifyContent: 'center',
    },
    filterItemActive: {
        backgroundColor: '#1E3A8A',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#4B5563',
    },
    filterTextActive: {
        color: '#fff',
    },
    deptItem: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#f0f2f5',
        marginRight: 8,
        height: 30,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    deptItemActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    deptText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
    },
    deptTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    imageContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: '#E5E7EB',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    placeholderAvatar: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialsAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialsText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
    },
    infoContainer: {
        flex: 1,
        marginLeft: 16,
    },
    name: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    title: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    dept: {
        fontSize: 12,
        color: '#1E3A8A',
        fontWeight: '500',
        marginBottom: 4,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#D97706',
        marginLeft: 4,
    },
    reviewCount: {
        fontSize: 11,
        color: '#9CA3AF',
        marginLeft: 6,
    },
    loader: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        paddingTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        color: '#6B7280',
        fontSize: 15,
        textAlign: 'center',
    },
    retryBtn: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#1E3A8A',
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
    }
});
