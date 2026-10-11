module.exports = {
  preset: "jest-expo",
  testTimeout: 20000,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["**/__tests__/**/*.(test|spec).(ts|tsx)", "**/*.(test|spec).(ts|tsx)"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@gorhom/.*|nativewind)",
  ],
  moduleNameMapper: {
    "^@stayverse/assets/(.*)$": "<rootDir>/../assets/$1",
  },
};
