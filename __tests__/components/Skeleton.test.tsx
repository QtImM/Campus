import { render } from '@testing-library/react-native';
import React from 'react';
import { Skeleton } from '../../components/common/Skeleton';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => { };
    Reanimated.useSharedValue = jest.fn(() => ({ value: 0 }));
    Reanimated.useAnimatedStyle = jest.fn(() => ({}));
    Reanimated.withRepeat = jest.fn((val) => val);
    Reanimated.withSequence = jest.fn((...args) => args);
    Reanimated.withTiming = jest.fn((val) => val);
    return Reanimated;
});

describe('Skeleton Component', () => {
    it('renders correctly without crashing', () => {
        const { root } = render(<Skeleton />);
        // It should render an Animated.View
        expect(root).toBeTruthy();
    });

    it('applies custom dimensions correctly', () => {
        const { UNSAFE_root } = render(
            <Skeleton width={100} height={50} borderRadius={10} />
        );
        // Props on the custom skeleton
        const baseProps = UNSAFE_root.children[0].props;
        // In React Native, the dimensions are passed in the style array
        const styles = baseProps.style;
        // The second element in the style array is our explicit dimension object
        const dimensionStyle = styles.find((s: any) => s && s.width !== undefined);
        expect(dimensionStyle).toBeTruthy();
        expect(dimensionStyle.width).toBe(100);
        expect(dimensionStyle.height).toBe(50);
        expect(dimensionStyle.borderRadius).toBe(10);
    });
});
