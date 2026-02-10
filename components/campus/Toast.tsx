import { AlertCircle, CheckCircle2 } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export type ToastType = 'success' | 'error';

interface ToastProps {
    visible: boolean;
    message: string;
    type?: ToastType;
    onHide: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
    visible,
    message,
    type = 'success',
    onHide,
    duration = 3000
}) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Show
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 7
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true
                })
            ]).start();

            // Auto hide
            const timer = setTimeout(() => {
                hideToast();
            }, duration);

            return () => clearTimeout(timer);
        } else {
            hideToast();
        }
    }, [visible]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            })
        ]).start(() => {
            onHide();
        });
    };

    if (!visible) return null;

    const isSuccess = type === 'success';

    return (
        <SafeAreaView style={styles.safeArea}>
            <Animated.View style={[
                styles.container,
                { transform: [{ translateY }], opacity },
                isSuccess ? styles.successContainer : styles.errorContainer
            ]}>
                <View style={styles.iconWrapper}>
                    {isSuccess ?
                        <CheckCircle2 size={24} color="#fff" /> :
                        <AlertCircle size={24} color="#fff" />
                    }
                </View>
                <Text style={styles.message}>{message}</Text>
            </Animated.View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        pointerEvents: 'none',
    },
    container: {
        marginHorizontal: 20,
        marginTop: 10,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    successContainer: {
        backgroundColor: '#10B981', // Tailwind Emerald 500
    },
    errorContainer: {
        backgroundColor: '#EF4444', // Tailwind Red 500
    },
    iconWrapper: {
        marginRight: 12,
    },
    message: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        flex: 1,
    },
});
