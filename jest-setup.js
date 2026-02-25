import '@testing-library/jest-native/extend-expect';

// Mock Expo Router
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
}));

// Mock Async Storage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock get-random-values for uuid
jest.mock('react-native-get-random-values', () => ({
    getRandomBase64: jest.fn(),
}));

// Mock NativeWind / Tailwind if needed
jest.mock('nativewind', () => ({
    styled: (component) => component,
    useTailwind: () => ({}),
}));

// Silence some React Native warnings
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs(true);
