import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, Eye, EyeOff, Globe, Key } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { sendOTP, setSkipAuthRedirect, signIn, signOut, updatePassword, verifyOTP } from '../../services/auth';
import { changeLanguage } from '../i18n/i18n';

const DOMAINS = [
    { label: '@life.hkbu.edu.hk', value: '@life.hkbu.edu.hk' },
    { label: '@gmail.com', value: '@gmail.com' },
    { label: '@qq.com', value: '@qq.com' },
    { label: '@163.com', value: '@163.com' },
    { label: 'Other / 其他', value: 'other' },
];

const LANGUAGES = [
    { label: '简体中文', value: 'zh-Hans' },
    { label: '繁體中文', value: 'zh-Hant' },
    { label: 'English', value: 'en' },
];

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const [emailPrefix, setEmailPrefix] = useState('');
    const [emailSuffix, setEmailSuffix] = useState('@life.hkbu.edu.hk');
    const [loading, setLoading] = useState(false);
    const [showDomainPicker, setShowDomainPicker] = useState(false);
    const [showLangPicker, setShowLangPicker] = useState(false);

    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [isOtpSent, setIsOtpSent] = useState(false);

    React.useEffect(() => {
        let timer: any;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleLanguageChange = async (lang: string) => {
        await changeLanguage(lang);
        setShowLangPicker(false);
    };

    const handleSendOTP = async () => {
        if (!emailPrefix) {
            const placeholder = emailSuffix === 'other' ? t('auth.email_label') : t('auth.email_placeholder');
            Alert.alert(t('common.tip', '提示'), placeholder);
            return;
        }

        let prefix = emailPrefix.trim();
        if (emailSuffix !== 'other' && prefix.toLowerCase().endsWith(emailSuffix.toLowerCase())) {
            prefix = prefix.substring(0, prefix.length - emailSuffix.length);
        }

        const fullEmail = emailSuffix === 'other' ? prefix.toLowerCase() : (prefix + emailSuffix).toLowerCase();

        setLoading(true);
        try {
            await sendOTP(fullEmail);
            setCountdown(60);
            const isResend = isOtpSent;
            setIsOtpSent(true);
            if (isResend) {
                Alert.alert(t('auth.resend_success', '已重发'), t('auth.resend_msg', '验证码已重新发送到您的邮箱'));
            } else {
                Alert.alert(t('auth.send_success', '已发送'), t('auth.send_msg', '验证码已发送到您的邮箱'));
            }
        } catch (error: any) {
            Alert.alert(t('common.error', 'Error'), error.message || t('auth.otp_failed', 'Failed to send verification code'));
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!isOtpSent) {
            Alert.alert(t('common.tip', 'Tip'), t('auth.send_otp_first', 'Please send verification code first'));
            return;
        }
        if (otp.length !== 6) {
            Alert.alert(t('common.tip', 'Tip'), t('auth.otp_invalid', 'Invalid verification code'));
            return;
        }
        if (password.length < 6) {
            Alert.alert(t('common.tip', 'Tip'), t('auth.password_too_short', 'Password must be at least 6 characters'));
            return;
        }

        let prefix = emailPrefix.trim();
        if (emailSuffix !== 'other' && prefix.toLowerCase().endsWith(emailSuffix.toLowerCase())) {
            prefix = prefix.substring(0, prefix.length - emailSuffix.length);
        }
        const fullEmail = emailSuffix === 'other' ? prefix.toLowerCase() : (prefix + emailSuffix).toLowerCase();

        setLoading(true);
        try {
            // 1. 先检查新密码是否与旧密码相同（在验证 OTP 之前）
            try {
                // 设置标志，阻止 auth 状态变化导致的跳转
                setSkipAuthRedirect(true);
                await signIn(fullEmail, password);
                // 如果登录成功，说明新密码与旧密码相同
                await signOut();
                // 清除标志
                setSkipAuthRedirect(false);
                setLoading(false);
                Alert.alert(
                    t('common.tip', '提示'), 
                    t('auth.password_same_as_old', '新密码不能与旧密码相同，请设置一个新的密码')
                );
                return;
            } catch (loginError: any) {
                // 登录失败说明新密码与旧密码不同，可以继续
                // 清除标志
                setSkipAuthRedirect(false);
                console.log('Password is different, proceeding with OTP verification');
            }

            // 2. 验证 OTP（验证成功后用户已登录）
            const user = await verifyOTP(fullEmail, otp);
            if (!user) throw new Error('Verification failed');

            // 3. 执行密码重置
            await updatePassword(password);

            // 4. 密码重置成功，用新密码登录
            await signIn(fullEmail, password);
            
            // 5. 显示成功提示并跳转到主页（用户已登录）
            Alert.alert(t('common.tip', 'Success'), t('auth.reset_success_msg', 'Password reset successful'), [
                { text: 'OK', onPress: () => router.replace('/(tabs)/campus') }
            ]);
        } catch (error: any) {
            Alert.alert(t('common.error', 'Error'), error.message || t('auth.register_failed', 'Reset failed'));
        } finally {
            setLoading(false);
        }
    };

    const renderDomainItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.pickerItem}
            onPress={() => {
                setEmailSuffix(item.value);
                setShowDomainPicker(false);
            }}
        >
            <Text style={[styles.pickerItemText, emailSuffix === item.value && styles.pickerItemTextActive]}>
                {item.label}
            </Text>
        </TouchableOpacity>
    );

    const renderLangItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.pickerItem}
            onPress={() => handleLanguageChange(item.value)}
        >
            <Text style={[styles.pickerItemText, i18n.language === item.value && styles.pickerItemTextActive]}>
                {item.label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color="#1E3A8A" />
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B' }}>Language</Text>
                    <TouchableOpacity style={styles.langSelector} onPress={() => setShowLangPicker(true)}>
                        <Globe size={18} color="#4B5563" />
                        <Text style={styles.langSelectorText}>
                            {LANGUAGES.find(l => l.value === i18n.language)?.label || 'Language'}
                        </Text>
                        <ChevronDown size={14} color="#4B5563" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Key size={32} color="#1E3A8A" />
                    </View>
                    <Text style={styles.title}>{t('auth.forgot_password_title')}</Text>
                    <Text style={styles.subtitle}>{t('auth.forgot_password_subtitle', 'Verify email to set a new password')}</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>{t('auth.email_label')}</Text>

                    {emailSuffix === 'other' ? (
                        <View style={[styles.inputContainer, styles.fullEmailContainer]}>
                            <TextInput
                                style={styles.input}
                                placeholder="example@email.com"
                                placeholderTextColor="#9CA3AF"
                                value={emailPrefix}
                                onChangeText={setEmailPrefix}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                            <TouchableOpacity
                                style={styles.domainReset}
                                onPress={() => setEmailSuffix('@life.hkbu.edu.hk')}
                            >
                                <ChevronDown size={16} color="#4B5563" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.emailRow}>
                            <View style={[styles.inputContainer, { flex: 2 }]}>
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.email_placeholder')}
                                    placeholderTextColor="#9CA3AF"
                                    value={emailPrefix}
                                    onChangeText={setEmailPrefix}
                                    autoCapitalize="none"
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.domainSelector}
                                onPress={() => setShowDomainPicker(true)}
                            >
                                <Text style={styles.domainSelectorText}>{emailSuffix}</Text>
                                <ChevronDown size={16} color="#4B5563" />
                            </TouchableOpacity>
                        </View>
                    )}

                    <Text style={styles.label}>{t('auth.verification_code', 'Verification Code')}</Text>
                    <View style={styles.otpRow}>
                        <View style={[styles.inputContainer, { flex: 1 }]}>
                            <TextInput
                                style={styles.input}
                                placeholder="000000"
                                placeholderTextColor="#9CA3AF"
                                value={otp}
                                onChangeText={setOtp}
                                keyboardType="number-pad"
                                maxLength={6}
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.sendCodeBtn, countdown > 0 && styles.sendCodeBtnDisabled]}
                            onPress={handleSendOTP}
                            disabled={countdown > 0 || loading}
                        >
                            <Text style={[styles.sendCodeText, countdown > 0 && styles.sendCodeTextDisabled]}>
                                {countdown > 0 ? `${countdown}s` : (isOtpSent ? t('auth.resend_action', 'Resend') : t('auth.send_code', 'Send Code'))}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>{t('auth.password_label')}</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder={t('auth.password_placeholder')}
                            placeholderTextColor="#9CA3AF"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>{t('auth.reset_password_btn', 'Reset Password')}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal visible={showDomainPicker} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDomainPicker(false)}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('auth.select_domain', 'Select Domain')}</Text>
                        </View>
                        <FlatList data={DOMAINS} renderItem={renderDomainItem} keyExtractor={item => item.value} />
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={showLangPicker} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLangPicker(false)}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('auth.language_select')}</Text>
                        </View>
                        <FlatList data={LANGUAGES} renderItem={renderLangItem} keyExtractor={item => item.value} />
                    </View>
                </TouchableOpacity>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    backButton: {
        padding: 4,
    },
    langSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    langSelectorText: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        paddingTop: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(30, 58, 138, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1E3A8A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
    },
    form: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 8,
        marginLeft: 4,
    },
    emailRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    inputContainer: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    fullEmailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    domainReset: {
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        color: '#111827',
    },
    domainSelector: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
    },
    domainSelectorText: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#1E3A8A',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '60%',
    },
    modalHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    pickerItem: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
    },
    pickerItemText: {
        fontSize: 16,
        color: '#4B5563',
        textAlign: 'center',
    },
    pickerItemTextActive: {
        color: '#1E3A8A',
        fontWeight: 'bold',
    },
    otpRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    sendCodeBtn: {
        backgroundColor: '#DBEAFE',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    sendCodeBtnDisabled: {
        backgroundColor: '#F3F4F6',
    },
    sendCodeText: {
        color: '#1E3A8A',
        fontWeight: '600',
        fontSize: 14,
    },
    sendCodeTextDisabled: {
        color: '#9CA3AF',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 24,
    },
    passwordInput: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        color: '#111827',
    },
    eyeIcon: {
        padding: 12,
    },
});
