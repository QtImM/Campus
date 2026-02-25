import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

interface AnimatedTabIconProps {
    focused: boolean;
    color: string;
    size: number;
    IconComponent: any;
}

export const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
    focused,
    color,
    size,
    IconComponent
}) => {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withSpring(focused ? 1.2 : 1, {
            damping: 12,
            stiffness: 200,
        });

        if (focused) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <IconComponent color={color} size={size} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    dot: {
        position: 'absolute',
        bottom: -12,
        width: 4,
        height: 4,
        borderRadius: 2,
    },
});
