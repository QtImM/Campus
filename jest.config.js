module.exports = {
    preset: 'jest-expo',
    setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
    ],
    collectCoverage: false,
    collectCoverageFrom: [
        'services/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'utils/**/*.{ts,tsx}',
        '!**/coverage/**',
        '!**/node_modules/**'
    ]
};
