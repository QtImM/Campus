const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const path = require('path');

// Enable package exports for LangChain/LangGraph support
config.resolver.unstable_enablePackageExports = true;
// Add support for .mjs files (common in modern AI packages)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    'node:async_hooks': path.resolve(__dirname, 'services/agent/mocks/async_hooks.js'),
    'async_hooks': path.resolve(__dirname, 'services/agent/mocks/async_hooks.js'),
};

module.exports = config;
