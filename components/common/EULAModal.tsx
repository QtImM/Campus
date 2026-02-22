import { AlertTriangle, Ban, ShieldAlert, UserCheck } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EULAModalProps {
    visible: boolean;
    onAccept: () => void;
}

export const EULAModal: React.FC<EULAModalProps> = ({ visible, onAccept }) => {
    const { t } = useTranslation();

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <ShieldAlert size={40} color="#fff" />
                        </View>
                        <Text style={styles.title}>{t('moderation.eula.title')}</Text>
                    </View>

                    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <AlertTriangle size={20} color="#EF4444" />
                                <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>{t('moderation.eula.zero_tolerance')}</Text>
                            </View>
                            <View style={styles.cardHighlight}>
                                <Text style={styles.textHighlight}>
                                    {t('moderation.eula.policy_desc')}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ban size={20} color="#1E3A8A" />
                                <Text style={styles.sectionTitle}>{t('moderation.eula.prohibited_content')}</Text>
                            </View>
                            <Text style={styles.text}>
                                {t('moderation.eula.prohibited_list')}
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <UserCheck size={20} color="#1E3A8A" />
                                <Text style={styles.sectionTitle}>{t('moderation.eula.user_moderation')}</Text>
                            </View>
                            <Text style={styles.text}>
                                {t('moderation.eula.moderation_desc')}
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <ShieldAlert size={20} color="#1E3A8A" />
                                <Text style={styles.sectionTitle}>{t('moderation.eula.enforcement')}</Text>
                            </View>
                            <Text style={styles.text}>
                                {t('moderation.eula.enforcement_desc')}
                            </Text>
                        </View>

                        <View style={styles.footerSpace} />
                    </ScrollView>

                    <View style={styles.footer}>
                        <Text style={styles.agreementText}>
                            {t('moderation.eula.agreement_text')}
                        </Text>
                        <TouchableOpacity style={styles.acceptButton} onPress={onAccept} activeOpacity={0.8}>
                            <Text style={styles.acceptButtonText}>{t('moderation.eula.accept')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#1E3A8A',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1E3A8A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginTop: 20,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    scrollContainer: {
        flex: 1,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1E3A8A',
        letterSpacing: -0.3,
    },
    cardHighlight: {
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    textHighlight: {
        fontSize: 15,
        color: '#991B1B',
        lineHeight: 22,
        fontWeight: '500',
    },
    text: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
    },
    footer: {
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: '#fff',
    },
    agreementText: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 18,
        paddingHorizontal: 20,
    },
    acceptButton: {
        backgroundColor: '#1E3A8A',
        paddingVertical: 18,
        borderRadius: 18,
        alignItems: 'center',
        shadowColor: '#1E3A8A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    acceptButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    footerSpace: {
        height: 60,
    }
});
