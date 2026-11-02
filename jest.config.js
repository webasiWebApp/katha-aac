module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.svg$': '<rootDir>/src/__mocks__/svg.tsx',
    '^expo-sqlite$': '<rootDir>/src/core/db/__mocks__/sqliteMemory',
    '^expo-crypto$': '<rootDir>/src/__mocks__/expo-crypto',
  },
  testMatch: ['<rootDir>/src/**/tests/**/*.test.{ts,tsx}'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|zustand)',
  ],
};
