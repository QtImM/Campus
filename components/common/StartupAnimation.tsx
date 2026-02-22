import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface StartupAnimationProps {
    onFinish: () => void;
}

export const StartupAnimation: React.FC<StartupAnimationProps> = ({ onFinish }) => {
    // Animation Values
    const scale = useSharedValue(0.5);
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const containerOpacity = useSharedValue(1);

    useEffect(() => {
        // 1. Initial Reveal (Smooth Spring)
        scale.value = withSpring(1, {
            damping: 15,
            stiffness: 100,
        });
        opacity.value = withTiming(1, { duration: 1200 });

        // 2. Text Reveal (Soft Fade + Slide)
        textOpacity.value = withSequence(
            withDelay(500, withTiming(1, { duration: 1000 }))
        );

        // 3. Subtle Breathing Animation (Pulse)
        scale.value = withDelay(1200, withRepeat(
            withSequence(
                withTiming(1.03, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
                withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
        ));

        // 4. Exit Animation
        const timeout = setTimeout(() => {
            containerOpacity.value = withTiming(0, {
                duration: 800,
                easing: Easing.bezier(0.4, 0, 0.2, 1)
            }, (finished) => {
                if (finished) {
                    runOnJS(onFinish)();
                }
            });
        }, 3000);

        return () => clearTimeout(timeout);
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateY: translateY.value }
        ],
        opacity: opacity.value,
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: withTiming(textOpacity.value === 1 ? 0 : 20, { duration: 800 }) }]
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <View style={styles.content}>
                <Animated.View style={[styles.logoContainer, logoStyle]}>
                    <Image
                        source={require('../../assets/images/HKCampusicon.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animated.View>

                <Animated.View style={[styles.textContainer, textStyle]}>
                    <Text style={styles.brandName}>HKCampus</Text>
                    <View style={styles.subtitleContainer}>
                        <View style={styles.line} />
                        <Text style={styles.subtitle}>All For Students</Text>
                        <View style={styles.line} />
                    </View>
                </Animated.View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Version 1.0.0 • HKBU</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        width: 180,
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        marginTop: 50,
        alignItems: 'center',
    },
    brandName: {
        fontSize: 38,
        fontWeight: '700',
        color: '#000000',
        letterSpacing: -0.5, // Apple-style tight tracking for display headers
    },
    subtitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    line: {
        width: 0, // Removed for cleaner look
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#86868b', // Apple gray
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    footer: {
        position: 'absolute',
        bottom: 60,
        alignItems: 'center',
    },
    footerText: {
        color: '#d2d2d7',
        fontSize: 12,
        fontWeight: '400',
        letterSpacing: 0.5,
    }
});
