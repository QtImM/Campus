import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { sendOTP, updatePassword, verifyOTP } from '../../services/auth';

export default function VerifyScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { email } = useLocalSearchParams<{ email: string }>();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'otp' | 'password'>('otp');
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        let timer: any;
        if (countdown > 0 && step === 'otp') {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown, step]);

    const handleVerifyOTP = async () => {
        if (token.length !== 6) {
            Alert.alert(t('common.tip', '提示'), t('auth.otp_invalid', '请输入6位有效验证码'));
            return;
        }

        setLoading(true);
        try {
            const user = await verifyOTP(email as string, token);
            if (user) {
                setStep('password');
            }
        } catch (error: any) {
            Alert.alert(t('common.error', '错误'), error.message || t('auth.otp_failed', '验证失败'));
        } finally {
            setLoading(false);
        }
    };

    const handleSetPassword = async () => {
        if (password.length < 6) {
            Alert.alert(t('common.tip', '提示'), t('auth.password_too_short', '密码长度不能少于6位'));
            return;
        }

        setLoading(true);
        try {
            await updatePassword(password);
            router.replace('/(auth)/setup');
        } catch (error: any) {
            Alert.alert(t('common.error', '错误'), error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;

        try {
            await sendOTP(email as string);
            setCountdown(60);
            Alert.alert(t('auth.resend_success', '已重发'), t('auth.resend_msg', '新的验证码已发送至您的邮箱'));
        } catch (error: any) {
            Alert.alert(t('common.error', '错误'), error.message);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color="#1E3A8A" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {step === 'otp' ? (
                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            <ShieldCheck size={48} color="#1E3A8A" />
                        </View>

                        <Text style={styles.title}>{t('auth.verify_title')}</Text>
                        <Text style={styles.subtitle}>
                            {t('auth.verify_subtitle')} <Text style={styles.emailText}>{email}</Text>
                        </Text>

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="000000"
                                placeholderTextColor="#9CA3AF"
                                value={token}
                                onChangeText={setToken}
                                keyboardType="number-pad"
                                maxLength={6}
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, (loading || token.length !== 6) && styles.buttonDisabled]}
                            onPress={handleVerifyOTP}
                            disabled={loading || token.length !== 6}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('auth.verify_btn')}</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.resendContainer}
                            onPress={handleResend}
                            disabled={countdown > 0}
                        >
                            <Text style={[styles.resendText, countdown > 0 && styles.resendTextDisabled]}>
                                {countdown > 0
                                    ? `${countdown}${t('auth.seconds_resend', '秒后可重发')}`
                                    : t('auth.resend_action', '没收到？点击重发')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            <Lock size={48} color="#1E3A8A" />
                        </View>

                        <Text style={styles.title}>{t('auth.set_password_title')}</Text>
                        <Text style={styles.subtitle}>{t('auth.set_password_subtitle')}</Text>

                        <View style={styles.inputContainer}>
                            <View style={styles.passwordWrapper}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder={t('auth.password_placeholder')}
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoFocus
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                >
                                    {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, (loading || password.length < 6) && styles.buttonDisabled]}
                            onPress={handleSetPassword}
                            disabled={loading || password.length < 6}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('auth.finish_register')}</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    topBar: {
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    backButton: {
        padding: 4,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 500,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(30, 58, 138, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1E3A8A',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    emailText: {
        color: '#1E3A8A',
        fontWeight: '600',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 24,
    },
    input: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 20,
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 8,
        color: '#111827',
    },
    button: {
        backgroundColor: '#1E3A8A',
        borderRadius: 12,
        padding: 18,
        width: '100%',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    resendContainer: {
        marginTop: 24,
    },
    resendText: {
        color: '#3B82F6',
        fontSize: 14,
        fontWeight: '500',
    },
    resendTextDisabled: {
        color: '#9CA3AF',
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        width: '100%',
    },
    passwordInput: {
        flex: 1,
        padding: 20,
        fontSize: 18,
        color: '#111827',
    },
    eyeIcon: {
        padding: 16,
    },
});
